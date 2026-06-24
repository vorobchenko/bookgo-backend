import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import pg from 'pg';

dotenv.config();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  if (!email || !password) {
    console.error('SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are required');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('SEED_ADMIN_PASSWORD must be at least 8 characters');
    process.exit(1);
  }

  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined
  });

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);

    if (existing.rowCount > 0) {
      console.log(`Admin user already exists: ${email}`);
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 8);
    const name = process.env.SEED_ADMIN_NAME || 'Admin';

    await pool.query(
      `INSERT INTO users (email, password, name, lang)
       VALUES ($1, $2, $3, $4)`,
      [email.toLowerCase(), hashedPassword, name, process.env.SEED_ADMIN_LANG || 'en']
    );

    console.log(`Admin user created: ${email}`);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
