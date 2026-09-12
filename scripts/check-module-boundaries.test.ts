import { describe, expect, it } from "bun:test";
import path from "node:path";
import {
  checkFile,
  getModuleFromPath,
  getPrivateModuleTarget,
  resolveImportPath,
  run,
} from "./check-module-boundaries";

describe("check-module-boundaries", () => {
  describe("getModuleFromPath", () => {
    it("identifies module name when file is inside a module", () => {
      expect(
        getModuleFromPath("apps/server/src/modules/auth/features/register/register.handler.ts"),
      ).toBe("auth");
      expect(getModuleFromPath("apps/server/src/modules/billing/routes.ts")).toBe("billing");
    });

    it("returns null when file is outside modules directory", () => {
      expect(getModuleFromPath("apps/server/src/index.ts")).toBeNull();
      expect(getModuleFromPath("apps/server/src/lib/logger.ts")).toBeNull();
      expect(getModuleFromPath("apps/app/src/app/page.tsx")).toBeNull();
    });
  });

  describe("resolveImportPath", () => {
    it("resolves alias @/ to apps/server/src/", () => {
      const resolved = resolveImportPath(
        "apps/server/src/modules/billing/routes.ts",
        "@/modules/auth/internal/security",
      );
      expect(resolved).toContain(path.normalize("apps/server/src/modules/auth/internal/security"));
    });

    it("resolves relative path correctly", () => {
      const resolved = resolveImportPath(
        "apps/server/src/modules/billing/routes.ts",
        "../auth/internal/security",
      );
      expect(resolved).toContain(path.normalize("apps/server/src/modules/auth/internal/security"));
    });

    it("returns null for non-alias non-relative imports", () => {
      expect(resolveImportPath("apps/server/src/index.ts", "hono")).toBeNull();
      expect(resolveImportPath("apps/server/src/index.ts", "@syncdocket/db")).toBeNull();
    });
  });

  describe("getPrivateModuleTarget", () => {
    it("detects internal/ directory target", () => {
      const target = path.resolve(
        process.cwd(),
        "apps/server/src/modules/auth/internal/security.ts",
      );
      expect(getPrivateModuleTarget(target)).toEqual({
        moduleName: "auth",
        privateDir: "internal",
      });
    });

    it("detects features/ directory target", () => {
      const target = path.resolve(
        process.cwd(),
        "apps/server/src/modules/auth/features/register/register.dto.ts",
      );
      expect(getPrivateModuleTarget(target)).toEqual({
        moduleName: "auth",
        privateDir: "features",
      });
    });

    it("detects schema target", () => {
      const target = path.resolve(process.cwd(), "apps/server/src/modules/auth/schema.ts");
      expect(getPrivateModuleTarget(target)).toEqual({
        moduleName: "auth",
        privateDir: "schema.ts",
      });
    });

    it("detects routes target", () => {
      const target = path.resolve(process.cwd(), "apps/server/src/modules/auth/routes.ts");
      expect(getPrivateModuleTarget(target)).toEqual({
        moduleName: "auth",
        privateDir: "routes.ts",
      });
    });

    it("detects events/ directory target", () => {
      const target = path.resolve(
        process.cwd(),
        "apps/server/src/modules/auth/events/user-created.listener.ts",
      );
      expect(getPrivateModuleTarget(target)).toEqual({
        moduleName: "auth",
        privateDir: "events",
      });
    });

    it("returns null for module directory root (e.g. apps/server/src/modules/auth)", () => {
      const dirTarget = path.resolve(process.cwd(), "apps/server/src/modules/auth");
      expect(getPrivateModuleTarget(dirTarget)).toBeNull();
    });

    it("returns null for public root contract (index.ts and manifest)", () => {
      const indexTarget = path.resolve(process.cwd(), "apps/server/src/modules/auth/index.ts");
      expect(getPrivateModuleTarget(indexTarget)).toBeNull();

      const manifestTarget = path.resolve(
        process.cwd(),
        "apps/server/src/modules/auth/auth.manifest.ts",
      );
      expect(getPrivateModuleTarget(manifestTarget)).toBeNull();
    });
  });

  describe("checkFile boundary violations", () => {
    it("blocks cross-module alias import of internal/", () => {
      const code = `
        import { hashPassword } from "@/modules/auth/internal/security";
        console.log(hashPassword);
      `;
      const violations = checkFile("apps/server/src/modules/billing/routes.ts", code);
      expect(violations).toHaveLength(1);
      expect(violations[0]?.targetModule).toBe("auth");
      expect(violations[0]?.targetDir).toBe("internal");
      expect(violations[0]?.sourceModule).toBe("billing");
    });

    it("blocks cross-module alias import of features/", () => {
      const code = `
        import { registerHandler } from "@/modules/auth/features/register/register.handler";
      `;
      const violations = checkFile("apps/server/src/modules/billing/routes.ts", code);
      expect(violations).toHaveLength(1);
      expect(violations[0]?.targetModule).toBe("auth");
      expect(violations[0]?.targetDir).toBe("features");
    });

    it("blocks cross-module relative import of internal/", () => {
      const code = `
        import { hashPassword } from "../auth/internal/security";
      `;
      const violations = checkFile("apps/server/src/modules/billing/routes.ts", code);
      expect(violations).toHaveLength(1);
      expect(violations[0]?.targetModule).toBe("auth");
      expect(violations[0]?.targetDir).toBe("internal");
    });

    it("blocks cross-module relative import of features/", () => {
      const code = `
        import { registerSchema } from "../auth/features/register/register.dto";
      `;
      const violations = checkFile("apps/server/src/modules/billing/routes.ts", code);
      expect(violations).toHaveLength(1);
      expect(violations[0]?.targetModule).toBe("auth");
      expect(violations[0]?.targetDir).toBe("features");
    });

    it("blocks external code (root index.ts) from importing private directories", () => {
      const code = `
        import { hashPassword } from "./modules/auth/internal/security";
      `;
      const violations = checkFile("apps/server/src/index.ts", code);
      expect(violations).toHaveLength(1);
      expect(violations[0]?.sourceModule).toBeNull();
      expect(violations[0]?.targetModule).toBe("auth");
      expect(violations[0]?.targetDir).toBe("internal");
    });

    it("blocks dynamic import of another module's internal/ directory", () => {
      const code = `
        async function run() {
          const mod = await import("@/modules/auth/internal/security");
        }
      `;
      const violations = checkFile("apps/server/src/modules/billing/routes.ts", code);
      expect(violations).toHaveLength(1);
      expect(violations[0]?.targetModule).toBe("auth");
      expect(violations[0]?.kind).toBe("dynamic-import");
    });

    it("blocks type-only import of another module's internal/ directory", () => {
      const code = `
        import type { SecurityContext } from "@/modules/auth/internal/security";
      `;
      const violations = checkFile("apps/server/src/modules/billing/routes.ts", code);
      expect(violations).toHaveLength(1);
      expect(violations[0]?.targetModule).toBe("auth");
    });

    it("blocks cross-module alias import of schema", () => {
      const code = `
        import { users } from "@/modules/auth/schema";
      `;
      const violations = checkFile("apps/server/src/modules/billing/routes.ts", code);
      expect(violations).toHaveLength(1);
      expect(violations[0]?.targetModule).toBe("auth");
      expect(violations[0]?.targetDir).toBe("schema");
    });

    it("blocks cross-module relative import of routes", () => {
      const code = `
        import { authRoutes } from "../auth/routes";
      `;
      const violations = checkFile("apps/server/src/modules/billing/routes.ts", code);
      expect(violations).toHaveLength(1);
      expect(violations[0]?.targetModule).toBe("auth");
      expect(violations[0]?.targetDir).toBe("routes");
    });

    it("blocks external code (root index.ts) from directly importing routes", () => {
      const code = `
        import { authRoutes } from "./modules/auth/routes";
      `;
      const violations = checkFile("apps/server/src/index.ts", code);
      expect(violations).toHaveLength(1);
      expect(violations[0]?.sourceModule).toBeNull();
      expect(violations[0]?.targetModule).toBe("auth");
      expect(violations[0]?.targetDir).toBe("routes");
    });

    it("allows intra-module relative imports to internal/ and features/", () => {
      const code = `
        import { hashPassword } from "./internal/security";
        import { registerSchema } from "./features/register/register.dto";
      `;
      const violations = checkFile("apps/server/src/modules/auth/routes.ts", code);
      expect(violations).toHaveLength(0);
    });

    it("allows intra-module relative imports to schema and routes", () => {
      const code = `
        import { users } from "../../schema";
        import { authRoutes } from "../../routes";
      `;
      const violations = checkFile(
        "apps/server/src/modules/auth/features/register/register.handler.ts",
        code,
      );
      expect(violations).toHaveLength(0);
    });

    it("allows importing public contract (index.ts) from external files", () => {
      const code = `
        import { authManifest, authRoutes } from "@/modules/auth";
      `;
      const violations = checkFile("apps/server/src/index.ts", code);
      expect(violations).toHaveLength(0);
    });

    it("allows cross-module import of public contract (index.ts)", () => {
      const code = `
        import { authManifest } from "@/modules/auth";
      `;
      const violations = checkFile("apps/server/src/modules/billing/routes.ts", code);
      expect(violations).toHaveLength(0);
    });
  });

  describe("run CLI", () => {
    it("returns 0 on current codebase", () => {
      const exitCode = run([]);
      expect(exitCode).toBe(0);
    });
  });
});
