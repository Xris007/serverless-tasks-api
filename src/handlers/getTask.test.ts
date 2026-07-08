import { handler } from './getTask';
import { buildEvent } from '../test-utils/buildEvent';
import { getPool } from '../db/connection';

jest.mock('../db/connection');

const mockedGetPool = getPool as jest.MockedFunction<typeof getPool>;

describe('getTask handler', () => {
  it('returns 400 when no id path parameter is provided', async () => {
    const event = buildEvent({ pathParameters: null });

    const result = await handler(event);

    expect(result.statusCode).toBe(400);
  });

  it('returns 404 when the task does not exist', async () => {
    mockedGetPool.mockReturnValue({
      query: jest.fn().mockResolvedValue([[]]), // no rows found
    } as any);

    const event = buildEvent({ pathParameters: { id: 'non-existent-id' } });

    const result = await handler(event);

    expect(result.statusCode).toBe(404);
    expect(JSON.parse(result.body).error).toBe('Task not found');
  });

  it('returns 200 with the task when found', async () => {
    const fakeTask = { id: 'abc-123', title: 'Learn AWS Lambda', status: 'pending' };

    mockedGetPool.mockReturnValue({
      query: jest.fn().mockResolvedValue([[fakeTask]]),
    } as any);

    const event = buildEvent({ pathParameters: { id: 'abc-123' } });

    const result = await handler(event);
    const parsed = JSON.parse(result.body);

    expect(result.statusCode).toBe(200);
    expect(parsed.task).toEqual(fakeTask);
  });
});