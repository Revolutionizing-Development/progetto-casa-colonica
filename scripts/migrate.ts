/**
 * Run Aditus DB migration on startup.
 * Usage: npx tsx scripts/migrate.ts
 *
 * getMigrationSql() is part of the Aditus adapters module (still in progress).
 * When released, uncomment the import block below.
 */
import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  // Run app schema migration
  const sql = readFileSync(
    join(process.cwd(), 'supabase/migrations/001_initial_schema.sql'),
    'utf-8'
  );
  await pool.query(sql);
  console.log('[migrate] App schema applied.');

  // Aditus migration — uncomment once createPostgresAdapter ships:
  // const { getMigrationSql } = await import('@revolutionizing-development/aditus');
  // await pool.query(getMigrationSql());
  // console.log('[migrate] Aditus schema applied.');

  await pool.end();
}

run().catch((err) => {
  console.error('[migrate] Failed:', err);
  process.exit(1);
});
