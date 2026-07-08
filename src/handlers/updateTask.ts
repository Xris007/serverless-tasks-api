import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getPool } from '../db/connection';
import { taskUpdateSchema } from '../db/types';
import { jsonResponse, errorResponse } from '../utils/response';

const ALLOWED_FIELDS = ['title', 'description', 'priority', 'status', 'due_date'] as const;

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const id = event.pathParameters?.id;
    if (!id) return errorResponse(400, "Missing 'id' path parameter");

    const body = JSON.parse(event.body ?? '{}');
    const parsed = taskUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(400, `Invalid request body: ${parsed.error.message}`);
    }

    const updates = Object.entries(parsed.data).filter(([key]) =>
      (ALLOWED_FIELDS as readonly string[]).includes(key)
    );

    if (updates.length === 0) {
      return errorResponse(400, 'No valid fields to update');
    }

    const pool = getPool();
    const setClause = updates.map(([key]) => `${key} = ?`).join(', ');
    const values = updates.map(([, value]) => value);

    const [result] = await pool.query(
      `UPDATE tasks SET ${setClause} WHERE id = ?`,
      [...values, id]
    );

    if ((result as { affectedRows: number }).affectedRows === 0) {
      return errorResponse(404, 'Task not found');
    }

    const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);
    return jsonResponse(200, { task: (rows as unknown[])[0] });
  } catch (err) {
    console.error('updateTask error:', err);
    return errorResponse(500, 'Failed to update task');
  }
}
