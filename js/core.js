/* Toasts */
const Toast = (() => {
  let container = null;

  function getContainer() {
    if (!container) {
      container = document.getElementById('toast-container');
      if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        container.id = 'toast-container';
        document.body.appendChild(container);
      }
    }
    return container;
  }

  function show(msg, type = '', duration = 3500) {
    const el = document.createElement('div');
    el.className = 'toast' + (type ? ' toast-' + type : '');
    el.textContent = msg;
    const c = getContainer();
    c.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transition = 'opacity .3s';
      setTimeout(() => el.remove(), 300);
    }, duration);
  }

  return {
    info:    (m, d) => show(m, '',        d),
    success: (m, d) => show(m, 'success', d),
    error:   (m, d) => show(m, 'error',   d),
  };
})();


/* Custom selects */
const CustomSelect = (() => {
  const instances = new Map();
  let openInstance = null;

  function enhance(select) {
    if (!select || instances.has(select)) return instances.get(select);

    const wrapper = document.createElement('div');
    wrapper.className = 'custom-select';
    select.parentNode.insertBefore(wrapper, select);
    wrapper.appendChild(select);
    select.classList.add('custom-select__native');
    select.tabIndex = -1;

    const trigger = document.createElement('button');
    trigger.className = 'custom-select__trigger';
    trigger.type = 'button';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.innerHTML = '<span class="custom-select__value"></span><svg class="custom-select__chevron" viewBox="0 0 20 20" aria-hidden="true"><path d="m6 8 4 4 4-4"/></svg>';

    const label = select.labels?.[0] || select.closest('.form-group')?.querySelector('label');

    const menu = document.createElement('div');
    menu.className = 'custom-select__menu';
    menu.setAttribute('role', 'listbox');
    menu.hidden = true;
    wrapper.append(trigger, menu);

    const instance = { select, wrapper, trigger, menu, options: [] };
    instances.set(select, instance);

    function rebuild() {
      menu.innerHTML = '';
      instance.options = Array.from(select.options).map((option, index) => {
        const button = document.createElement('button');
        button.className = 'custom-select__option';
        button.type = 'button';
        button.setAttribute('role', 'option');
        button.dataset.value = option.value;
        button.innerHTML = `<span>${option.textContent}</span><svg class="custom-select__check" viewBox="0 0 24 24" aria-hidden="true"><path d="m9.55 18-5.7-5.7 1.4-1.4 4.3 4.3 9.2-9.2 1.4 1.4L9.55 18Z" fill="currentColor"/></svg>`;
        button.disabled = option.disabled;
        button.addEventListener('click', () => {
          if (select.value !== option.value) {
            select.value = option.value;
            select.dispatchEvent(new Event('input', { bubbles: true }));
            select.dispatchEvent(new Event('change', { bubbles: true }));
          }
          sync();
          close(true);
        });
        button.addEventListener('keydown', event => handleOptionKeydown(event, index));
        menu.appendChild(button);
        return button;
      });
      sync();
    }

    function sync() {
      const selected = select.selectedOptions[0] || select.options[0];
      trigger.querySelector('.custom-select__value').textContent = selected ? selected.textContent : '';
      trigger.setAttribute('aria-label', label
        ? `${label.textContent.trim()}: ${selected?.textContent || ''}`
        : selected?.textContent || 'Выбрать формат');
      trigger.disabled = select.disabled;
      trigger.title = select.title;
      instance.options.forEach((button, index) => {
        const isSelected = select.options[index]?.selected;
        button.classList.toggle('is-selected', Boolean(isSelected));
        button.setAttribute('aria-selected', String(Boolean(isSelected)));
        button.disabled = Boolean(select.options[index]?.disabled);
      });
      if (select.disabled) close();
    }

    function open() {
      if (select.disabled || !menu.hidden) return;
      if (openInstance && openInstance !== instance) openInstance.close();
      menu.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      wrapper.classList.add('is-open');
      wrapper.classList.remove('is-upwards');
      const menuHeight = Math.min(menu.scrollHeight, 280) + 8;
      const triggerRect = trigger.getBoundingClientRect();
      const spaceBelow = window.innerHeight - triggerRect.bottom;
      wrapper.classList.toggle('is-upwards', spaceBelow < menuHeight && triggerRect.top > spaceBelow);
      openInstance = instance;
      instance.options[select.selectedIndex]?.scrollIntoView({ block: 'nearest' });
    }

    function close(returnFocus = false) {
      if (menu.hidden) return;
      menu.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
      wrapper.classList.remove('is-open', 'is-upwards');
      if (openInstance === instance) openInstance = null;
      if (returnFocus) trigger.focus();
    }

    function focusOption(index) {
      const available = instance.options.filter(option => !option.disabled);
      if (!available.length) return;
      const current = available.indexOf(instance.options[index]);
      available[Math.max(0, current)]?.focus();
    }

    function handleOptionKeydown(event, index) {
      if (!['ArrowDown', 'ArrowUp', 'Home', 'End', 'Escape'].includes(event.key)) return;
      event.preventDefault();
      if (event.key === 'Escape') return close(true);
      const available = instance.options.filter(option => !option.disabled);
      const current = available.indexOf(instance.options[index]);
      const next = event.key === 'Home' ? 0
        : event.key === 'End' ? available.length - 1
        : (current + (event.key === 'ArrowDown' ? 1 : -1) + available.length) % available.length;
      available[next]?.focus();
    }

    trigger.addEventListener('click', () => menu.hidden ? open() : close());
    trigger.addEventListener('keydown', event => {
      if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      open();
      const selectedIndex = Math.max(0, select.selectedIndex);
      requestAnimationFrame(() => focusOption(selectedIndex));
    });
    select.addEventListener('change', sync);
    select.addEventListener('ui-sync', sync);
    select.form?.addEventListener('reset', () => setTimeout(sync));
    new MutationObserver(sync).observe(select, { attributes: true, childList: true, subtree: true });

    instance.close = close;
    instance.sync = sync;
    rebuild();
    return instance;
  }

  function init(root = document) {
    root.querySelectorAll('select[data-custom-select="format"]').forEach(enhance);
  }

  document.addEventListener('click', event => {
    if (openInstance && !openInstance.wrapper.contains(event.target)) openInstance.close();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && openInstance) openInstance.close(true);
  });

  return { init, enhance, sync: select => instances.get(select)?.sync() };
})();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => CustomSelect.init());
} else {
  CustomSelect.init();
}

