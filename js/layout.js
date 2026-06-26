/* Shared layout */
(function () {
  const tools = [
    { href: '/compress',   page: '/pages/compress.html',   label: 'Сжать' },
    { href: '/resize',     page: '/pages/resize.html',     label: 'Изменить размер' },
    { href: '/watermark',  page: '/pages/watermark.html',  label: 'Водяной знак' },
    { href: '/crop',       page: '/pages/crop.html',       label: 'Обрезать' },
    { href: '/convert',    page: '/pages/convert.html',    label: 'Конвертировать' },
    { href: '/rotate',     page: '/pages/rotate.html',     label: 'Повернуть' }
  ];

  const localHosts = ['localhost', '127.0.0.1'];
  const isLocalStaticHost = localHosts.includes(location.hostname);
  const homeHref = '/';
  const localRoutes = {
    '/compress': '/pages/compress.html',
    '/resize': '/pages/resize.html',
    '/watermark': '/pages/watermark.html',
    '/crop': '/pages/crop.html',
    '/convert': '/pages/convert.html',
    '/rotate': '/pages/rotate.html',
    '/effects': '/pages/effects.html',
    '/meme': '/pages/meme.html',
    '/split': '/pages/split.html',
    '/round': '/pages/round.html',
    '/pixelate': '/pages/pixelate.html',
    '/exif': '/pages/exif.html',
    '/base64': '/pages/base64.html',
    '/favicon': '/pages/favicon.html',
    '/palette': '/pages/palette.html',
    '/privacy': '/pages/privacy.html'
  };

  function routeHref(href, page) {
    return isLocalStaticHost ? page : href;
  }

  function navLinks() {
    return tools.map(t => {
      return `<a href="${routeHref(t.href, t.page)}">${t.label}</a>`;
    }).join('');
  }

  const headerHTML = `
    <header class="site-header">
      <div class="container inner">
        <div class="header-side header-side--start">
          <a href="${homeHref}" class="logo">
            <svg class="logo-mark" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
              <rect width="64" height="64" rx="16" fill="#2563EB"/>
              <rect x="15" y="17" width="34" height="30" rx="5" fill="none" stroke="#FFFFFF" stroke-width="5"/>
              <path d="M17 41l12-10 7 7 5-5 8 8" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="41" cy="26" r="3.5" fill="#FFFFFF"/>
            </svg>
            AKD Image
          </a>
        </div>
        <nav class="site-nav" id="site-nav">
          ${navLinks()}
        </nav>
        <div class="header-side header-side--end">
          <a href="${homeHref}" class="header-btn">Все инструменты</a>
          <button class="nav-toggle" aria-label="Меню" aria-controls="site-nav" aria-expanded="false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
        </div>
      </div>
    </header>
  `;

  const footerHTML = `
    <footer class="site-footer">
      <div class="container inner">
        <p class="footer-copy">© 2026 AKD Image — Бесплатные инструменты для работы с изображениями. Все права защищены.</p>
        <ul class="footer-links">
          <li><a href="${routeHref('/privacy', '/pages/privacy.html')}">Конфиденциальность</a></li>
        </ul>
      </div>
    </footer>
  `;

  const toastContainer = `<div class="toast-container" id="toast-container"></div>`;

  document.addEventListener('DOMContentLoaded', () => {
    document.body.insertAdjacentHTML('afterbegin', headerHTML);
    document.body.insertAdjacentHTML('beforeend', footerHTML);
    document.body.insertAdjacentHTML('beforeend', toastContainer);

    const nav = document.querySelector('.site-nav');
    const toggle = document.querySelector('.nav-toggle');
    const current = location.pathname.replace(/\/$/, '') || '/';

    if (isLocalStaticHost) {
      document.querySelectorAll('.tool-card[href^="/"]').forEach(link => {
        const href = link.getAttribute('href');
        if (localRoutes[href]) link.setAttribute('href', localRoutes[href]);
      });
    }

    toggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });

    document.querySelectorAll('.site-nav a').forEach(a => {
      const href = a.getAttribute('href').replace(/\/$/, '') || '/';
      if (href === current) a.classList.add('active');
    });
  });
})();
