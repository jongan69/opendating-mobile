import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import process from 'node:process';

const manifestUrl = new URL('../../release/manifest.json', import.meta.url);
const appConfigUrl = new URL('../../app.json', import.meta.url);
const manifest = JSON.parse(await readFile(manifestUrl, 'utf8'));
const appConfig = JSON.parse(await readFile(appConfigUrl, 'utf8'));
const validateOnly = process.argv.includes('--validate-only');
const sourceOnly = process.argv.includes('--source-only');

function fail(message) {
  throw new Error(message);
}

function git(args, { allowFailure = false } = {}) {
  const result = spawnSync('git', args, {
    cwd: new URL('../..', import.meta.url),
    encoding: 'utf8',
  });
  if (!allowFailure && result.status !== 0) {
    fail(`git ${args.join(' ')} failed: ${result.stderr.trim()}`);
  }
  return result;
}

const requiredStringFields = [
  'appVersion',
  'protocolVersion',
  'databaseSchema',
  'migrationState',
];
for (const field of requiredStringFields) {
  if (typeof manifest[field] !== 'string' || manifest[field].length === 0) {
    fail(`Release manifest is missing ${field}.`);
  }
}

if (manifest.appVersion !== appConfig.expo?.version) {
  fail(
    `Release manifest appVersion ${manifest.appVersion} does not match app.json ` +
      `${appConfig.expo?.version ?? '(missing)'}.`,
  );
}
if (!['blocked', 'approved'].includes(manifest.status)) {
  fail('Release manifest status must be blocked or approved.');
}
if (!Array.isArray(manifest.blockers)) {
  fail('Release manifest blockers must be an array.');
}
if (!manifest.artifacts || typeof manifest.artifacts !== 'object') {
  fail('Release manifest must contain an artifacts object.');
}

for (const [platform, buildField] of [
  ['ios', 'buildNumber'],
  ['android', 'versionCode'],
]) {
  const artifact = manifest.artifacts[platform];
  if (!artifact || typeof artifact !== 'object') {
    fail(`Release manifest is missing artifacts.${platform}.`);
  }
  if (artifact.appVersion !== manifest.appVersion) {
    fail(
      `artifacts.${platform}.appVersion must match release ${manifest.appVersion}.`,
    );
  }
  if (
    artifact[buildField] !== null &&
    (typeof artifact[buildField] !== 'string' || artifact[buildField].length === 0)
  ) {
    fail(`artifacts.${platform}.${buildField} must be a non-empty string or null.`);
  }
  if (
    artifact.buildId !== null &&
    (typeof artifact.buildId !== 'string' || artifact.buildId.length === 0)
  ) {
    fail(`artifacts.${platform}.buildId must be a non-empty string or null.`);
  }
  if (
    artifact.sha256 !== null &&
    !/^[0-9a-f]{64}$/i.test(artifact.sha256)
  ) {
    fail(`artifacts.${platform}.sha256 must be a 64-character hex digest or null.`);
  }
}

if (validateOnly) {
  console.log(`Release manifest is structurally valid and currently ${manifest.status}.`);
  process.exit(0);
}

if (manifest.status !== 'approved' || manifest.blockers.length > 0) {
  fail(`Production release is blocked: ${manifest.blockers.join(', ') || 'approval missing'}.`);
}
if (!/^[0-9a-f]{40}$/.test(manifest.gitSha ?? '')) {
  fail('An approved release must pin the full source-candidate git SHA.');
}
if (!manifest.approvedAt || !manifest.approvedBy) {
  fail('An approved release must record approval time and approver.');
}
if (process.env.OPENDATING_RELEASE_APPROVED !== 'true') {
  fail('Release approval is available only in the protected release environment.');
}

// Avoid a manifest self-reference: gitSha names the reviewed source candidate.
// The current commit may differ from it only by release/manifest.json, and a
// signed annotated tag must bind this exact approval commit immutably.
const headSha = git(['rev-parse', 'HEAD']).stdout.trim();
if (manifest.gitSha === headSha) {
  fail('manifest.gitSha must name the source candidate before its approval-only commit.');
}
if (git(['merge-base', '--is-ancestor', manifest.gitSha, headSha], { allowFailure: true }).status !== 0) {
  fail('manifest.gitSha is not an ancestor of the checked-out approval commit.');
}
const changedPaths = git(['diff', '--name-only', `${manifest.gitSha}..${headSha}`])
  .stdout.trim()
  .split('\n')
  .filter(Boolean);
if (changedPaths.length === 0 || changedPaths.some((path) => path !== 'release/manifest.json')) {
  fail(
    'Only release/manifest.json may change between manifest.gitSha and the tagged approval commit.',
  );
}

const releaseTag = process.env.OPENDATING_RELEASE_TAG;
const tagPrefix = `opendating-mobile-v${manifest.appVersion}`;
if (
  typeof releaseTag !== 'string' ||
  (releaseTag !== tagPrefix && !releaseTag.startsWith(`${tagPrefix}-rc.`))
) {
  fail(`OPENDATING_RELEASE_TAG must be ${tagPrefix} or a numbered ${tagPrefix}-rc.* tag.`);
}
if (git(['cat-file', '-t', `refs/tags/${releaseTag}`], { allowFailure: true }).stdout.trim() !== 'tag') {
  fail(`Release tag ${releaseTag} must be an annotated tag.`);
}
const tagSha = git(['rev-parse', `${releaseTag}^{commit}`]).stdout.trim();
if (tagSha !== headSha) {
  fail(`Signed release tag ${releaseTag} does not point to the checked-out commit.`);
}
if (git(['verify-tag', releaseTag], { allowFailure: true }).status !== 0) {
  fail(`Release tag ${releaseTag} does not have a trusted valid signature.`);
}

if (!sourceOnly) {
  for (const [platform, buildField] of [
    ['ios', 'buildNumber'],
    ['android', 'versionCode'],
  ]) {
    const artifact = manifest.artifacts[platform];
    if (!artifact.buildId || !artifact[buildField] || !artifact.sha256) {
      fail(
        `Approved release is missing ${platform} artifact ID, ${buildField}, or checksum.`,
      );
    }
  }
}

console.log(
  `Release ${manifest.appVersion} is approved from source ${manifest.gitSha} ` +
    `by signed tag ${releaseTag}${sourceOnly ? ' (source gate)' : ''}.`,
);
