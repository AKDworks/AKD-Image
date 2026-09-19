/* Shared layout */
(function () {
  const localHosts = ['localhost', '127.0.0.1'];
  const isLocalStaticHost = localHosts.includes(location.hostname);
  const homeHref = window.AKDI18n?.routeHref('/') || '/';
  const themeStorageKey = 'akd-image-theme';
  const settingsStorageKey = 'akd-image-settings';
  const installAvailableStorageKey = 'akd-image-pwa-install-available';
  const systemDarkQuery = '(prefers-color-scheme: dark)';
  const defaultSettings = Object.freeze({
    showCategories: true,
    showFavorites: true,
    showSorting: true,
  });
  const localRoutes = {
    '/compress': '/pages/compress.html',
    '/gif-optimize': '/pages/gif-optimize.html',
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
    '/remove-background': '/pages/remove-background.html',
    '/favorites': '/pages/favorites.html',
    '/privacy': '/pages/privacy.html',
    '/about': '/pages/about.html',
    '/faq': '/pages/faq.html',
    '/licenses': '/pages/licenses.html'
  };

  function routeHref(href, page) {
    if (isLocalStaticHost && !/^\/(ru|en|es)(?:\/|$)/.test(location.pathname)) return page;
    return window.AKDI18n?.routeHref(href) || href;
  }

  function initialInstallControlsVisible() {
    const standalone = window.matchMedia?.('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    if (standalone) return false;

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const desktopSafari = /^((?!chrome|android|crios|edg).)*safari/i.test(navigator.userAgent) && !ios;
    if (ios || desktopSafari) return true;

    try {
      return sessionStorage.getItem(installAvailableStorageKey) === 'true';
    } catch {
      return false;
    }
  }

  function readSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem(settingsStorageKey));
      if (!saved || typeof saved !== 'object') return { ...defaultSettings };
      return Object.fromEntries(Object.entries(defaultSettings).map(([key, fallback]) => [
        key,
        typeof saved[key] === 'boolean' ? saved[key] : fallback,
      ]));
    } catch {
      return { ...defaultSettings };
    }
  }

  function saveSettings(settings) {
    try {
      localStorage.setItem(settingsStorageKey, JSON.stringify(settings));
    } catch {
      /* Settings still apply for the current page if storage is unavailable. */
    }
  }

  function applySettings(settings, notify = false) {
    const root = document.documentElement;
    root.dataset.catalogCategories = settings.showCategories ? 'visible' : 'hidden';
    root.dataset.catalogFavorites = settings.showFavorites ? 'visible' : 'hidden';
    root.dataset.catalogSorting = settings.showSorting ? 'visible' : 'hidden';
    if (notify) {
      window.dispatchEvent(new CustomEvent('akd-settingschange', {
        detail: { settings: { ...settings } },
      }));
    }
  }

  let currentSettings = readSettings();
  applySettings(currentSettings);
  window.AKDSettings = {
    defaults: { ...defaultSettings },
    get() { return { ...currentSettings }; },
  };

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
    const resolved = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.dataset.theme = resolved;
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.setAttribute('content', resolved === 'dark' ? '#191C20' : '#F2F3F8');
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

  const initialInstallHiddenClass = initialInstallControlsVisible() ? '' : ' hidden';

  const themeControlHTML = `
          <div class="theme-control" id="theme-control" role="group" aria-label="Выбор темы">
            <button class="theme-option" type="button" data-theme-mode="light" aria-label="Светлая тема" title="Светлая тема">
              <svg viewBox="0 -960 960 960" aria-hidden="true" focusable="false">
                <path class="theme-icon-default" fill="currentColor" d="M440-800v-120h80v120h-80Zm0 760v-120h80v120h-80Zm360-400v-80h120v80H800Zm-760 0v-80h120v80H40Zm708-252-56-56 70-72 58 58-72 70ZM198-140l-58-58 72-70 56 56-70 72Zm564 0-70-72 56-56 72 70-58 58ZM212-692l-72-70 58-58 70 72-56 56Zm98 382q-70-70-70-170t70-170q70-70 170-70t170 70q70 70 70 170t-70 170q-70 70-170 70t-170-70Zm283.5-56.5Q640-413 640-480t-46.5-113.5Q547-640 480-640t-113.5 46.5Q320-547 320-480t46.5 113.5Q413-320 480-320t113.5-46.5ZM480-480Z"/>
                <path class="theme-icon-selected" fill="currentColor" d="M440-760v-160h80v160h-80Zm266 110-55-55 112-115 56 57-113 113Zm54 210v-80h160v80H760ZM440-40v-160h80v160h-80ZM254-652 140-763l57-56 113 113-56 54Zm508 512L651-255l54-54 114 110-57 59ZM40-440v-80h160v80H40Zm157 300-56-57 112-112 29 27 29 28-114 114Zm113-170q-70-70-70-170t70-170q70-70 170-70t170 70q70 70 70 170t-70 170q-70 70-170 70t-170-70Z"/>
              </svg>
            </button>
            <button class="theme-option" type="button" data-theme-mode="dark" aria-label="Темная тема" title="Темная тема">
              <svg viewBox="0 -960 960 960" aria-hidden="true" focusable="false">
                <path class="theme-icon-default" fill="currentColor" d="M484-80q-84 0-157.5-32t-128-86.5Q144-253 112-326.5T80-484q0-146 93-257.5T410-880q-18 99 11 193.5T521-521q71 71 165.5 100T880-410q-26 144-138 237T484-80Zm0-80q88 0 163-44t118-121q-86-8-163-43.5T464-465q-61-61-97-138t-43-163q-77 43-120.5 118.5T160-484q0 135 94.5 229.5T484-160Zm-20-305Z"/>
                <path class="theme-icon-selected" fill="currentColor" d="M484-80q-84 0-157.5-32t-128-86.5Q144-253 112-326.5T80-484q0-146 93-257.5T410-880q-18 99 11 193.5T521-521q71 71 165.5 100T880-410q-26 144-138 237T484-80Z"/>
              </svg>
            </button>
          </div>
  `;

  const settingsMenuHTML = `
          <div class="settings-menu" id="settings-menu">
            <button class="settings-trigger" id="settings-trigger" type="button" aria-haspopup="dialog" aria-expanded="false" aria-controls="app-settings-panel" aria-label="Открыть настройки" title="Настройки">
              <svg viewBox="0 -960 960 960" aria-hidden="true" focusable="false">
                <path fill="currentColor" d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z"/>
              </svg>
            </button>
            <div class="settings-panel" id="app-settings-panel" role="dialog" aria-labelledby="settings-title" hidden>
              <div class="settings-panel__head">
                <h2 id="settings-title">Настройки</h2>
                <button class="settings-panel__close" type="button" data-settings-close aria-label="Закрыть настройки">
                  <svg viewBox="0 -960 960 960" aria-hidden="true" focusable="false"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg>
                </button>
              </div>
              <div class="settings-panel__body">
                <section class="settings-section" aria-labelledby="settings-catalog-title">
                  <h3 id="settings-catalog-title">Каталог</h3>
                  <button class="settings-option" type="button" role="switch" data-setting="showCategories" aria-checked="true">
                    <span class="settings-option__copy"><strong>Показывать категории</strong><small>Фильтры «Оптимизация», «Геометрия» и «Творчество»</small></span>
                    <span class="settings-switch" aria-hidden="true"><span></span></span>
                  </button>
                  <button class="settings-option" type="button" role="switch" data-setting="showFavorites" aria-checked="true">
                    <span class="settings-option__copy"><strong>Показывать избранное</strong><small>Отдельный каталог сохранённых инструментов</small></span>
                    <span class="settings-switch" aria-hidden="true"><span></span></span>
                  </button>
                  <button class="settings-option" type="button" role="switch" data-setting="showSorting" aria-checked="true">
                    <span class="settings-option__copy"><strong>Показывать сортировку</strong><small>Сортировка по популярности, новизне и названию</small></span>
                    <span class="settings-switch" aria-hidden="true"><span></span></span>
                  </button>
                </section>
                <section class="settings-section" aria-labelledby="settings-data-title">
                  <h3 id="settings-data-title">Данные приложения</h3>
                  <button class="settings-action" type="button" data-settings-action="clear-favorites">
                    <svg viewBox="0 -960 960 960" aria-hidden="true"><path d="M160-80v-560q0-33 23.5-56.5T240-720h320q33 0 56.5 23.5T640-640v560L400-200 160-80Zm80-121 160-86 160 86v-439H240v439Zm480-39v-560H280v-80h440q33 0 56.5 23.5T800-800v560h-80ZM240-640h320-320Z"/></svg>
                    <span><strong>Очистить избранное</strong><small>Удалить список сохранённых инструментов</small></span>
                  </button>
                  <button class="settings-action" type="button" data-settings-action="clear-downloads">
                    <svg viewBox="0 -960 960 960" aria-hidden="true"><path d="M580-280h80q25 0 42.5-17.5T720-340v-160h40v-60H660v-40h-80v40H480v60h40v160q0 25 17.5 42.5T580-280Zm0-220h80v160h-80v-160ZM160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h240l80 80h320q33 0 56.5 23.5T880-640v400q0 33-23.5 56.5T800-160H160Zm0-80h640v-400H447l-80-80H160v480Zm0 0v-480 480Z"/></svg>
                    <span><strong>Удалить данные инструментов</strong><small>Загруженные модели и другие кэшированные ресурсы будут удалены</small></span>
                  </button>
                  <button class="settings-action" type="button" data-settings-action="reset-settings">
                    <svg viewBox="0 -960 960 960" aria-hidden="true"><path d="M440-122q-121-15-200.5-105.5T160-440q0-66 26-126.5T260-672l57 57q-38 34-57.5 79T240-440q0 88 56 155.5T440-202v80Zm80 0v-80q87-16 143.5-83T720-440q0-100-70-170t-170-70h-3l44 44-56 56-140-140 140-140 56 56-44 44h3q134 0 227 93t93 227q0 121-79.5 211.5T520-122Z"/></svg>
                    <span><strong>Стандартные настройки</strong><small>Вернуть исходное отображение интерфейса</small></span>
                  </button>
                  <div class="settings-section__divider" role="separator"></div>
                  <button class="settings-action settings-action--danger" type="button" data-settings-action="clear-all">
                    <svg viewBox="0 -960 960 960" aria-hidden="true"><path d="m376-300 104-104 104 104 56-56-104-104 104-104-56-56-104 104-104-104-56 56 104 104-104 104 56 56Zm-96 180q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520Zm-400 0v520-520Z"/></svg>
                    <span><strong>Очистить локальные данные</strong><small>Удалить настройки, избранное и данные инструментов</small></span>
                  </button>
                </section>
              </div>
            </div>
          </div>
  `;

  const headerHTML = `
    <header class="site-header">
      <div class="container inner">
        <div class="header-side header-side--start">
          <a href="${homeHref}" class="logo" aria-label="AKD Image">
            <img class="logo-mark" src="/assets/icons/favicon.svg?v=3.3.0" alt="" aria-hidden="true">
            <span>AKD Image</span>
          </a>
        </div>
        <div class="header-side header-side--end">
          ${themeControlHTML}
          <button class="header-install-btn${initialInstallHiddenClass}" type="button" data-pwa-install aria-label="Установить AKD Image" title="Установить AKD Image">
            <svg viewBox="0 -960 960 960" aria-hidden="true" focusable="false">
              <path fill="currentColor" d="M480-320 280-520l56-58 104 104v-326h80v326l104-104 56 58-200 200ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z"/>
            </svg>
            <span>Установить</span>
          </button>

          <span class="header-install-divider${initialInstallHiddenClass}" data-pwa-install-divider aria-hidden="true"></span>
          <a href="${homeHref}" class="header-btn">Главная</a>
          ${settingsMenuHTML}
        </div>
      </div>
    </header>
  `;

  const footerHTML = `
    <footer class="site-footer">
      <nav class="container footer-grid" aria-label="Навигация внизу страницы">
        <section class="footer-column" aria-labelledby="footer-product-title">
          <h2 id="footer-product-title">AKD Image</h2>
          <ul class="footer-links">
            <li><a href="${routeHref('/about', '/pages/about.html')}">О проекте</a></li>
            <li><button type="button" data-pwa-install-info aria-haspopup="dialog">Установить приложение</button></li>
            <li><a href="https://github.com/AKDworks/AKD-Image" target="_blank" rel="noopener noreferrer">GitHub</a></li>
          </ul>
        </section>
        <section class="footer-column" aria-labelledby="footer-support-title">
          <h2 id="footer-support-title">Поддержка</h2>
          <ul class="footer-links">
            <li><a href="${routeHref('/faq', '/pages/faq.html')}">Частые вопросы</a></li>
            <li><button type="button" data-contact-open aria-haspopup="dialog">Написать разработчику</button></li>
            <li><button type="button" data-support-open aria-haspopup="dialog">Поддержать разработчика</button></li>
          </ul>
        </section>
        <section class="footer-column" aria-labelledby="footer-legal-title">
          <h2 id="footer-legal-title">Правовая информация</h2>
          <ul class="footer-links">
            <li><a href="${routeHref('/privacy', '/pages/privacy.html')}">Конфиденциальность</a></li>
            <li><a href="${routeHref('/licenses', '/pages/licenses.html')}">Лицензии</a></li>
          </ul>
        </section>
        <section class="footer-column" aria-labelledby="footer-works-title">
          <h2 id="footer-works-title">AKDworks</h2>
          <ul class="footer-links">
            <li><button type="button" data-website-open aria-haspopup="dialog">Официальный сайт</button></li>
          </ul>
        </section>
      </nav>
      <div class="container footer-bottom">
        <p class="footer-copy">© 2026 AKD Image – Бесплатные инструменты для работы с изображениями. Все права защищены.</p>
        <div class="footer-preferences">
        <div class="language-control">
          <button class="language-trigger" type="button" aria-haspopup="menu" aria-expanded="false" aria-label="Выбрать язык">
            <svg class="language-globe" viewBox="0 -960 960 960" aria-hidden="true" focusable="false">
              <path d="M480-80q-82 0-155-31.5t-127.5-86Q142-253 111-326T80-480q0-83 31-156t86.5-127Q253-818 326-849t154-31q83 0 156 31t127 86.5Q818-707 849-634t31 154q0 82-31.5 155T763-197.5Q707-142 634-111T480-80Zm0-82q26-36 45-75t31-83H404q12 44 31 83t45 75Zm-104-16q-18-33-31.5-68.5T322-320H204q29 50 72.5 87t99.5 55Zm208 0q56-18 99.5-55t72.5-87H638q-9 46-22.5 81.5T584-178ZM170-400h136q-3-20-4.5-39.5T300-480q0-21 1.5-40.5T306-560H170q-5 20-7.5 39.5T160-480q0 21 2.5 40.5T170-400Zm216 0h188q3-20 4.5-39.5T580-480q0-21-1.5-40.5T574-560H386q-3 20-4.5 39.5T380-480q0 21 1.5 40.5T386-400Zm268 0h136q5-20 7.5-39.5T800-480q0-21-2.5-40.5T790-560H654q3 20 4.5 39.5T660-480q0 21-1.5 40.5T654-400ZM638-640h118q-29-50-72.5-87T584-782q18 33 31.5 68.5T638-640Zm-234 0h152q-12-44-31-83t-45-75q-26 36-45 75t-31 83Zm-200 0h118q9-46 22.5-81.5T376-782q-56 18-99.5 55T204-640Z"></path>
            </svg>
            <span class="language-current">Русский</span>
            <svg class="language-chevron" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
              <path d="m6 8 4 4 4-4"></path>
            </svg>
          </button>
          <div class="language-menu" role="menu" aria-label="Язык интерфейса">
            <button class="language-option" type="button" role="menuitemradio" data-language="en" aria-checked="false">
              <span>English</span>
              <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="m5 10 3 3 7-7"></path></svg>
            </button>
            <button class="language-option" type="button" role="menuitemradio" data-language="es" aria-checked="false">
              <span>Español</span>
              <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="m5 10 3 3 7-7"></path></svg>
            </button>
            <button class="language-option" type="button" role="menuitemradio" data-language="ru" aria-checked="false">
              <span>Русский</span>
              <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="m5 10 3 3 7-7"></path></svg>
            </button>
          </div>
        </div>
        </div>
      </div>
    </footer>
  `;

  const toastContainer = `<div class="toast-container" id="toast-container"></div>`;

  const contactHTML = `
    <div class="modal-overlay" id="contact-overlay" hidden>
    <dialog class="modal contact-modal" id="contact-dialog" aria-modal="true" aria-labelledby="contact-title">
      <div class="modal__head">
        <h3 id="contact-title">Написать разработчику</h3>
        <button class="modal__close" type="button" data-contact-close aria-label="Закрыть">×</button>
      </div>
      <form class="modal__body contact-form" id="contact-form" method="post" novalidate>
        <div class="contact-form__row">
          <div class="form-group"><label for="contact-name">Имя или псевдоним</label><input id="contact-name" name="name" type="text" autocomplete="nickname" maxlength="100" required></div>
          <div class="form-group"><label for="contact-email">Ваш email</label><input id="contact-email" name="email" type="email" autocomplete="email" maxlength="254" aria-describedby="contact-email-hint" required><small id="contact-email-hint">Для ответа на ваше обращение.</small></div>
        </div>
        <div class="form-group"><label for="contact-category">Категория</label><select id="contact-category" name="category"><option value="question">Вопрос</option><option value="bug">Ошибка</option><option value="suggestion">Предложение</option><option value="other">Другое</option></select></div>
        <div class="form-group"><label for="contact-subject">Тема</label><input id="contact-subject" name="subject" type="text" maxlength="200" required></div>
        <div class="form-group"><label for="contact-message">Сообщение</label><textarea id="contact-message" name="message" rows="4" maxlength="5000" required></textarea></div>
        <div class="contact-captcha-panel" id="contact-captcha-panel" hidden>
          <div class="contact-captcha-heading">Защита от спама</div>
          <div id="contact-captcha" translate="no"></div>
          <p class="contact-captcha-verified" id="contact-captcha-verified" role="status" hidden>Проверка пройдена</p>
        </div>
        <div class="contact-form__actions">
          <button class="btn btn-secondary" id="contact-captcha-load" type="button">Пройти капчу</button>
          <button class="btn btn-primary" type="submit" disabled>Отправить сообщение</button>
        </div>
        <p class="contact-status" id="contact-status" role="status" aria-live="polite" hidden></p>
      </form>
    </dialog>
    </div>
  `;

  const supportHTML = `
    <dialog class="modal contact-modal support-modal" id="support-dialog" aria-labelledby="support-title" aria-describedby="support-description">
      <div class="modal__head">
        <h3 id="support-title">Переход на внешний сайт</h3>
        <button class="modal__close" type="button" data-support-close aria-label="Закрыть">×</button>
      </div>
      <div class="modal__body contact-form">
        <p id="support-description">Вы переходите на Ko-fi, чтобы поддержать разработчика AKD Image. Это внешний сайт, он откроется в новой вкладке.</p>
        <p class="contact-notice">ko-fi.com/akdworks</p>
        <div class="support-actions">
          <button class="btn btn-secondary" type="button" data-support-close autofocus>Остаться</button>
          <a class="btn btn-primary" href="https://ko-fi.com/akdworks" target="_blank" rel="noopener noreferrer" data-support-confirm>Перейти на Ko-fi</a>
        </div>
      </div>
    </dialog>
  `;

  const websiteHTML = `
    <dialog class="modal contact-modal support-modal" id="website-dialog" aria-labelledby="website-title" aria-describedby="website-description">
      <div class="modal__head">
        <h3 id="website-title">Переход на внешний сайт</h3>
        <button class="modal__close" type="button" data-website-close aria-label="Закрыть">×</button>
      </div>
      <div class="modal__body contact-form">
        <p id="website-description">Вы переходите на официальный сайт AKDworks. Это внешний сайт, он откроется в новой вкладке.</p>
        <p class="contact-notice">akdworks.com</p>
        <div class="support-actions">
          <button class="btn btn-secondary" type="button" data-website-close autofocus>Остаться</button>
          <a class="btn btn-primary" href="https://akdworks.com" target="_blank" rel="noopener noreferrer" data-website-confirm>Перейти на сайт</a>
        </div>
      </div>
    </dialog>
  `;

  const settingsConfirmHTML = `
    <dialog class="modal settings-confirm-dialog" id="settings-confirm-dialog" aria-labelledby="settings-confirm-title" aria-describedby="settings-confirm-description">
      <div class="modal__head">
        <h3 id="settings-confirm-title">Подтвердите действие</h3>
        <button class="modal__close" type="button" data-settings-confirm-close aria-label="Закрыть">×</button>
      </div>
      <div class="modal__body settings-confirm-dialog__body">
        <p id="settings-confirm-description"></p>
        <div class="settings-confirm-dialog__actions">
          <button class="btn btn-secondary" type="button" data-settings-confirm-close>Отмена</button>
          <button class="btn btn-danger" id="settings-confirm-action" type="button">Удалить</button>
        </div>
      </div>
    </dialog>
  `;

  function initFooterDialog(id, triggerSelector, closeSelector) {
    const dialog = document.getElementById(id);
    const overlay = id === 'contact-dialog' ? document.getElementById('contact-overlay') : null;
    let inertElements = [];
    let trigger = null;
    document.querySelectorAll(triggerSelector).forEach(button => {
      button.addEventListener('click', () => {
        trigger = button;
        if (overlay) {
          // hCaptcha portals its challenge into body. A native top-layer modal
          // would make that challenge inert. Use the existing modal overlay here.
          overlay.hidden = false;
          inertElements = [...document.body.children].filter(element => element !== overlay &&
            !element.inert && !element.querySelector('iframe[src*="hcaptcha.com"]'));
          inertElements.forEach(element => { element.inert = true; });
          dialog.show();
          dialog.querySelector('input')?.focus();
        } else dialog.showModal();
        document.body.classList.add('contact-open');
      });
    });
    if (overlay) {
      overlay.addEventListener('click', event => {
        if (event.target === overlay) dialog.close();
      });
      document.addEventListener('keydown', event => {
        if (!dialog.open || dialog.dataset.captchaChallenge === 'true') return;
        if (event.key === 'Escape') { event.preventDefault(); dialog.close(); }
        if (event.key !== 'Tab') return;
        const focusable = [...dialog.querySelectorAll('button, input, select, textarea, a[href], iframe, [tabindex="0"]')]
          .filter(element => !element.disabled && element.getClientRects().length);
        const first = focusable[0], last = focusable.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      });
    }
    dialog.querySelectorAll(closeSelector).forEach(button => {
      button.addEventListener('click', () => dialog.close());
    });
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right ||
          event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    });
    dialog.addEventListener('close', () => {
      if (overlay) {
        overlay.hidden = true;
        inertElements.forEach(element => { element.inert = false; });
        inertElements = [];
      }
      document.body.classList.remove('contact-open');
      trigger?.focus();
    });
    // Never allow a native navigation to expose form values or bypass the handler.
    dialog.querySelector('form')?.addEventListener('submit', event => event.preventDefault());
    dialog.querySelector('[data-support-confirm], [data-website-confirm]')?.addEventListener('click', () => dialog.close());
  }

  function initSettingsMenu() {
    const menu = document.getElementById('settings-menu');
    const trigger = document.getElementById('settings-trigger');
    const panel = document.getElementById('app-settings-panel');
    const confirmDialog = document.getElementById('settings-confirm-dialog');
    const confirmTitle = document.getElementById('settings-confirm-title');
    const confirmDescription = document.getElementById('settings-confirm-description');
    const confirmAction = document.getElementById('settings-confirm-action');
    const toggles = Array.from(panel?.querySelectorAll('[data-setting]') || []);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const t = value => window.AKDI18n?.t(value) || value;
    let closeTimer = 0;
    let pendingAction = null;
    let actionTrigger = null;

    if (!menu || !trigger || !panel || !confirmDialog || !confirmAction) return;

    function syncToggles() {
      toggles.forEach(button => {
        button.setAttribute('aria-checked', String(Boolean(currentSettings[button.dataset.setting])));
      });
    }

    function openSettings() {
      window.clearTimeout(closeTimer);
      panel.hidden = false;
      panel.classList.remove('is-closing');
      panel.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
      requestAnimationFrame(() => panel.querySelector('[data-settings-close]')?.focus());
    }

    function closeSettings(restoreFocus = false) {
      if (panel.hidden) return;
      window.clearTimeout(closeTimer);
      trigger.setAttribute('aria-expanded', 'false');
      panel.classList.remove('is-open');

      const finish = () => {
        panel.hidden = true;
        panel.classList.remove('is-closing');
        if (restoreFocus) trigger.focus();
      };

      if (reducedMotion.matches) {
        finish();
        return;
      }

      panel.classList.add('is-closing');
      closeTimer = window.setTimeout(finish, 150);
    }

    function updateSetting(key) {
      if (!(key in defaultSettings)) return;
      currentSettings = { ...currentSettings, [key]: !currentSettings[key] };
      saveSettings(currentSettings);
      applySettings(currentSettings, true);
      syncToggles();
    }

    async function clearDownloadedResources() {
      if (!('caches' in window)) return 0;
      const names = await caches.keys();
      const downloadableCaches = names.filter(name => !name.startsWith('akd-image-pwa-'));
      const results = await Promise.all(downloadableCaches.map(name => caches.delete(name)));
      return results.filter(Boolean).length;
    }

    function notify(message) {
      if (window.Toast?.success) window.Toast.success(t(message));
    }

    function askForConfirmation(action, button) {
      const confirmations = {
        'clear-favorites': {
          title: 'Очистить избранное?',
          description: 'Все сохранённые инструменты будут удалены из избранного.',
        },
        'clear-downloads': {
          title: 'Удалить данные инструментов?',
          description: 'ИИ-модели и дополнительные данные инструментов будут загружены заново при следующем использовании.',
        },
        'clear-all': {
          title: 'Очистить локальные данные?',
          description: 'Настройки, избранное и данные инструментов будут удалены. Это действие нельзя отменить.',
        },
      };
      const content = confirmations[action];
      if (!content) return;
      pendingAction = action;
      actionTrigger = button;
      confirmTitle.textContent = t(content.title);
      confirmDescription.textContent = t(content.description);
      confirmAction.textContent = t('Удалить');
      confirmDialog.showModal();
      document.body.classList.add('modal-open');
      confirmAction.focus();
    }

    async function runConfirmedAction() {
      if (!pendingAction) return;
      const action = pendingAction;
      confirmAction.disabled = true;
      confirmDialog.setAttribute('aria-busy', 'true');

      try {
        if (action === 'clear-favorites') {
          localStorage.removeItem('akd-image-favorites');
          window.dispatchEvent(new CustomEvent('akd-favoriteschange', { detail: { favorites: [] } }));
          notify('Избранное очищено.');
        } else if (action === 'clear-downloads') {
          await clearDownloadedResources();
          notify('Данные инструментов удалены.');
        } else if (action === 'clear-all') {
          for (let index = localStorage.length - 1; index >= 0; index--) {
            const key = localStorage.key(index);
            if (key?.startsWith('akd-image-')) localStorage.removeItem(key);
          }
          for (let index = sessionStorage.length - 1; index >= 0; index--) {
            const key = sessionStorage.key(index);
            if (key?.startsWith('akd-image-')) sessionStorage.removeItem(key);
          }
          await clearDownloadedResources();
          location.reload();
          return;
        }
        confirmDialog.close();
        closeSettings(true);
      } catch (error) {
        console.error(error);
        window.Toast?.error?.(t('Не удалось удалить данные. Попробуйте ещё раз.'));
      } finally {
        confirmAction.disabled = false;
        confirmDialog.removeAttribute('aria-busy');
      }
    }

    trigger.addEventListener('click', event => {
      event.stopPropagation();
      if (panel.hidden || panel.classList.contains('is-closing')) openSettings();
      else closeSettings(true);
    });

    panel.querySelector('[data-settings-close]')?.addEventListener('click', () => closeSettings(true));
    toggles.forEach(button => button.addEventListener('click', () => updateSetting(button.dataset.setting)));
    panel.querySelectorAll('[data-settings-action]').forEach(button => {
      button.addEventListener('click', () => {
        const action = button.dataset.settingsAction;
        if (action === 'reset-settings') {
          currentSettings = { ...defaultSettings };
          saveSettings(currentSettings);
          applySettings(currentSettings, true);
          syncToggles();
          notify('Стандартные настройки восстановлены.');
          return;
        }
        askForConfirmation(action, button);
      });
    });

    document.addEventListener('click', event => {
      if (confirmDialog.contains(event.target)) return;
      if (!panel.hidden && !menu.contains(event.target)) closeSettings();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !panel.hidden && !confirmDialog.open) closeSettings(true);
    });
    confirmDialog.querySelectorAll('[data-settings-confirm-close]').forEach(button => {
      button.addEventListener('click', () => confirmDialog.close());
    });
    confirmDialog.addEventListener('click', event => {
      if (event.target !== confirmDialog) return;
      const bounds = confirmDialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right ||
          event.clientY < bounds.top || event.clientY > bounds.bottom) confirmDialog.close();
    });
    confirmDialog.addEventListener('close', () => {
      document.body.classList.remove('modal-open');
      pendingAction = null;
      actionTrigger?.focus();
      actionTrigger = null;
    });
    confirmAction.addEventListener('click', runConfirmedAction);
    window.addEventListener('akd-languagechange', syncToggles);
    syncToggles();
  }

  function initThemeControl() {
    const control = document.getElementById('theme-control');
    if (!control) return;

    const buttons = Array.from(control.querySelectorAll('[data-theme-mode]'));

    function syncButtons() {
      const activeMode = resolvedTheme(activeThemeMode());

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
      syncButtons();
    });

    syncButtons();
    requestAnimationFrame(() => control.classList.add('is-ready'));
  }

  function initContactForm() {
    const form = document.getElementById('contact-form');
    const submit = form.querySelector('[type="submit"]');
    const status = document.getElementById('contact-status');
    const captchaLoad = document.getElementById('contact-captcha-load');
    const dialog = document.getElementById('contact-dialog');
    const captchaPanel = document.getElementById('contact-captcha-panel');
    const verifiedLabel = document.getElementById('contact-captcha-verified');
    let widget = null;
    let verified = false;
    let loading = false;
    let busy = false;
    let nextAttempt = 0;
    const t = text => window.AKDI18n?.t(text) || text;
    function report(message, kind = 'info') {
      status.textContent = t(message);
      status.dataset.kind = kind;
      status.hidden = false;
    }
    function setVerified(value) {
      verified = value;
      verifiedLabel.hidden = !value;
      captchaPanel.classList.toggle('is-verified', value);
      submit.disabled = busy || !value;
      captchaLoad.disabled = busy || loading || value;
      captchaLoad.textContent = t(value ? 'Проверка пройдена' : 'Пройти капчу');
    }
    // Style only the provider's outer portal; do not move or modify its iframe.
    // This also handles hCaptcha recreating its challenge after a reset/reopen.
    function syncCaptchaLayer() {
      document.querySelectorAll('iframe[src]').forEach(frame => {
        const url = new URL(frame.src, location.href);
        if (!(url.hostname === 'hcaptcha.com' || url.hostname.endsWith('.hcaptcha.com')) ||
            !url.hash.includes('frame=challenge') || dialog.contains(frame)) return;
        let portal = frame;
        while (portal.parentElement && portal.parentElement !== document.body) portal = portal.parentElement;
        if (portal.parentElement === document.body) {
          portal.classList.add('contact-captcha-portal');
          if (dialog.open) portal.inert = false;
        }
      });
    }
    const portalObserver = new MutationObserver(syncCaptchaLayer);
    const fields = ['name', 'email', 'subject', 'message'].map(name => form.elements.namedItem(name));
    function validateField(field) {
      let message = '';
      if (!field.value.trim()) message = 'Заполните это поле.';
      else if (field.validity.typeMismatch) message = 'Укажите корректный email.';
      else if (field.value.length > field.maxLength) message = 'Сократите текст до допустимой длины.';
      else if (field.name !== 'message' && /[\r\n]/.test(field.value)) message = 'Уберите переносы строк.';
      const error = document.getElementById(field.id + '-error');
      error.textContent = t(message);
      error.hidden = !message;
      field.setAttribute('aria-invalid', String(Boolean(message)));
      return !message;
    }
    fields.forEach(field => {
      let edited = false;
      const error = document.createElement('small');
      error.id = field.id + '-error';
      error.className = 'contact-field-error';
      error.hidden = true;
      field.parentElement.appendChild(error);
      field.setAttribute('aria-describedby', [field.getAttribute('aria-describedby'), error.id].filter(Boolean).join(' '));
      field.addEventListener('blur', () => {
        if (edited || field.value) validateField(field);
      });
      field.addEventListener('input', () => {
        edited = true;
        if (field.getAttribute('aria-invalid') === 'true') validateField(field);
      });
    });
    dialog.addEventListener('close', () => {
      if (dialog.dataset.captchaChallenge === 'true' && widget !== null) {
        window.hcaptcha?.reset(widget);
        setVerified(false);
      }
      dialog.dataset.captchaChallenge = 'false';
    });
    // Load the third-party CAPTCHA only after an explicit action in this dialog.
    captchaLoad.addEventListener('click', () => {
      if (loading || busy || verified) return;
      if (widget !== null) {
        document.getElementById('contact-captcha').scrollIntoView({ block: 'nearest' });
        document.querySelector('#contact-captcha iframe')?.focus();
        report('Отметьте «Я человек» в блоке проверки.');
        return;
      }
      loading = true;
      captchaPanel.hidden = false;
      portalObserver.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });
      captchaLoad.disabled = true;
      report('Загрузка проверки от спама…');
      const script = document.createElement('script');
      let timer;
      function failed() {
        clearTimeout(timer);
        loading = false;
        captchaLoad.disabled = false;
        script.remove();
        report('Не удалось загрузить проверку. Проверьте соединение и попробуйте ещё раз.');
      }
      window.akdContactCaptchaReady = () => {
        clearTimeout(timer);
        if (widget !== null) return;
        try {
          widget = window.hcaptcha.render('contact-captcha', {
            // Public hCaptcha sitekey provided by Web3Forms for its free integration.
            sitekey: '50b2fe65-b00b-4b9e-ad62-3ba471098be2',
            size: document.getElementById('contact-captcha').clientWidth >= 303 ? 'normal' : 'compact',
            theme: document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light',
            callback: () => { dialog.dataset.captchaChallenge = 'false'; setVerified(true); status.hidden = true; },
            'open-callback': () => { dialog.dataset.captchaChallenge = 'true'; syncCaptchaLayer(); },
            'close-callback': () => { dialog.dataset.captchaChallenge = 'false'; },
            'chalexpired-callback': () => { dialog.dataset.captchaChallenge = 'false'; },
            'expired-callback': () => { setVerified(false); report('Пройдите проверку от спама ещё раз.'); },
            'error-callback': () => {
              dialog.dataset.captchaChallenge = 'false';
              setVerified(false);
              report('Не удалось выполнить проверку от спама. Попробуйте ещё раз.');
            }
          });
          loading = false;
          setVerified(false);
          syncCaptchaLayer();
          status.hidden = true;
        } catch { failed(); }
      };
      script.src = 'https://js.hcaptcha.com/1/api.js?onload=akdContactCaptchaReady&render=explicit&recaptchacompat=off';
      script.async = true;
      script.onerror = failed;
      timer = setTimeout(failed, 20000);
      document.head.appendChild(script);
    });
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (busy) return;
      if (Date.now() < nextAttempt) {
        report('Подождите немного перед повторной отправкой.');
        return;
      }
      for (const name of ['name', 'email', 'subject', 'message']) {
        const field = form.elements.namedItem(name);
        field.value = field.value.trim();
      }
      const valid = fields.map(validateField);
      if (valid.includes(false)) {
        fields[valid.indexOf(false)].focus();
        return;
      }
      const categories = { question: 'Вопрос', bug: 'Ошибка', suggestion: 'Предложение', other: 'Другое' };
      const category = categories[form.elements.category.value];
      if (!category) return;
      const token = widget !== null ? window.hcaptcha?.getResponse(widget) : '';
      if (!token) {
        setVerified(false);
        report('Пройдите проверку от спама перед отправкой.');
        return;
      }
      if (!navigator.onLine) {
        report('Нет подключения к интернету. Сообщение не отправлено.');
        return;
      }
      // Allowlisted fields only; never include images, page state, or arbitrary form fields.
      const payload = {
        // Web3Forms intentionally uses a PUBLIC form key, not a server credential.
        access_key: '65fae9af-d241-4b1a-8d17-1e63d784b6c7',
        from_name: 'AKD Image',
        name: form.elements.name.value,
        email: form.elements.email.value,
        subject: '[AKD Image] ' + form.elements.subject.value.replace(/[\r\n]/g, ' '),
        category: t(category),
        message: form.elements.message.value,
        'h-captcha-response': token
      };
      if (payload.name.length > 100 || payload.email.length > 254 ||
          payload.subject.length > 212 || payload.message.length > 5000 ||
          /[\r\n]/.test(payload.name + payload.email)) return;
      busy = true;
      const controls = [...form.querySelectorAll('input, select, textarea, button')];
      const previousDisabled = controls.map(control => control.disabled);
      controls.forEach(control => { control.disabled = true; });
      form.setAttribute('aria-busy', 'true');
      submit.textContent = t('Отправляется…');
      report('Отправляется…');
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      try {
        const response = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload),
          credentials: 'omit',
          cache: 'no-store',
          referrerPolicy: 'strict-origin-when-cross-origin',
          signal: controller.signal
        });
        const result = await response.json();
        if (!response.ok || result.success !== true) throw new Error('submission-rejected');
        // Clear only after confirmed acceptance. No message data is stored or logged.
        for (const name of ['name', 'email', 'subject', 'message']) form.elements.namedItem(name).value = '';
        report('Сообщение отправлено. Спасибо за обращение!', 'success');
        nextAttempt = Date.now() + 30000;
      } catch {
        // Never render provider-controlled HTML or claim delivery after a network error.
        report('Не удалось подтвердить отправку. Текст сохранён в форме. Проверьте соединение перед повторной попыткой.', 'error');
        nextAttempt = Date.now() + 5000;
      } finally {
        clearTimeout(timeout);
        try { window.hcaptcha?.reset(widget); } catch { /* A new check is still required. */ }
        controls.forEach((control, index) => { control.disabled = previousDisabled[index]; });
        busy = false;
        setVerified(false);
        form.removeAttribute('aria-busy');
        submit.textContent = t('Отправить сообщение');
      }
    });
  }

  function initLanguageControl() {
    const control = document.querySelector('.language-control');
    const trigger = control?.querySelector('.language-trigger');
    const currentLabel = control?.querySelector('.language-current');
    const buttons = Array.from(control?.querySelectorAll('.language-option[data-language]') || []);
    if (!control || !trigger || !currentLabel || !buttons.length || !window.AKDI18n) return;

    const languageNames = { en: 'English', es: 'Español', ru: 'Русский' };

    function setOpen(isOpen) {
      control.classList.toggle('is-open', isOpen);
      trigger.setAttribute('aria-expanded', String(isOpen));
    }

    function syncButtons() {
      currentLabel.textContent = languageNames[window.AKDI18n.language] || 'English';
      buttons.forEach(button => {
        const isActive = button.dataset.language === window.AKDI18n.language;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-checked', String(isActive));
      });
    }

    trigger.addEventListener('click', () => {
      setOpen(!control.classList.contains('is-open'));
    });

    buttons.forEach(button => {
      button.addEventListener('click', () => {
        window.AKDI18n.setLanguage(button.dataset.language);
        syncButtons();
        setOpen(false);
        trigger.focus();
      });
    });

    document.addEventListener('click', event => {
      if (!control.contains(event.target)) setOpen(false);
    });

    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || !control.classList.contains('is-open')) return;
      setOpen(false);
      trigger.focus();
    });

    window.addEventListener('akd-languagechange', syncButtons);

    syncButtons();
  }

  function loadPwaController() {
    if (document.querySelector('script[data-pwa-controller]')) return;
    const script = document.createElement('script');
    script.src = '/js/pwa.js?v=3.3.0';
    script.defer = true;
    script.dataset.pwaController = '';
    document.body.appendChild(script);
  }

  function initToolModeIndicators() {
    document.querySelectorAll('.base64-tabs').forEach(group => {
      const sync = () => {
        const selected = group.querySelector('.base64-tab[aria-selected="true"]');
        if (!selected) return;
        group.style.setProperty('--mode-x', selected.offsetLeft + 'px');
        group.style.setProperty('--mode-y', selected.offsetTop + 'px');
        group.style.setProperty('--mode-width', selected.offsetWidth + 'px');
        group.style.setProperty('--mode-height', selected.offsetHeight + 'px');
        group.classList.add('has-mode-indicator');
      };
      sync();
      requestAnimationFrame(() => group.classList.add('mode-motion-ready'));
      new MutationObserver(sync).observe(group, {
        subtree: true, attributes: true, attributeFilter: ['aria-selected']
      });
      const resize = new ResizeObserver(sync);
      resize.observe(group);
      group.querySelectorAll('.base64-tab').forEach(button => resize.observe(button));
      document.fonts?.ready.then(sync);
      window.addEventListener('akd-languagechange', () => requestAnimationFrame(sync));
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.body.insertAdjacentHTML('afterbegin', headerHTML);
    document.body.insertAdjacentHTML('beforeend', footerHTML);
    document.body.insertAdjacentHTML('beforeend', toastContainer);
    document.body.insertAdjacentHTML('beforeend', contactHTML);
    document.body.insertAdjacentHTML('beforeend', supportHTML);
    document.body.insertAdjacentHTML('beforeend', websiteHTML);
    document.body.insertAdjacentHTML('beforeend', settingsConfirmHTML);

    initThemeControl();
    initSettingsMenu();
    initToolModeIndicators();
    initLanguageControl();
    initFooterDialog('contact-dialog', '[data-contact-open]', '[data-contact-close]');
    initContactForm();
    initFooterDialog('support-dialog', '[data-support-open]', '[data-support-close]');
    initFooterDialog('website-dialog', '[data-website-open]', '[data-website-close]');
    loadPwaController();

    if (isLocalStaticHost) {
      document.querySelectorAll('a[href^="/"]').forEach(link => {
        const href = link.getAttribute('href');
        if (localRoutes[href]) link.setAttribute('href', localRoutes[href]);
      });
    }

  });
})();
