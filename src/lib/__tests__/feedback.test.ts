import { buildCrashDiagnostic, buildProblemReport, type SafeBuildContext } from '../feedback';

const context: SafeBuildContext = {
  appVersion: '0.1.1',
  build: '42',
  platform: 'web',
  osVersion: 'web',
};

describe('privacy-safe reports', () => {
  it('serializes only entered answers and safe build context', () => {
    const report = buildProblemReport(
      { trying: 'open matches', happened: 'blank view', expected: 'matches', frequency: 'Once' },
      { ...context, route: '/secret', location: 'raw', key: 'private' } as SafeBuildContext
    );
    expect(report).toContain('open matches');
    expect(report).not.toContain('/secret');
    expect(report).not.toContain('private');
    expect(report).not.toContain('raw');
  });

  it('keeps crash diagnostics generic', () => {
    const report = buildCrashDiagnostic(context, 'generic-id', '2026-08-29T00:00:00.000Z');
    expect(report).toContain('generic-id');
    expect(report).not.toMatch(/message|stack|route|location|recovery key/i);
  });
});
