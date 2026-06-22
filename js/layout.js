/**
 * AKD IMAGE — Shared Layout
 * Inject header and footer into every page
 */

(function () {
  const tools = [
    { href: '../pages/compress.html',   label: 'Сжать' },
    { href: '../pages/resize.html',     label: 'Изменить размер' },
    { href: '../pages/watermark.html',  label: 'Водяной знак' },
    { href: '../pages/crop.html',       label: 'Обрезать' },
    { href: '../pages/convert.html',    label: 'Конвертировать' },
    { href: '../pages/rotate.html',     label: 'Повернуть' }
  ];

  // Determine relative path prefix (pages vs root)
  const isRoot = !location.pathname.includes('/pages/');
  const prefix = isRoot ? '' : '../';

  function navLinks() {
    return tools.map(t => {
      const href = isRoot
        ? t.href.replace('../pages/', 'pages/')
        : t.href;
      return `<a href="${href}">${t.label}</a>`;
    }).join('');
  }

const headerHTML = `
  <header class="site-header">
    <div class="container inner">
      <div style="display: flex; justify-content: flex-start;">
        <a href="${prefix}index.html" class="logo">
          AKD Image
        </a>
      </div>
      <nav class="site-nav" id="site-nav" style="margin: 0 auto; flex: none; justify-content: center;">
        ${navLinks()}
      </nav>
      <div style="display: flex; justify-content: flex-end; align-items: center;">
        <a href="${prefix}index.html" class="header-btn" style="text-decoration: none;">Все инструменты</a>
        <button class="nav-toggle" aria-label="Меню" onclick="document.getElementById('site-nav').classList.toggle('open')">
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
          <li><a href="#">О сервисе</a></li>
          <li><a href="${prefix}pages/privacy.html">Конфиденциальность</a></li>
          <li><a href="#">Контакты</a></li>
        </ul>
      </div>
    </footer>
  `;

  const toastContainer = `<div class="toast-container" id="toast-container"></div>`;

  document.addEventListener('DOMContentLoaded', () => {
    // Insert header before body content
    document.body.insertAdjacentHTML('afterbegin', headerHTML);
    document.body.insertAdjacentHTML('beforeend', footerHTML);
    document.body.insertAdjacentHTML('beforeend', toastContainer);

    // Mark active nav link
    const current = location.pathname;
    document.querySelectorAll('.site-nav a').forEach(a => {
      if (current.endsWith(a.getAttribute('href').replace('../', '').replace('./', ''))) {
        a.classList.add('active');
      }
    });
  });
})();
