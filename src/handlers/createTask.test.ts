import { handler } from './createTask';
import { buildEvent } from '../test-utils/buildEvent';
import { getPool } from '../db/connection';

jest.mock('../db/connection');

const mockedGetPool = getPool as jest.MockedFunction<typeof getPool>;

describe('createTask handler', () => {
  it('returns 400 when the request body is invalid', async () => {
    const event = buildEvent({
      httpMethod: 'POST',
      body: JSON.stringify({ /* missing required "title" */ priority: 'high' }),
    });

    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).error).toContain('Invalid request body');
  });

  it('creates a task and returns 201 with the persisted row', async () => {
    const fakeTask = {
      id: 'fake-uuid',
      title: 'Write unit tests',
      description: null,
      status: 'pending',
      priority: 'high',
      due_date: null,
      created_at: '2026-07-07T00:00:00.000Z',
      updated_at: '2026-07-07T00:00:00.000Z',
    };

    mockedGetPool.mockReturnValue({
      query: jest
        .fn()
        .mockResolvedValueOnce([{ insertId: 1 }]) // INSERT
        .mockResolvedValueOnce([[fakeTask]]),      // SELECT ... LIMIT 1
    } as any);

    const event = buildEvent({
      httpMethod: 'POST',
      body: JSON.stringify({ title: 'Write unit tests', priority: 'high' }),
    });

    const result = await handler(event);
    const parsed = JSON.parse(result.body);

    expect(result.statusCode).toBe(201);
    expect(parsed.task).toEqual(fakeTask);
  });

  it('returns 500 when the database query fails', async () => {
    mockedGetPool.mockReturnValue({
      query: jest.fn().mockRejectedValue(new Error('Connection refused')),
    } as any);

    const event = buildEvent({
      httpMethod: 'POST',
      body: JSON.stringify({ title: 'This will fail' }),
    });

    const result = await handler(event);

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body).error).toBe('Failed to create task');
  });
});