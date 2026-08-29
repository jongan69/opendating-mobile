#!/usr/bin/env node

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const dist = resolve('dist');
const index = await readFile(join(dist, 'index.html'), 'utf8');
const csp = index.match(/<meta[^>]+http-equiv="Content-Security-Policy"[^>]*>/i)?.[0];

if (!csp) throw new Error('The exported app shell is missing its Content Security Policy.');

async function htmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? htmlFiles(path) : entry.name.endsWith('.html') ? [path] : [];
    })
  );
  return nested.flat();
}

let secured = 0;
for (const path of await htmlFiles(dist)) {
  const html = await readFile(path, 'utf8');
  if (/http-equiv="Content-Security-Policy"/i.test(html)) continue;
  if (!/<head(?:\s[^>]*)?>/i.test(html)) throw new Error(`Cannot secure HTML without <head>: ${path}`);
  await writeFile(path, html.replace(/<head(?:\s[^>]*)?>/i, (head) => `${head}${csp}`));
  secured++;
}

console.log(`Secured ${secured} static HTML files.`);
