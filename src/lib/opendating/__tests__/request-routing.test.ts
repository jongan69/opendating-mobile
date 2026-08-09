import { getRequestRoute, REQUEST_ROUTES } from '../request-routing';

describe('request routing', () => {
  it('routes account deletion to the dedicated service', () => {
    expect(getRequestRoute('account.delete')).toEqual({
      role: 'deletion',
      resultType: 'account.delete.result',
    });
  });

  it('routes block removal and unmatch to messaging policy', () => {
    expect(getRequestRoute('block.remove').role).toBe('dm_policy');
    expect(getRequestRoute('unmatch.create').role).toBe('dm_policy');
  });

  it('defines a response type for every request', () => {
    for (const route of Object.values(REQUEST_ROUTES)) {
      expect(route.resultType).toMatch(/(?:\.result|\.pong)$/);
    }
  });
});
