import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getPool } from '../db/connection';
import { jsonResponse, errorResponse } from '../utils/response';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const id = event.pathParameters?.id;
    if (!id) return errorResponse(400, "Missing 'id' path parameter");

    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);
    const task = (rows as unknown[])[0];

    if (!task) return errorResponse(404, 'Task not found');

    return jsonResponse(200, { task });
  } catch (err) {
    console.error('getTask error:', err);
    return errorResponse(500, 'Failed to fetch task');
  }
}
