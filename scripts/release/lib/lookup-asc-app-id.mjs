#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { sign } from 'node:crypto';

const bundleId = process.env.APP_BUNDLE_ID || 'com.jongan69.opendating';
const writeEasJson = process.argv.includes('--write-eas-json');
const keyId = process.env.ASC_API_KEY_ID || process.env.EXPO_ASC_API_KEY_ID || '563GUURUSD';
const issuerId = process.env.ASC_API_KEY_ISSUER_ID || process.env.EXPO_ASC_API_KEY_ISSUER_ID;
const keyPath =
  process.env.ASC_API_KEY_PATH ||
  process.env.EXPO_ASC_API_KEY_PATH ||
  `${homedir()}/.appstoreconnect/private_keys/AuthKey_${keyId}.p8`;

function fail(message) {
  console.error(message);
  process.exit(1);
}

function base64Url(value) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function createToken() {
  if (!issuerId) fail('ASC_API_KEY_ISSUER_ID is required.');

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'ES256', kid: keyId, typ: 'JWT' };
  const payload = { iss: issuerId, iat: now, exp: now + 1200, aud: 'appstoreconnect-v1' };
  const body = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(payload))}`;
  const signature = sign('sha256', Buffer.from(body), {
    key: readFileSync(keyPath, 'utf8'),
    dsaEncoding: 'ieee-p1363',
  });

  return `${body}.${base64Url(signature)}`;
}

const token = createToken();
const params = new URLSearchParams({ 'filter[bundleId]': bundleId });
const response = await fetch(`https://api.appstoreconnect.apple.com/v1/apps?${params}`, {
  headers: { Authorization: `Bearer ${token}` },
});
const body = await response.json().catch(() => null);

if (!response.ok) {
  const error = body?.errors?.[0];
  fail(
    `App Store Connect lookup failed (${response.status}): ${
      error?.title || error?.detail || 'unknown error'
    }`
  );
}

const apps = Array.isArray(body?.data) ? body.data : [];
if (apps.length === 0) {
  console.error(`No App Store Connect app record found for ${bundleId}.`);
  console.error('Create the app record first, then run this command again.');
  process.exit(2);
}
if (apps.length > 1) {
  console.error(`Expected one app record for ${bundleId}, found ${apps.length}.`);
  process.exit(3);
}

const app = apps[0];
console.log(`ASC_APP_ID=${app.id}`);
console.log(`APP_NAME=${app.attributes?.name || ''}`);

if (writeEasJson) {
  const easJsonPath = new URL('../../../eas.json', import.meta.url);
  const easJson = JSON.parse(readFileSync(easJsonPath, 'utf8'));
  easJson.submit ??= {};
  easJson.submit.production ??= {};
  easJson.submit.production.ios ??= {};
  easJson.submit.production.ios.ascAppId = app.id;
  writeFileSync(easJsonPath, `${JSON.stringify(easJson, null, 2)}\n`);
  console.log('Updated eas.json submit.production.ios.ascAppId.');
}