/* Custom color pickers */
const CustomColorPicker = (() => {
  const instances = new Map();
  let openInstance = null;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function normalizeHex(value) {
    const raw = String(value || '').trim().replace(/^#/, '');
    if (/^[0-9a-f]{3}$/i.test(raw)) {
      return `#${raw.split('').map(char => char + char).join('').toUpperCase()}`;
    }
    return /^[0-9a-f]{6}$/i.test(raw) ? `#${raw.toUpperCase()}` : null;
  }

  function hexToRgb(hex) {
    const normalized = normalizeHex(hex) || '#000000';
    const value = Number.parseInt(normalized.slice(1), 16);
    return {
      r: (value >> 16) & 255,
      g: (value >> 8) & 255,
      b: value & 255,
    };
  }

  function rgbToHex(r, g, b) {
    return `#${[r, g, b]
      .map(value => clamp(Math.round(value), 0, 255).toString(16).padStart(2, '0'))
      .join('')}`.toUpperCase();
  }

  function rgbToHsv(r, g, b) {
    const red = r / 255;
    const green = g / 255;
    const blue = b / 255;
    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    const delta = max - min;
    let hue = 0;

    if (delta) {
      if (max === red) hue = 60 * (((green - blue) / delta) % 6);
      else if (max === green) hue = 60 * ((blue - red) / delta + 2);
      else hue = 60 * ((red - green) / delta + 4);
    }

    return {
      h: hue < 0 ? hue + 360 : hue,
      s: max ? (delta / max) * 100 : 0,
      v: max * 100,
    };
  }

  function hsvToRgb(h, s, v) {
    const saturation = clamp(s, 0, 100) / 100;
    const value = clamp(v, 0, 100) / 100;
    const chroma = value * saturation;
    const segment = ((h % 360) + 360) % 360 / 60;
    const second = chroma * (1 - Math.abs((segment % 2) - 1));
    const match = value - chroma;
    let red = 0;
    let green = 0;
    let blue = 0;

    if (segment < 1) [red, green] = [chroma, second];
    else if (segment < 2) [red, green] = [second, chroma];
    else if (segment < 3) [green, blue] = [chroma, second];
    else if (segment < 4) [green, blue] = [second, chroma];
    else if (segment < 5) [red, blue] = [second, chroma];
    else [red, blue] = [chroma, second];

    return {
      r: Math.round((red + match) * 255),
      g: Math.round((green + match) * 255),
      b: Math.round((blue + match) * 255),
    };
  }

  function enhance(input) {
    if (!input || instances.has(input)) return instances.get(input);

    const wrapper = document.createElement('div');
    wrapper.className = 'custom-color';
    input.parentNode.insertBefore(wrapper, input);
    wrapper.appendChild(input);
    input.classList.add('custom-color__native');
    input.tabIndex = -1;

    const trigger = document.createElement('button');
    trigger.className = 'custom-color__trigger';
    trigger.type = 'button';
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.innerHTML = `
      <span class="custom-color__swatch" aria-hidden="true"></span>
      <span class="custom-color__value"></span>
      <svg class="custom-color__chevron" viewBox="0 0 20 20" aria-hidden="true"><path d="m6 8 4 4 4-4"/></svg>`;

    const panel = document.createElement('div');
    panel.className = 'custom-color__panel';
    panel.hidden = true;
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Выбор цвета');
    panel.innerHTML = `
      <div class="custom-color__saturation" role="slider" tabindex="0" aria-label="Насыщенность и яркость" aria-valuemin="0" aria-valuemax="100">
        <span class="custom-color__cursor" aria-hidden="true"></span>
      </div>
      <label class="custom-color__hue-label">
        <span>Оттенок</span>
        <input class="custom-color__hue" type="range" min="0" max="359" step="1" aria-label="Оттенок">
      </label>
      <div class="custom-color__fields">
        <label class="custom-color__hex-field">
          <span>HEX</span>
          <input class="custom-color__hex" type="text" maxlength="7" spellcheck="false" autocomplete="off">
        </label>
        <label><span>R</span><input class="custom-color__rgb" data-channel="r" type="number" min="0" max="255"></label>
        <label><span>G</span><input class="custom-color__rgb" data-channel="g" type="number" min="0" max="255"></label>
        <label><span>B</span><input class="custom-color__rgb" data-channel="b" type="number" min="0" max="255"></label>
      </div>`;
    wrapper.append(trigger, panel);

    const label = input.labels?.[0] || input.closest('.form-group')?.querySelector('label');
    const swatch = trigger.querySelector('.custom-color__swatch');
    const valueLabel = trigger.querySelector('.custom-color__value');
    const saturation = panel.querySelector('.custom-color__saturation');
    const cursor = panel.querySelector('.custom-color__cursor');
    const hueInput = panel.querySelector('.custom-color__hue');
    const hexInput = panel.querySelector('.custom-color__hex');
    const rgbInputs = Object.fromEntries(
      Array.from(panel.querySelectorAll('.custom-color__rgb'))
        .map(field => [field.dataset.channel, field])
    );
    const initialRgb = hexToRgb(input.value);
    const initialHsv = rgbToHsv(initialRgb.r, initialRgb.g, initialRgb.b);
    const state = { ...initialHsv, updating: false };
    const instance = { input, wrapper, trigger, panel, close: null };
    instances.set(input, instance);

    function render(hex, rgb, preserveHex = false) {
      wrapper.style.setProperty('--picker-color', hex);
      wrapper.style.setProperty('--picker-hue', String(state.h));
      swatch.style.backgroundColor = hex;
      valueLabel.textContent = hex;
      if (!preserveHex) hexInput.value = hex;
      hueInput.value = String(Math.round(state.h));
      rgbInputs.r.value = String(rgb.r);
      rgbInputs.g.value = String(rgb.g);
      rgbInputs.b.value = String(rgb.b);
      cursor.style.left = `${state.s}%`;
      cursor.style.top = `${100 - state.v}%`;
      saturation.setAttribute('aria-valuetext', `Насыщенность ${Math.round(state.s)}%, яркость ${Math.round(state.v)}%`);
      trigger.setAttribute('aria-label', label
        ? `${label.textContent.trim()}: ${hex}`
        : `Цвет: ${hex}`);
    }

    function applyHsv({ notify = true, change = false, preserveHex = false } = {}) {
      const rgb = hsvToRgb(state.h, state.s, state.v);
      const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
      state.updating = true;
      input.value = hex;
      render(hex, rgb, preserveHex);
      if (notify) input.dispatchEvent(new Event('input', { bubbles: true }));
      if (change) input.dispatchEvent(new Event('change', { bubbles: true }));
      state.updating = false;
    }

    function applyHex(value, options = {}) {
      const hex = normalizeHex(value);
      if (!hex) return false;
      const rgb = hexToRgb(hex);
      const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
      state.h = hsv.h;
      state.s = hsv.s;
      state.v = hsv.v;
      applyHsv(options);
      return true;
    }

    function setSaturationFromPointer(event, change = false) {
      const rect = saturation.getBoundingClientRect();
      state.s = clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100);
      state.v = clamp(100 - ((event.clientY - rect.top) / rect.height) * 100, 0, 100);
      applyHsv({ change });
    }

    function open() {
      if (!panel.hidden) return;
      if (openInstance && openInstance !== instance) openInstance.close();
      panel.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      wrapper.classList.add('is-open');
      wrapper.classList.remove('is-upwards', 'is-align-right');
      const triggerRect = trigger.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();
      const spaceBelow = window.innerHeight - triggerRect.bottom;
      wrapper.classList.toggle('is-upwards', spaceBelow < panelRect.height + 12 && triggerRect.top > spaceBelow);
      wrapper.classList.toggle('is-align-right', triggerRect.left + panelRect.width > window.innerWidth - 16);
      openInstance = instance;
    }

    function close(returnFocus = false) {
      if (panel.hidden) return;
      panel.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
      wrapper.classList.remove('is-open', 'is-upwards', 'is-align-right');
      if (openInstance === instance) openInstance = null;
      if (returnFocus) trigger.focus();
    }

    trigger.addEventListener('click', () => panel.hidden ? open() : close());
    saturation.addEventListener('pointerdown', event => {
      event.preventDefault();
      saturation.setPointerCapture(event.pointerId);
      setSaturationFromPointer(event);
    });
    saturation.addEventListener('pointermove', event => {
      if (saturation.hasPointerCapture(event.pointerId)) setSaturationFromPointer(event);
    });
    saturation.addEventListener('pointerup', event => {
      if (!saturation.hasPointerCapture(event.pointerId)) return;
      setSaturationFromPointer(event, true);
      saturation.releasePointerCapture(event.pointerId);
    });
    saturation.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
      event.preventDefault();
      if (event.key === 'ArrowLeft') state.s = clamp(state.s - 1, 0, 100);
      if (event.key === 'ArrowRight') state.s = clamp(state.s + 1, 0, 100);
      if (event.key === 'ArrowUp') state.v = clamp(state.v + 1, 0, 100);
      if (event.key === 'ArrowDown') state.v = clamp(state.v - 1, 0, 100);
      applyHsv({ change: true });
    });
    hueInput.addEventListener('input', () => {
      state.h = Number(hueInput.value);
      applyHsv();
    });
    hueInput.addEventListener('change', () => applyHsv({ change: true }));
    hexInput.addEventListener('change', () => {
      if (!applyHex(hexInput.value, { change: true })) hexInput.value = input.value.toUpperCase();
    });
    hexInput.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        hexInput.blur();
      }
    });
    Object.values(rgbInputs).forEach(field => {
      field.addEventListener('change', () => {
        const rgb = {
          r: clamp(Number(rgbInputs.r.value) || 0, 0, 255),
          g: clamp(Number(rgbInputs.g.value) || 0, 0, 255),
          b: clamp(Number(rgbInputs.b.value) || 0, 0, 255),
        };
        applyHex(rgbToHex(rgb.r, rgb.g, rgb.b), { change: true });
      });
    });
    input.addEventListener('input', () => {
      if (!state.updating) applyHex(input.value, { notify: false });
    });

    instance.close = close;
    applyHex(input.value, { notify: false });
    return instance;
  }

  function init(root = document) {
    root.querySelectorAll('input[type="color"].color-input').forEach(enhance);
  }

  document.addEventListener('click', event => {
    if (openInstance && !openInstance.wrapper.contains(event.target)) openInstance.close();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && openInstance) openInstance.close(true);
  });

  return { init, enhance };
})();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => CustomColorPicker.init());
} else {
  CustomColorPicker.init();
}

