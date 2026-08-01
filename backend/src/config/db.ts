import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT) || 5432,
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'todo_app',
});

pool.on('error', (err) => {
  // Errors on idle clients in the pool - log to console since logger
  // itself depends on this pool. Avoid circular dependency.
  console.error('Unexpected PostgreSQL pool error:', err);
});

export default pool;
