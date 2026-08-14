#!/usr/bin/env node
/**
 * buy-domain.mjs — register a domain via the Namecheap API.
 *
 * Reads candidates from release.config.json, checks availability in order,
 * and registers the first available one within the configured price ceiling.
 *
 * Environment (never hard-code these):
 *   NAMECHEAP_API_USER    API username
 *   NAMECHEAP_API_KEY     API key
 *   NAMECHEAP_USERNAME    account username (usually same as API user)
 *   NAMECHEAP_CLIENT_IP   the whitelisted IPv4 making the call
 *   NAMECHEAP_ENV         "production" to leave sandbox (default: sandbox)
 *   NC_REGISTRANT_*       contact details, see REQUIRED_CONTACT below
 *
 * Namecheap constraints that bite in practice:
 *   - The calling IP must be whitelisted in Profile > Tools > API Access.
 *     A laptop on DHCP or a CI runner with rotating egress IPs will fail.
 *   - Production API access has account requirements; sandbox does not.
 *   - domains.create charges the account balance immediately. Domain
 *     registrations are effectively non-refundable.
 *   - WHOIS privacy defaults to OFF at the API level, which publishes the
 *     registrant's address. This script forces it ON unless explicitly disabled.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { extractNamecheapErrors } from './security-utils.mjs';

const args = process.argv.slice(2);
const argOf = (flag, fallback = null) => {
  const i = args.indexOf(flag);
  return i === -1 ? fallback : args[i + 1];
};
const DRY_RUN = args.includes('--dry-run');
const CONFIG_PATH = resolve(argOf('--config', './release/release.config.json'));
const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
const domainCfg = config.domain ?? {};

const IS_PRODUCTION = process.env.NAMECHEAP_ENV === 'production';
const API_BASE = IS_PRODUCTION
  ? 'https://api.namecheap.com/xml.response'
  : 'https://api.sandbox.namecheap.com/xml.response';

const REQUIRED_ENV = ['NAMECHEAP_API_USER', 'NAMECHEAP_API_KEY', 'NAMECHEAP_USERNAME', 'NAMECHEAP_CLIENT_IP'];
const REQUIRED_CONTACT = [
  'FIRST_NAME', 'LAST_NAME', 'ADDRESS1', 'CITY',
  'STATE_PROVINCE', 'POSTAL_CODE', 'COUNTRY', 'PHONE', 'EMAIL_ADDRESS',
];

const log = (msg) => console.log(`   ${msg}`);
const fail = (msg) => { console.error(`   xx ${msg}`); process.exit(1); };

// ── minimal XML helpers ───────────────────────────────────────────────────────
// The Namecheap responses we consume are flat attribute sets, so targeted
// extraction is sufficient and avoids pulling in a parser dependency.
const attr = (xml, tag, name) => {
  const el = new RegExp(`<${tag}\\b[^>]*>`, 'i').exec(xml)?.[0];
  return el ? new RegExp(`${name}="([^"]*)"`, 'i').exec(el)?.[1] ?? null : null;
};
const allTags = (xml, tag) => xml.match(new RegExp(`<${tag}\\b[^>]*>`, 'gi')) ?? [];
const attrIn = (el, name) => new RegExp(`${name}="([^"]*)"`, 'i').exec(el)?.[1] ?? null;

async function ncCall(command, params = {}, method = 'GET') {
  const query = new URLSearchParams({
    ApiUser: process.env.NAMECHEAP_API_USER,
    ApiKey: process.env.NAMECHEAP_API_KEY,
    UserName: process.env.NAMECHEAP_USERNAME,
    ClientIp: process.env.NAMECHEAP_CLIENT_IP,
    Command: command,
    ...params,
  });

  const res = method === 'POST'
    ? await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: query.toString(),
      })
    : await fetch(`${API_BASE}?${query}`);

  const xml = await res.text();

  if (/Status="ERROR"/i.test(xml)) {
    const errors = extractNamecheapErrors(xml).join('; ');
    throw new Error(`${command} failed: ${errors || 'unknown error'}`);
  }
  return xml;
}

// ── steps ─────────────────────────────────────────────────────────────────────
async function alreadyOwned(candidates) {
  try {
    const xml = await ncCall('namecheap.domains.getList', { PageSize: '100' });
    const owned = allTags(xml, 'Domain').map((d) => attrIn(d, 'Name')?.toLowerCase());
    return candidates.find((c) => owned.includes(c.toLowerCase())) ?? null;
  } catch {
    return null; // getList is a convenience check; never block the run on it
  }
}

async function findAvailable(candidates, maxPrice) {
  const xml = await ncCall('namecheap.domains.check', { DomainList: candidates.join(',') });

  for (const candidate of candidates) {
    const el = allTags(xml, 'DomainCheckResult')
      .find((e) => attrIn(e, 'Domain')?.toLowerCase() === candidate.toLowerCase());
    if (!el) continue;

    if (attrIn(el, 'Available') !== 'true') { log(`taken      ${candidate}`); continue; }

    const isPremium = attrIn(el, 'IsPremiumName') === 'true';
    const premiumPrice = parseFloat(attrIn(el, 'PremiumRegistrationPrice') ?? '0');

    if (isPremium && premiumPrice > maxPrice) {
      log(`premium    ${candidate} — $${premiumPrice} exceeds ceiling $${maxPrice}, skipping`);
      continue;
    }

    log(`available  ${candidate}${isPremium ? ` (premium $${premiumPrice})` : ''}`);
    return { domain: candidate, isPremium, premiumPrice };
  }
  return null;
}

function contactParams() {
  const missing = REQUIRED_CONTACT.filter((k) => !process.env[`NC_REGISTRANT_${k}`]);
  if (missing.length) {
    fail(`Missing registrant env vars: ${missing.map((m) => `NC_REGISTRANT_${m}`).join(', ')}`);
  }
  const get = (k) => process.env[`NC_REGISTRANT_${k}`];
  const base = {
    FirstName: get('FIRST_NAME'),
    LastName: get('LAST_NAME'),
    Address1: get('ADDRESS1'),
    City: get('CITY'),
    StateProvince: get('STATE_PROVINCE'),
    PostalCode: get('POSTAL_CODE'),
    Country: get('COUNTRY'),
    Phone: get('PHONE'),          // must be +NNN.NNNNNNNNNN
    EmailAddress: get('EMAIL_ADDRESS'),
  };
  // Namecheap requires the same contact block repeated under four prefixes.
  const out = {};
  for (const role of ['Registrant', 'Tech', 'Admin', 'AuxBilling']) {
    for (const [k, v] of Object.entries(base)) out[`${role}${k}`] = v;
  }
  return out;
}

async function register({ domain, isPremium, premiumPrice }) {
  const privacy = domainCfg.whoisPrivacy !== false;
  const params = {
    DomainName: domain,
    Years: String(domainCfg.years ?? 1),
    ...contactParams(),
    AddFreeWhoisguard: privacy ? 'yes' : 'no',
    WGEnabled: privacy ? 'yes' : 'no',
  };
  if (isPremium) {
    params.IsPremiumDomain = 'True';
    params.PremiumPrice = String(premiumPrice);
  }
  if (Array.isArray(domainCfg.nameservers) && domainCfg.nameservers.length) {
    params.Nameservers = domainCfg.nameservers.join(',');
  }

  const xml = await ncCall('namecheap.domains.create', params, 'POST');
  return {
    domain,
    registered: attr(xml, 'DomainCreateResult', 'Registered') === 'true',
    charged: attr(xml, 'DomainCreateResult', 'ChargedAmount'),
    orderId: attr(xml, 'DomainCreateResult', 'OrderID'),
    privacy,
  };
}

// ── main ──────────────────────────────────────────────────────────────────────
const candidates = domainCfg.candidates ?? [];
const maxPrice = domainCfg.maxPriceUsd ?? 50;

if (!candidates.length) fail('No domain.candidates configured');

log(`environment: ${IS_PRODUCTION ? 'PRODUCTION (real money)' : 'sandbox'}`);
log(`candidates : ${candidates.join(', ')}`);
log(`ceiling    : $${maxPrice}   privacy: ${domainCfg.whoisPrivacy !== false ? 'ON' : 'OFF'}`);

if (!IS_PRODUCTION) {
  log('NAMECHEAP_ENV is not "production" — using sandbox. No real domain will be bought.');
}

const missingEnv = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missingEnv.length) fail(`Missing env vars: ${missingEnv.join(', ')}`);

const owned = await alreadyOwned(candidates);
if (owned) {
  log(`already owned: ${owned} — nothing to do`);
  process.exit(0);
}

const pick = await findAvailable(candidates, maxPrice);
if (!pick) fail('No candidate is available within the price ceiling');

if (DRY_RUN) {
  log(`[dry-run] would register ${pick.domain} for ${domainCfg.years ?? 1}y`);
  process.exit(0);
}

log(`registering ${pick.domain} ...`);
const result = await register(pick);

if (!result.registered) fail(`Registration did not complete for ${pick.domain}`);

log(`registered ${result.domain}  charged $${result.charged}  order ${result.orderId}`);
if (!result.privacy) log('WARNING: WHOIS privacy is OFF — registrant contact details are public');

// Record the outcome so later stages (landing page, sitemap, canonical URLs)
// can consume the real domain without a second lookup.
const out = resolve('release/.domain.json');
writeFileSync(out, JSON.stringify({ ...result, registeredAt: new Date().toISOString() }, null, 2));
log(`wrote ${out}`);
