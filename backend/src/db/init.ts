import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import pool from '../config/db';

dotenv.config();

async function init() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');

  try {
    await pool.query(schema);
    console.log('✅ Database schema initialized successfully (todos, error_logs).');
  } catch (err) {
    console.error('❌ Failed to initialize database schema:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

init();
