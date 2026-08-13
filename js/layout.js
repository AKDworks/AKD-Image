/* Shared layout */
(function () {
  const localHosts = ['localhost', '127.0.0.1'];
  const isLocalStaticHost = localHosts.includes(location.hostname);
  const homeHref = '/';
  const themeStorageKey = 'akd-image-theme';
  const systemDarkQuery = '(prefers-color-scheme: dark)';
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
    '/pdf': '/pages/pdf.html',
    '/collage': '/pages/collage.html',
    '/annotate': '/pages/annotate.html',
    '/gif-trim': '/pages/gif-trim.html',
    '/video-gif': '/pages/video-gif.html',
    '/gif-frames': '/pages/gif-frames.html',
    '/favorites': '/pages/favorites.html',
    '/privacy': '/pages/privacy.html',
    '/about': '/pages/about.html'
  };

  function routeHref(href, page) {
    return isLocalStaticHost ? page : href;
  }

  function storedTheme() {
    try {
      const theme = localStorage.getItem(themeStorageKey);
      return ['system', 'light', 'dark'].includes(theme) ? theme : null;
    } catch {
      return null;
    }
  }

  function systemTheme() {
    return window.matchMedia?.(systemDarkQuery).matches ? 'dark' : 'light';
  }

  function currentThemeMode() {
    return storedTheme() || 'system';
  }

  function activeThemeMode() {
    return document.documentElement.dataset.themeMode || currentThemeMode();
  }

  function resolvedTheme(mode) {
    return mode === 'system' ? systemTheme() : mode;
  }

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme === 'dark' ? 'dark' : 'light';
  }

  function applyThemeMode(mode) {
    const themeMode = ['system', 'light', 'dark'].includes(mode) ? mode : 'system';
    document.documentElement.dataset.themeMode = themeMode;
    applyTheme(resolvedTheme(themeMode));
  }

  function saveThemeMode(mode) {
    try {
      localStorage.setItem(themeStorageKey, mode);
    } catch {
      /* Theme still works for the current page even if storage is unavailable. */
    }
  }

  applyThemeMode(currentThemeMode());

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
        <div class="header-side header-side--end">
          <div class="theme-control" id="theme-control" role="group" aria-label="Выбор темы">
            <button class="theme-option" type="button" data-theme-mode="system" aria-label="Системная тема" title="Системная тема">
              <svg class="theme-icon theme-icon--desktop" viewBox="0 -960 960 960" aria-hidden="true" focusable="false">
                <path fill="currentColor" d="M320-120v-80h80v-80H160q-33 0-56.5-23.5T80-360v-400q0-33 23.5-56.5T160-840h640q33 0 56.5 23.5T880-760v400q0 33-23.5 56.5T800-280H560v80h80v80H320ZM160-360h640v-400H160v400Zm0 0v-400 400Z"/>
              </svg>
              <svg class="theme-icon theme-icon--mobile" viewBox="0 -960 960 960" aria-hidden="true" focusable="false">
                <path fill="currentColor" d="M280-40q-33 0-56.5-23.5T200-120v-720q0-33 23.5-56.5T280-920h400q33 0 56.5 23.5T760-840v124q18 7 29 22t11 34v80q0 19-11 34t-29 22v404q0 33-23.5 56.5T680-40H280Zm0-80h400v-720H280v720Zm0 0v-720 720Zm228.5-611.5Q520-743 520-760t-11.5-28.5Q497-800 480-800t-28.5 11.5Q440-777 440-760t11.5 28.5Q463-720 480-720t28.5-11.5Z"/>
              </svg>
            </button>
            <button class="theme-option" type="button" data-theme-mode="light" aria-label="Светлая тема" title="Светлая тема">
              <svg viewBox="0 -960 960 960" aria-hidden="true" focusable="false">
                <path fill="currentColor" d="M440-800v-120h80v120h-80Zm0 760v-120h80v120h-80Zm360-400v-80h120v80H800Zm-760 0v-80h120v80H40Zm708-252-56-56 70-72 58 58-72 70ZM198-140l-58-58 72-70 56 56-70 72Zm564 0-70-72 56-56 72 70-58 58ZM212-692l-72-70 58-58 70 72-56 56Zm98 382q-70-70-70-170t70-170q70-70 170-70t170 70q70 70 70 170t-70 170q-70 70-170 70t-170-70Zm283.5-56.5Q640-413 640-480t-46.5-113.5Q547-640 480-640t-113.5 46.5Q320-547 320-480t46.5 113.5Q413-320 480-320t113.5-46.5ZM480-480Z"/>
              </svg>
            </button>
            <button class="theme-option" type="button" data-theme-mode="dark" aria-label="Темная тема" title="Темная тема">
              <svg viewBox="0 -960 960 960" aria-hidden="true" focusable="false">
                <path fill="currentColor" d="M484-80q-84 0-157.5-32t-128-86.5Q144-253 112-326.5T80-484q0-146 93-257.5T410-880q-18 99 11 193.5T521-521q71 71 165.5 100T880-410q-26 144-138 237T484-80Zm0-80q88 0 163-44t118-121q-86-8-163-43.5T464-465q-61-61-97-138t-43-163q-77 43-120.5 118.5T160-484q0 135 94.5 229.5T484-160Zm-20-305Z"/>
              </svg>
            </button>
          </div>
          <a href="${homeHref}" class="header-btn">Главная</a>
        </div>
      </div>
    </header>
  `;

  const footerHTML = `
    <footer class="site-footer">
      <div class="container inner">
        <p class="footer-copy">© 2026 AKD Image – Бесплатные инструменты для работы с изображениями. Все права защищены.</p>
        <ul class="footer-links">
          <li><a href="${routeHref('/about', '/pages/about.html')}">О проекте</a></li>
          <li><a href="${routeHref('/privacy', '/pages/privacy.html')}">Конфиденциальность</a></li>
          <li><a href="${routeHref('/licenses', '/pages/licenses.html')}">Лицензии</a></li>
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

  function initThemeControl() {
    const control = document.getElementById('theme-control');
    if (!control) return;

    const buttons = Array.from(control.querySelectorAll('[data-theme-mode]'));

    function syncButtons() {
      const activeMode = activeThemeMode();

      buttons.forEach(button => {
        const isActive = button.dataset.themeMode === activeMode;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', String(isActive));
      });
    }

    buttons.forEach(button => {
      button.addEventListener('click', () => {
        const mode = button.dataset.themeMode;
        applyThemeMode(mode);
        saveThemeMode(mode);
        syncButtons();
      });
    });

    window.matchMedia?.(systemDarkQuery).addEventListener('change', () => {
      if (activeThemeMode() !== 'system') return;
      applyThemeMode('system');
    });

    syncButtons();
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.body.insertAdjacentHTML('afterbegin', headerHTML);
    document.body.insertAdjacentHTML('beforeend', footerHTML);
    document.body.insertAdjacentHTML('beforeend', toastContainer);

    initThemeControl();

    if (isLocalStaticHost) {
      document.querySelectorAll('a[href^="/"]').forEach(link => {
        const href = link.getAttribute('href');
        if (localRoutes[href]) link.setAttribute('href', localRoutes[href]);
      });
    }

  });
})();
