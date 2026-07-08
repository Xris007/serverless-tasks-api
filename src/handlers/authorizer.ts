import type {
  APIGatewayTokenAuthorizerEvent,
  APIGatewayAuthorizerResult,
} from 'aws-lambda';
import jwt from 'jsonwebtoken';

export async function handler(
  event: APIGatewayTokenAuthorizerEvent
): Promise<APIGatewayAuthorizerResult> {
  const token = extractToken(event.authorizationToken);

  if (!token) {
    throw new Error('Unauthorized');
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET is not configured');

    const decoded = jwt.verify(token, secret) as { sub?: string };

    return generatePolicy(decoded.sub ?? 'unknown-user', 'Allow', event.methodArn);
  } catch (err) {
    console.error('Token verification failed:', err);
    throw new Error('Unauthorized');
  }
}

function extractToken(authorizationHeader: string): string | null {
  const [scheme, token] = authorizationHeader?.split(' ') ?? [];
  if (scheme !== 'Bearer' || !token) return null;
  return token;
}

function generatePolicy(
  principalId: string,
  effect: 'Allow' | 'Deny',
  resource: string
): APIGatewayAuthorizerResult {
  return {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: resource,
        },
      ],
    },
  };
}