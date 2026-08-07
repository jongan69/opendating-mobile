#!/usr/bin/env node
/**
 * scaffold-landing.mjs — generate an Astro landing site + blog from release.config.json.
 *
 * Emits a complete, deployable Astro project:
 *   - landing page built from project config
 *   - content collection for the generated articles
 *   - JSON-LD SoftwareApplication + Article structured data
 *   - sitemap, robots.txt, llms.txt
 *
 * Existing files are never overwritten, so this is safe to re-run after you have
 * customised the output. Delete a file to have it regenerated.
 *
 * Why Astro: static output by default, so the article set ships as plain HTML
 * that crawlers and LLM retrievers can read without executing JavaScript.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';

const args = process.argv.slice(2);
const argOf = (f, d = null) => { const i = args.indexOf(f); return i === -1 ? d : args[i + 1]; };
const DRY_RUN = args.includes('--dry-run');

const CONFIG_PATH = resolve(argOf('--config', './release/release.config.json'));
const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
const project = config.project ?? {};
const landing = config.landing ?? {};

const ROOT = resolve(landing.dir ?? 'landing');
const COLOR = landing.primaryColor ?? '#5B8DEF';

// Prefer a domain actually registered by buy-domain.mjs over the configured guess.
let siteUrl = config.web?.productionUrl ?? 'https://example.com';
const domainRecord = resolve('release/.domain.json');
if (existsSync(domainRecord)) {
  const { domain } = JSON.parse(readFileSync(domainRecord, 'utf8'));
  if (domain) siteUrl = `https://${domain}`;
}

const log = (m) => console.log(`   ${m}`);
let written = 0, skipped = 0;

function emit(relPath, contents) {
  const path = join(ROOT, relPath);
  if (existsSync(path)) { skipped++; return; }
  if (DRY_RUN) { log(`[dry-run] ${relPath}`); written++; return; }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, contents);
  written++;
}

const esc = (s) => String(s ?? '').replace(/`/g, '\\`').replace(/\$/g, '\\$');
const bullets = project.differentiators ?? [];

// ── project files ─────────────────────────────────────────────────────────────
emit('package.json', JSON.stringify({
  name: `${project.slug ?? 'app'}-landing`,
  type: 'module',
  private: true,
  scripts: {
    dev: 'astro dev',
    build: 'astro build',
    preview: 'astro preview',
  },
  dependencies: { astro: '^5.0.0', '@astrojs/sitemap': '^3.2.0' },
}, null, 2) + '\n');

emit('astro.config.mjs', `import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: '${siteUrl}',
  integrations: [sitemap()],
});
`);

emit('src/content.config.ts', `import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    draft: z.boolean().default(false),
    category: z.string().optional(),
    keywords: z.array(z.string()).default([]),
    generated: z.boolean().default(false),
    generatedBy: z.string().optional(),
  }),
});

export const collections = { blog };
`);

// ── layout ────────────────────────────────────────────────────────────────────
emit('src/layouts/Base.astro', `---
interface Props {
  title: string;
  description: string;
  jsonLd?: Record<string, unknown>;
}
const { title, description, jsonLd } = Astro.props;
const canonical = new URL(Astro.url.pathname, Astro.site).toString();
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={canonical} />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="sitemap" href="/sitemap-index.xml" />
    {jsonLd && <script type="application/ld+json" set:html={JSON.stringify(jsonLd)} />}
    <style is:global>
      :root { --accent: ${COLOR}; --fg: #16181d; --muted: #5c6370; --bg: #fff; --line: #e6e8ec; }
      @media (prefers-color-scheme: dark) {
        :root { --fg: #e8eaee; --muted: #9aa2b1; --bg: #0e1013; --line: #23262d; }
      }
      * { box-sizing: border-box; }
      body {
        margin: 0; background: var(--bg); color: var(--fg);
        font: 16px/1.65 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
      }
      .wrap { max-width: 720px; margin: 0 auto; padding: 0 20px; }
      header, footer { border-color: var(--line); }
      header { border-bottom: 1px solid var(--line); padding: 20px 0; }
      footer { border-top: 1px solid var(--line); padding: 40px 0; margin-top: 80px; color: var(--muted); font-size: 14px; }
      a { color: var(--accent); }
      nav a { margin-left: 18px; text-decoration: none; }
      h1 { font-size: 2.2rem; line-height: 1.2; letter-spacing: -0.02em; margin: 0 0 12px; }
      h2 { font-size: 1.4rem; margin: 40px 0 12px; letter-spacing: -0.01em; }
      h3 { font-size: 1.1rem; margin: 28px 0 8px; }
      .lede { font-size: 1.15rem; color: var(--muted); }
      .cta {
        display: inline-block; background: var(--accent); color: #fff; text-decoration: none;
        padding: 12px 22px; border-radius: 10px; font-weight: 600; margin-top: 8px;
      }
      ul.features { list-style: none; padding: 0; }
      ul.features li { padding: 10px 0; border-bottom: 1px solid var(--line); }
      article :where(p, ul, ol) { margin: 14px 0; }
      .post { padding: 16px 0; border-bottom: 1px solid var(--line); }
      .post a { font-weight: 600; text-decoration: none; font-size: 1.05rem; }
      .meta { color: var(--muted); font-size: 13px; }
    </style>
  </head>
  <body>
    <header><div class="wrap" style="display:flex;justify-content:space-between;align-items:center">
      <a href="/" style="font-weight:700;text-decoration:none;color:var(--fg)">${esc(project.name)}</a>
      <nav><a href="/blog">Blog</a></nav>
    </div></header>
    <main class="wrap"><slot /></main>
    <footer><div class="wrap">
      &copy; {new Date().getFullYear()} ${esc(project.name)}. ${esc(project.tagline)}
    </div></footer>
  </body>
</html>
`);

// ── landing page ──────────────────────────────────────────────────────────────
emit('src/pages/index.astro', `---
import Base from '../layouts/Base.astro';
import { getCollection } from 'astro:content';

const posts = (await getCollection('blog', ({ data }) => !data.draft))
  .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
  .slice(0, 5);

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: ${JSON.stringify(project.name)},
  description: ${JSON.stringify(project.description)},
  applicationCategory: 'HealthApplication',
  operatingSystem: ${JSON.stringify((project.platforms ?? []).join(', '))},
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};
---
<Base title="${esc(project.name)} — ${esc(project.tagline)}" description="${esc(project.description)}" jsonLd={jsonLd}>
  <section style="padding:60px 0 20px">
    <h1>${esc(project.tagline)}</h1>
    <p class="lede">${esc(project.description)}</p>
    <p><a class="cta" href="#get">Get ${esc(project.name)}</a></p>
    <p class="meta">${esc(project.price)} · ${esc((project.platforms ?? []).join(', '))}</p>
  </section>

  <section id="features">
    <h2>Why ${esc(project.name)}</h2>
    <ul class="features">
${bullets.map((b) => `      <li>${esc(b)}</li>`).join('\n')}
    </ul>
  </section>

  {posts.length > 0 && (
    <section>
      <h2>Latest writing</h2>
      {posts.map((post) => (
        <div class="post">
          <a href={\`/blog/\${post.id}/\`}>{post.data.title}</a>
          <div class="meta">{post.data.pubDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
        </div>
      ))}
      <p><a href="/blog">All articles →</a></p>
    </section>
  )}

  <section id="get">
    <h2>Get ${esc(project.name)}</h2>
    <p>${esc(project.price)}. ${esc(project.audience ? `Built for ${project.audience}.` : '')}</p>
  </section>
</Base>
`);

// ── blog ──────────────────────────────────────────────────────────────────────
emit('src/pages/blog/index.astro', `---
import Base from '../../layouts/Base.astro';
import { getCollection } from 'astro:content';

const posts = (await getCollection('blog', ({ data }) => !data.draft))
  .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
---
<Base title="Blog — ${esc(project.name)}" description="Articles about ${esc(project.category)} tools, comparisons, and guides.">
  <h1 style="margin-top:50px">Blog</h1>
  {posts.map((post) => (
    <div class="post">
      <a href={\`/blog/\${post.id}/\`}>{post.data.title}</a>
      <p class="meta">{post.data.description}</p>
      <div class="meta">{post.data.pubDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
    </div>
  ))}
</Base>
`);

emit('src/pages/blog/[...slug].astro', `---
import Base from '../../layouts/Base.astro';
import { getCollection, render } from 'astro:content';

export async function getStaticPaths() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return posts.map((post) => ({ params: { slug: post.id }, props: { post } }));
}

const { post } = Astro.props;
const { Content } = await render(post);

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: post.data.title,
  description: post.data.description,
  datePublished: post.data.pubDate.toISOString(),
  keywords: post.data.keywords.join(', '),
};
---
<Base title={post.data.title} description={post.data.description} jsonLd={jsonLd}>
  <article>
    <h1 style="margin-top:50px">{post.data.title}</h1>
    <p class="meta">
      {post.data.pubDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
    </p>
    <Content />
  </article>
</Base>
`);

// ── crawler files ─────────────────────────────────────────────────────────────
emit('public/robots.txt', `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap-index.xml
`);

// llms.txt is an emerging convention for exposing a plain-text product summary
// to LLM crawlers. Cheap to serve, and unlike the blog it states only facts you
// control.
emit('public/llms.txt', `# ${project.name}

> ${project.tagline}

${project.description}

## What it is
- Category: ${project.category}
- Platforms: ${(project.platforms ?? []).join(', ')}
- Price: ${project.price}
- Built for: ${project.audience ?? 'general use'}

## Key properties
${bullets.map((b) => `- ${b}`).join('\n')}

## Links
- Site: ${siteUrl}
- Blog: ${siteUrl}/blog
`);

emit('.gitignore', `dist/\nnode_modules/\n.astro/\n`);

log(`${written} file(s) written, ${skipped} left alone (already existed)`);
log(`site url: ${siteUrl}`);
if (!DRY_RUN) {
  log('');
  log(`next:  cd ${landing.dir ?? 'landing'} && npm install && npm run build`);
}
