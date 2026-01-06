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

  const schemaPath = resolve(process.cwd(), "../supabase/schema.sql");
  const sql = await readFile(schemaPath, "utf8");

  const client = new Client({
    connectionString,
    application_name: "lawyer-diary-schema-sync",
  });

  try {
    await client.connect();
    await client.query("begin;");
    await client.query(sql);
    await client.query("commit;");
    console.log("✅ schema.sql applied successfully");
  } catch (error) {
    await client.query("rollback;");
    console.error("❌ Failed to apply schema.sql");
    console.error(error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();


