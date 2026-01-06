import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Client } from "pg";

async function main() {
  const connectionString = process.env.SUPABASE_DB_URL;

  if (!connectionString) {
    console.error(
      "Missing SUPABASE_DB_URL. Grab the connection string from the Supabase dashboard (Project Settings → Database) and export it before running this script.",
    );
    process.exit(1);
  }

  const migrationPath = resolve(process.cwd(), "supabase/migrations/add_documents_ai_columns.sql");
  const sql = await readFile(migrationPath, "utf8");

  const client = new Client({
    connectionString,
    application_name: "lawyer-diary-ai-columns-migration",
  });

  try {
    await client.connect();
    console.log("🔄 Applying AI columns migration...");
    await client.query("begin;");
    await client.query(sql);
    await client.query("commit;");
    console.log("✅ AI columns added to documents table successfully");
  } catch (error) {
    await client.query("rollback;");
    console.error("❌ Failed to apply AI columns migration");
    console.error(error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();

