import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getPool } from '../db/connection';
import { jsonResponse, errorResponse } from '../utils/response';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const { status, limit, offset } = event.queryStringParameters ?? {};
    const pool = getPool();

    const parsedLimit = Math.min(Number(limit) || 50, 100); // cap to avoid huge scans
    const parsedOffset = Number(offset) || 0;

    let query = 'SELECT * FROM tasks WHERE 1=1';
    const params: unknown[] = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY due_date IS NULL, due_date ASC LIMIT ? OFFSET ?';
    params.push(parsedLimit, parsedOffset);

    const [rows] = await pool.query(query, params);

    return jsonResponse(200, {
      tasks: rows,
      pagination: { limit: parsedLimit, offset: parsedOffset },
    });
  } catch (err) {
    console.error('listTasks error:', err);
    return errorResponse(500, 'Failed to list tasks');
  }
}
