export interface SafeBuildContext {
  appVersion: string;
  build: string;
  platform: string;
  osVersion: string;
}

export interface ProblemReportInput {
  trying: string;
  happened: string;
  expected: string;
  frequency: string;
}

export function buildProblemReport(input: ProblemReportInput, context: SafeBuildContext): string {
  return [
    'OpenDating problem report',
    '',
    `What I was trying to do: ${input.trying.trim()}`,
    `What happened: ${input.happened.trim()}`,
    `What I expected: ${input.expected.trim()}`,
    `How often: ${input.frequency}`,
    '',
    'Safe app context',
    `Version: ${context.appVersion}`,
    `Build: ${context.build}`,
    `Platform: ${context.platform}`,
    `OS: ${context.osVersion}`,
  ].join('\n');
}

export function buildCrashDiagnostic(
  context: SafeBuildContext,
  genericErrorId: string,
  timestamp = new Date().toISOString()
): string {
  return [
    'OpenDating crash diagnostic',
    `Error ID: ${genericErrorId}`,
    `Timestamp: ${timestamp}`,
    `Version: ${context.appVersion}`,
    `Build: ${context.build}`,
    `Platform: ${context.platform}`,
    `OS: ${context.osVersion}`,
  ].join('\n');
}
