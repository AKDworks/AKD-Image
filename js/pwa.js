/* PWA installation, updates and platform guidance */
(function () {
  const installAvailableStorageKey = 'akd-image-pwa-install-available';
  const installButtons = Array.from(document.querySelectorAll('[data-pwa-install]'));
  const installDivider = document.querySelector('[data-pwa-install-divider]');
  const infoButtons = Array.from(document.querySelectorAll('[data-pwa-install-info]'));
  let deferredInstallPrompt = null;
  let activeModal = null;
  let lastFocusedElement = null;
  let refreshing = false;
  let updateReloadTimer = null;

  function t(value) {
    return window.AKDI18n?.t(value) || value;
  }

  function isStandalone() {
    return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
  }

  function isIOS() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  function isDesktopSafari() {
    return /^((?!chrome|android|crios|edg).)*safari/i.test(navigator.userAgent) && !isIOS();
  }

  function isDesktopFirefox() {
    return /firefox/i.test(navigator.userAgent) && !/android/i.test(navigator.userAgent);
  }

  function rememberedInstallAvailability() {
    try {
      return sessionStorage.getItem(installAvailableStorageKey) === 'true';
    } catch {
      return false;
    }
  }

  function rememberInstallAvailability(available) {
    try {
      if (available) sessionStorage.setItem(installAvailableStorageKey, 'true');
      else sessionStorage.removeItem(installAvailableStorageKey);
    } catch {
      /* Installation still works when session storage is unavailable. */
    }
  }

  function syncInstallControls() {
    const installed = isStandalone();
    const canOfferFromHeader = Boolean(deferredInstallPrompt) || rememberedInstallAvailability() ||
      isIOS() || isDesktopSafari();

    installButtons.forEach(button => {
      button.classList.toggle('hidden', installed || !canOfferFromHeader);
    });
    installDivider?.classList.toggle('hidden', installed || !canOfferFromHeader);

    infoButtons.forEach(button => {
      const label = t(installed ? 'Как удалить AKD Image' : 'Установить приложение');
      button.textContent = label;
      button.setAttribute('aria-label', label);
    });

  }

  function platformInstruction() {
    if (isIOS()) {
      return 'Откройте меню «Поделиться», выберите «На экран „Домой“», включите «Открывать как веб-приложение» и нажмите «Добавить».';
    }
    if (isDesktopSafari()) {
      return 'В Safari откройте меню «Файл» и выберите «Добавить в Dock».';
    }
    if (isDesktopFirefox()) {
      return 'Firefox на компьютере не поддерживает установку сайта как приложения. Откройте AKD Image в Chrome, Edge или Safari.';
    }
    return 'Откройте меню браузера и выберите «Установить приложение» или «Добавить на главный экран».';
  }

  function removalInstruction() {
    if (isIOS()) {
      return 'Нажмите и удерживайте значок AKD Image на экране «Домой», выберите «Удалить приложение» и подтвердите удаление.';
    }
    if (isDesktopSafari()) {
      return 'Откройте Finder, перейдите в «Программы», найдите AKD Image и переместите приложение в Корзину.';
    }
    if (/android/i.test(navigator.userAgent)) {
      return 'Нажмите и удерживайте значок AKD Image, выберите «Удалить» и подтвердите удаление приложения.';
    }
    return 'В окне AKD Image откройте меню приложения и выберите «Удалить AKD Image» или «Удалить приложение».';
  }

  function closeInstallModal() {
    if (!activeModal) return;
    activeModal.remove();
    activeModal = null;
    document.body.classList.remove('modal-open');
    lastFocusedElement?.focus?.();
    lastFocusedElement = null;
  }

  function trapFocus(event) {
    if (!activeModal || event.key !== 'Tab') return;
    const focusable = Array.from(activeModal.querySelectorAll(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter(element => !element.classList.contains('hidden'));
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function showPlatformInstructions(modal, shouldFocus = false) {
    const instructions = modal.querySelector('[data-pwa-instructions]');
    const confirmButton = modal.querySelector('[data-pwa-confirm]');
    instructions.textContent = platformInstruction();
    instructions.classList.remove('hidden');
    confirmButton.textContent = t('Понятно');
    confirmButton.dataset.closeOnly = 'true';
    if (shouldFocus) instructions.focus();
  }

  async function confirmInstallation(modal) {
    const confirmButton = modal.querySelector('[data-pwa-confirm]');
    if (confirmButton.dataset.closeOnly === 'true') {
      closeInstallModal();
      return;
    }

    if (!deferredInstallPrompt) {
      showPlatformInstructions(modal, true);
      return;
    }

    const promptEvent = deferredInstallPrompt;
    deferredInstallPrompt = null;
    closeInstallModal();
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome !== 'accepted') syncInstallControls();
  }

  function openInstallModal(event) {
    if (isStandalone()) return;
    closeInstallModal();
    lastFocusedElement = event?.currentTarget || document.activeElement;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay pwa-install-overlay';
    overlay.innerHTML = `
      <section class="modal pwa-install-modal" role="dialog" aria-modal="true" aria-labelledby="pwa-install-title">
        <div class="modal__head">
          <div class="pwa-install-modal__title-wrap">
            <img src="/assets/icons/favicon.svg?v=3.3.0" alt="" aria-hidden="true">
            <h3 id="pwa-install-title">Установить AKD Image</h3>
          </div>
          <button class="modal__close" type="button" data-pwa-close aria-label="Закрыть">×</button>
        </div>
        <div class="modal__body pwa-install-modal__body">
          <p class="pwa-install-modal__lead">AKD Image можно установить на компьютер или телефон и запускать как отдельное приложение.</p>
          <div class="pwa-install-summary">
            <section class="pwa-install-summary__section">
              <h4>
                <svg viewBox="0 -960 960 960" aria-hidden="true"><path fill="currentColor" d="m424-296 282-282-56-56-226 226-114-114-56 56 170 170Zm56 216q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>
                Будет доступно
              </h4>
              <ul>
                <li>Локальная обработка изображений</li>
                <li>Основные инструменты без интернета</li>
                <li>Быстрый запуск с рабочего стола</li>
                <li>Автоматические обновления</li>
              </ul>
            </section>
            <section class="pwa-install-summary__section">
              <h4>
                <svg viewBox="0 -960 960 960" aria-hidden="true"><path fill="currentColor" d="M440-280h80v-240h-80v240Zm68.5-331.5Q520-623 520-640t-11.5-28.5Q497-680 480-680t-28.5 11.5Q440-657 440-640t11.5 28.5Q463-600 480-600t28.5-11.5ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>
                Потребуется интернет
              </h4>
              <ul>
                <li>Dropbox и другие облачные источники</li>
                <li>Первая загрузка ИИ-компонентов</li>
                <li>Получение обновлений приложения</li>
              </ul>
            </section>
          </div>
          <p class="pwa-install-instructions hidden" data-pwa-instructions tabindex="-1"></p>
          <div class="pwa-install-modal__actions pwa-install-modal__actions--end">
            <div class="pwa-install-modal__primary-actions">
              <button class="btn btn-secondary" type="button" data-pwa-close>Не сейчас</button>
              <button class="btn btn-primary" type="button" data-pwa-confirm>${deferredInstallPrompt ? 'Установить' : 'Как установить'}</button>
            </div>
          </div>
        </div>
      </section>
    `;

    activeModal = overlay;
    document.body.appendChild(overlay);
    document.body.classList.add('modal-open');

    overlay.querySelectorAll('[data-pwa-close]').forEach(button => {
      button.addEventListener('click', closeInstallModal);
    });
    overlay.querySelector('[data-pwa-confirm]').addEventListener('click', () => confirmInstallation(overlay));
    overlay.addEventListener('click', modalEvent => {
      if (modalEvent.target === overlay) closeInstallModal();
    });
    overlay.addEventListener('keydown', trapFocus);
    if (isIOS() || isDesktopSafari()) showPlatformInstructions(overlay);
    overlay.querySelector('[data-pwa-close]').focus();
  }

  function openRemovalModal(event) {
    if (!isStandalone()) return;
    closeInstallModal();
    lastFocusedElement = event?.currentTarget || document.activeElement;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay pwa-install-overlay';
    overlay.innerHTML = `
      <section class="modal pwa-install-modal" role="dialog" aria-modal="true" aria-labelledby="pwa-remove-title">
        <div class="modal__head">
          <div class="pwa-install-modal__title-wrap">
            <img src="/assets/icons/favicon.svg?v=3.3.0" alt="" aria-hidden="true">
            <h3 id="pwa-remove-title">${t('Удалить AKD Image')}</h3>
          </div>
          <button class="modal__close" type="button" data-pwa-close aria-label="${t('Закрыть')}">×</button>
        </div>
        <div class="modal__body pwa-install-modal__body">
          <p class="pwa-install-modal__lead">${t('Браузер не разрешает сайту удалять установленное приложение автоматически.')}</p>
          <p class="pwa-remove-instructions">${t(removalInstruction())}</p>
          <div class="pwa-install-modal__actions pwa-install-modal__actions--end">
            <button class="btn btn-secondary" type="button" data-pwa-close>${t('Понятно')}</button>
          </div>
        </div>
      </section>
    `;

    activeModal = overlay;
    document.body.appendChild(overlay);
    document.body.classList.add('modal-open');
    overlay.querySelectorAll('[data-pwa-close]').forEach(button => {
      button.addEventListener('click', closeInstallModal);
    });
    overlay.addEventListener('click', modalEvent => {
      if (modalEvent.target === overlay) closeInstallModal();
    });
    overlay.addEventListener('keydown', trapFocus);
    overlay.querySelector('[data-pwa-close]').focus();
  }

  function openUpdateProgressModal(trigger) {
    closeInstallModal();
    lastFocusedElement = trigger || document.activeElement;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay pwa-install-overlay';
    overlay.innerHTML = `
      <section class="modal pwa-install-modal pwa-update-modal" role="dialog" aria-modal="true" aria-labelledby="pwa-update-title" tabindex="-1" data-pwa-update-modal>
        <div class="modal__head">
          <div class="pwa-install-modal__title-wrap">
            <img src="/assets/icons/favicon.svg?v=3.3.0" alt="" aria-hidden="true">
            <h3 id="pwa-update-title">${t('Обновление AKD Image')}</h3>
          </div>
        </div>
        <div class="modal__body pwa-update-modal__body" aria-live="polite">
          <div class="pwa-update-modal__status">
            <span class="pwa-update-modal__status-icon" aria-hidden="true">
              <span class="spinner"></span>
              <svg viewBox="0 -960 960 960"><path fill="currentColor" d="m424-296 282-282-56-56-226 226-114-114-56 56 170 170Z"/></svg>
            </span>
            <div>
              <h4 data-pwa-update-status>${t('Устанавливаем обновление')}</h4>
              <p data-pwa-update-description>${t('Новая версия уже загружена. Сейчас приложение применит её и автоматически перезапустится.')}</p>
            </div>
          </div>
          <div class="pwa-update-progress" role="progressbar" aria-label="${t('Установка обновления')}" aria-busy="true">
            <span></span>
          </div>
        </div>
      </section>
    `;

    activeModal = overlay;
    document.body.appendChild(overlay);
    document.body.classList.add('modal-open');
    overlay.querySelector('[data-pwa-update-modal]').focus();
  }

  function finishUpdateAndReload() {
    if (!refreshing) return;
    refreshing = false;
    window.clearTimeout(updateReloadTimer);
    updateReloadTimer = null;

    const modal = document.querySelector('[data-pwa-update-modal]');
    if (modal) {
      modal.classList.add('is-complete');
      modal.querySelector('[data-pwa-update-status]').textContent = t('Обновление установлено');
      modal.querySelector('[data-pwa-update-description]').textContent = t('Перезапускаем AKD Image…');
      const progress = modal.querySelector('.pwa-update-progress');
      progress.setAttribute('aria-busy', 'false');
      progress.setAttribute('aria-valuenow', '100');
    }

    window.setTimeout(() => window.location.reload(), modal ? 700 : 0);
  }

  function startUpdate(registration, waitingWorker, trigger) {
    const worker = waitingWorker || registration.waiting;
    document.querySelector('[data-pwa-update-toast]')?.remove();
    openUpdateProgressModal(trigger);
    refreshing = true;

    if (worker) {
      worker.addEventListener('statechange', () => {
        if (worker.state === 'activated') finishUpdateAndReload();
      });
      worker.postMessage({ type: 'SKIP_WAITING' });
    } else {
      registration.update().catch(() => {});
    }

    updateReloadTimer = window.setTimeout(() => {
      if (refreshing) window.location.reload();
    }, 12000);
  }

  function showUpdateToast(registration, waitingWorker = registration.waiting) {
    if (!isStandalone()) return;
    if (document.querySelector('[data-pwa-update-toast]')) return;
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast pwa-update-toast';
    toast.dataset.pwaUpdateToast = '';
    toast.innerHTML = `
      <span>Доступно обновление AKD Image.</span>
      <button type="button">Обновить</button>
    `;
    toast.querySelector('button').addEventListener('click', event => {
      startUpdate(registration, waitingWorker, event.currentTarget);
    });
    container.appendChild(toast);
  }

  function handleAvailableUpdate(registration, waitingWorker = registration.waiting) {
    if (isStandalone()) {
      showUpdateToast(registration, waitingWorker);
      return;
    }
    if (!waitingWorker) return;
    refreshing = true;
    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    window.clearTimeout(updateReloadTimer);
    updateReloadTimer = window.setTimeout(() => window.location.reload(), 12000);
  }

  async function registerServiceWorker() {
    if (!('serviceWorker' in navigator) || !window.isSecureContext) return;

    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
        updateViaCache: 'none'
      });

      if (registration.waiting && navigator.serviceWorker.controller) {
        handleAvailableUpdate(registration, registration.waiting);
      }

      registration.addEventListener('updatefound', () => {
        const installing = registration.installing;
        if (!installing) return;
        installing.addEventListener('statechange', () => {
          if (installing.state === 'installed' && navigator.serviceWorker.controller) {
            handleAvailableUpdate(registration, registration.waiting || installing);
          }
        });
      });

      window.setTimeout(() => registration.update().catch(() => {}), 4000);
    } catch (error) {
      console.warn('Не удалось зарегистрировать офлайн-режим AKD Image.', error);
    }
  }

  installButtons.forEach(button => {
    button.addEventListener('click', openInstallModal);
  });

  infoButtons.forEach(button => {
    button.addEventListener('click', event => {
      if (isStandalone()) openRemovalModal(event);
      else openInstallModal(event);
    });
  });

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    rememberInstallAvailability(true);
    syncInstallControls();
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    rememberInstallAvailability(false);
    closeInstallModal();
    syncInstallControls();
  });

  window.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !activeModal?.querySelector('[data-pwa-update-modal]')) {
      closeInstallModal();
    }
  });

  navigator.serviceWorker?.addEventListener('controllerchange', () => {
    finishUpdateAndReload();
  });

  window.matchMedia?.('(display-mode: standalone)').addEventListener('change', syncInstallControls);
  window.addEventListener('akd-languagechange', syncInstallControls);
  syncInstallControls();

  // Preserve old installation links without keeping a separate app page.
  const entryUrl = new URL(location.href);
  if (entryUrl.searchParams.get('install') === '1') {
    if (isStandalone()) openRemovalModal();
    else openInstallModal();
    entryUrl.searchParams.delete('install');
    history.replaceState(history.state, '', entryUrl.pathname + entryUrl.search + entryUrl.hash);
  }

  if (document.readyState === 'complete') registerServiceWorker();
  else window.addEventListener('load', registerServiceWorker, { once: true });
})();
