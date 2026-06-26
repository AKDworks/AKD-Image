/* Shared layout */
(function () {
  const tools = [
    { href: '/compress',   label: 'Сжать' },
    { href: '/resize',     label: 'Изменить размер' },
    { href: '/watermark',  label: 'Водяной знак' },
    { href: '/crop',       label: 'Обрезать' },
    { href: '/convert',    label: 'Конвертировать' },
    { href: '/rotate',     label: 'Повернуть' }
  ];

  const homeHref = '/';

  function navLinks() {
    return tools.map(t => {
      return `<a href="${t.href}">${t.label}</a>`;
    }).join('');
  }

  const headerHTML = `
    <header class="site-header">
      <div class="container inner">
        <div class="header-side header-side--start">
          <a href="${homeHref}" class="logo">
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
          <li><a href="/privacy">Конфиденциальность</a></li>
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