/* UI */
const UIUtils = {
  setDisabled(elements, disabled) {
    elements.forEach(el => {
      if (el) el.disabled = disabled;
    });
  },

  setBatchLocked(manager, elements, locked) {
    const pickerButtons = manager
      ? Array.from((manager.container.closest('main') || document)
        .querySelectorAll('[data-open-file-picker]'))
      : [];
    this.setDisabled([...elements, ...pickerButtons], locked);
    if (manager) manager.setLocked(locked);
  },

  setVisible(el, visible) {
    if (el) el.classList.toggle('hidden', !visible);
  },

  updateBatchLayout(parts, count) {
    const hasFiles = count > 0;
    this.setVisible(parts.dropzoneEl, !hasFiles);
    this.setVisible(parts.fileListEl, hasFiles);
    this.setVisible(parts.settingsEl, hasFiles);
    this.setVisible(parts.actionBarEl, hasFiles);
    if (parts.countEl) parts.countEl.textContent = FileUtils.formatFilesCount(count);
    return hasFiles;
  },

  syncGifOutput(select, files) {
    if (!select) return;
    const hasGif = files.some(entry => FileUtils.isGif(entry.file || entry));
    if (hasGif) {
      select.value = select.querySelector('option[value="same"]') ? 'same' : 'image/gif';
    }
    select.disabled = hasGif;
    select.title = hasGif ? 'Анимированный GIF сохраняется только как GIF' : '';
    select.dispatchEvent(new Event('ui-sync'));
  },

  resetBatchResult(parts) {
    if (parts.resultArea) parts.resultArea.classList.remove('visible');
    if (parts.resultStats) parts.resultStats.innerHTML = '';
    this.setVisible(parts.downloadAllBtn, false);
  },

  resetPreview(parts, hasFiles) {
    this.setVisible(parts.previewBtn, hasFiles);
    this.setVisible(parts.previewCanvas, false);
  },

  async runPreview(previewEl, render) {
    try {
      await render();
    } catch (err) {
      console.error(err);
      this.setVisible(previewEl, false);
      Toast.error('Не удалось показать предпросмотр.');
    }
  },

  createPreviewScheduler(render, delay = 350) {
    let timer = null;
    let revision = 0;

    const refresh = async () => {
      const currentRevision = ++revision;
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }

      try {
        await render(() => currentRevision === revision);
      } catch (error) {
        if (currentRevision !== revision) return;
        console.error(error);
        Toast.error('Не удалось обновить предпросмотр.');
      }
    };

    return {
      refresh,
      schedule() {
        revision++;
        if (timer) clearTimeout(timer);
        timer = setTimeout(refresh, delay);
      },
      cancel() {
        revision++;
        if (timer) clearTimeout(timer);
        timer = null;
      },
    };
  },

  showBatchResult(parts, count) {
    if (parts.resultArea) parts.resultArea.classList.add('visible');
    this.setVisible(parts.downloadAllBtn, count > 1);
  },

  async showSelectedFileInfo(container, file, dimensions = {}) {
    if (!container || !file) return;

    let info = container.querySelector('.selected-file-info');
    if (!info) {
      info = document.createElement('div');
      info.className = 'selected-file-info';

      const head = Array.from(container.children).find(child =>
        child.classList.contains('tool-panel__head')
      );
      if (head) head.insertAdjacentElement('afterend', info);
      else container.prepend(info);
    }

    const requestId = String(Date.now()) + Math.random();
    info.dataset.requestId = requestId;
    info.replaceChildren();

    const name = document.createElement('span');
    name.className = 'selected-file-info__name';
    name.textContent = file.name;
    name.title = file.name;

    const meta = document.createElement('span');
    meta.className = 'selected-file-info__meta';
    meta.textContent = 'Определяем параметры файла...';

    info.append(name, meta);

    try {
      const details = await FileUtils.getImageDetails(file, dimensions);
      if (info.dataset.requestId === requestId) {
        meta.textContent = FileUtils.describeImage(file, details);
      }
    } catch (error) {
      if (info.dataset.requestId === requestId) {
        meta.textContent = `${FileUtils.getFormatLabel(file)} · ${FileUtils.formatSize(file.size)}`;
      }
    }
  },
};


