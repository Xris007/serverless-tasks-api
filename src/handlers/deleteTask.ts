import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getPool } from '../db/connection';
import { jsonResponse, errorResponse } from '../utils/response';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const id = event.pathParameters?.id;
    if (!id) return errorResponse(400, "Missing 'id' path parameter");

    const pool = getPool();
    const [result] = await pool.query('DELETE FROM tasks WHERE id = ?', [id]);

    if ((result as { affectedRows: number }).affectedRows === 0) {
      return errorResponse(404, 'Task not found');
    }

    return jsonResponse(204, {});
  } catch (err) {
    console.error('deleteTask error:', err);
    return errorResponse(500, 'Failed to delete task');
  }
}
