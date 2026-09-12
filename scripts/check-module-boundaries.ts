import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

export interface BoundaryViolation {
  filePath: string;
  line: number;
  column: number;
  importSpecifier: string;
  lineText: string;
  sourceModule: string | null;
  targetModule: string;
  targetDir: string;
  kind: string;
}

const REPO_ROOT = process.cwd();
const SERVER_SRC = path.resolve(REPO_ROOT, "apps/server/src");
const MODULES_DIR = path.resolve(SERVER_SRC, "modules");

const transpiler = new Bun.Transpiler({ loader: "tsx" });

/**
 * Extracts the module name if the file is inside apps/server/src/modules/<module-name>/
 */
export function getModuleFromPath(filePath: string): string | null {
  const absPath = path.isAbsolute(filePath) ? filePath : path.resolve(REPO_ROOT, filePath);
  const relToModules = path.relative(MODULES_DIR, absPath);

  // If path goes up or is outside modules dir
  if (relToModules.startsWith("..") || path.isAbsolute(relToModules)) {
    return null;
  }

  const parts = relToModules.split(path.sep);
  const firstPart = parts[0];
  return firstPart ? firstPart : null;
}

/**
 * Resolves an import specifier to an absolute path when possible
 */
export function resolveImportPath(importerPath: string, specifier: string): string | null {
  if (specifier.startsWith("@/")) {
    // Alias @/ maps to apps/server/src/
    return path.resolve(SERVER_SRC, specifier.slice(2));
  }

  if (specifier.startsWith(".")) {
    const importerDir = path.dirname(
      path.isAbsolute(importerPath) ? importerPath : path.resolve(REPO_ROOT, importerPath),
    );
    return path.resolve(importerDir, specifier);
  }

  return null;
}

/**
 * Checks whether a target path refers to a private subpath of a domain module
 * (anything other than the module root, index, or manifest)
 */
export function getPrivateModuleTarget(
  targetPath: string,
): { moduleName: string; privateDir: string } | null {
  const relToModules = path.relative(MODULES_DIR, targetPath);

  if (relToModules.startsWith("..") || path.isAbsolute(relToModules)) {
    return null;
  }

  const normalizedRel = relToModules.replace(/\\/g, "/").replace(/\/+$/, "");
  const parts = normalizedRel.split("/");
  const moduleName = parts[0];

  if (!moduleName) {
    return null;
  }

  // Targeting the module directory directly: e.g. "auth" -> resolves to index.ts
  if (parts.length === 1) {
    return null;
  }

  const subPath = parts.slice(1).join("/");
  // Strip file extension (.ts, .tsx, .js, .jsx, etc.) for comparison
  const subPathWithoutExt = subPath.replace(/\.[^/.]+$/, "");

  const isAllowedPublicContract =
    subPathWithoutExt === "index" ||
    subPathWithoutExt === `${moduleName}.manifest` ||
    subPathWithoutExt === "manifest";

  if (isAllowedPublicContract) {
    return null;
  }

  const privateTarget = parts[1] || subPath;

  return {
    moduleName,
    privateDir: privateTarget,
  };
}

/**
 * Finds line and column of the import specifier in the source code
 */
function findLocation(
  content: string,
  specifier: string,
): { line: number; column: number; lineText: string } {
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const lineText = lines[i];
    if (lineText !== undefined) {
      const col = lineText.indexOf(specifier);
      if (col !== -1) {
        return {
          line: i + 1,
          column: col + 1,
          lineText,
        };
      }
    }
  }

  return { line: 1, column: 1, lineText: "" };
}

/**
 * Extracts all import and export specifiers including type-only imports
 */
export function extractImports(content: string): Array<{ path: string; kind: string }> {
  let imports: Array<{ path: string; kind: string }> = [];
  try {
    imports = transpiler.scanImports(content);
  } catch {
    // If syntax error, still try scanning type imports
  }

  // scanImports strips type-only imports in TS/TSX mode. Scan them here:
  const TYPE_IMPORT_REGEX =
    /(?:import|export)\s+type\s+(?:[\w*\s{},]*\s+from\s+)?["']([^"']+)["']/g;
  for (const match of content.matchAll(TYPE_IMPORT_REGEX)) {
    const importPath = match[1];
    if (importPath && !imports.some((imp) => imp.path === importPath)) {
      imports.push({ path: importPath, kind: "type-import" });
    }
  }

  return imports;
}

/**
 * Scans a single file's content for module boundary violations
 */
