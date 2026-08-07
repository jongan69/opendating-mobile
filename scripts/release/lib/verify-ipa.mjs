#!/usr/bin/env node
/**
 * verify-ipa.mjs — prove an IPA is what you think it is before uploading it.
 *
 * Checks bundle identifier, marketing version, and that the embedded
 * provisioning profile is an App Store distribution profile rather than a
 * development or ad-hoc one.
 *
 * The distribution test is structural, not a name match:
 *   - App Store profiles carry no ProvisionedDevices key
 *   - get-task-allow is false (debugging disabled)
 * A development profile passing a name check but failing these would be
 * rejected by App Store Connect after a long upload.
 *
 * macOS only — uses plutil for the binary plist.
 */

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { globSync } from 'node:fs';

const args = process.argv.slice(2);
const argOf = (f, d = null) => { const i = args.indexOf(f); return i === -1 ? d : args[i + 1]; };

const IPA = argOf('--ipa');
const WANT_BUNDLE_ID = argOf('--bundle-id');
const WANT_VERSION = argOf('--version');

if (!IPA) { console.error('   xx --ipa is required'); process.exit(1); }

const log = (m) => console.log(`   ${m}`);
const problems = [];

const work = mkdtempSync(join(tmpdir(), 'ipa-verify-'));
try {
  execFileSync('unzip', ['-q', IPA, '-d', work]);

  const infoPlist = globSync(join(work, 'Payload/*.app/Info.plist'))[0];
  if (!infoPlist) throw new Error('No Info.plist found inside Payload/*.app');

  const info = JSON.parse(execFileSync('plutil', ['-convert', 'json', '-o', '-', infoPlist]).toString());

  const bundleId = info.CFBundleIdentifier;
  const version = info.CFBundleShortVersionString;
  const build = info.CFBundleVersion;

  log(`bundle id : ${bundleId}`);
  log(`version   : ${version}`);
  log(`build     : ${build}`);

  if (WANT_BUNDLE_ID && bundleId !== WANT_BUNDLE_ID) {
    problems.push(`bundle id is ${bundleId}, expected ${WANT_BUNDLE_ID}`);
  }
  if (WANT_VERSION && version !== WANT_VERSION) {
    problems.push(`version is ${version}, expected ${WANT_VERSION}`);
  }

  // ── provisioning profile ────────────────────────────────────────────────────
  const profilePath = globSync(join(work, 'Payload/*.app/embedded.mobileprovision'))[0];
  if (!profilePath) {
    problems.push('no embedded.mobileprovision — the app is not signed');
  } else {
    // The profile is CMS-wrapped; the plist payload sits between these markers.
    const raw = readFileSync(profilePath, 'latin1');
    const xml = raw.slice(raw.indexOf('<?xml'), raw.indexOf('</plist>') + 8);

    const strVal = (key) => new RegExp(`<key>${key}</key>\\s*<string>([^<]*)</string>`).exec(xml)?.[1] ?? null;
    const isTrue = (key) => new RegExp(`<key>${key}</key>\\s*<true\\s*/>`).test(xml);
    const hasKey = (key) => new RegExp(`<key>${key}</key>`).test(xml);

    const profileName = strVal('Name');
    const hasDevices = hasKey('ProvisionedDevices');
    const taskAllow = isTrue('get-task-allow');
    const isAppStore = !hasDevices && !taskAllow;

    log(`profile   : ${profileName ?? 'unknown'}`);
    log(`expires   : ${strVal('ExpirationDate') ?? /<key>ExpirationDate<\/key>\s*<date>([^<]*)<\/date>/.exec(xml)?.[1] ?? 'unknown'}`);
    log(`App Store : ${isAppStore ? 'yes' : 'NO'}`);

    if (hasDevices) problems.push('profile lists ProvisionedDevices — this is a development or ad-hoc build');
    if (taskAllow) problems.push('get-task-allow is true — debugging enabled, not a distribution build');
  }
} catch (err) {
  problems.push(err.message);
} finally {
  rmSync(work, { recursive: true, force: true });
}

if (problems.length) {
  console.error('');
  for (const p of problems) console.error(`   xx ${p}`);
  console.error('');
  process.exit(1);
}
log('IPA verified');