/* Files */
const FileUtils = {
  MAX_FILE_SIZE: 50 * 1024 * 1024,
  MAX_GIF_FILE_SIZE: 25 * 1024 * 1024,
  MAX_HEIC_FILE_SIZE: 20 * 1024 * 1024,
  MAX_BATCH_FILES: 50,
  MAX_BATCH_SIZE: 250 * 1024 * 1024,
  MAX_ZIP_SIZE: 500 * 1024 * 1024,
  MAX_IMAGE_PIXELS: 40 * 1000 * 1000,
  MAX_IMAGE_SIDE: 16384,
  SUPPORTED_IMAGE_TYPES: [
    'image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif',
    'image/heic', 'image/heif', 'image/svg+xml', 'image/bmp',
  ],

  formatSize(bytes) {
    if (bytes < 1024)       return bytes + ' B';
    if (bytes < 1048576)    return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
  },

  formatPct(before, after) {
    if (before === 0) return '0%';
    if (before === after) return '0%';
    const pct = ((before - after) / before * 100).toFixed(1);
    return (pct > 0 ? '-' : '+') + Math.abs(pct) + '%';
  },

  formatCount(count, forms) {
    const abs = Math.abs(count);
    const mod100 = abs % 100;
    const mod10 = abs % 10;
    let form = forms[2];

    if (mod100 < 11 || mod100 > 14) {
      if (mod10 === 1) form = forms[0];
      else if (mod10 >= 2 && mod10 <= 4) form = forms[1];
    }

    return count + ' ' + form;
  },

  formatFilesCount(count) {
    return this.formatCount(count, ['файл', 'файла', 'файлов']);
  },

  getExt(name) {
    return name.split('.').pop().toLowerCase();
  },

  getFileMime(file) {
    const rawMime = String(file?.type || '').toLowerCase();
    const declaredMime = {
      'image/x-bmp': 'image/bmp',
      'image/x-ms-bmp': 'image/bmp',
    }[rawMime] || rawMime;
    if (this.SUPPORTED_IMAGE_TYPES.includes(declaredMime)) return declaredMime;
    const extension = this.getExt(file?.name || '');
    return {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      avif: 'image/avif',
      gif: 'image/gif',
      heic: 'image/heic',
      heif: 'image/heif',
      svg: 'image/svg+xml',
      bmp: 'image/bmp',
    }[extension] || '';
  },

  getFormatLabel(file) {
    return {
      'image/jpeg': 'JPG',
      'image/png': 'PNG',
      'image/webp': 'WebP',
      'image/avif': 'AVIF',
      'image/gif': 'GIF',
      'image/heic': 'HEIC',
      'image/heif': 'HEIF',
      'image/svg+xml': 'SVG',
      'image/bmp': 'BMP',
    }[this.getFileMime(file)] || 'Изображение';
  },

  describeImage(file, details = {}) {
    const parts = [this.getFormatLabel(file)];
    if (details.width && details.height) parts.push(`${details.width} × ${details.height}`);
    if (details.frameCount) {
      parts.push(this.formatCount(details.frameCount, ['кадр', 'кадра', 'кадров']));
    }
    if (Number.isFinite(details.duration) && details.duration > 0) {
      const seconds = (details.duration / 1000).toFixed(details.duration % 1000 ? 1 : 0);
      parts.push(`${seconds} с`);
    }
    parts.push(this.formatSize(file.size));
    return parts.join(' · ');
  },

  resolveOutputMime(file, selectedMime) {
    if (this.isGif(file)) return 'image/gif';
    if (selectedMime !== 'same') return selectedMime;
    const sourceMime = this.getFileMime(file);
    if (sourceMime === 'image/svg+xml') return 'image/png';
    if (sourceMime === 'image/heif') return 'image/heic';
    return sourceMime;
  },

  extensionForMime(mime) {
    return {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/avif': 'avif',
      'image/gif': 'gif',
      'image/heic': 'heic',
      'image/heif': 'heif',
      'image/bmp': 'bmp',
    }[mime] || 'png';
  },

  isGif(file) {
    return this.getFileMime(file) === 'image/gif';
  },

  isHeic(file) {
    return ['image/heic', 'image/heif'].includes(this.getFileMime(file));
  },

  isSvg(file) {
    return this.getFileMime(file) === 'image/svg+xml';
  },

  isSupportedImage(file) {
    return this.SUPPORTED_IMAGE_TYPES.includes(this.getFileMime(file));
  },

  validateFile(file) {
    if (!(file instanceof Blob)) throw new Error('Некорректный файл');
    const limit = this.isGif(file)
      ? this.MAX_GIF_FILE_SIZE
      : this.isHeic(file) ? this.MAX_HEIC_FILE_SIZE : this.MAX_FILE_SIZE;
    if (file.size > limit) {
      throw new Error(`Файл превышает лимит ${this.formatSize(limit)}`);
    }
    return file;
  },

  validateImageSize(width, height) {
    if (!width || !height) throw new Error('Изображение не содержит корректных размеров');
    if (width > this.MAX_IMAGE_SIDE || height > this.MAX_IMAGE_SIDE) {
      throw new Error(`Сторона изображения не должна превышать ${this.MAX_IMAGE_SIDE} px`);
    }
    if (width * height > this.MAX_IMAGE_PIXELS) {
      throw new Error('Разрешение изображения превышает лимит 40 мегапикселей');
    }
  },

  safeFilename(filename, fallback = 'download') {
    const safe = String(filename || '')
      .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_')
      .replace(/\.+$/g, '')
      .trim();
    return safe.slice(0, 180) || fallback;
  },

  detectImageMime(bytes) {
    if (bytes.length >= 6) {
      const signature = String.fromCharCode(...bytes.slice(0, 6));
      if (signature === 'GIF87a' || signature === 'GIF89a') return 'image/gif';
    }
    if (bytes.length >= 8 &&
        bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47 &&
        bytes[4] === 0x0D && bytes[5] === 0x0A && bytes[6] === 0x1A && bytes[7] === 0x0A) {
      return 'image/png';
    }
    if (bytes.length >= 3 && bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
      return 'image/jpeg';
    }
    if (bytes.length >= 2 && bytes[0] === 0x42 && bytes[1] === 0x4D) {
      return 'image/bmp';
    }
    if (bytes.length >= 12 &&
        String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
        String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP') {
      return 'image/webp';
    }
    if (bytes.length >= 12 &&
        String.fromCharCode(...bytes.slice(4, 8)) === 'ftyp') {
      const boxSize = Math.min(
        bytes.length,
        (bytes[0] * 0x1000000) + (bytes[1] << 16) + (bytes[2] << 8) + bytes[3]
      );
      const brands = [];
      for (let offset = 8; offset + 4 <= boxSize; offset += 4) {
        brands.push(String.fromCharCode(...bytes.slice(offset, offset + 4)));
      }
      if (brands.some(brand => brand === 'avif' || brand === 'avis')) return 'image/avif';
      if (brands.some(brand => [
        'heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'hevm', 'hevs', 'mif1', 'msf1',
      ].includes(brand))) return 'image/heic';
    }
    if (bytes.length) {
      const start = new TextDecoder().decode(bytes.slice(0, 1024)).replace(/^\uFEFF/, '').trimStart();
      if (/^(?:<\?xml[^>]*>\s*)?<svg(?:\s|>)/i.test(start)) return 'image/svg+xml';
    }
    return '';
  },

  readAsOriginalDataURL(file) {
    this.validateFile(file);
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload  = e => res(e.target.result);
      r.onerror = () => rej(new Error('Не удалось прочитать файл'));
      r.readAsDataURL(file);
    });
  },

  async prepareRasterInput(file) {
    this.validateFile(file);
    const mime = this.getFileMime(file);
    if (!this.isHeic(file) && mime !== 'image/svg+xml') return file;
    const formats = await import('/js/image-formats.js?v=1');
    return formats.prepareInput(file, mime);
  },

  async readAsDataURL(file) {
    const prepared = await this.prepareRasterInput(file);
    return this.readAsOriginalDataURL(prepared);
  },

  readAsArrayBuffer(file) {
    this.validateFile(file);
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload  = e => res(e.target.result);
      r.onerror = () => rej(new Error('Не удалось прочитать файл'));
      r.readAsArrayBuffer(file);
    });
  },

  downloadBlob(blob, filename) {
    if (!(blob instanceof Blob)) throw new Error('Некорректные данные для скачивания');
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = this.safeFilename(filename);
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 300);
  },

  loadImage(src) {
    return new Promise((res, rej) => {
      const img = new Image();
      if (/^https:\/\//i.test(src)) img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          this.validateImageSize(img.naturalWidth, img.naturalHeight);
          res(img);
        } catch (err) {
          rej(err);
        }
      };
      img.onerror = () => rej(new Error('Не удалось загрузить изображение'));
      img.src = src;
    });
  },

  async canvasToBlob(canvas, mimeType = 'image/jpeg', quality = 0.85) {
    if (mimeType === 'image/avif') {
      try {
        const { encodeCanvas } = await import('/js/vendor/avif/encode.js');
        return await encodeCanvas(canvas, quality);
      } catch (err) {
        console.error(err);
        throw new Error('Не удалось сохранить AVIF. Попробуйте уменьшить изображение или выбрать другой формат.');
      }
    }

    if (['image/heic', 'image/heif', 'image/bmp'].includes(mimeType)) {
      try {
        const formats = await import('/js/image-formats.js?v=1');
        return await formats.encodeCanvas(canvas, mimeType, quality);
      } catch (err) {
        console.error(err);
        const label = mimeType === 'image/bmp' ? 'BMP' : 'HEIC';
        throw new Error(`Не удалось сохранить ${label}. Попробуйте уменьшить изображение или выбрать другой формат.`);
      }
    }

    return new Promise((res, rej) => {
      canvas.toBlob(blob => {
        if (!blob) {
          rej(new Error('Не удалось сохранить изображение'));
          return;
        }
        if (blob.type !== mimeType) {
          rej(new Error('Браузер не поддерживает выбранный формат'));
          return;
        }
        res(blob);
      }, mimeType, quality);
    });
  },

  async getImageDetails(file, dimensions = {}) {
    let width = Number(dimensions.width) || 0;
    let height = Number(dimensions.height) || 0;

    if (!width || !height) {
      const source = await this.readAsDataURL(file);
      const image = await this.loadImage(source);
      width = image.naturalWidth;
      height = image.naturalHeight;
    }

    const details = { width, height };
    if (this.isGif(file)) {
      const gif = await GifProcessor.inspect(file);
      details.width = gif.width || width;
      details.height = gif.height || height;
      details.frameCount = gif.frameCount;
      details.duration = gif.duration;
    }
    return details;
  },

  canvasForMime(canvas, mimeType) {
    if (!['image/jpeg', 'image/heic', 'image/heif', 'image/bmp'].includes(mimeType)) return canvas;

    const out = document.createElement('canvas');
    out.width = canvas.width;
    out.height = canvas.height;
    const ctx = out.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.drawImage(canvas, 0, 0);
    return out;
  },

  loadJSZip() {
    if (window.JSZip) return Promise.resolve(window.JSZip);
    if (window.__akdJSZipPromise) return window.__akdJSZipPromise;

    window.__akdJSZipPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = '/js/vendor/jszip.min.js';
      script.onload = () => resolve(window.JSZip);
      script.onerror = () => {
        window.__akdJSZipPromise = null;
        reject(new Error('Не удалось загрузить JSZip'));
      };
      document.head.appendChild(script);
    });

    return window.__akdJSZipPromise;
  },

  loadJSPDF() {
    if (window.jspdf?.jsPDF) return Promise.resolve(window.jspdf.jsPDF);
    if (window.__akdJSPDFPromise) return window.__akdJSPDFPromise;

    window.__akdJSPDFPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = '/js/vendor/jspdf.umd.min.js';
      script.onload = () => resolve(window.jspdf.jsPDF);
      script.onerror = () => {
        window.__akdJSPDFPromise = null;
        reject(new Error('Не удалось загрузить jsPDF'));
      };
      document.head.appendChild(script);
    });

    return window.__akdJSPDFPromise;
  },

  async downloadZip(entries, filename, successMessage = 'ZIP скачан.') {
    try {
      const totalSize = entries.reduce((sum, entry) => sum + entry.blob.size, 0);
      if (totalSize > this.MAX_ZIP_SIZE) {
        throw new Error(`Размер ZIP превышает лимит ${this.formatSize(this.MAX_ZIP_SIZE)}`);
      }
      const JSZipCtor = await this.loadJSZip();
      const zip = new JSZipCtor();
      entries.forEach((entry, index) => {
        zip.file(this.safeFilename(entry.filename, `file-${index + 1}`), entry.blob);
      });
      const blob = await zip.generateAsync({ type: 'blob' });
      this.downloadBlob(blob, filename);
      if (successMessage) Toast.success(successMessage);
      return true;
    } catch (err) {
      console.error(err);
      Toast.error('Не удалось подготовить ZIP-архив.');
      return false;
    }
  },
};


