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
    '/blur': '/pages/blur.html',
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
        <p class="footer-copy">© 2026 AKD Image – Бесплатные инструменты для работы с изображениями. Все права защищены.</p>
        <ul class="footer-links">
          <li><a href="${routeHref('/privacy', '/pages/privacy.html')}">Конфиденциальность</a></li>
        </ul>
      </div>
      <div class="container footer-bottom">
        <a class="footer-social-link" href="https://github.com/AKDworks" target="_blank" rel="noopener noreferrer" aria-label="GitHub AKDworks">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path fill="currentColor" d="M12 .5C5.65.5.5 5.65.5 12c0 5.1 3.29 9.4 7.86 10.93.58.1.79-.25.79-.56v-2.13c-3.2.7-3.88-1.36-3.88-1.36-.52-1.34-1.28-1.7-1.28-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.56-.29-5.25-1.28-5.25-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.18A11.05 11.05 0 0 1 12 6.03c.98 0 1.96.13 2.88.39 2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.77.11 3.06.74.81 1.19 1.84 1.19 3.1 0 4.42-2.7 5.39-5.27 5.68.42.36.79 1.07.79 2.16v3.13c0 .31.21.67.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z"/>
          </svg>
          <span>AKDworks</span>
        </a>
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