export function checkFile(filePath: string, fileContent?: string): BoundaryViolation[] {
  const absPath = path.isAbsolute(filePath) ? filePath : path.resolve(REPO_ROOT, filePath);
  const content = fileContent !== undefined ? fileContent : readFileSync(absPath, "utf8");
  const sourceModule = getModuleFromPath(absPath);
  const violations: BoundaryViolation[] = [];

  const imports = extractImports(content);

  for (const imp of imports) {
    const resolvedPath = resolveImportPath(absPath, imp.path);
    if (!resolvedPath) {
      continue;
    }

    const targetInfo = getPrivateModuleTarget(resolvedPath);
    if (!targetInfo) {
      continue;
    }

    // Violation occurs if importing file is NOT in the same module
    if (sourceModule !== targetInfo.moduleName) {
      const loc = findLocation(content, imp.path);
      violations.push({
        filePath: path.relative(REPO_ROOT, absPath),
        line: loc.line,
        column: loc.column,
        importSpecifier: imp.path,
        lineText: loc.lineText,
        sourceModule,
        targetModule: targetInfo.moduleName,
        targetDir: targetInfo.privateDir,
        kind: imp.kind,
      });
    }
  }

  return violations;
}

/**
 * Recursively collects source files from a directory
 */
export function getSourceFiles(dir: string): string[] {
  const results: string[] = [];
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const full = path.join(dir, entry);
      const stat = statSync(full);
      if (stat.isDirectory()) {
        if (
          entry !== "node_modules" &&
          entry !== "dist" &&
          entry !== ".next" &&
          entry !== ".turbo" &&
          entry !== ".git"
        ) {
          results.push(...getSourceFiles(full));
        }
      } else if (/\.(ts|tsx|js|jsx|mts|cts)$/.test(entry) && !entry.endsWith(".d.ts")) {
        results.push(full);
      }
    }
  } catch {
    // Directory might not exist
  }
  return results;
}

/**
 * Main runner function
 */
export function run(args: string[] = process.argv.slice(2)): number {
  const targetFiles: string[] = [];

  if (args.length > 0) {
    for (const arg of args) {
      if (arg.startsWith("-")) continue;
      const abs = path.isAbsolute(arg) ? arg : path.resolve(REPO_ROOT, arg);
      const isAppCode =
        abs.startsWith(SERVER_SRC) || abs.startsWith(path.resolve(REPO_ROOT, "apps/app/src"));
      const isBoundaryTest = abs.includes("check-module-boundaries.test");
      if (
        isAppCode &&
        !isBoundaryTest &&
        /\.(ts|tsx|js|jsx|mts|cts)$/.test(arg) &&
        !arg.endsWith(".d.ts")
      ) {
        targetFiles.push(arg);
      }
    }
  }

  // If no specific files passed, scan all server and relevant app source files
  const filesToScan =
    targetFiles.length > 0
      ? targetFiles
      : [...getSourceFiles(SERVER_SRC), ...getSourceFiles(path.resolve(REPO_ROOT, "apps/app/src"))];

  if (filesToScan.length === 0) {
    console.log("No relevant files to scan for module boundary checks.");
    return 0;
  }

  const allViolations: BoundaryViolation[] = [];

  for (const file of filesToScan) {
    const violations = checkFile(file);
    allViolations.push(...violations);
  }

  if (allViolations.length > 0) {
    console.error("\n❌ Module Boundary Encapsulation Violations Found:\n");
    for (const v of allViolations) {
      const fromDesc = v.sourceModule ? `module '${v.sourceModule}'` : "outside code";
      const targetLabel = v.targetDir.includes(".") ? `'${v.targetDir}'` : `'${v.targetDir}/'`;
      console.error(
        `    ✖ Forbidden import of ${targetLabel} in module '${v.targetModule}' from ${fromDesc}.`,
      );
      if (v.lineText) {
        console.error(`      ${v.line} | ${v.lineText.trim()}`);
        console.error(
          `      ${" ".repeat(String(v.line).length)} | ${" ".repeat(v.column > 1 ? v.column - 1 : 0)}^`,
        );
      }
      console.error(
        `    ℹ Rule: External code may only import from 'apps/server/src/modules/${v.targetModule}/index.ts' or manifest.\n`,
      );
    }
    console.error(
      `Found ${allViolations.length} boundary violation(s) across ${filesToScan.length} file(s) checked.\n`,
    );
    return 1;
  }

  console.log(`✔ Checked ${filesToScan.length} file(s): all module boundaries respected.`);
  return 0;
}

// Auto-run if executed directly via CLI
if (import.meta.main) {
  const exitCode = run();
  process.exit(exitCode);
}