/* Animated GIF processing */
const GifProcessor = (() => {
  const WORKER_URL = '/js/vendor/modern-gif/worker.js?v=2.1.0';
  const limits = Object.freeze({
    maxFrames: 200,
    maxDuration: 60 * 1000,
    minFrameDelay: 30,
    maxSide: 1920,
    maxPixelsPerFrame: 1920 * 1080,
    maxTotalPixels: 24 * 1000 * 1000,
    maxOutputSize: 50 * 1024 * 1024,
  });
  const inspectionCache = new WeakMap();
  let libraryPromise = null;

  function loadLibrary() {
    if (window.modernGif) return Promise.resolve(window.modernGif);
    if (libraryPromise) return libraryPromise;

    libraryPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = '/js/vendor/modern-gif/index.js?v=2.1.0';
      script.onload = () => resolve(window.modernGif);
      script.onerror = () => {
        libraryPromise = null;
        reject(new Error('Не удалось загрузить модуль обработки GIF'));
      };
      document.head.appendChild(script);
    });

    return libraryPromise;
  }

  function normalizeQuality(quality) {
    return Math.min(1, Math.max(0.1, Number(quality) || 0.82));
  }

  function qualityToColors(quality) {
    return Math.min(255, Math.max(32, Math.round(16 + normalizeQuality(quality) * 239)));
  }

  function workerUrl() {
    return typeof Worker === 'undefined' ? undefined : WORKER_URL;
  }

  function validateMetadata(gif) {
    const frameCount = gif.frames.length;
    const duration = gif.frames.reduce((total, frame) => total + frame.delay, 0);

    if (!frameCount) throw new Error('GIF не содержит кадров');
    if (frameCount > limits.maxFrames) {
      throw new Error(`GIF содержит больше ${limits.maxFrames} кадров`);
    }
    if (duration > limits.maxDuration) {
      throw new Error('Длительность GIF не должна превышать 60 секунд');
    }
    if (gif.frames.some(frame => frame.delay < limits.minFrameDelay)) {
      throw new Error('Задержка кадра GIF не должна быть меньше 30 мс');
    }
    validateOutputSize(gif.width, gif.height, frameCount);

    return { frameCount, duration };
  }

  function validateOutputSize(width, height, frameCount) {
    if (!width || !height) throw new Error('GIF не содержит корректных размеров');
    if (width > limits.maxSide || height > limits.maxSide) {
      throw new Error(`Сторона GIF не должна превышать ${limits.maxSide} px`);
    }
    if (width * height > limits.maxPixelsPerFrame) {
      throw new Error('Один кадр GIF не должен превышать 2,1 мегапикселя');
    }
    if (width * height * frameCount > limits.maxTotalPixels) {
      throw new Error('GIF слишком большой для безопасной обработки в браузере');
    }
  }

  async function inspect(file) {
    FileUtils.validateFile(file);
    if (!FileUtils.isGif(file)) throw new Error('Файл не является GIF');

    const cached = inspectionCache.get(file);
    if (cached) return cached;

    const [library, buffer] = await Promise.all([
      loadLibrary(),
      FileUtils.readAsArrayBuffer(file),
    ]);
    const header = new Uint8Array(buffer, 0, Math.min(buffer.byteLength, 16));
    if (FileUtils.detectImageMime(header) !== 'image/gif') {
      throw new Error('Содержимое файла не соответствует формату GIF');
    }

    let gif;
    try {
      gif = library.decode(buffer);
    } catch (error) {
      console.error(error);
      throw new Error('Не удалось прочитать структуру GIF');
    }

    const stats = validateMetadata(gif);
    const result = {
      width: gif.width,
      height: gif.height,
      frameCount: stats.frameCount,
      duration: stats.duration,
      looped: gif.looped === true,
      loopCount: gif.loopCount || 0,
    };
    inspectionCache.set(file, result);
    return result;
  }

  async function decode(file) {
    FileUtils.validateFile(file);
    const [library, buffer] = await Promise.all([
      loadLibrary(),
      FileUtils.readAsArrayBuffer(file),
    ]);
    const gif = library.decode(buffer);
    const stats = validateMetadata(gif);
    const decodeBuffer = buffer.slice(0);
    let frames = await library.decodeFrames(decodeBuffer, {
      gif,
      workerUrl: workerUrl(),
    });
    if (!Array.isArray(frames)) {
      frames = library.decodeFrames(buffer, { gif });
    }
    return { library, gif, frames, ...stats };
  }

  function frameCanvas(frame) {
    const canvas = document.createElement('canvas');
    canvas.width = frame.width;
    canvas.height = frame.height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.putImageData(new ImageData(frame.data, frame.width, frame.height), 0, 0);
    return canvas;
  }

  async function encodeFrames(library, config, frames, transformFrame, onProgress) {
    const quality = normalizeQuality(config.quality);
    const encoder = new library.Encoder({
      width: config.width,
      height: config.height,
      workerUrl: workerUrl(),
      maxColors: qualityToColors(quality),
      dither: quality < 0.98 ? 'floyd-steinberg' : undefined,
      ditherTransparency: 'floyd-steinberg',
      looped: config.looped,
      loopCount: config.loopCount,
    });

    for (let index = 0; index < frames.length; index++) {
      const frame = frames[index];
      const sourceCanvas = frameCanvas(frame);
      frame.data = null;
      const outputCanvas = await transformFrame({
        sourceCanvas,
        frame,
        index,
        width: config.width,
        height: config.height,
      });
      const canvas = outputCanvas || sourceCanvas;
      if (canvas.width !== config.width || canvas.height !== config.height) {
        throw new Error('Все кадры GIF должны иметь одинаковый размер');
      }
      const context = canvas.getContext('2d', { willReadFrequently: true });
      const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
      await encoder.encode({
        data,
        width: canvas.width,
        height: canvas.height,
        delay: frame.delay,
      });
      onProgress(35 + Math.round(((index + 1) / frames.length) * 50));
      sourceCanvas.width = 1;
      sourceCanvas.height = 1;
      if (canvas !== sourceCanvas) {
        canvas.width = 1;
        canvas.height = 1;
      }
    }

    const blob = await encoder.flush('blob');
    if (blob.size > limits.maxOutputSize) {
      throw new Error(`Результат GIF превышает ${FileUtils.formatSize(limits.maxOutputSize)}`);
    }
    return blob;
  }

  async function process(file, options = {}) {
    const onProgress = typeof options.onProgress === 'function'
      ? options.onProgress
      : () => {};
    onProgress(5);
    const decoded = await decode(file);
    onProgress(30);

    const outputSize = typeof options.getOutputSize === 'function'
      ? options.getOutputSize(decoded.gif)
      : { width: decoded.gif.width, height: decoded.gif.height };
    const width = Math.max(1, Math.round(outputSize.width));
    const height = Math.max(1, Math.round(outputSize.height));
    validateOutputSize(width, height, decoded.frameCount);

    const transformFrame = typeof options.transformFrame === 'function'
      ? options.transformFrame
      : ({ sourceCanvas }) => sourceCanvas;
    const blob = await encodeFrames(decoded.library, {
      width,
      height,
      quality: options.quality,
      looped: decoded.gif.looped === true,
      loopCount: decoded.gif.loopCount || 0,
    }, decoded.frames, transformFrame, onProgress);
    onProgress(100);

    return {
      blob,
      width,
      height,
      originalWidth: decoded.gif.width,
      originalHeight: decoded.gif.height,
      frameCount: decoded.frameCount,
      duration: decoded.duration,
    };
  }

  async function trim(file, options = {}) {
    const onProgress = typeof options.onProgress === 'function'
      ? options.onProgress
      : () => {};
    onProgress(5);

    const decoded = await decode(file);
    onProgress(30);

    const requestedStart = Math.max(0, Number(options.startMs) || 0);
    const requestedEnd = Math.min(
      decoded.duration,
      Math.max(requestedStart + 1, Number(options.endMs) || decoded.duration),
    );

    let elapsed = 0;
    let actualStart = 0;
    let actualEnd = 0;
    const selectedFrames = decoded.frames.filter(frame => {
      const frameStart = elapsed;
      const frameEnd = frameStart + frame.delay;
      elapsed = frameEnd;

      const isSelected = frameEnd > requestedStart && frameStart < requestedEnd;
      if (isSelected) {
        if (!actualEnd) actualStart = frameStart;
        actualEnd = frameEnd;
      }
      return isSelected;
    });

    if (!selectedFrames.length) {
      throw new Error('Выберите фрагмент GIF длительностью хотя бы в один кадр');
    }

    validateOutputSize(decoded.gif.width, decoded.gif.height, selectedFrames.length);
    const blob = await encodeFrames(decoded.library, {
      width: decoded.gif.width,
      height: decoded.gif.height,
      quality: options.quality,
      looped: decoded.gif.looped === true,
      loopCount: decoded.gif.loopCount || 0,
    }, selectedFrames, ({ sourceCanvas }) => sourceCanvas, onProgress);
    onProgress(100);

    return {
      blob,
      width: decoded.gif.width,
      height: decoded.gif.height,
      frameCount: selectedFrames.length,
      duration: actualEnd - actualStart,
      start: actualStart,
      end: actualEnd,
    };
  }

  async function extractFrames(file, options = {}) {
    const onProgress = typeof options.onProgress === 'function'
      ? options.onProgress
      : () => {};
    const mimeType = options.mimeType === 'image/jpeg' ? 'image/jpeg' : 'image/png';
    const quality = normalizeQuality(options.quality);
    onProgress(5);

    const decoded = await decode(file);
    onProgress(25);

    const frames = [];
    let elapsed = 0;
    let totalSize = 0;

    try {
      for (let index = 0; index < decoded.frames.length; index++) {
        const frame = decoded.frames[index];
        const sourceCanvas = frameCanvas(frame);
        frame.data = null;
        let outputCanvas = sourceCanvas;

        if (mimeType === 'image/jpeg') {
          outputCanvas = document.createElement('canvas');
          outputCanvas.width = sourceCanvas.width;
          outputCanvas.height = sourceCanvas.height;
          const context = outputCanvas.getContext('2d');
          context.fillStyle = '#fff';
          context.fillRect(0, 0, outputCanvas.width, outputCanvas.height);
          context.drawImage(sourceCanvas, 0, 0);
        }

        const blob = await FileUtils.canvasToBlob(outputCanvas, mimeType, quality);
        totalSize += blob.size;
        if (totalSize > FileUtils.MAX_ZIP_SIZE) {
          throw new Error(`Общий размер кадров превышает лимит ${FileUtils.formatSize(FileUtils.MAX_ZIP_SIZE)}`);
        }

        frames.push({
          blob,
          index,
          start: elapsed,
          delay: frame.delay,
          width: outputCanvas.width,
          height: outputCanvas.height,
        });
        elapsed += frame.delay;

        sourceCanvas.width = 1;
        sourceCanvas.height = 1;
        if (outputCanvas !== sourceCanvas) {
          outputCanvas.width = 1;
          outputCanvas.height = 1;
        }
        onProgress(25 + Math.round(((index + 1) / decoded.frames.length) * 75));
      }
    } finally {
      decoded.frames.forEach(frame => { frame.data = null; });
    }

    return {
      frames,
      width: decoded.gif.width,
      height: decoded.gif.height,
      frameCount: decoded.frameCount,
      duration: decoded.duration,
      totalSize,
      mimeType,
    };
  }

  async function createTimelinePreview(file, options = {}) {
    const maxFrames = Math.min(24, Math.max(1, Number(options.maxFrames) || 16));
    const maxHeight = Math.min(96, Math.max(32, Number(options.height) || 56));
    const decoded = await decode(file);
    const frameStarts = [];
    let elapsed = 0;

    decoded.frames.forEach(frame => {
      frameStarts.push(elapsed);
      elapsed += frame.delay;
    });

    const sampleCount = Math.min(maxFrames, decoded.frames.length);
    const indices = Array.from({ length: sampleCount }, (_, index) => (
      Math.min(decoded.frames.length - 1, Math.round(index * (decoded.frames.length - 1) / Math.max(1, sampleCount - 1)))
    ));

    const thumbnails = indices.map(index => {
      const frame = decoded.frames[index];
      const sourceCanvas = frameCanvas(frame);
      const scale = Math.min(1, maxHeight / frame.height, 120 / frame.width);
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(frame.width * scale));
      canvas.height = Math.max(1, Math.round(frame.height * scale));
      canvas.getContext('2d').drawImage(sourceCanvas, 0, 0, canvas.width, canvas.height);
      const source = canvas.toDataURL('image/png');
      sourceCanvas.width = 1;
      sourceCanvas.height = 1;
      canvas.width = 1;
      canvas.height = 1;
      return { source, start: frameStarts[index] };
    });

    decoded.frames.forEach((frame, index) => {
      frame.start = frameStarts[index];
    });

    return {
      width: decoded.gif.width,
      height: decoded.gif.height,
      duration: decoded.duration,
      frameCount: decoded.frameCount,
      thumbnails,
      frames: decoded.frames,
      dispose() {
        decoded.frames.forEach(frame => { frame.data = null; });
      },
    };
  }

  async function encodeCanvas(canvas, options = {}) {
    validateOutputSize(canvas.width, canvas.height, 1);
    const library = await loadLibrary();
    const context = canvas.getContext('2d', { willReadFrequently: true });
    const quality = normalizeQuality(options.quality);
    const encoder = new library.Encoder({
      width: canvas.width,
      height: canvas.height,
      workerUrl: workerUrl(),
      maxColors: qualityToColors(quality),
      dither: quality < 0.98 ? 'floyd-steinberg' : undefined,
      ditherTransparency: 'floyd-steinberg',
      looped: false,
    });
    await encoder.encode({
      data: context.getImageData(0, 0, canvas.width, canvas.height).data,
      width: canvas.width,
      height: canvas.height,
      delay: 100,
    });
    return encoder.flush('blob');
  }

  return {
    limits,
    inspect,
    process,
    trim,
    extractFrames,
    createTimelinePreview,
    encodeCanvas,
    qualityToColors,
  };
})();


