import pg from 'pg';

const { Pool } = pg;

let pool;

function resolveDatabaseUrl() {
  return process.env.DATABASE_URL?.trim() || process.env.SUPABASE_DB_URL?.trim() || '';
}

function resolveSsl(connectionString) {
  const sslEnv = process.env.DATABASE_SSL?.trim().toLowerCase();

  if (sslEnv === 'true') {
    return { rejectUnauthorized: false };
  }

  if (sslEnv === 'false') {
    return undefined;
  }

  // Supabase and most managed Postgres hosts require SSL.
  if (/supabase\.(com|co)/i.test(connectionString)) {
    return { rejectUnauthorized: false };
  }

  return undefined;
}

export function getPool() {
  if (!pool) {
    const connectionString = resolveDatabaseUrl();

    if (!connectionString) {
      throw new Error('DATABASE_URL or SUPABASE_DB_URL is not set');
    }

    pool = new Pool({
      connectionString,
      ssl: resolveSsl(connectionString),
      max: Number(process.env.DATABASE_POOL_MAX) || 10
    });
  }

  return pool;
}

export async function query(text, params) {
  return getPool().query(text, params);
}

export async function withTransaction(fn) {
  const client = await getPool().connect();

  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
