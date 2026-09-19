import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'dist');
const origin = 'https://image.akdworks.com';
const languages = ['ru', 'en', 'es'];
const pages = fs.readdirSync(path.join(root, 'pages'))
  .filter(name => name.endsWith('.html'))
  .map(name => name.slice(0, -5))
  .sort();
const routes = new Set(pages);
const untranslated = new Map();
const spanishFallbacks = new Set();
const dictionaries = new Map();
let activeSources = null;
const i18nSource = fs.readFileSync(path.join(root, 'js/i18n.js'), 'utf8');

function translator(language) {
  if (dictionaries.has(language)) return dictionaries.get(language);
  const document = {
    documentElement: { dataset: {}, classList: { add() {} } },
    addEventListener() {}
  };
  const window = { addEventListener() {} };
  const context = {
    document,
    window,
    navigator: { language },
    location: { pathname: `/${language}/` },
    localStorage: { getItem: () => null }
  };
  const instrumented = i18nSource.replace('  window.AKDI18n = {',
    '  window.__AKD_BUILD_DICTIONARIES = { ENGLISH, SPANISH, SPANISH_PATTERNS, PAGE_ROUTES };\n  window.AKDI18n = {');
  vm.runInNewContext(instrumented, context, { filename: 'js/i18n.js' });
  const translate = value => window.AKDI18n.t(value);
  translate.catalog = window.__AKD_BUILD_DICTIONARIES;
  dictionaries.set(language, translate);
  return translate;
}

const entities = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0',
  laquo: '«', raquo: '»', ndash: '–', mdash: '—', hellip: '…',
  times: '×', middot: '·', bull: '•', copy: '©', reg: '®'
};

function decodeEntities(value) {
  return value.replace(/&(#(?:x[\da-f]+|\d+)|[a-z]+);/gi, (match, code) => {
    if (code[0] === '#') {
      const number = code[1].toLowerCase() === 'x'
        ? Number.parseInt(code.slice(2), 16) : Number.parseInt(code.slice(1), 10);
      return Number.isFinite(number) && number <= 0x10ffff
        ? String.fromCodePoint(number) : match;
    }
    return entities[code.toLowerCase()] ?? match;
  });
}

function recordUntranslated(language, slug, value) {
  if (language === 'ru' || !/[А-Яа-яЁё]/.test(value)) return;
  const key = `${language}/${slug}`;
  if (!untranslated.has(key)) untranslated.set(key, new Set());
  untranslated.get(key).add(value.trim().replace(/\s+/g, ' ').slice(0, 140));
}

function translateText(value, language, slug, attribute = false, markSource = false) {
  if (language === 'ru' || !value.trim()) return value;
  const decoded = decodeEntities(value);
  const translate = translator(language);
  const translated = translate(decoded);
  if (language === 'es') {
    const normalized = decoded.trim().replace(/\s+/g, ' ');
    if (translate.catalog.ENGLISH[normalized] && !translate.catalog.SPANISH[normalized] &&
        !translate.catalog.SPANISH_PATTERNS.some(([pattern]) => pattern.test(normalized))) {
      spanishFallbacks.add(`${slug}: ${normalized}`);
    }
  }
  recordUntranslated(language, slug, translated);
  if (translated === decoded) return value;
  if (activeSources) {
    const key = translated.trim().replace(/\s+/g, ' ');
    const source = decoded.trim().replace(/\s+/g, ' ');
    const previous = activeSources.get(key);
    if (previous && previous !== source && attribute) {
      throw new Error(`Ambiguous attribute translation on ${language}/${slug}: ${key}`);
    }
    if (!previous) activeSources.set(key, source);
  }
  const escaped = translated.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  if (attribute) return escaped.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  return markSource ? `<!--akd-i18n:${Buffer.from(decoded, 'utf8').toString('base64')}-->${escaped}` : escaped;
}