/* Background image processing */
const ImageProcessor = (() => {
  const pending = new Map();
  let worker = null;
  let workerDisabled = false;
  let nextTaskId = 1;

  function canUseWorker() {
    return !workerDisabled &&
      typeof Worker !== 'undefined' &&
      typeof OffscreenCanvas !== 'undefined' &&
      typeof createImageBitmap !== 'undefined';
  }

  function rejectPending(error) {
    pending.forEach(task => task.reject(error));
    pending.clear();
  }

  function disableWorker(error) {
    workerDisabled = true;
    if (worker) worker.terminate();
    worker = null;
    rejectPending(error);
  }

  function getWorker() {
    if (worker) return worker;

    worker = new Worker('/js/image-worker.js?v=2', { type: 'module' });
    worker.addEventListener('message', event => {
      const task = pending.get(event.data.id);
      if (!task) return;

      if (typeof event.data.progress === 'number') {
        task.onProgress(event.data.progress);
        return;
      }

      pending.delete(event.data.id);
      if (event.data.error) {
        task.reject(new Error(event.data.error));
      } else {
        task.onProgress(100);
        task.resolve(event.data.result);
      }
    });
    worker.addEventListener('error', event => {
      disableWorker(new Error(event.message || 'Web Worker недоступен'));
    });

    return worker;
  }

  function runInWorker(file, task, onProgress) {
    return new Promise((resolve, reject) => {
      const id = nextTaskId++;
      pending.set(id, { resolve, reject, onProgress });
      getWorker().postMessage({ id, file, task });
    });
  }

  function getResizeSize(width, height, task) {
    let targetWidth = width;
    let targetHeight = height;

    if (task.mode === 'px') {
      targetWidth = Number(task.width) || width;
      targetHeight = Number(task.height) || height;
      if (task.noEnlarge) {
        targetWidth = Math.min(targetWidth, width);
        targetHeight = Math.min(targetHeight, height);
      }
    } else if (task.mode === 'pct') {
      const scale = (Number(task.scale) || 100) / 100;
      targetWidth = Math.round(width * scale);
      targetHeight = Math.round(height * scale);
    } else {
      const longest = Number(task.longest) || 1200;
      const ratio = width > height ? longest / width : longest / height;
      const scale = task.noEnlarge ? Math.min(ratio, 1) : ratio;
      targetWidth = Math.round(width * scale);
      targetHeight = Math.round(height * scale);
    }

    return {
      width: Math.max(1, targetWidth),
      height: Math.max(1, targetHeight),
    };
  }

  function imageWidth(image) {
    return image.naturalWidth || image.width;
  }

  function imageHeight(image) {
    return image.naturalHeight || image.height;
  }

  function getOutputSize(image, task) {
    const width = imageWidth(image);
    const height = imageHeight(image);
    if (task.type === 'resize') {
      return getResizeSize(width, height, task);
    }
    if (task.type === 'crop') {
      return {
        width: Math.max(1, Math.round(task.area.width)),
        height: Math.max(1, Math.round(task.area.height)),
      };
    }
    if (task.type === 'rotate' && Math.abs(Number(task.rotation)) % 180 === 90) {
      return { width: height, height: width };
    }
    return { width, height };
  }

  function drawOnMainThread(image, canvas, context, task) {
    if (task.type === 'resize') {
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      return;
    }

    if (task.type === 'rotate') {
      const width = imageWidth(image);
      const height = imageHeight(image);
      context.translate(canvas.width / 2, canvas.height / 2);
      context.rotate((Number(task.rotation) || 0) * Math.PI / 180);
      context.scale(task.flipH ? -1 : 1, task.flipV ? -1 : 1);
      context.drawImage(image, -width / 2, -height / 2);
      return;
    }

    if (task.type === 'pixelate') {
      const pixelSize = Math.max(1, Number(task.pixelSize) || 10);
      const smallWidth = Math.max(1, Math.floor(canvas.width / pixelSize));
      const smallHeight = Math.max(1, Math.floor(canvas.height / pixelSize));
      const smallCanvas = document.createElement('canvas');
      smallCanvas.width = smallWidth;
      smallCanvas.height = smallHeight;
      smallCanvas.getContext('2d').drawImage(image, 0, 0, smallWidth, smallHeight);
      context.imageSmoothingEnabled = false;
      context.drawImage(
        smallCanvas,
        0, 0, smallWidth, smallHeight,
        0, 0, canvas.width, canvas.height
      );
      return;
    }

    if (task.type === 'crop') {
      const area = task.area;
      context.drawImage(
        image,
        area.x, area.y, area.width, area.height,
        0, 0, canvas.width, canvas.height
      );
      return;
    }

    if (task.type === 'effects') {
      const filters = task.filters;
      context.filter = [
        `brightness(${filters.brightness}%)`,
        `contrast(${filters.contrast}%)`,
        `saturate(${filters.saturate}%)`,
        `blur(${filters.blur}px)`,
        `sepia(${filters.sepia}%)`,
        `grayscale(${filters.grayscale}%)`,
        `invert(${filters.invert}%)`,
      ].join(' ');
      context.drawImage(image, 0, 0);
      return;
    }

    if (task.type === 'blurArea') {
      context.drawImage(image, 0, 0);
      const blurredCanvas = document.createElement('canvas');
      blurredCanvas.width = canvas.width;
      blurredCanvas.height = canvas.height;
      const blurredContext = blurredCanvas.getContext('2d');
      blurredContext.filter = `blur(${Math.max(0, Number(task.radius) || 0)}px)`;
      blurredContext.drawImage(image, 0, 0);
      context.save();
      context.beginPath();
      context.rect(task.area.x, task.area.y, task.area.width, task.area.height);
      context.clip();
      context.drawImage(blurredCanvas, 0, 0);
      context.restore();
      return;
    }

    context.drawImage(image, 0, 0);
  }

  async function runOnMainThread(file, task, onProgress) {
    onProgress(25);
    const source = await FileUtils.readAsDataURL(file);
    const image = await FileUtils.loadImage(source);
    const size = getOutputSize(image, task);
    FileUtils.validateImageSize(size.width, size.height);

    const canvas = document.createElement('canvas');
    canvas.width = size.width;
    canvas.height = size.height;
    const context = canvas.getContext('2d');

    if (['image/jpeg', 'image/heic', 'image/heif', 'image/bmp'].includes(task.mimeType)) {
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
    }

    onProgress(55);
    drawOnMainThread(image, canvas, context, task);
    onProgress(80);
    const blob = task.mimeType === 'image/gif'
      ? await GifProcessor.encodeCanvas(canvas, { quality: task.quality })
      : await FileUtils.canvasToBlob(canvas, task.mimeType, task.quality);
    onProgress(100);

    return {
      blob,
      width: canvas.width,
      height: canvas.height,
      originalWidth: imageWidth(image),
      originalHeight: imageHeight(image),
    };
  }

  async function process(file, task, options = {}) {
    FileUtils.validateFile(file);
    const onProgress = typeof options.onProgress === 'function'
      ? options.onProgress
      : () => {};

    if (FileUtils.isGif(file)) {
      if (task.mimeType !== 'image/gif') {
        throw new Error('Анимированный GIF можно сохранить только в формате GIF');
      }
      return GifProcessor.process(file, {
        quality: task.quality,
        onProgress,
        getOutputSize: gif => getOutputSize(gif, task),
        transformFrame: ({ sourceCanvas }) => {
          const size = getOutputSize(sourceCanvas, task);
          const canvas = document.createElement('canvas');
          canvas.width = size.width;
          canvas.height = size.height;
          drawOnMainThread(sourceCanvas, canvas, canvas.getContext('2d'), task);
          return canvas;
        },
      });
    }

    if (task.mimeType === 'image/gif') {
      return runOnMainThread(file, task, onProgress);
    }

    const sourceFile = await FileUtils.prepareRasterInput(file);

    if (['image/heic', 'image/heif', 'image/bmp'].includes(task.mimeType)) {
      return runOnMainThread(sourceFile, task, onProgress);
    }

    if (canUseWorker()) {
      try {
        return await runInWorker(sourceFile, task, onProgress);
      } catch (error) {
        console.warn('Фоновая обработка недоступна, используется обычный Canvas.', error);
      }
    }

    return runOnMainThread(sourceFile, task, onProgress);
  }

  return {
    process,
    isWorkerSupported: canUseWorker,
  };
})();


