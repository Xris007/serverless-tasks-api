import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getPool } from '../db/connection';
import { taskInputSchema } from '../db/types';
import { jsonResponse, errorResponse } from '../utils/response';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const body = JSON.parse(event.body ?? '{}');
    const parsed = taskInputSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(400, `Invalid request body: ${parsed.error.message}`);
    }

    const { title, description, priority, due_date } = parsed.data;
    const pool = getPool();

    const [result] = await pool.query(
      `INSERT INTO tasks (id, title, description, priority, due_date)
       VALUES (UUID(), ?, ?, ?, ?)`,
      [title, description ?? null, priority, due_date ?? null]
    );

    const insertId = (result as { insertId?: number }).insertId;

    const [rows] = await pool.query(
      `SELECT * FROM tasks ORDER BY created_at DESC LIMIT 1`
    );

    return jsonResponse(201, { task: (rows as unknown[])[0] });
  } catch (err) {
    console.error('createTask error:', err);
    return errorResponse(500, 'Failed to create task');
  }
}
