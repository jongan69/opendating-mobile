import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import process from 'node:process';

const exceptionsUrl = new URL('../security/audit-exceptions.json', import.meta.url);
const exceptions = JSON.parse(await readFile(exceptionsUrl, 'utf8'));
const audit = spawnSync('npm', ['audit', '--omit=dev', '--json'], {
  cwd: new URL('..', import.meta.url),
  encoding: 'utf8',
});

let report;
try {
  report = JSON.parse(audit.stdout);
} catch {
  throw new Error(`npm audit did not return JSON: ${audit.stderr.trim()}`);
}

const vulnerabilities = Object.entries(report.vulnerabilities ?? {});
const critical = vulnerabilities
  .filter(([, value]) => value.severity === 'critical')
  .map(([name]) => name);
if (critical.length > 0) {
  throw new Error(`Critical production advisories: ${critical.join(', ')}`);
}

const expiry = new Date(`${exceptions.expires}T23:59:59Z`);
if (!Number.isFinite(expiry.getTime()) || expiry < new Date()) {
  throw new Error(`Security exception expired on ${exceptions.expires}.`);
}

const allowed = new Set(exceptions.highSeverityPackages ?? []);
const unexpectedHigh = vulnerabilities
  .filter(([, value]) => value.severity === 'high')
  .map(([name]) => name)
  .filter((name) => !allowed.has(name));
if (unexpectedHigh.length > 0) {
  throw new Error(`Unexpected high production advisories: ${unexpectedHigh.join(', ')}`);
}

const currentHigh = new Set(
  vulnerabilities
    .filter(([, value]) => value.severity === 'high')
    .map(([name]) => name),
);
const resolved = [...allowed].filter((name) => !currentHigh.has(name));
if (resolved.length > 0) {
  console.warn(`Remove resolved audit exceptions: ${resolved.join(', ')}`);
}

console.log(
  `Production audit checked: ${currentHigh.size} time-limited high advisories, ` +
    `0 critical; exception expires ${exceptions.expires}.`,
);
