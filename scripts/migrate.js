import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, '..', 'migrations');

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
}

async function getAppliedMigrations(client) {
  const result = await client.query('SELECT name FROM schema_migrations ORDER BY name');
  return new Set(result.rows.map((row) => row.name));
}

async function applyMigration(client, name, sql) {
  await client.query('BEGIN');
  try {
    await client.query(sql);
    await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [name]);
    await client.query('COMMIT');
    console.log(`Applied: ${name}`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

async function main() {
  const statusOnly = process.argv.includes('--status');

  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined
  });

  const client = await pool.connect();

  try {
    await ensureMigrationsTable(client);
    const applied = await getAppliedMigrations(client);

    const files = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    const pending = files.filter((file) => !applied.has(file));
    const appliedList = files.filter((file) => applied.has(file));

    if (statusOnly) {
      console.log('Applied:', appliedList.length ? appliedList.join(', ') : '(none)');
      console.log('Pending:', pending.length ? pending.join(', ') : '(none)');
      return;
    }

    if (pending.length === 0) {
      console.log('No pending migrations');
      return;
    }

    for (const file of pending) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await applyMigration(client, file, sql);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
