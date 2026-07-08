import type { APIGatewayProxyEvent, APIGatewayProxyResult, ScheduledEvent } from 'aws-lambda';
import { getPool } from '../db/connection';
import { jsonResponse, errorResponse } from '../utils/response';

/**
 * This function serves two triggers defined in serverless.yml:
 * 1. An HTTP GET /health endpoint, for on-demand checks (e.g. uptime monitors).
 * 2. A scheduled EventBridge rule (every 15 min), for periodic self-checks
 *    independent of user traffic — useful to catch DB connectivity issues
 *    before they show up as user-facing errors.
 *
 * Same Lambda, two independent event sources — a common serverless pattern.
 */
export async function handler(
  event: APIGatewayProxyEvent | ScheduledEvent
): Promise<APIGatewayProxyResult | void> {
  const isHttpTrigger = 'httpMethod' in event;

  try {
    const pool = getPool();
    await pool.query('SELECT 1');

    const payload = { status: 'ok', db: 'connected', timestamp: new Date().toISOString() };

    if (isHttpTrigger) {
      return jsonResponse(200, payload);
    }

    console.log('Scheduled health check passed:', payload);
    return;
  } catch (err) {
    console.error('Health check failed:', err);

    if (isHttpTrigger) {
      return errorResponse(503, 'Service unavailable: database connection failed');
    }
    // For scheduled invocations, throwing lets CloudWatch alarms react to failures.
    throw err;
  }
}
