import { Request, Response } from 'express';
import pool from '../config/db';
import { AppError } from '../middleware/AppError';
import { asyncHandler } from '../middleware/asyncHandler';
import logger from '../config/logger';

// GET /api/todos
export const getTodos = asyncHandler(async (req: Request, res: Response) => {
  const result = await pool.query('SELECT * FROM todos ORDER BY created_at DESC');
  res.json({ success: true, data: result.rows });
});

// GET /api/todos/:id
export const getTodoById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await pool.query('SELECT * FROM todos WHERE id = $1', [id]);

  if (result.rows.length === 0) {
    throw new AppError(`Todo with id ${id} not found`, 404);
  }

  res.json({ success: true, data: result.rows[0] });
});

// POST /api/todos
export const createTodo = asyncHandler(async (req: Request, res: Response) => {
  const { title } = req.body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    throw new AppError('Title is required and must be a non-empty string', 400);
  }

  const result = await pool.query(
    'INSERT INTO todos (title) VALUES ($1) RETURNING *',
    [title.trim()]
  );

  logger.info('Todo created', { id: result.rows[0].id });
  res.status(201).json({ success: true, data: result.rows[0] });
});

// PUT /api/todos/:id
export const updateTodo = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, completed } = req.body;

  const existing = await pool.query('SELECT * FROM todos WHERE id = $1', [id]);
  if (existing.rows.length === 0) {
    throw new AppError(`Todo with id ${id} not found`, 404);
  }

  const current = existing.rows[0];
  const newTitle = title !== undefined ? title : current.title;
  const newCompleted = completed !== undefined ? completed : current.completed;

  const result = await pool.query(
    'UPDATE todos SET title = $1, completed = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
    [newTitle, newCompleted, id]
  );

  res.json({ success: true, data: result.rows[0] });
});

// DELETE /api/todos/:id
export const deleteTodo = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await pool.query('DELETE FROM todos WHERE id = $1 RETURNING *', [id]);

  if (result.rows.length === 0) {
    throw new AppError(`Todo with id ${id} not found`, 404);
  }

  logger.info('Todo deleted', { id });
  res.json({ success: true, data: result.rows[0] });
});
