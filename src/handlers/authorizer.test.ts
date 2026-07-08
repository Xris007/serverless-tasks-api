import jwt from 'jsonwebtoken';
import { handler } from './authorizer';
import type { APIGatewayTokenAuthorizerEvent } from 'aws-lambda';

const TEST_SECRET = 'test-secret-for-unit-tests';

function buildAuthEvent(authorizationToken: string): APIGatewayTokenAuthorizerEvent {
  return {
    type: 'TOKEN',
    authorizationToken,
    methodArn: 'arn:aws:execute-api:us-east-1:123456789012:abc123/dev/POST/tasks',
  };
}

describe('JWT authorizer', () => {
  const originalEnv = process.env.JWT_SECRET;

  beforeAll(() => {
    process.env.JWT_SECRET = TEST_SECRET;
  });

  afterAll(() => {
    process.env.JWT_SECRET = originalEnv;
  });

  it('allows access with a valid token', async () => {
    const token = jwt.sign({ sub: 'user-123' }, TEST_SECRET, { expiresIn: '1h' });
    const event = buildAuthEvent(`Bearer ${token}`);

    const result = await handler(event);

    expect(result.principalId).toBe('user-123');
    expect(result.policyDocument.Statement[0].Effect).toBe('Allow');
  });

  it('rejects a request with no Authorization header', async () => {
    const event = buildAuthEvent('');

    await expect(handler(event)).rejects.toThrow('Unauthorized');
  });

  it('rejects a malformed Authorization header (missing "Bearer" prefix)', async () => {
    const token = jwt.sign({ sub: 'user-123' }, TEST_SECRET);
    const event = buildAuthEvent(token); // no "Bearer " prefix

    await expect(handler(event)).rejects.toThrow('Unauthorized');
  });

  it('rejects an expired token', async () => {
    const expiredToken = jwt.sign({ sub: 'user-123' }, TEST_SECRET, { expiresIn: '-1s' });
    const event = buildAuthEvent(`Bearer ${expiredToken}`);

    await expect(handler(event)).rejects.toThrow('Unauthorized');
  });

  it('rejects a token signed with the wrong secret', async () => {
    const token = jwt.sign({ sub: 'user-123' }, 'wrong-secret');
    const event = buildAuthEvent(`Bearer ${token}`);

    await expect(handler(event)).rejects.toThrow('Unauthorized');
  });
});