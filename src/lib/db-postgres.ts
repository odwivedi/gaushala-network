import { Pool } from 'pg';
import logger from '@/lib/logger';

const pool = new Pool({
  host: process.env.POSTGRES_HOST || '127.0.0.1',
  port: parseInt(process.env.POSTGRES_PORT || '5433'),
  user: process.env.POSTGRES_USER || 'gaushala_user',
  password: process.env.POSTGRES_PASSWORD || '',
  database: process.env.POSTGRES_DB || 'gaushala_db',
});

pool.on('error', (err) => {
  logger.error('DB', 'db-postgres.ts', 'PostgreSQL pool error', { err: String(err) });
});

export async function query(text: string, params?: unknown[]) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    if (duration > 500) {
      logger.warn('DB', 'db-postgres.ts', 'Slow query detected', { text, duration });
    }
    return result;
  } catch (err) {
    logger.error('DB', 'db-postgres.ts', 'Query failed', { text, err: String(err) });
    throw err;
  }
}

export default pool;
