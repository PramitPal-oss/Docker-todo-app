import { Request, Response } from 'express';
import pool from '../config/db';
import { asyncHandler } from '../middleware/asyncHandler';

// GET /api/logs?limit=50
// Utility endpoint to inspect recent error/warn logs stored in PostgreSQL.
export const getLogs = asyncHandler(async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 50, 500);
  const result = await pool.query(
    'SELECT * FROM error_logs ORDER BY created_at DESC LIMIT $1',
    [limit]
  );
  res.json({ success: true, data: result.rows });
});
