import { handler } from './listTasks';
import { buildEvent } from '../test-utils/buildEvent';
import { getPool } from '../db/connection';

jest.mock('../db/connection');

const mockedGetPool = getPool as jest.MockedFunction<typeof getPool>;

describe('listTasks handler', () => {
  it('returns 200 with a list of tasks', async () => {
    const fakeTasks = [
      { id: '1', title: 'Task A', status: 'pending' },
      { id: '2', title: 'Task B', status: 'done' },
    ];

    mockedGetPool.mockReturnValue({
      query: jest.fn().mockResolvedValue([fakeTasks]),
    } as any);

    const event = buildEvent({ httpMethod: 'GET' });

    const result = await handler(event);
    const parsed = JSON.parse(result.body);

    expect(result.statusCode).toBe(200);
    expect(parsed.tasks).toEqual(fakeTasks);
  });

  it('filters by status when provided as a query parameter', async () => {
    const mockQuery = jest.fn().mockResolvedValue([[]]);
    mockedGetPool.mockReturnValue({ query: mockQuery } as any);

    const event = buildEvent({
      httpMethod: 'GET',
      queryStringParameters: { status: 'done' },
    });

    await handler(event);

    const [sqlText, params] = mockQuery.mock.calls[0];
    expect(sqlText).toContain('status = ?');
    expect(params).toContain('done');
  });

  it('caps the limit at 100 even if a higher value is requested', async () => {
    const mockQuery = jest.fn().mockResolvedValue([[]]);
    mockedGetPool.mockReturnValue({ query: mockQuery } as any);

    const event = buildEvent({
      httpMethod: 'GET',
      queryStringParameters: { limit: '500' },
    });

    await handler(event);

    const [, params] = mockQuery.mock.calls[0];
    expect(params).toContain(100);
  });
});