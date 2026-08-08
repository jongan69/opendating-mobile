#!/usr/bin/env node
/**
 * Fail the build when a second copy of a singleton runtime module reaches
 * node_modules.
 *
 * A dependency that declares `react-native` (or any Expo native module) as a
 * hard dependency instead of a peer forces npm to nest its own copy. Metro
 * then bundles two runtimes, the second initialises TurboModuleRegistry
 * against a native registry that only ever registered the first, and the app
 * dies at launch with:
 *
 *   Invariant Violation: TurboModuleRegistry.getEnforcing(...):
 *   'PlatformConstants' could not be found.
 *
 * That failure is deterministic but reads like a stale build, so it has cost
 * this project a full day twice. It is also invisible until someone runs a
 * development build — `npm install`, typecheck, lint, and unit tests all pass
 * with the duplicate present. This check makes it loud at install time.
 *
 * Run directly: node scripts/check-duplicate-runtimes.mjs
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url)) + '/..';
const MODULES = join(ROOT, 'node_modules');

/**
 * Modules that must exist exactly once. React and React Native are the
 * runtimes proper; the Expo modules are native and pair a JS half with an
 * autolinked binary, so a version split breaks them the same way.
 */
const SINGLETONS = [
  'react',
  'react-dom',
  'react-native',
  'scheduler',
  'expo',
  'expo-image',
  'expo-secure-store',
  'expo-modules-core',
];

function version(pkgDir) {
  try {
    return JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8')).version;
  } catch {
    return null;
  }
}

/** Walk node_modules looking for nested copies of the singleton modules. */
function findNested(dir, depth = 0, found = []) {
  if (depth > 5 || !existsSync(dir)) return found;

  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return found;
  }

  for (const entry of entries) {
    if (!entry.isDirectory() && !entry.isSymbolicLink()) continue;
    if (entry.name === '.bin' || entry.name === '.cache') continue;

    const full = join(dir, entry.name);

    // Scoped packages hold their members one level down.
    if (entry.name.startsWith('@')) {
      findNested(full, depth, found);
      continue;
    }

    const nested = join(full, 'node_modules');
    if (existsSync(nested)) {
      for (const singleton of SINGLETONS) {
        const copy = join(nested, singleton);
        if (existsSync(copy) && statSync(copy).isDirectory()) {
          found.push({
            module: singleton,
            owner: full.slice(MODULES.length + 1),
            version: version(copy),
            rootVersion: version(join(MODULES, singleton)),
          });
        }
      }
      findNested(nested, depth + 1, found);
    }
  }
  return found;
}

const duplicates = findNested(MODULES);

if (duplicates.length === 0) {
  console.log('✓ No duplicate runtime modules.');
  process.exit(0);
}

console.error('\n✗ Duplicate runtime modules found in node_modules.\n');
console.error('  Two copies of these break development builds at launch,');
console.error('  usually as "PlatformConstants could not be found".\n');

for (const d of duplicates) {
  console.error(`  ${d.module}`);
  console.error(`    nested ${d.version}  under ${d.owner}`);
  console.error(`    root   ${d.rootVersion}\n`);
}

const owners = [...new Set(duplicates.map((d) => d.owner.split('/node_modules/')[0]))];
console.error('  Cause: the package below declares the module as a hard');
console.error('  dependency rather than a peer, so npm must nest its own copy:\n');
for (const owner of owners) console.error(`    ${owner}`);
console.error('\n  Fix it at the source — drop the dependency, or replace it');
console.error('  with one that declares peers correctly. Blocking the copy in');
console.error('  metro.config.js hides the symptom and leaves the native half');
console.error('  mismatched.\n');

process.exit(1);
