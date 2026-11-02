// Build first. Use --live to inspect the public site's current HTTP responses.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const origin = 'https://image.akdworks.com';
const languages = ['ru', 'en', 'es'];
const live = process.argv.includes('--live');
const report = { mode: live ? 'live' : 'dist', checkedAt: new Date().toISOString(), pages: [] };
const routes = ['', 'convert', 'pixelate'];
const pagePath = (language, slug) => `/${language}/${slug}`;
const publicFile = pathname => path.join(root, 'dist', pathname);

async function read(pathname) {
  if (!live) return fs.readFileSync(publicFile(pathname), 'utf8');
  const response = await fetch(`${origin}${pathname}`, { redirect: 'manual' });
  assert.equal(response.status, 200, pathname);
  assert.doesNotMatch(response.headers.get('x-robots-tag') || '', /noindex/i, pathname);
  return response.text();
}

function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w:-]+)=["']([^"']*)["']/g)].map(m => [m[1], m[2]]));
}
const tags = (html, name) => [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map(m => attributes(m[0]));
const readable = html => html.replace(/<(script|style|svg)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
  .replace(/<!--[\s\S]*?-->/g, '');

const sitemap = await read('/sitemap.xml');
const entries = [...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(m => m[1]);
const locations = new Set();
for (const entry of entries) {
  const url = entry.match(/<loc>([^<]+)<\/loc>/)?.[1];
  assert.ok(url?.startsWith(`${origin}/`), `Invalid sitemap location: ${url}`);
  assert.ok(!locations.has(url), `Duplicate sitemap location: ${url}`);
  locations.add(url);
  const suffix = new URL(url).pathname.replace(/^\/(ru|en|es)/, '');
  const alternates = tags(entry, 'xhtml:link');
  assert.equal(alternates.length, 3, url);
  for (const language of languages) {
    assert.ok(alternates.some(a => a.rel === 'alternate' && a.hreflang === language &&
      a.href === `${origin}/${language}${suffix}`), `Sitemap alternate ${language}: ${url}`);
  }
  if (!live) {
    const pathname = new URL(url).pathname;
    assert.ok(fs.existsSync(publicFile(`${pathname}${pathname.endsWith('/') ? 'index' : ''}.html`)), url);
  }
}
const robots = await read('/robots.txt');
assert.match(robots, /User-agent:\s*\*/i);
assert.doesNotMatch(robots, /^Disallow:\s*\/(?:\s|$)/im);
assert.ok(robots.includes(`Sitemap: ${origin}/sitemap.xml`));

for (const language of languages) {
  for (const slug of routes) {
    const pathname = pagePath(language, slug);
    const html = await read(live ? pathname : `${pathname}${slug ? '' : 'index'}.html`);
    assert.equal(tags(html, 'html')[0]?.lang, language, pathname);
    const links = tags(html, 'link');
    const canonical = links.filter(a => a.rel === 'canonical');
    assert.equal(canonical.length, 1, pathname);
    assert.equal(canonical[0].href, `${origin}${pathname}`, pathname);
    for (const code of languages) {
      const alternates = links.filter(a => a.rel === 'alternate' && a.hreflang === code);
      assert.equal(alternates.length, 1, pathname);
      assert.equal(alternates[0].href, `${origin}${pagePath(code, slug)}`, pathname);
    }
    assert.ok(locations.has(`${origin}${pathname}`), `Missing sitemap entry: ${pathname}`);
    assert.equal(tags(html, 'h1').length, 1, pathname);
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
    const description = tags(html, 'meta').find(a => a.name === 'description')?.content;
    assert.ok(title && description, `Missing metadata: ${pathname}`);
    assert.ok(!tags(html, 'meta').some(a => /^(robots|googlebot)$/i.test(a.name) && /noindex/i.test(a.content)), pathname);
    if (language !== 'ru') assert.doesNotMatch(readable(html), /[А-Яа-яЁё]/, pathname);
    const anchors = tags(readable(html), 'a').map(a => a.href).filter(Boolean);
    for (const href of anchors.filter(href => href.startsWith('/') && !href.startsWith('//'))) {
      const target = new URL(href, origin).pathname;
      assert.ok(target.startsWith(`/${language}/`), `Wrong language link on ${pathname}: ${href}`);
      if (!live) assert.ok(fs.existsSync(publicFile(`${target}${target.endsWith('/') ? 'index' : ''}.html`)), href);
    }
    const guide = /class="tool-guide"/.test(html);
    if (!live && slug) assert.ok(!guide, `Unexpected tool guide: ${pathname}`);
    report.pages.push({ path: pathname, title, description, guide, internalLinks: anchors.length });
  }
}

if (live) {
  const redirects = { '/pages/convert.html': '/convert', '/pages/pixelate.html': '/pixelate',
    '/ru': '/ru/', '/en/convert/': '/en/convert', '/es/pixelate.html': '/es/pixelate' };
  for (const [source, target] of Object.entries(redirects)) {
    const response = await fetch(`${origin}${source}`, { redirect: 'manual' });
    assert.ok([301, 308].includes(response.status), source);
    assert.equal(new URL(response.headers.get('location'), origin).pathname, target, source);
  }
  const missing = await fetch(`${origin}/ru/nonexistent-seo-check`, { redirect: 'manual' });
  assert.equal(missing.status, 404);
  report.redirects = redirects;
}
report.sitemapEntries = entries.length;
console.log(JSON.stringify(report, null, 2));