function localizedHref(href, language) {
  if (!href.startsWith('/') || href.startsWith('//')) return href;
  const match = href.match(/^\/([^?#]*)(.*)$/);
  if (!match) return href;
  const slug = match[1].replace(/\/$/, '');
  if (!slug) return `/${language}/${match[2]}`;
  if (!routes.has(slug)) return href;
  return `/${language}/${slug}${match[2]}`;
}

function transformTag(tag, language, slug) {
  if (/^<html\b/i.test(tag)) tag = tag.replace(/\blang=["'][^"']*["']/i, `lang="${language}"`);
  const meta = /^<meta\b/i.test(tag);
  return tag.replace(/(\s)([\w:-]+)(\s*=\s*)(["'])([\s\S]*?)\4/g,
    (whole, space, name, equals, quote, value) => {
      let next = value;
      if (name === 'href') next = localizedHref(value, language);
      if ((name === 'src' || name === 'href') && /^(?:css|js)\//.test(next)) next = `/${next}`;
      if (['aria-label', 'aria-valuetext', 'title', 'placeholder', 'alt'].includes(name) ||
          (meta && name === 'content' && /[А-Яа-яЁё]/.test(value))) {
        next = translateText(next, language, slug, true);
      }
      return `${space}${name}${equals}${quote}${next}${quote}`;
    });
}

function localizedHtml(source, language, slug, legacy = false) {
  activeSources = !legacy && language !== 'ru' ? new Map() : null;
  let inRawText = false;
  // Keep executable script, CSS, SVG, and comments byte-for-byte. Translate only
  // human-readable HTML text and attributes using the same catalog as the browser.
  let html = source.replace(
    /<script\b[^>]*>[\s\S]*?<\/script\s*>|<style\b[^>]*>[\s\S]*?<\/style\s*>|<svg\b[^>]*>[\s\S]*?<\/svg\s*>|<!--([\s\S]*?)-->|<![^>]*>|<[^>]+>|[^<]+/gi,
    token => {
      if (!token.startsWith('<')) return translateText(token, language, slug, false, !inRawText && !legacy);
      if (/^<(?:title|textarea)\b/i.test(token)) inRawText = true;
      if (/^<\/(?:title|textarea)\b/i.test(token)) inRawText = false;
      return /^<\/?[a-z]/i.test(token) && !/^<(?:script|style|svg)\b/i.test(token)
        ? transformTag(token, language, slug) : token;
    }
  );
  html = html.replace(/\s*<meta charset="UTF-8">/i, '');
  html = html.replace(/<head>/i, '<head>\n  <meta charset="UTF-8">');
  const route = slug === 'index' ? '/' : `/${slug}`;
  const canonical = `${origin}/${language}${route === '/' ? '/' : route}`;
  const alternates = languages.map(code =>
    `  <link rel="alternate" hreflang="${code}" href="${origin}/${code}${route === '/' ? '/' : route}">`
  ).join('\n');
  html = html.replace(/<link rel="canonical" href="[^"]*">/i,
    `<link rel="canonical" href="${canonical}">${legacy ? '' : `\n${alternates}`}`);
  html = html.replace(/<meta property="og:url" content="[^"]*">/i,
    `<meta property="og:url" content="${canonical}">`);
  if (!legacy) {
    html = html.replace('href="/manifest.webmanifest"',
      `href="/${language}/manifest.webmanifest"`);
  }
  html = html.replace(/(\bsrc=["'])js\//g, '$1/js/');
  html = html.replace(/(\/js\/(?:i18n|layout|favorites)\.js\?v=)[^"']+/g,
    (match, prefix) => `${prefix}3.5.1`);
  if (slug === 'index') {
    html = html.replace(/("url":\s*)"https:\/\/image\.akdworks\.com\/"/,
      `$1"${canonical}"`);
  }
  if (activeSources?.size) {
    const mapping = JSON.stringify(Object.fromEntries(activeSources)).replace(/</g, '\\u003c');
    html = html.replace(/(<script src="\/js\/i18n\.js)/i,
      `<script>window.AKD_I18N_SOURCES = ${mapping};</script>\n  $1`);
  }
  activeSources = null;
  return html;
}

if (path.dirname(output) !== root || path.basename(output) !== 'dist') {
  throw new Error('Refusing to clean an unexpected output directory.');
}
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });
for (const name of ['assets', 'css', 'fonts', 'js']) {
  fs.cpSync(path.join(root, name), path.join(output, name), { recursive: true });
}
for (const name of ['manifest.webmanifest', 'robots.txt', 'service-worker.js', 'LICENSE.MaterialSymbols.txt']) {
  fs.copyFileSync(path.join(root, name), path.join(output, name));
}

const sourcePages = new Map([['index', fs.readFileSync(path.join(root, 'index.html'), 'utf8')]]);
for (const slug of pages) sourcePages.set(slug, fs.readFileSync(path.join(root, 'pages', `${slug}.html`), 'utf8'));
const configuredRoutes = [...translator('ru').catalog.PAGE_ROUTES].sort();
if (JSON.stringify(configuredRoutes) !== JSON.stringify(pages)) {
  throw new Error('The localized route list must match pages/*.html.');
}

for (const language of languages) {
  const directory = path.join(output, language);
  fs.mkdirSync(directory);
  for (const [slug, source] of sourcePages) {
    fs.writeFileSync(path.join(directory, `${slug}.html`), localizedHtml(source, language, slug));
  }
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8'));
  manifest.lang = language;
  manifest.description = translator(language)(manifest.description);
  manifest.start_url = `/${language}/?source=pwa`;
  manifest.shortcuts = manifest.shortcuts.map(shortcut => ({
    ...shortcut,
    name: translator(language)(shortcut.name),
    short_name: translator(language)(shortcut.short_name),
    url: `/${language}${shortcut.url}`
  }));
  if (language !== 'ru' && /[А-Яа-яЁё]/.test(JSON.stringify(manifest))) {
    throw new Error(`Untranslated Cyrillic in ${language} manifest.`);
  }
  fs.writeFileSync(path.join(directory, 'manifest.webmanifest'),
    `${JSON.stringify(manifest, null, 2)}\n`);
}

fs.writeFileSync(path.join(output, 'index.html'), localizedHtml(sourcePages.get('index'), 'ru', 'index', true));
fs.mkdirSync(path.join(output, 'pages'));
for (const slug of pages) {
  fs.writeFileSync(path.join(output, 'pages', `${slug}.html`),
    localizedHtml(sourcePages.get(slug), 'ru', slug, true));
}

const sitemap = ['<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'];
for (const slug of sourcePages.keys()) {
  if (slug === 'favorites') continue;
  const suffix = slug === 'index' ? '/' : `/${slug}`;
  for (const language of languages) {
    sitemap.push('  <url>', `    <loc>${origin}/${language}${suffix}</loc>`);
    for (const alternate of languages) {
      sitemap.push(`    <xhtml:link rel="alternate" hreflang="${alternate}" href="${origin}/${alternate}${suffix}" />`);
    }
    sitemap.push('  </url>');
  }
}
sitemap.push('</urlset>');
fs.writeFileSync(path.join(output, 'sitemap.xml'), `${sitemap.join('\n')}\n`);

if (untranslated.size) {
  const report = [...untranslated].map(([page, values]) =>
    `${page}:\n${[...values].map(value => `  ${value}`).join('\n')}`).join('\n');
  throw new Error(`Untranslated Cyrillic in localized pages:\n${report}`);
}
if (spanishFallbacks.size) {
  throw new Error(`English fallback on Spanish pages:\n${[...spanishFallbacks].join('\n')}`);
}
console.log(`Built ${sourcePages.size * languages.length} localized pages.`);