/* Dropzone */
class Dropzone {
  constructor(el, opts = {}) {
    this.el   = el;
    this.opts = { multiple: true, accept: [], ...opts };
    this._bind();
  }

  _bind() {
    const el = this.el;

    el.addEventListener('dragover', e => {
      e.preventDefault();
      el.classList.add('drag-over');
    });
    el.addEventListener('dragleave', e => {
      if (!el.contains(e.relatedTarget)) el.classList.remove('drag-over');
    });
    el.addEventListener('drop', e => {
      e.preventDefault();
      el.classList.remove('drag-over');
      const files = e.dataTransfer.files;
      if (files.length) this._handle(files);
    });

    document.addEventListener('paste', e => {
      if (this._isTextTarget(e.target)) return;
      const files = this._clipboardImages(e.clipboardData);
      if (!files.length) return;
      e.preventDefault();
      this._handle(files);
    });

    const input = el.querySelector('input[type="file"]');
    if (input) {
      input.multiple = this.opts.multiple;
      if (this.opts.accept.length) input.accept = this.opts.accept.join(',');
      input.addEventListener('change', () => {
        if (input.files.length) this._handle(input.files);
        input.value = '';
      });
    }

    el.addEventListener('click', e => {
      if (e.target === el || e.target.closest('.dropzone__icon, .dropzone__title, .dropzone__hint')) {
        input && input.click();
      }
    });
  }

  _isTextTarget(target) {
    return target instanceof Element && Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
  }

  _clipboardImages(clipboardData) {
    if (!clipboardData) return [];
    const files = Array.from(clipboardData.files || [])
      .filter(file => FileUtils.getFileMime(file).startsWith('image/'));
    if (files.length) return files;

    return Array.from(clipboardData.items || [])
      .filter(item => item.kind === 'file' && item.type.startsWith('image/'))
      .map(item => item.getAsFile())
      .filter(Boolean);
  }

