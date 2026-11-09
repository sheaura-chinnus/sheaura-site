import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import "dotenv/config";

async function run() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing in .env");
  }

  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

  console.log("1. Cleaning partially applied schema from previous push...");
  await pool.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");

  console.log("2. Applying migrations in order from server/db/migrations...");
  const db = drizzle(pool);
  await migrate(db, { migrationsFolder: "server/db/migrations" });

  console.log("All migrations applied successfully!");
  await pool.end();
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
