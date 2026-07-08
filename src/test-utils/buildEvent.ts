import type { APIGatewayProxyEvent } from 'aws-lambda';

/**
 * Builds a minimal, valid APIGatewayProxyEvent for unit tests, so each test
 * only needs to override the fields it actually cares about (body, path
 * params, query params) instead of repeating this whole shape everywhere.
 */
export function buildEvent(overrides: Partial<APIGatewayProxyEvent> = {}): APIGatewayProxyEvent {
  return {
    body: null,
    headers: {},
    multiValueHeaders: {},
    httpMethod: 'GET',
    isBase64Encoded: false,
    path: '/tasks',
    pathParameters: null,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {} as APIGatewayProxyEvent['requestContext'],
    resource: '',
    ...overrides,
  };
}