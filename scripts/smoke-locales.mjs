// Run after build-locales.mjs and preview-locales.mjs, with Chrome DevTools on port 9223.
import assert from 'node:assert/strict';

const debuggerUrl = 'http://127.0.0.1:9223';
const previewUrl = 'http://127.0.0.1:4173';
const tab = await (await fetch(`${debuggerUrl}/json/new?${encodeURIComponent(`${previewUrl}/es/annotate`)}`, {
  method: 'PUT'
})).json();
const socket = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});

let id = 0;
const pending = new Map();
const exceptions = [];
socket.addEventListener('message', event => {
  const result = JSON.parse(event.data);
  if (result.method === 'Runtime.exceptionThrown') {
    exceptions.push(result.params.exceptionDetails.text);
  }
  if (!result.id || !pending.has(result.id)) return;
  const { resolve, reject } = pending.get(result.id);
  pending.delete(result.id);
  if (result.error) reject(new Error(result.error.message));
  else resolve(result.result);
});

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const requestId = ++id;
    pending.set(requestId, { resolve, reject });
    socket.send(JSON.stringify({ id: requestId, method, params }));
  });
}

async function evaluate(expression) {
  const response = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text);
  return response.result.value;
}

async function waitFor(expression) {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (await evaluate(expression)) return;
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  throw new Error(`Timed out: ${expression}`);
}

const state = `({
  path: location.pathname,
  language: document.documentElement.lang,
  heading: document.querySelector('.tool-page__title')?.textContent,
  canonical: document.querySelector('link[rel="canonical"]')?.href,
  manifest: document.querySelector('link[rel="manifest"]')?.getAttribute('href'),
  home: document.querySelector('a.logo')?.getAttribute('href'),
  visibleCyrillic: /[А-Яа-яЁё]/.test(document.body.innerText),
  sentinel: window.__localeSentinel
})`;

try {
  await send('Runtime.enable');
  await waitFor('document.readyState === "complete" && !!window.AKDI18n && !!document.querySelector("a.logo")');
  let value = await evaluate(state);
  assert.equal(value.path, '/es/annotate');
  assert.equal(value.language, 'es');
  assert.match(value.heading, /Editor de im[aá]genes/i);
  assert.equal(value.home, '/es/');
  assert.equal(value.manifest, '/es/manifest.webmanifest');
  assert.equal(value.visibleCyrillic, false);

  await evaluate('window.__localeSentinel = 7; window.AKDI18n.setLanguage("en")');
  value = await evaluate(state);
  assert.equal(value.path, '/en/annotate');
  assert.equal(value.language, 'en');
  assert.equal(value.heading, 'Image editor');
  assert.equal(value.canonical, 'https://image.akdworks.com/en/annotate');
  assert.equal(value.home, '/en/');
  assert.equal(value.manifest, '/en/manifest.webmanifest');
  assert.equal(value.sentinel, 7, 'switching language must not reload the editor');
  assert.equal(value.visibleCyrillic, false);

  await evaluate('window.AKDI18n.setLanguage("ru")');
  value = await evaluate(state);
  assert.equal(value.path, '/ru/annotate');
  assert.equal(value.language, 'ru');
  assert.equal(value.heading, 'Редактор изображений');
  assert.equal(value.home, '/ru/');
  assert.equal(value.manifest, '/ru/manifest.webmanifest');

  await evaluate('window.AKDI18n.setLanguage("es")');
  value = await evaluate(state);
  assert.equal(value.path, '/es/annotate');
  assert.match(value.heading, /Editor de im[aá]genes/i);
  assert.equal(value.visibleCyrillic, false);

  await evaluate('history.back()');
  await waitFor('location.pathname === "/ru/annotate" && document.documentElement.lang === "ru"');
  value = await evaluate(state);
  assert.equal(value.heading, 'Редактор изображений');
  assert.equal(await evaluate('localStorage.getItem("akd-image-language")'), 'ru');
  for (const code of ['ru', 'en', 'es']) {
    const home = await fetch(`${previewUrl}/${code}/`);
    const manifest = await fetch(`${previewUrl}/${code}/manifest.webmanifest`);
    assert.equal(home.status, 200);
    assert.equal((await manifest.json()).lang, code);
  }
  await send('Page.navigate', { url: `${previewUrl}/es/` });
  await waitFor('location.pathname === "/es/" && document.readyState === "complete" && !!document.querySelector(".tool-card")');
  assert.equal(await evaluate('/[А-Яа-яЁё]/.test(document.body.innerText)'), false);
  assert.equal(await evaluate('document.querySelector("a[href*=annotate]")?.getAttribute("href")'), '/es/annotate');
  const offlineReady = await evaluate(`Promise.race([
    navigator.serviceWorker.ready.then(() => true),
    new Promise(resolve => setTimeout(() => resolve(false), 5000))
  ])`);
  assert.equal(offlineReady, true, 'offline service worker must install');
  assert.deepEqual(exceptions, [], 'browser must not throw while switching languages');
  console.log('Locale routes, switching, history, metadata, and editor state passed.');
} finally {
  await send('Page.close').catch(() => {});
  socket.close();
}
