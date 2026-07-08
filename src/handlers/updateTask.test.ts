import { handler } from './updateTask';
import { buildEvent } from '../test-utils/buildEvent';
import { getPool } from '../db/connection';

jest.mock('../db/connection');

const mockedGetPool = getPool as jest.MockedFunction<typeof getPool>;

describe('updateTask handler', () => {
  it('returns 400 when no id path parameter is provided', async () => {
    const event = buildEvent({ httpMethod: 'PATCH', pathParameters: null, body: '{}' });

    const result = await handler(event);

    expect(result.statusCode).toBe(400);
  });

  it('returns 400 when there are no valid fields to update', async () => {
    const event = buildEvent({
      httpMethod: 'PATCH',
      pathParameters: { id: 'abc-123' },
      body: JSON.stringify({}), // empty body -> no fields to update
    });

    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).error).toBe('No valid fields to update');
  });

  it('returns 404 when the task does not exist', async () => {
    mockedGetPool.mockReturnValue({
      query: jest.fn().mockResolvedValue([{ affectedRows: 0 }]), // UPDATE matched nothing
    } as any);

    const event = buildEvent({
      httpMethod: 'PATCH',
      pathParameters: { id: 'non-existent-id' },
      body: JSON.stringify({ status: 'done' }),
    });

    const result = await handler(event);

    expect(result.statusCode).toBe(404);
  });

  it('returns 200 with the updated task on success', async () => {
    const updatedTask = { id: 'abc-123', title: 'Task', status: 'done' };

    mockedGetPool.mockReturnValue({
      query: jest
        .fn()
        .mockResolvedValueOnce([{ affectedRows: 1 }]) // UPDATE
        .mockResolvedValueOnce([[updatedTask]]),        // SELECT after update
    } as any);

    const event = buildEvent({
      httpMethod: 'PATCH',
      pathParameters: { id: 'abc-123' },
      body: JSON.stringify({ status: 'done' }),
    });

    const result = await handler(event);
    const parsed = JSON.parse(result.body);

    expect(result.statusCode).toBe(200);
    expect(parsed.task).toEqual(updatedTask);
  });
});