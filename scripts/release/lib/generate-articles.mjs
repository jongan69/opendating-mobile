#!/usr/bin/env node
/**
 * generate-articles.mjs — build an SEO article set with the Claude API and
 * write it into an Astro content collection.
 *
 * Article matrix is derived from release.config.json:
 *   "Best {category} for {useCase} in {year}"   one per useCase
 *   "{competitor} vs {product}"                 one per competitor
 *   "{competitor} alternatives in {year}"       one per competitor
 *   evergreen explainers                        fills to articleCount
 *
 * Environment:
 *   AI_PROVIDER   provider id: anthropic, openai, deepseek, or custom
 *   AI_API_KEY    API key for the chosen provider
 *   AI_MODEL      model name (e.g. claude-sonnet-5, gpt-4o, deepseek-chat)
 *   AI_BASE_URL   optional — override the default API endpoint (OpenAI-compatible)
 *
 * Resumable: existing files are skipped, so a failed run can be re-invoked.
 *
 * A note kept deliberately in the source, because whoever runs this should see it:
 * comparison articles assert things about named third-party products. The model
 * is instructed not to state specifics it cannot support, but generated claims
 * about a competitor's pricing or features can still be wrong, and wrong claims
 * about a named company are a real liability. Read them.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

const args = process.argv.slice(2);
const argOf = (f, d = null) => { const i = args.indexOf(f); return i === -1 ? d : args[i + 1]; };
const DRY_RUN = args.includes('--dry-run');

const CONFIG_PATH = resolve(argOf('--config', './scripts/release/release.config.json'));
const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
const seo = config.seo ?? {};
const project = config.project ?? {};

const MODEL = seo.model ?? 'claude-sonnet-5';
const YEAR = seo.year ?? new Date().getFullYear();
const COUNT = seo.articleCount ?? 30;
const AUTO_PUBLISH = seo.autoPublish === true;
const CONCURRENCY = 3;

// Markdown is the source of truth and is version-controlled. build-blog.mjs
// renders it to static HTML, so an article can be edited and rebuilt without
// paying for regeneration.
const blog = config.blog ?? {};
const OUT_DIR = blog.mode === 'astro'
  ? resolve(blog.astroDir ?? 'landing', 'src/content/blog')
  : resolve(blog.contentDir ?? 'content/blog');

const log = (m) => console.log(`   ${m}`);
const fail = (m) => { console.error(`   xx ${m}`); process.exit(1); };

const slugify = (s) => s.toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 80);

// Headline-case a phrase, leaving short function words lowercase unless leading.
const MINOR = new Set(['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'of', 'on', 'or', 'the', 'to', 'vs', 'with', 'without']);
const titleCase = (phrase) =>
  String(phrase)
    .split(' ')
    .map((word, i) => {
      const lower = word.toLowerCase();
      if (i > 0 && MINOR.has(lower)) return lower;
      // Preserve intentional casing like "AI" or "MyFitnessPal".
      if (/[A-Z]/.test(word.slice(1))) return word;
      // Capitalise each side of a hyphenated compound: "privacy-focused" -> "Privacy-Focused".
      return word.split('-').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join('-');
    })
    .join(' ');

// ── article matrix ────────────────────────────────────────────────────────────
function buildMatrix() {
  const { name, category } = project;
  const Cat = titleCase(category);
  const competitors = seo.competitors ?? [];
  const useCases = seo.useCases ?? [];
  const items = [];

  for (const useCase of useCases) {
    items.push({
      kind: 'listicle',
      title: titleCase(`Best ${category} for ${useCase} in ${YEAR}`),
      intent: `Someone comparing ${category} options for ${useCase}.`,
    });
  }
  for (const c of competitors) {
    items.push({
      kind: 'comparison',
      title: `${c} vs ${name}: Which ${Cat} Should You Use in ${YEAR}?`,
      intent: `Someone already using or evaluating ${c}.`,
      competitor: c,
    });
  }
  for (const c of competitors) {
    items.push({
      kind: 'alternatives',
      title: `${c} Alternatives in ${YEAR}: ${Cat} Options Compared`,
      intent: `Someone actively looking to move off ${c}.`,
      competitor: c,
    });
  }

  const evergreen = [
    `How to Use a ${Cat} Without Creating an Account`,
    `Do You Really Need a Subscription for a ${Cat}?`,
    `How On-Device AI Changes ${Cat} Privacy`,
    `What Actually Happens to Your Data in a ${Cat}`,
    `How to Choose a ${Cat} in ${YEAR}: A Practical Guide`,
    `Offline-First Apps: Why Local Storage Still Matters in ${YEAR}`,
  ];
  for (const t of evergreen) {
    items.push({ kind: 'evergreen', title: t, intent: 'Someone researching the problem space.' });
  }

  return items.slice(0, COUNT);
}

// ── prompt ────────────────────────────────────────────────────────────────────
function buildPrompt(item) {
  const facts = [
    `Product name: ${project.name}`,
    `Tagline: ${project.tagline}`,
    `Description: ${project.description}`,
    `Category: ${project.category}`,
    `Platforms: ${(project.platforms ?? []).join(', ')}`,
    `Price: ${project.price}`,
    `Differentiators:\n${(project.differentiators ?? []).map((d) => `  - ${d}`).join('\n')}`,
  ].join('\n');

  return `Write a genuinely useful article for a product blog.

TITLE: ${item.title}
READER: ${item.intent}

VERIFIED FACTS about the product being written about — these are the ONLY claims
you may state about it as fact:
${facts}

RULES:
- Write for a person making a real decision, not for a crawler. If the article
  would not help someone, it has failed.
- Do NOT invent statistics, study results, user counts, review scores, or quotes.
- Do NOT state specifics about competitor pricing, features, or policies that you
  are not confident are accurate and current. Prefer describing general
  trade-offs and categories of difference. It is far better to write "many
  subscription-based trackers" than to assert a specific price you may have wrong.
- Where a competitor comparison genuinely depends on current details, tell the
  reader to check the competitor's own site rather than guessing for them.
- Be fair to competitors. Acknowledge what they do well. A hit piece reads as
  marketing and converts worse than an honest comparison.
- No hype, no "in today's fast-paced world", no invented urgency.
- 900-1400 words.
- Markdown body only. Use ## and ### headings. No H1 — the layout renders the title.
- Open with the answer, then support it. Do not bury the point under preamble.
${item.competitor ? `\n- The competitor in focus is: ${item.competitor}` : ''}

Return ONLY a JSON object, no surrounding prose:
{
  "description": "<150-160 char meta description>",
  "keywords": ["<5-8 keywords>"],
  "body": "<the full markdown article>"
}`;
}

// ── provider resolution ──────────────────────────────────────────────────────
const AI_PROVIDER = (process.env.AI_PROVIDER || 'anthropic').toLowerCase();
const AI_API_KEY = process.env.AI_API_KEY;
const AI_MODEL = process.env.AI_MODEL || MODEL;
const AI_BASE_URL = process.env.AI_BASE_URL || '';

const PROVIDERS = {
  anthropic: {
    url: 'https://api.anthropic.com/v1/messages',
    headers: (key) => ({ 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' }),
    body: (model, prompt) => ({ model, max_tokens: 8000, messages: [{ role: 'user', content: prompt }] }),
    extract: (data) => data.content?.[0]?.text ?? '',
    retryOn: (s) => s === 429 || s >= 500,
  },
  openai: {
    url: 'https://api.openai.com/v1/chat/completions',
    headers: (key) => ({ 'Authorization': `Bearer ${key}`, 'content-type': 'application/json' }),
    body: (model, prompt) => ({ model, messages: [{ role: 'user', content: prompt }], temperature: 0.7 }),
    extract: (data) => data.choices?.[0]?.message?.content ?? '',
    retryOn: (s) => s === 429 || s >= 500,
  },
  deepseek: {
    url: 'https://api.deepseek.com/v1/chat/completions',
    headers: (key) => ({ 'Authorization': `Bearer ${key}`, 'content-type': 'application/json' }),
    body: (model, prompt) => ({ model, messages: [{ role: 'user', content: prompt }], temperature: 0.7 }),
    extract: (data) => data.choices?.[0]?.message?.content ?? '',
    retryOn: (s) => s === 429 || s >= 500,
  },
};

const provider = PROVIDERS[AI_PROVIDER];
if (!provider && !AI_BASE_URL) fail(`Unknown AI_PROVIDER "${AI_PROVIDER}". Set AI_BASE_URL for custom OpenAI-compatible endpoints, or use: ${Object.keys(PROVIDERS).join(', ')}`);

const EFFECTIVE_URL = AI_BASE_URL || provider?.url;
const EFFECTIVE_HEADERS = provider?.headers || ((key) => ({ 'Authorization': `Bearer ${key}`, 'content-type': 'application/json' }));
const EFFECTIVE_BODY = provider?.body || ((model, prompt) => ({ model, messages: [{ role: 'user', content: prompt }], temperature: 0.7 }));
const EFFECTIVE_EXTRACT = provider?.extract || ((data) => data.choices?.[0]?.message?.content ?? '');
const EFFECTIVE_RETRY = provider?.retryOn || ((s) => s === 429 || s >= 500);

// ── API ───────────────────────────────────────────────────────────────────────
async function generate(item, attempt = 1) {
  const res = await fetch(EFFECTIVE_URL, {
    method: 'POST',
    headers: EFFECTIVE_HEADERS(AI_API_KEY),
    body: JSON.stringify(EFFECTIVE_BODY(AI_MODEL, buildPrompt(item))),
  });

  if (EFFECTIVE_RETRY(res.status)) {
    if (attempt > 4) throw new Error(`API ${res.status} after ${attempt} attempts`);
    const wait = 2 ** attempt * 1000;
    log(`retry ${attempt} in ${wait}ms — ${item.title.slice(0, 40)}...`);
    await new Promise((r) => setTimeout(r, wait));
    return generate(item, attempt + 1);
  }
  if (!res.ok) throw new Error(`API ${res.status}: ${(await res.text()).slice(0, 200)}`);

  const data = await res.json();
  const text = EFFECTIVE_EXTRACT(data);
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) throw new Error('No JSON object in model response');
  return JSON.parse(text.slice(start, end + 1));
}

// ── output ────────────────────────────────────────────────────────────────────
const yamlString = (s) => `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

function write(item, result, index) {
  const slug = slugify(item.title);
  const file = join(OUT_DIR, `${slug}.md`);

  // Stagger dates backwards so the archive does not show 30 posts at one instant.
  const date = new Date(Date.now() - index * 86400000).toISOString().split('T')[0];

  const frontmatter = [
    '---',
    `title: ${yamlString(item.title)}`,
    `description: ${yamlString(result.description)}`,
    `pubDate: ${date}`,
    `draft: ${AUTO_PUBLISH ? 'false' : 'true'}`,
    `category: ${yamlString(item.kind)}`,
    `keywords: [${(result.keywords ?? []).map(yamlString).join(', ')}]`,
    'generated: true',
    `generatedBy: ${yamlString(AI_MODEL)}`,
    '---',
    '',
  ].join('\n');

  writeFileSync(file, frontmatter + result.body.trim() + '\n');
  return file;
}

// ── main ──────────────────────────────────────────────────────────────────────
if (!AI_API_KEY && !DRY_RUN) fail('AI_API_KEY is not set');

const matrix = buildMatrix();
log(`${matrix.length} articles · ${AI_PROVIDER}/${AI_MODEL} · ${AUTO_PUBLISH ? 'auto-publish' : 'drafts'}`);
log(`output: ${OUT_DIR}`);

if (DRY_RUN) {
  matrix.forEach((m, i) => log(`[dry-run] ${String(i + 1).padStart(2)}. ${m.title}`));
  process.exit(0);
}

mkdirSync(OUT_DIR, { recursive: true });

const pending = matrix.filter((m) => {
  if (existsSync(join(OUT_DIR, `${slugify(m.title)}.md`))) {
    log(`skip (exists) ${m.title.slice(0, 60)}`);
    return false;
  }
  return true;
});

let done = 0;
const failures = [];

// Bounded concurrency: a plain Promise.all over 30 requests trips rate limits.
const queue = [...pending.entries()];
await Promise.all(
  Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
    while (queue.length) {
      const [index, item] = queue.shift();
      try {
        const result = await generate(item);
        write(item, result, index);
        log(`[${++done}/${pending.length}] ${item.title.slice(0, 60)}`);
      } catch (err) {
        failures.push({ title: item.title, error: err.message });
        log(`FAILED ${item.title.slice(0, 50)} — ${err.message}`);
      }
    }
  })
);

log(`wrote ${done} article(s)`);
if (failures.length) {
  log(`${failures.length} failed — re-run to retry only those`);
  process.exitCode = 1;
}
if (AUTO_PUBLISH && done > 0) {
  log('');
  log('These are published, not drafts. They make claims about named competitors.');
  log('Read them before they get indexed.');
}
