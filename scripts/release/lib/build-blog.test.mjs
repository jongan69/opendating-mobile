import { expect, test } from 'bun:test';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const buildBlog = fileURLToPath(new URL('./build-blog.mjs', import.meta.url));

test('builds only explicitly published blog pages', () => {
  const root = mkdtempSync(join(tmpdir(), 'opendating-blog-'));
  const contentDir = join(root, 'content');
  const publicDir = join(root, 'public');
  const configPath = join(root, 'config.json');

  try {
    mkdirSync(join(publicDir, 'blog', 'draft-post'), { recursive: true });
    mkdirSync(contentDir, { recursive: true });
    writeFileSync(join(publicDir, 'blog', 'draft-post', 'index.html'), 'stale draft');
    writeFileSync(join(contentDir, 'published-post.md'), `---
title: "Published post"
description: "Reviewed article"
pubDate: 2026-08-29
draft: false
---

Published body.
`);
    writeFileSync(join(contentDir, 'draft-post.md'), `---
title: "Draft post"
description: "Unreviewed article"
pubDate: 2026-08-29
draft: true
---

Draft body.
`);
    writeFileSync(configPath, JSON.stringify({
      project: { name: 'OpenDating' },
      web: { productionUrl: 'https://example.com/base', sitemapPaths: ['/'] },
      blog: { contentDir, publicDir, basePath: '/blog' },
    }));

    const result = spawnSync('node', [buildBlog, '--config', configPath], { encoding: 'utf8' });
    expect(result.status, result.stderr).toBe(0);

    const index = readFileSync(join(publicDir, 'blog', 'index.html'), 'utf8');
    const sitemap = readFileSync(join(publicDir, 'sitemap.xml'), 'utf8');
    const llms = readFileSync(join(publicDir, 'llms.txt'), 'utf8');
    const robots = readFileSync(join(publicDir, 'robots.txt'), 'utf8');
    expect(index).toContain('Published post');
    expect(index).not.toContain('Draft post');
    expect(existsSync(join(publicDir, 'blog', 'published-post', 'index.html'))).toBe(true);
    expect(existsSync(join(publicDir, 'blog', 'draft-post', 'index.html'))).toBe(false);
    expect(sitemap).toContain('https://example.com/base/blog/published-post/');
    expect(sitemap).not.toContain('draft-post');
    expect(llms).toContain('[Live app](https://example.com/base/)');
    expect(llms).toContain('[Product facts](https://example.com/base/about/)');
    expect(robots).toContain('Sitemap: https://example.com/base/sitemap.xml');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('rejects unsafe output paths and impossible dates', () => {
  const root = mkdtempSync(join(tmpdir(), 'opendating-blog-invalid-'));
  const contentDir = join(root, 'content');
  const publicDir = join(root, 'public');
  const configPath = join(root, 'config.json');
  const postPath = join(contentDir, 'post.md');
  const sentinelPath = join(publicDir, 'keep.txt');

  try {
    mkdirSync(contentDir, { recursive: true });
    mkdirSync(publicDir, { recursive: true });
    writeFileSync(sentinelPath, 'keep');
    writeFileSync(postPath, `---
title: "Post"
description: "Reviewed article"
pubDate: 2026-08-29
draft: false
---

Body.
`);
    const config = {
      project: { name: 'OpenDating' },
      web: { productionUrl: 'https://example.com' },
      blog: { contentDir, publicDir, basePath: '/' },
    };
    writeFileSync(configPath, JSON.stringify(config));

    const unsafePath = spawnSync('node', [buildBlog, '--config', configPath], { encoding: 'utf8' });
    expect(unsafePath.status).not.toBe(0);
    expect(readFileSync(sentinelPath, 'utf8')).toBe('keep');

    config.blog.basePath = '/blog';
    writeFileSync(configPath, JSON.stringify(config));
    writeFileSync(postPath, readFileSync(postPath, 'utf8').replace('2026-08-29', '2026-02-31'));

    const invalidDate = spawnSync('node', [buildBlog, '--config', configPath], { encoding: 'utf8' });
    expect(invalidDate.status).not.toBe(0);
    expect(invalidDate.stderr).toContain('YYYY-MM-DD pubDate');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
