import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { getPool, query } from '../utils/db.js';
import { isValidEmail, normalizeEmail } from '../utils/email.js';

dotenv.config();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!process.env.DATABASE_URL?.trim() && !process.env.SUPABASE_DB_URL?.trim()) {
    console.error('DATABASE_URL or SUPABASE_DB_URL is required');
    process.exit(1);
  }

  if (!email || !password) {
    console.error('SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are required');
    process.exit(1);
  }

  const normalizedEmail = normalizeEmail(email);
  if (!isValidEmail(normalizedEmail)) {
    console.error('SEED_ADMIN_EMAIL is not a valid email address');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('SEED_ADMIN_PASSWORD must be at least 8 characters');
    process.exit(1);
  }

  try {
    const existing = await query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);

    if (existing.rowCount > 0) {
      console.log(`Admin user already exists: ${normalizedEmail}`);
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 8);
    const name = process.env.SEED_ADMIN_NAME || 'Admin';

    await query(
      `INSERT INTO users (email, password, name, lang)
       VALUES ($1, $2, $3, $4)`,
      [normalizedEmail, hashedPassword, name, process.env.SEED_ADMIN_LANG || 'en']
    );

    console.log(`Admin user created: ${normalizedEmail}`);
  } finally {
    await getPool().end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
