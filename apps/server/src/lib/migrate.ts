import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { db } from "@syncdocket/db";
import { sql } from "drizzle-orm";

async function runMigrations() {
  console.log("Running module migrations...");
  const modulesDir = join(import.meta.dir, "../modules");

  const domains = readdirSync(modulesDir);
  for (const domain of domains) {
    const migrationsDir = join(modulesDir, domain, "migrations");
    try {
      if (!statSync(migrationsDir).isDirectory()) continue;
    } catch {
      continue;
    }

    const files = readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();
    for (const file of files) {
      console.log(`Applying migration [${domain}]: ${file}`);
      const sqlContent = readFileSync(join(migrationsDir, file), "utf-8");
      await db.execute(sql.raw(sqlContent));
      console.log(`  ✓ Done [${domain}]: ${file}`);
    }
  }

  console.log("All module migrations applied successfully!");
  process.exit(0);
}

runMigrations().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