  async _handle(files) {
    let list = Array.from(files);
    if (!this.opts.multiple) list = list.slice(0, 1);

    if (list.length > FileUtils.MAX_BATCH_FILES) {
      Toast.error(`Можно выбрать не более ${FileUtils.MAX_BATCH_FILES} файлов за один раз.`);
      return;
    }

    const totalSize = list.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > FileUtils.MAX_BATCH_SIZE) {
      Toast.error(`Общий размер файлов не должен превышать ${FileUtils.formatSize(FileUtils.MAX_BATCH_SIZE)}.`);
      return;
    }

    const valid = this.opts.accept.length
      ? list.filter(f => this.opts.accept.some(t => {
          const mime = FileUtils.getFileMime(f);
          if (t.endsWith('/*')) return mime.startsWith(t.slice(0,-1));
          return mime === t;
        }))
      : list;
    const acceptedBySize = valid.filter(file => {
      const limit = FileUtils.isGif(file)
        ? FileUtils.MAX_GIF_FILE_SIZE
        : FileUtils.isHeic(file) ? FileUtils.MAX_HEIC_FILE_SIZE : FileUtils.MAX_FILE_SIZE;
      return file.size <= limit;
    });

    if (valid.length < list.length) {
      Toast.error('Некоторые файлы имеют неподдерживаемый формат.');
    }
    if (acceptedBySize.length < valid.length) {
      Toast.error('Некоторые файлы превышают допустимый размер.');
    }

    const accepted = [];
    for (const file of acceptedBySize) {
      if (!FileUtils.isGif(file)) {
        accepted.push(file);
        continue;
      }
      try {
        await GifProcessor.inspect(file);
        accepted.push(file);
      } catch (error) {
        console.error(error);
        Toast.error(error.message || 'Не удалось проверить GIF.');
      }
    }
    if (accepted.length) this.opts.onFiles(accepted);
  }
}

document.addEventListener('click', event => {
  const trigger = event.target.closest('[data-open-file-picker]');
  if (!trigger) return;

  const scope = trigger.closest('main') || document;
  const input = scope.querySelector('.dropzone input[type="file"]');
  if (!input || input.disabled) return;

  input.value = '';
  input.click();
});

/* File list */
class FileListManager {
  constructor(containerEl) {
    this.container = containerEl;
    this.items = [];
    this.selectedId = null;
    this.locked = false;
    this.container.setAttribute('role', 'listbox');
    this.container.setAttribute('aria-label', 'Загруженные изображения');
  }

  clear() {
    this.items = [];
    this.selectedId = null;
    this.container.innerHTML = '';
  }

  select(id, notify = true) {
    if (!this.items.some(item => item.id === id)) return;
    this.selectedId = id;
    this.items.forEach(item => {
      const selected = item.id === id;
      item.el.classList.toggle('is-selected', selected);
      item.el.setAttribute('aria-selected', String(selected));
    });
    if (notify) {
      this.container.dispatchEvent(new CustomEvent('file-selected', { detail: { id } }));
    }
  }

  getSelectedItem() {
    return this.items.find(item => item.id === this.selectedId) || this.items[0] || null;
  }

  add(file) {
    const id  = Date.now() + Math.random();
    const ext = FileUtils.getExt(file.name).toUpperCase();
    const row = document.createElement('div');
    row.className = 'file-item';
    row.dataset.id = id;
    row.innerHTML = `
      <div class="file-item__thumb-wrap">
        <div class="file-item__thumb file-item__thumb-placeholder"></div>
      </div>
      <div class="file-item__info">
        <div class="file-item__name"></div>
        <div class="file-item__meta">${FileUtils.getFormatLabel(file)} · ${FileUtils.formatSize(file.size)}</div>
        <div class="progress-bar hidden"><div class="progress-fill"></div></div>
      </div>
      <span class="file-item__status status-pending">Готов к обработке</span>
      <button class="btn-icon remove-btn" title="Удалить">✕</button>
    `;

    const placeholder = row.querySelector('.file-item__thumb-placeholder');
    const name = row.querySelector('.file-item__name');
    placeholder.textContent = ext;
    name.textContent = file.name;
    name.title = file.name;
    row.tabIndex = 0;
    row.setAttribute('role', 'option');
    row.setAttribute('aria-selected', 'false');

    this.container.appendChild(row);

    const btn = row.querySelector('.remove-btn');
    btn.onclick = event => {
      event.stopPropagation();
      const index = this.items.findIndex(item => item.id === id);
      const wasSelected = this.selectedId === id;
      row.remove();
      this.items = this.items.filter(i => i.id !== id);
      if (wasSelected) {
        const next = this.items[Math.min(index, this.items.length - 1)];
        this.selectedId = null;
        if (next) this.select(next.id);
      }
      this.container.dispatchEvent(new CustomEvent('file-removed', { detail: { id } }));
    };

    const selectRow = () => {
      if (!this.locked) this.select(id);
    };
    row.addEventListener('click', event => {
      if (!event.target.closest('button')) selectRow();
    });
    row.addEventListener('keydown', event => {
      if (event.target.closest('button')) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        selectRow();
      }
    });

    if (FileUtils.isSupportedImage(file)) {
      FileUtils.readAsDataURL(file).then(src => {
        const thumb = row.querySelector('.file-item__thumb');
        if (!thumb) return;
        const image = document.createElement('img');
        image.className = 'file-item__thumb';
        image.src = src;
        image.alt = '';
        thumb.replaceWith(image);
      }).catch(() => {});
    }

    const item = { id, file, el: row };
    this.items.push(item);
    if (this.selectedId === null) this.select(id, false);
    FileUtils.getImageDetails(file).then(details => {
      const status = row.querySelector('.file-item__status');
      if (status?.classList.contains('status-pending')) {
        this.setMeta(id, FileUtils.describeImage(file, details));
      }
    }).catch(() => {});
    return item;
  }

  setStatus(id, label, cls) {
    const row = this.container.querySelector(`[data-id="${id}"]`);
    if (!row) return;
    const s = row.querySelector('.file-item__status');
    const statusLabel = cls === 'status-error' && label === 'Ошибка' ? 'Не удалось' : label.replace(/\.\.\.$/, '');
    s.textContent = statusLabel;
    s.className   = 'file-item__status ' + cls;
    s.dataset.label = statusLabel;

    const bar = row.querySelector('.progress-bar');
    if (cls !== 'status-processing' && bar) {
      bar.classList.add('hidden');
      bar.querySelector('.progress-fill').style.width = '0%';
    }
  }

  setProgress(id, pct) {
    const row = this.container.querySelector(`[data-id="${id}"]`);
    if (!row) return;
    const safePct = Math.max(0, Math.min(100, Math.round(Number(pct) || 0)));
    const bar = row.querySelector('.progress-bar');
    bar.classList.remove('hidden');
    bar.setAttribute('role', 'progressbar');
    bar.setAttribute('aria-valuemin', '0');
    bar.setAttribute('aria-valuemax', '100');
    bar.setAttribute('aria-valuenow', String(safePct));
    bar.querySelector('.progress-fill').style.width = safePct + '%';

    const status = row.querySelector('.file-item__status');
    if (status?.classList.contains('status-processing')) {
      status.textContent = `${status.dataset.label || 'Обработка'} ${safePct}%`;
    }
  }

  setMeta(id, text) {
    const row = this.container.querySelector(`[data-id="${id}"]`);
    if (!row) return;
    row.querySelector('.file-item__meta').textContent = text;
  }

  setLocked(locked) {
    this.locked = locked;
    this.container.classList.toggle('is-locked', locked);
    this.container.querySelectorAll('.remove-btn').forEach(btn => {
      btn.disabled = locked;
    });
  }

  addDownload(id, blob, filename) {
    const row = this.container.querySelector(`[data-id="${id}"]`);
    if (!row) return;
    const dl = document.createElement('button');
    dl.className   = 'btn btn-sm btn-success mt-8';
    dl.textContent = ' Скачать';
    dl.onclick = () => FileUtils.downloadBlob(blob, filename);
    const info = row.querySelector('.file-item__info');
    const existing = info.querySelector('.dl-btn');
    if (existing) existing.remove();
    dl.className += ' dl-btn';
    dl.addEventListener('click', event => event.stopPropagation());
    info.appendChild(dl);
  }
}
