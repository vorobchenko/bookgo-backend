import { spawnSync } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL?.trim() || process.env.SUPABASE_DB_URL?.trim();
const statusOnly = process.argv.includes('--status');

if (!databaseUrl) {
  console.error('DATABASE_URL or SUPABASE_DB_URL is required');
  process.exit(1);
}

const subcommand = statusOnly ? 'migration' : 'db';
const action = statusOnly ? 'list' : 'push';
const args = ['supabase', subcommand, action, '--db-url', databaseUrl];

const result = spawnSync('npx', args, {
  stdio: 'inherit',
  shell: process.platform === 'win32'
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
