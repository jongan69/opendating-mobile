#!/usr/bin/env node
/**
 * build-blog.mjs — render content/blog/*.md to static HTML under public/blog/.
 *
 * Why static files in public/ rather than app routes:
 * this project sets web.output = "single", so every Expo route resolves to one
 * client-rendered HTML shell. A crawler or LLM retriever asking for an article
 * URL would receive an empty shell. Expo copies public/ verbatim into the web
 * export, so files written here are served as real HTML and bypass the SPA
 * entirely. No change to web.output is needed, and the app routes are untouched.
 *
 * Also regenerates sitemap.xml (articles + homepage) and llms.txt.
 *
 * Markdown support is intentionally narrow — headings, paragraphs, lists,
 * blockquotes, code, links, bold/italic — matching the format the generator is
 * instructed to produce. Narrow and predictable beats a dependency here.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { resolve, join, basename } from 'node:path';

const args = process.argv.slice(2);
const argOf = (f, d = null) => { const i = args.indexOf(f); return i === -1 ? d : args[i + 1]; };
const DRY_RUN = args.includes('--dry-run');

const CONFIG_PATH = resolve(argOf('--config', './scripts/release/release.config.json'));
const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
const project = config.project ?? {};
const blog = config.blog ?? {};

const CONTENT_DIR = resolve(blog.contentDir ?? 'content/blog');
const PUBLIC_DIR = resolve(blog.publicDir ?? 'public');
const BASE = (blog.basePath ?? '/blog').replace(/\/$/, '');
const COLOR = blog.primaryColor ?? '#5B8DEF';
const SITE = (config.web?.productionUrl ?? 'https://example.com').replace(/\/$/, '');

const log = (m) => console.log(`   ${m}`);
const fail = (m) => { console.error(`   xx ${m}`); process.exit(1); };

// ── escaping ──────────────────────────────────────────────────────────────────
const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

// ── frontmatter ───────────────────────────────────────────────────────────────
function parseFrontmatter(raw) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw);
  if (!m) return { data: {}, body: raw };

  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^(\w+):\s*(.*)$/.exec(line);
    if (!kv) continue;
    let [, key, value] = kv;
    value = value.trim();

    if (/^\[.*\]$/.test(value)) {
      data[key] = value.slice(1, -1).split(',')
        .map((v) => v.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
    } else if (value === 'true' || value === 'false') {
      data[key] = value === 'true';
    } else {
      data[key] = value.replace(/^["']|["']$/g, '').replace(/\\"/g, '"');
    }
  }
  return { data, body: raw.slice(m[0].length) };
}

// ── markdown ──────────────────────────────────────────────────────────────────
function inline(text) {
  return esc(text)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]*)\)/g, '<a href="$2">$1</a>');
}

function renderMarkdown(md) {
  const out = [];
  const lines = md.split(/\r?\n/);
  let para = [];
  let list = null; // 'ul' | 'ol'

  const flushPara = () => {
    if (para.length) { out.push(`<p>${inline(para.join(' '))}</p>`); para = []; }
  };
  const flushList = () => {
    if (list) { out.push(`</${list}>`); list = null; }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!line.trim()) { flushPara(); flushList(); continue; }

    const heading = /^(#{2,4})\s+(.*)$/.exec(line);
    if (heading) {
      flushPara(); flushList();
      const level = heading[1].length;
      out.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      continue;
    }

    const ul = /^[-*]\s+(.*)$/.exec(line);
    const ol = /^\d+\.\s+(.*)$/.exec(line);
    if (ul || ol) {
      flushPara();
      const want = ul ? 'ul' : 'ol';
      if (list !== want) { flushList(); out.push(`<${want}>`); list = want; }
      out.push(`<li>${inline((ul ?? ol)[1])}</li>`);
      continue;
    }

    const quote = /^>\s?(.*)$/.exec(line);
    if (quote) {
      flushPara(); flushList();
      out.push(`<blockquote><p>${inline(quote[1])}</p></blockquote>`);
      continue;
    }

    if (/^(---|\*\*\*)\s*$/.test(line)) { flushPara(); flushList(); out.push('<hr />'); continue; }

    flushList();
    para.push(line.trim());
  }
  flushPara(); flushList();
  return out.join('\n');
}

// ── page shell ────────────────────────────────────────────────────────────────
const STYLE = `
:root{--accent:${COLOR};--fg:#16181d;--muted:#5c6370;--bg:#fff;--line:#e6e8ec}
@media(prefers-color-scheme:dark){:root{--fg:#e8eaee;--muted:#9aa2b1;--bg:#0e1013;--line:#23262d}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.7 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
.wrap{max-width:720px;margin:0 auto;padding:0 20px}
header{border-bottom:1px solid var(--line);padding:18px 0}
header .wrap{display:flex;justify-content:space-between;align-items:center}
header a.brand{font-weight:700;text-decoration:none;color:var(--fg)}
nav a{margin-left:18px;color:var(--accent);text-decoration:none}
footer{border-top:1px solid var(--line);margin-top:72px;padding:32px 0;color:var(--muted);font-size:14px}
h1{font-size:2.1rem;line-height:1.22;letter-spacing:-.02em;margin:44px 0 10px}
h2{font-size:1.35rem;margin:38px 0 10px;letter-spacing:-.01em}
h3{font-size:1.08rem;margin:26px 0 8px}
p,ul,ol{margin:14px 0}
li{margin:6px 0}
a{color:var(--accent)}
code{background:var(--line);padding:2px 6px;border-radius:4px;font-size:.9em}
blockquote{margin:18px 0;padding:2px 16px;border-left:3px solid var(--accent);color:var(--muted)}
hr{border:0;border-top:1px solid var(--line);margin:32px 0}
.meta{color:var(--muted);font-size:13px}
.post{padding:16px 0;border-bottom:1px solid var(--line)}
.post a{font-weight:600;text-decoration:none;font-size:1.05rem}
.cta{display:inline-block;background:var(--accent);color:#fff;text-decoration:none;padding:11px 20px;border-radius:10px;font-weight:600}
`.trim();

function page({ title, description, canonical, jsonLd, body }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:type" content="article">
<meta name="twitter:card" content="summary_large_image">
${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ''}
<style>${STYLE}</style>
</head>
<body>
<header><div class="wrap">
<a class="brand" href="/">${esc(project.name)}</a>
<nav><a href="${BASE}/">Blog</a><a href="/">Get the app</a></nav>
</div></header>
<main class="wrap">
${body}
</main>
<footer><div class="wrap">&copy; ${new Date().getFullYear()} ${esc(project.name)}. ${esc(project.tagline ?? '')}</div></footer>
</body>
</html>
`;
}

// ── main ──────────────────────────────────────────────────────────────────────
if (!existsSync(CONTENT_DIR)) fail(`No content directory at ${CONTENT_DIR} — run the seo stage first`);

const files = readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.md'));
if (!files.length) fail(`No markdown files in ${CONTENT_DIR}`);

const articles = [];
for (const file of files) {
  const { data, body } = parseFrontmatter(readFileSync(join(CONTENT_DIR, file), 'utf8'));
  if (data.draft === true) { log(`skip (draft) ${file}`); continue; }
  articles.push({
    slug: basename(file, '.md'),
    title: data.title ?? basename(file, '.md'),
    description: data.description ?? '',
    date: data.pubDate ?? new Date().toISOString().split('T')[0],
    keywords: data.keywords ?? [],
    html: renderMarkdown(body),
  });
}
articles.sort((a, b) => (a.date < b.date ? 1 : -1));

const fmtDate = (d) =>
  new Date(`${d}T12:00:00Z`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

let written = 0;
const emit = (relPath, contents) => {
  const path = join(PUBLIC_DIR, relPath);
  if (DRY_RUN) { log(`[dry-run] ${relPath}`); written++; return; }
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, contents);
  written++;
};

// article pages
for (const a of articles) {
  const canonical = `${SITE}${BASE}/${a.slug}/`;
  emit(`${BASE.slice(1)}/${a.slug}/index.html`, page({
    title: `${a.title} | ${project.name}`,
    description: a.description,
    canonical,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: a.title,
      description: a.description,
      datePublished: a.date,
      keywords: a.keywords.join(', '),
      publisher: { '@type': 'Organization', name: project.name },
      mainEntityOfPage: canonical,
    },
    body: `<article>
<h1>${esc(a.title)}</h1>
<p class="meta">${fmtDate(a.date)}</p>
${a.html}
<hr />
<p><a class="cta" href="/">Get ${esc(project.name)} — ${esc(project.price ?? 'Free')}</a></p>
</article>`,
  }));
}

// index
emit(`${BASE.slice(1)}/index.html`, page({
  title: `Blog | ${project.name}`,
  description: `Guides and comparisons about ${project.category ?? 'the category'}.`,
  canonical: `${SITE}${BASE}/`,
  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: `${project.name} Blog`,
    url: `${SITE}${BASE}/`,
  },
  body: `<h1>Blog</h1>
<p class="meta">${articles.length} article${articles.length === 1 ? '' : 's'}</p>
${articles.map((a) => `<div class="post">
<a href="${BASE}/${a.slug}/">${esc(a.title)}</a>
<p class="meta">${esc(a.description)}</p>
<div class="meta">${fmtDate(a.date)}</div>
</div>`).join('\n')}`,
}));

// sitemap — homepage plus every article
emit('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE}/</loc>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${SITE}${BASE}/</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
${articles.map((a) => `  <url>
    <loc>${SITE}${BASE}/${a.slug}/</loc>
    <lastmod>${a.date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`).join('\n')}
</urlset>
`);

// llms.txt — states only facts you control, unlike the article set
emit('llms.txt', `# ${project.name}

> ${project.tagline ?? ''}

${project.description ?? ''}

## What it is
- Category: ${project.category ?? ''}
- Platforms: ${(project.platforms ?? []).join(', ')}
- Price: ${project.price ?? ''}
- Built for: ${project.audience ?? 'general use'}

## Key properties
${(project.differentiators ?? []).map((d) => `- ${d}`).join('\n')}

## Articles
${articles.map((a) => `- [${a.title}](${SITE}${BASE}/${a.slug}/)`).join('\n')}
`);

log(`${articles.length} article(s) -> ${written} file(s) under ${PUBLIC_DIR}`);
log(`urls: ${SITE}${BASE}/<slug>/`);
if (!DRY_RUN) log('these are static HTML and bypass the SPA shell entirely');
