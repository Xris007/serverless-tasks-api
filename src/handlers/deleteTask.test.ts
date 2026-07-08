import { handler } from './deleteTask';
import { buildEvent } from '../test-utils/buildEvent';
import { getPool } from '../db/connection';

jest.mock('../db/connection');

const mockedGetPool = getPool as jest.MockedFunction<typeof getPool>;

describe('deleteTask handler', () => {
  it('returns 400 when no id path parameter is provided', async () => {
    const event = buildEvent({ httpMethod: 'DELETE', pathParameters: null });

    const result = await handler(event);

    expect(result.statusCode).toBe(400);
  });

  it('returns 404 when the task does not exist', async () => {
    mockedGetPool.mockReturnValue({
      query: jest.fn().mockResolvedValue([{ affectedRows: 0 }]),
    } as any);

    const event = buildEvent({ httpMethod: 'DELETE', pathParameters: { id: 'non-existent-id' } });

    const result = await handler(event);

    expect(result.statusCode).toBe(404);
  });

  it('returns 204 when the task is deleted successfully', async () => {
    mockedGetPool.mockReturnValue({
      query: jest.fn().mockResolvedValue([{ affectedRows: 1 }]),
    } as any);

    const event = buildEvent({ httpMethod: 'DELETE', pathParameters: { id: 'abc-123' } });

    const result = await handler(event);

    expect(result.statusCode).toBe(204);
  });
});