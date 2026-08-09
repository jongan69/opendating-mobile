import { readFile } from 'node:fs/promises';
import process from 'node:process';

const manifestUrl = new URL('../../release/manifest.json', import.meta.url);
const manifest = JSON.parse(await readFile(manifestUrl, 'utf8'));
const validateOnly = process.argv.includes('--validate-only');

const requiredStringFields = ['appVersion', 'protocolVersion', 'migrationState'];
for (const field of requiredStringFields) {
  if (typeof manifest[field] !== 'string' || manifest[field].length === 0) {
    throw new Error(`Release manifest is missing ${field}.`);
  }
}

if (!['blocked', 'approved'].includes(manifest.status)) {
  throw new Error('Release manifest status must be blocked or approved.');
}
if (!Array.isArray(manifest.blockers)) {
  throw new Error('Release manifest blockers must be an array.');
}

if (validateOnly) {
  console.log(`Release manifest is valid and currently ${manifest.status}.`);
  process.exit(0);
}

if (manifest.status !== 'approved' || manifest.blockers.length > 0) {
  throw new Error(
    `Production release is blocked: ${manifest.blockers.join(', ') || 'approval missing'}.`,
  );
}
if (!/^[0-9a-f]{40}$/.test(manifest.gitSha ?? '')) {
  throw new Error('An approved release must pin a full 40-character git SHA.');
}
if (!manifest.approvedAt || !manifest.approvedBy) {
  throw new Error('An approved release must record approval time and approver.');
}
if (process.env.OPENDATING_RELEASE_APPROVED !== 'true') {
  throw new Error('Set OPENDATING_RELEASE_APPROVED=true only in the protected release environment.');
}

console.log(`Release ${manifest.appVersion} is approved for ${manifest.gitSha}.`);
