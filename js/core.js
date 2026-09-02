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
        if (option.dataset.previewFont) {
          button.querySelector('span').style.fontFamily = option.dataset.previewFont;
        }
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
      const value = trigger.querySelector('.custom-select__value');
      value.textContent = selected ? selected.textContent : '';
      value.style.fontFamily = selected?.dataset.previewFont || '';
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
    root.querySelectorAll('select:not([multiple]):not([data-native-select])').forEach(enhance);
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

/* Unified completion screen */
const ResultFlow = (() => {
  const PREVIEW_HISTORY_KEY = 'akdResultPreview';
  const PREVIEW_MODES = {
    compress: 'compare',
    'gif-optimize': 'compare',
    convert: 'single',
    watermark: 'compare',
    effects: 'compare',
    meme: 'compare',
    round: 'compare',
    pixelate: 'compare',
    blur: 'compare',
    annotate: 'compare',
    'remove-background': 'compare',
    resize: 'single',
    crop: 'single',
    rotate: 'single',
    collage: 'single',
    palette: 'single',
    'gif-trim': 'single',
    'gif-frames': 'single',
    'video-gif': 'single',
    favicon: 'single',
  };

  const TOOL_CATALOG = {
    compress: { href: '/compress', label: 'Сжать изображение', iconClass: 'ic-green', iconPath: 'M160-400v-80h640v80H160Zm0-120v-80h640v80H160ZM440-80v-128l-64 64-56-56 160-160 160 160-56 56-64-62v126h-80Zm40-560L320-800l56-56 64 64v-128h80v128l64-64 56 56-160 160Z' },
    'gif-optimize': { href: '/gif-optimize', label: 'Оптимизировать GIF', iconClass: 'ic-green', iconPath: 'M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm240-160h60v-240h-60v240Zm-160 0h80q17 0 28.5-11.5T400-400v-80h-60v60h-40v-120h100v-20q0-17-11.5-28.5T360-600h-80q-17 0-28.5 11.5T240-560v160q0 17 11.5 28.5T280-360Zm280 0h60v-80h80v-60h-80v-40h120v-60H560v240ZM200-200v-560 560Z' },
    resize: { href: '/resize', label: 'Изменить размер', iconClass: 'ic-blue', iconPath: 'M560-280h200v-200h-80v120H560v80ZM200-480h80v-120h120v-80H200v200Zm-40 320q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm0-80h640v-480H160v480Zm0 0v-480 480Z' },
    watermark: { href: '/watermark', label: 'Водяной знак', iconClass: 'ic-orange', iconPath: 'M400-280h360v-240H400v240ZM160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm0-80h640v-480H160v480Zm0 0v-480 480Z' },
    crop: { href: '/crop', label: 'Обрезать изображение', iconClass: 'ic-blue', iconPath: 'M680-40v-160H280q-33 0-56.5-23.5T200-280v-400H40v-80h160v-160h80v640h640v80H760v160h-80Zm0-320v-320H360v-80h320q33 0 56.5 23.5T760-680v320h-80Z' },
    convert: { href: '/convert', label: 'Конвертировать', iconClass: 'ic-green', iconPath: 'M280-160 80-360l200-200 56 57-103 103h287v80H233l103 103-56 57Zm400-240-56-57 103-103H440v-80h287L624-743l56-57 200 200-200 200Z' },
    rotate: { href: '/rotate', label: 'Повернуть / Отразить', iconClass: 'ic-blue', iconPath: 'M487-104 150-440h114l280 280 200-200H640v-80h240v240h-80v-104L600-104q-23 23-56.5 23T487-104ZM80-520v-240h80v104l200-200q23-23 56.5-23t56.5 23l337 336H696L416-800 216-600h104v80H80Z' },
    effects: { href: '/effects', label: 'Фотоэффекты', iconClass: 'ic-orange', iconPath: 'M324-111.5Q251-143 197-197t-85.5-127Q80-397 80-480t31.5-156Q143-709 197-763t127-85.5Q397-880 480-880t156 31.5Q709-817 763-763t85.5 127Q880-563 880-480t-31.5 156Q817-251 763-197t-127 85.5Q563-80 480-80t-156-31.5ZM520-163q119-15 199.5-104.5T800-480q0-123-80.5-212.5T520-797v634Z' },
    meme: { href: '/meme', label: 'Генератор мемов', iconClass: 'ic-orange', iconPath: 'M620-520q25 0 42.5-17.5T680-580q0-25-17.5-42.5T620-640q-25 0-42.5 17.5T560-580q0 25 17.5 42.5T620-520Zm-280 0q25 0 42.5-17.5T400-580q0-25-17.5-42.5T340-640q-25 0-42.5 17.5T280-580q0 25 17.5 42.5T340-520Zm263.5 221.5Q659-337 684-400H276q25 63 80.5 101.5T480-260q68 0 123.5-38.5ZM324-111.5Q251-143 197-197t-85.5-127Q80-397 80-480t31.5-156Q143-709 197-763t127-85.5Q397-880 480-880t156 31.5Q709-817 763-763t85.5 127Q880-563 880-480t-31.5 156Q817-251 763-197t-127 85.5Q563-80 480-80t-156-31.5ZM480-480Zm227 227q93-93 93-227t-93-227q-93-93-227-93t-227 93q-93 93-93 227t93 227q93 93 227 93t227-93Z' },
    split: { href: '/split', label: 'Разделить изображение', iconClass: 'ic-blue', iconPath: 'M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h240v-560H200v560Zm320 0h240v-280H520v280Zm0-360h240v-200H520v200Z' },
    round: { href: '/round', label: 'Скругление углов', iconClass: 'ic-blue', iconPath: 'M120-120v-80h80v80h-80Zm0-160v-80h80v80h-80Zm0-160v-80h80v80h-80Zm0-160v-80h80v80h-80Zm0-160v-80h80v80h-80Zm160 640v-80h80v80h-80Zm0-640v-80h80v80h-80Zm160 640v-80h80v80h-80Zm160 0v-80h80v80h-80Zm160 0v-80h80v80h-80Zm0-160v-80h80v80h-80Zm80-160h-80v-200q0-50-35-85t-85-35H440v-80h200q83 0 141.5 58.5T840-640v200Z' },
    pixelate: { href: '/pixelate', label: 'Пикселизатор', iconClass: 'ic-orange', iconPath: 'M120-120v-720h720v720H120Zm80-80h560v-560H200v560Zm0 0v-560 560Z' },
    exif: { href: '/exif', label: 'Удалить EXIF', iconClass: 'ic-green', iconPath: 'M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z' },
    base64: { href: '/base64', label: 'Изображение в Base64', iconClass: 'ic-green', iconPath: 'M318-120q-82 0-140-58t-58-140q0-40 15-76t43-64l134-133 56 56-134 134q-17 17-25.5 38.5T200-318q0 49 34.5 83.5T318-200q23 0 45-8.5t39-25.5l133-134 57 57-134 133q-28 28-64 43t-76 15Zm79-220-57-57 223-223 57 57-223 223Zm251-28-56-57 134-133q17-17 25-38t8-44q0-50-34-85t-84-35q-23 0-44.5 8.5T558-726L425-592l-57-56 134-134q28-28 64-43t76-15q82 0 139.5 58T839-641q0 39-14.5 75T782-502L648-368Z' },
    favicon: { href: '/favicon', label: 'Создать favicon', iconClass: 'ic-green', iconPath: 'M325-111.5q-73-31.5-127.5-86t-86-127.5Q80-398 80-480.5t31.5-155q31.5-72.5 86-127t127.5-86Q398-880 480.5-880t155 31.5q72.5 31.5 127 86t86 127Q880-563 880-480.5T848.5-325q-31.5 73-86 127.5t-127 86Q563-80 480.5-80T325-111.5ZM480-162q26-36 45-75t31-83H404q12 44 31 83t45 75Zm-104-16q-18-33-31.5-68.5T322-320H204q29 50 72.5 87t99.5 55Zm208 0q56-18 99.5-55t72.5-87H638q-9 38-22.5 73.5T584-178ZM170-400h136q-3-20-4.5-39.5T300-480q0-21 1.5-40.5T306-560H170q-5 20-7.5 39.5T160-480q0 21 2.5 40.5T170-400Zm216 0h188q3-20 4.5-39.5T580-480q0-21-1.5-40.5T574-560H386q-3 20-4.5 39.5T380-480q0 21 1.5 40.5T386-400Zm268 0h136q5-20 7.5-39.5T800-480q0-21-2.5-40.5T790-560H654q3 20 4.5 39.5T660-480q0 21-1.5 40.5T654-400Zm-16-240h118q-29-50-72.5-87T584-782q18 33 31.5 68.5T638-640Zm-234 0h152q-12-44-31-83t-45-75q-26 36-45 75t-31 83Zm-200 0h118q9-38 22.5-73.5T376-782q-56 18-99.5 55T204-640Z' },
    palette: { href: '/palette', label: 'Генератор палитры', iconClass: 'ic-orange', iconPath: 'M480-80q-82 0-155-31.5t-127.5-86Q143-252 111.5-325T80-480q0-83 32.5-156t88-127Q256-817 330-848.5T488-880q80 0 151 27.5t124.5 76q53.5 48.5 85 115T880-518q0 115-70 176.5T640-280h-74q-9 0-12.5 5t-3.5 11q0 12 15 34.5t15 51.5q0 50-27.5 74T480-80Zm0-400Zm-177 23q17-17 17-43t-17-43q-17-17-43-17t-43 17q-17 17-17 43t17 43q17 17 43 17t43-17Zm120-160q17-17 17-43t-17-43q-17-17-43-17t-43 17q-17 17-17 43t17 43q17 17 43 17t43-17Zm200 0q17-17 17-43t-17-43q-17-17-43-17t-43 17q-17 17-17 43t17 43q17 17 43 17t43-17Zm120 160q17-17 17-43t-17-43q-17-17-43-17t-43 17q-17 17-17 43t17 43q17 17 43 17t43-17ZM480-160q9 0 14.5-5t5.5-13q0-14-15-33t-15-57q0-42 29-67t71-25h70q66 0 113-38.5T800-518q0-121-92.5-201.5T488-800q-136 0-232 93t-96 227q0 133 93.5 226.5T480-160Z' },
    blur: { href: '/blur', label: 'Размытие области', iconClass: 'ic-orange', iconPath: 'M106-386q-6-6-6-14t6-14q6-6 14-6t14 6q6 6 6 14t-6 14q-6 6-14 6t-14-6Zm0-160q-6-6-6-14t6-14q6-6 14-6t14 6q6 6 6 14t-6 14q-6 6-14 6t-14-6Zm105.5 334.5Q200-223 200-240t11.5-28.5Q223-280 240-280t28.5 11.5Q280-257 280-240t-11.5 28.5Q257-200 240-200t-28.5-11.5Zm0-160Q200-383 200-400t11.5-28.5Q223-440 240-440t28.5 11.5Q280-417 280-400t-11.5 28.5Q257-360 240-360t-28.5-11.5Zm0-160Q200-543 200-560t11.5-28.5Q223-600 240-600t28.5 11.5Q280-577 280-560t-11.5 28.5Q257-520 240-520t-28.5-11.5Zm0-160Q200-703 200-720t11.5-28.5Q223-760 240-760t28.5 11.5Q280-737 280-720t-11.5 28.5Q257-680 240-680t-28.5-11.5Zm146 334Q340-375 340-400t17.5-42.5Q375-460 400-460t42.5 17.5Q460-425 460-400t-17.5 42.5Q425-340 400-340t-42.5-17.5Zm0-160Q340-535 340-560t17.5-42.5Q375-620 400-620t42.5 17.5Q460-585 460-560t-17.5 42.5Q425-500 400-500t-42.5-17.5Zm14 306Q360-223 360-240t11.5-28.5Q383-280 400-280t28.5 11.5Q440-257 440-240t-11.5 28.5Q417-200 400-200t-28.5-11.5Zm0-480Q360-703 360-720t11.5-28.5Q383-760 400-760t28.5 11.5Q440-737 440-720t-11.5 28.5Q417-680 400-680t-28.5-11.5ZM386-106q-6-6-6-14t6-14q6-6 14-6t14 6q6 6 6 14t-6 14q-6 6-14 6t-14-6Zm0-720q-6-6-6-14t6-14q6-6 14-6t14 6q6 6 6 14t-6 14q-6 6-14 6t-14-6Zm131.5 468.5Q500-375 500-400t17.5-42.5Q535-460 560-460t42.5 17.5Q620-425 620-400t-17.5 42.5Q585-340 560-340t-42.5-17.5Zm0-160Q500-535 500-560t17.5-42.5Q535-620 560-620t42.5 17.5Q620-585 620-560t-17.5 42.5Q585-500 560-500t-42.5-17.5Zm14 306Q520-223 520-240t11.5-28.5Q543-280 560-280t28.5 11.5Q600-257 600-240t-11.5 28.5Q577-200 560-200t-28.5-11.5Zm0-480Q520-703 520-720t11.5-28.5Q543-760 560-760t28.5 11.5Q600-737 600-720t-11.5 28.5Q577-680 560-680t-28.5-11.5ZM546-106q-6-6-6-14t6-14q6-6 14-6t14 6q6 6 6 14t-6 14q-6 6-14 6t-14-6Zm0-720q-6-6-6-14t6-14q6-6 14-6t14 6q6 6 6 14t-6 14q-6 6-14 6t-14-6Zm145.5 614.5Q680-223 680-240t11.5-28.5Q703-280 720-280t28.5 11.5Q760-257 760-240t-11.5 28.5Q737-200 720-200t-28.5-11.5Zm0-160Q680-383 680-400t11.5-28.5Q703-440 720-440t28.5 11.5Q760-417 760-400t-11.5 28.5Q737-360 720-360t-28.5-11.5Zm0-160Q680-543 680-560t11.5-28.5Q703-600 720-600t28.5 11.5Q760-577 760-560t-11.5 28.5Q737-520 720-520t-28.5-11.5Zm0-160Q680-703 680-720t11.5-28.5Q703-760 720-760t28.5 11.5Q760-737 760-720t-11.5 28.5Q737-680 720-680t-28.5-11.5ZM826-386q-6-6-6-14t6-14q6-6 14-6t14 6q6 6 6 14t-6 14q-6 6-14 6t-14-6Zm0-160q-6-6-6-14t6-14q6-6 14-6t14 6q6 6 6 14t-6 14q-6 6-14 6t-14-6Z' },
    pdf: { href: '/pdf', label: 'Изображения в PDF', iconClass: 'ic-green', iconPath: 'M360-460h40v-80h40q17 0 28.5-11.5T480-580v-40q0-17-11.5-28.5T440-660h-80v200Zm40-120v-40h40v40h-40Zm120 120h80q17 0 28.5-11.5T640-500v-120q0-17-11.5-28.5T600-660h-80v200Zm40-40v-120h40v120h-40Zm120 40h40v-80h40v-40h-40v-40h40v-40h-80v200ZM320-240q-33 0-56.5-23.5T240-320v-480q0-33 23.5-56.5T320-880h480q33 0 56.5 23.5T880-800v480q0 33-23.5 56.5T800-240H320Zm0-80h480v-480H320v480ZM160-80q-33 0-56.5-23.5T80-160v-560h80v560h560v80H160Zm160-720v480-480Z' },
    collage: { href: '/collage', label: 'Коллаж', iconClass: 'ic-orange', iconPath: 'M440-120H200q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h240v720Zm-80-80v-560H200v560h160Zm160-320v-320h240q33 0 56.5 23.5T840-760v240H520Zm80-80h160v-160H600v160Zm-80 480v-320h320v240q0 33-23.5 56.5T760-120H520Zm80-80h160v-160H600v160ZM360-480Zm240-120Zm0 240Z' },
    annotate: { href: '/annotate', label: 'Пометки на изображении', iconClass: 'ic-orange', iconPath: 'M240-120q-45 0-89-22t-71-58q26 0 53-20.5t27-59.5q0-50 35-85t85-35q50 0 85 35t35 85q0 66-47 113t-113 47Zm0-80q33 0 56.5-23.5T320-280q0-17-11.5-28.5T280-320q-17 0-28.5 11.5T240-280q0 23-5.5 42T220-202q5 2 10 2h10Zm230-160L360-470l358-358q11-11 27.5-11.5T774-828l54 54q12 12 12 28t-12 28L470-360Zm-190 80Z' },
    'gif-trim': { href: '/gif-trim', label: 'Вырезать GIF', iconClass: 'ic-blue', iconPath: 'M760-120 480-400l-94 94q8 15 11 32t3 34q0 66-47 113T240-80q-66 0-113-47T80-240q0-66 47-113t113-47q17 0 34 3t32 11l94-94-94-94q-15 8-32 11t-34 3q-66 0-113-47T80-720q0-66 47-113t113-47q66 0 113 47t47 113q0 17-3 34t-11 32l494 494v40H760ZM600-520l-80-80 240-240h120v40L600-520ZM296.5-663.5Q320-687 320-720t-23.5-56.5Q273-800 240-800t-56.5 23.5Q160-753 160-720t23.5 56.5Q207-640 240-640t56.5-23.5ZM494-466q6-6 6-14t-6-14q-6-6-14-6t-14 6q-6 6-6 14t6 14q6 6 14 6t14-6ZM296.5-183.5Q320-207 320-240t-23.5-56.5Q273-320 240-320t-56.5 23.5Q160-273 160-240t23.5 56.5Q207-160 240-160t56.5-23.5Z' },
    'video-gif': { href: '/video-gif', label: 'Видео ↔ GIF', iconClass: 'ic-orange', iconPath: 'm480-420 240-160-240-160v320Zm28 220h224q-7 26-24 42t-44 20L228-85q-33 5-59.5-15.5T138-154L85-591q-4-33 16-59t53-30l46-6v80l-36 5 54 437 290-36Zm-148-80q-33 0-56.5-23.5T280-360v-440q0-33 23.5-56.5T360-880h440q33 0 56.5 23.5T880-800v440q0 33-23.5 56.5T800-280H360Zm0-80h440v-440H360v440Zm220-220ZM218-164Z' },
    'gif-frames': { href: '/gif-frames', label: 'GIF в кадры', iconClass: 'ic-orange', iconPath: 'M360-400h400L622-580l-92 120-62-80-108 140Zm-40 160q-33 0-56.5-23.5T240-320v-480q0-33 23.5-56.5T320-880h480q33 0 56.5 23.5T880-800v480q0 33-23.5 56.5T800-240H320Zm0-80h480v-480H320v480ZM160-80q-33 0-56.5-23.5T80-160v-560h80v560h560v80H160Zm160-720v480-480Z' },
    'remove-background': { href: '/remove-background', label: 'Удалить фон', iconClass: 'ic-orange', iconPath: 'M120-574v-85l181-181h85L120-574Zm0-196v-70h70l-70 70Zm527 67q-10-11-21.5-21.5T602-743l97-97h85L647-703ZM220-361l77-77q7 11 14.5 20t16.5 17q-28 7-56.5 17.5T220-361Zm480-197v-2q0-19-3-37t-9-35l152-152v86L700-558ZM436-776l65-64h85l-64 64q-11-2-21-3t-21-1q-11 0-22 1t-22 3ZM120-375v-85l144-144q-2 11-3 22t-1 22q0 11 1 21t3 20L120-375Zm709 83q-8-12-18.5-23T788-335l52-52v85l-11 10Zm-116-82q-7-3-14-5.5t-14-4.5q-9-3-17.5-6t-17.5-5l190-191v86L713-374Zm-233-26q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47Zm56.5-103.5Q560-527 560-560t-23.5-56.5Q513-640 480-640t-56.5 23.5Q400-593 400-560t23.5 56.5Q447-480 480-480t56.5-23.5ZM160-120v-71q0-34 17-63t47-44q51-26 115.5-44T480-360q76 0 140.5 18T736-298q30 15 47 44t17 63v71H160Zm81-80h478q-2-9-7-15.5T699-226q-36-18-91.5-36T480-280q-72 0-127.5 18T261-226q-8 4-13 11t-7 15Zm239 0Zm0-360Z' },
  };

  const CONTINUATION_MAP = {
    compress: ['resize', 'convert', 'crop', 'exif'],
    'gif-optimize': ['gif-trim', 'gif-frames', 'video-gif', 'resize'],
    resize: ['compress', 'crop', 'convert', 'watermark'],
    convert: ['compress', 'resize', 'exif', 'pdf'],
    watermark: ['compress', 'resize', 'convert', 'pdf'],
    crop: ['resize', 'compress', 'effects', 'watermark'],
    rotate: ['crop', 'resize', 'compress', 'watermark'],
    effects: ['compress', 'resize', 'watermark', 'meme'],
    meme: ['compress', 'resize', 'annotate', 'watermark'],
    split: ['compress', 'resize', 'pdf', 'collage'],
    base64: ['compress', 'convert', 'resize', 'favicon'],
    blur: ['crop', 'annotate', 'compress', 'watermark'],
    pdf: ['compress', 'resize', 'convert', 'collage'],
    collage: ['compress', 'resize', 'watermark', 'pdf'],
    annotate: ['compress', 'resize', 'watermark', 'pdf'],
    'gif-trim': ['gif-optimize', 'video-gif', 'gif-frames', 'resize'],
    'video-gif': ['gif-optimize', 'gif-trim', 'gif-frames', 'resize'],
    'gif-frames': ['video-gif', 'gif-trim', 'collage', 'pdf'],
    round: ['compress', 'resize', 'watermark', 'convert'],
    pixelate: ['compress', 'resize', 'effects', 'meme'],
    exif: ['compress', 'resize', 'convert', 'watermark'],
    favicon: ['resize', 'crop', 'convert', 'palette'],
    palette: ['effects', 'meme', 'collage', 'annotate'],
    'remove-background': ['crop', 'resize', 'watermark', 'collage'],
  };

  let screen = null;
  let toolPage = null;
  let legacyArea = null;
  let legacyObserver = null;
  let scheduled = false;
  let previewModal = null;
  let previewConfig = null;
  let previewIndex = 0;
  let previewObjectUrls = [];
  let previewHistoryClosing = false;

  function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function translate(value) {
    return window.AKDI18n?.t(value) || value;
  }

  function isBrowserImage(value) {
    if (!(value instanceof Blob)) return Boolean(value);
    const type = (value.type || '').toLowerCase();
    return type.startsWith('image/') && !/hei[cf]/.test(type);
  }

  function elementPreviewSource(element) {
    if (!element) return null;
    if (element instanceof HTMLCanvasElement) {
      try {
        return element.toDataURL('image/png');
      } catch {
        return null;
      }
    }
    if (element instanceof HTMLVideoElement) return element.currentSrc || element.src || null;
    if (element instanceof HTMLImageElement) return element.currentSrc || element.src || null;
    return null;
  }

  function normalizePreview(config) {
    if (!config) return null;
    const mode = config.mode === 'compare' ? 'compare' : 'single';
    const sourceItems = config.items || [config];
    const items = sourceItems.map(item => ({
      before: item.before || null,
      after: item.after || item.src || null,
      label: item.label || '',
      media: item.media || (item.after instanceof Blob && item.after.type.startsWith('video/') ? 'video' : 'image'),
    })).filter(item => {
      if (item.media === 'video') return mode === 'single' && Boolean(item.after);
      if (!isBrowserImage(item.after)) return false;
      return mode !== 'compare' || isBrowserImage(item.before);
    });
    return items.length ? { mode, items } : null;
  }

  function resolveLegacyPreview(area) {
    const explicit = normalizePreview(area?._resultPreview);
    if (explicit) return explicit;

    const slug = currentToolSlug();
    const mode = PREVIEW_MODES[slug];
    if (!mode) return null;

    const rows = Array.from(toolPage.querySelectorAll('.file-list .file-item'));
    const items = rows.map(row => ({
      before: row._sourcePreview || row.querySelector('img.file-item__thumb')?.src || row._sourceFile || null,
      after: row._resultBlob || null,
      label: row._resultFilename || row.querySelector('.file-item__name')?.textContent.trim() || '',
    })).filter(item => isBrowserImage(item.after) && (mode !== 'compare' || isBrowserImage(item.before)));
    if (items.length) return normalizePreview({ mode, items });

    const resultImage = area.querySelector('#result-img, #result-preview, #preview, #result-gif:not(.hidden), img:not(.hidden)');
    const resultVideo = area.querySelector('#result-video:not(.hidden), video:not(.hidden)');
    const after = elementPreviewSource(resultImage || resultVideo);
    if (!after) return null;

    if (mode === 'compare') {
      const sourceImage = toolPage.querySelector('#compare-source, #source-img, #source-preview');
      const before = elementPreviewSource(sourceImage);
      if (!before) return null;
      return normalizePreview({ mode, before, after });
    }
    return normalizePreview({ mode, after, media: resultVideo && !resultImage ? 'video' : 'image' });
  }

  function ensurePreviewModal() {
    if (previewModal?.isConnected) return previewModal;
    previewModal = createElement('div', 'modal-overlay result-preview-overlay hidden');
    previewModal.setAttribute('role', 'dialog');
    previewModal.setAttribute('aria-modal', 'true');
    previewModal.setAttribute('aria-labelledby', 'result-preview-title');
    previewModal.innerHTML = `
      <div class="modal result-preview-modal">
        <div class="modal__head result-preview-modal__head">
          <div>
            <h3 id="result-preview-title">Предпросмотр</h3>
            <div class="result-preview-modal__counter hidden" aria-live="polite"></div>
          </div>
          <button class="modal__close result-preview-modal__close" type="button" aria-label="Закрыть">×</button>
        </div>
        <div class="modal__body result-preview-modal__body">
          <div class="result-preview-modal__stage">
            <div class="result-preview-media preview-canvas--checker">
              <img class="result-preview-media__after" alt="Результат">
              <video class="result-preview-media__video hidden" controls playsinline></video>
              <div class="result-preview-media__before">
                <img alt="Исходное изображение">
              </div>
              <div class="result-preview-media__divider" aria-hidden="true"><span>↔</span></div>
              <input class="result-preview-media__range" type="range" min="0" max="100" value="50" aria-label="Сравнить исходное изображение и результат">
            </div>
          </div>
          <div class="result-preview-modal__labels hidden" aria-hidden="true"><span>До</span><span>После</span></div>
          <div class="result-preview-modal__navigation hidden">
            <button class="btn btn-secondary result-preview-modal__previous" type="button">Назад</button>
            <span class="result-preview-modal__filename"></span>
            <button class="btn btn-secondary result-preview-modal__next" type="button">Далее</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(previewModal);

    const close = () => requestClosePreview();
    previewModal.querySelector('.result-preview-modal__close').addEventListener('click', close);
    previewModal.addEventListener('click', event => {
      if (event.target === previewModal) close();
    });
    previewModal.querySelector('.result-preview-media__range').addEventListener('input', event => {
      previewModal.querySelector('.result-preview-media').style.setProperty('--preview-position', `${event.target.value}%`);
    });
    previewModal.querySelector('.result-preview-modal__previous').addEventListener('click', () => renderPreviewItem(previewIndex - 1));
    previewModal.querySelector('.result-preview-modal__next').addEventListener('click', () => renderPreviewItem(previewIndex + 1));
    document.addEventListener('keydown', event => {
      if (previewModal?.classList.contains('hidden')) return;
      if (event.key === 'Escape') close();
      if (event.key === 'ArrowLeft' && previewConfig?.items.length > 1 && event.target.type !== 'range') renderPreviewItem(previewIndex - 1);
      if (event.key === 'ArrowRight' && previewConfig?.items.length > 1 && event.target.type !== 'range') renderPreviewItem(previewIndex + 1);
    });
    window.addEventListener('popstate', event => {
      previewHistoryClosing = false;
      const shouldOpen = Boolean(event.state?.[PREVIEW_HISTORY_KEY]);
      const isOpen = !previewModal.classList.contains('hidden');
      if (shouldOpen && !isOpen && previewConfig) {
        openPreview(previewConfig, { fromHistory: true });
      } else if (!shouldOpen && isOpen) {
        closePreview();
      }
    });
    return previewModal;
  }

  function releasePreviewUrls() {
    previewObjectUrls.forEach(url => URL.revokeObjectURL(url));
    previewObjectUrls = [];
  }

  function previewUrl(value) {
    if (value instanceof Blob) {
      const url = URL.createObjectURL(value);
      previewObjectUrls.push(url);
      return url;
    }
    return String(value || '');
  }

  function renderPreviewItem(index) {
    if (!previewConfig?.items.length) return;
    releasePreviewUrls();
    const count = previewConfig.items.length;
    previewIndex = (index + count) % count;
    const item = previewConfig.items[previewIndex];
    const modal = ensurePreviewModal();
    const media = modal.querySelector('.result-preview-media');
    const afterImage = media.querySelector('.result-preview-media__after');
    const afterVideo = media.querySelector('.result-preview-media__video');
    const beforeImage = media.querySelector('.result-preview-media__before img');
    const range = media.querySelector('.result-preview-media__range');
    const compare = previewConfig.mode === 'compare';

    const isVideo = item.media === 'video';
    const afterUrl = previewUrl(item.after);
    afterImage.classList.toggle('hidden', isVideo);
    afterVideo.classList.toggle('hidden', !isVideo);
    afterImage.src = isVideo ? '' : afterUrl;
    afterVideo.src = isVideo ? afterUrl : '';
    beforeImage.src = compare ? previewUrl(item.before) : '';
    media.classList.toggle('is-single', !compare);
    media.classList.remove('is-portrait');
    modal.querySelector('.result-preview-modal__labels').classList.toggle('hidden', !compare);
    range.value = '50';
    media.style.setProperty('--preview-position', '50%');

    const applyImageAspect = () => {
      if (!afterImage.naturalWidth || !afterImage.naturalHeight) return;
      const ratio = afterImage.naturalWidth / afterImage.naturalHeight;
      media.style.setProperty('--preview-ratio', String(ratio));
      media.classList.toggle('is-portrait', ratio < 1);
    };
    const applyVideoAspect = () => {
      if (!afterVideo.videoWidth || !afterVideo.videoHeight) return;
      const ratio = afterVideo.videoWidth / afterVideo.videoHeight;
      media.style.setProperty('--preview-ratio', String(ratio));
      media.classList.toggle('is-portrait', ratio < 1);
    };
    if (isVideo) afterVideo.addEventListener('loadedmetadata', applyVideoAspect, { once: true });
    else if (afterImage.complete) applyImageAspect();
    else afterImage.addEventListener('load', applyImageAspect, { once: true });

    const multiple = count > 1;
    const navigation = modal.querySelector('.result-preview-modal__navigation');
    const counter = modal.querySelector('.result-preview-modal__counter');
    navigation.classList.toggle('hidden', !multiple);
    counter.classList.toggle('hidden', !multiple);
    counter.textContent = multiple ? `${previewIndex + 1} / ${count}` : '';
    navigation.querySelector('.result-preview-modal__filename').textContent = item.label || `${translate('Изображение')} ${previewIndex + 1}`;
  }

  function openPreview(config, { fromHistory = false } = {}) {
    previewConfig = normalizePreview(config);
    if (!previewConfig) return;
    const modal = ensurePreviewModal();
    const isOpen = !modal.classList.contains('hidden');
    if (!fromHistory && !isOpen && !history.state?.[PREVIEW_HISTORY_KEY]) {
      try {
        const currentState = history.state && typeof history.state === 'object' ? history.state : {};
        history.pushState({ ...currentState, [PREVIEW_HISTORY_KEY]: true }, '', window.location.href);
      } catch {
        /* Preview still works when browser history is unavailable. */
      }
    }
    previewHistoryClosing = false;
    modal.querySelector('#result-preview-title').textContent = previewConfig.mode === 'compare'
      ? 'Сравнение до и после'
      : 'Предпросмотр результата';
    renderPreviewItem(0);
    modal.classList.remove('hidden');
    modal.querySelector('.result-preview-modal__close').focus({ preventScroll: true });
  }

  function closePreview() {
    if (!previewModal) return;
    const video = previewModal.querySelector('.result-preview-media__video');
    video.pause();
    video.removeAttribute('src');
    video.load();
    previewModal.classList.add('hidden');
    releasePreviewUrls();
  }

  function requestClosePreview() {
    if (!previewModal || previewModal.classList.contains('hidden') || previewHistoryClosing) return;
    if (history.state?.[PREVIEW_HISTORY_KEY]) {
      previewHistoryClosing = true;
      history.back();
      return;
    }
    closePreview();
  }

  function ensureScreen() {
    if (screen?.isConnected) return screen;
    toolPage = document.querySelector('main .tool-page');
    if (!toolPage) return null;

    screen = createElement('section', 'container container--narrow result-flow hidden');
    screen.setAttribute('aria-live', 'polite');
    screen.innerHTML = `
      <div class="result-flow__hero">
        <div class="result-flow__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="m5 12.5 4.25 4.25L19 7"/></svg>
        </div>
        <h1 class="result-flow__title" tabindex="-1"></h1>
        <p class="result-flow__description"></p>
        <button class="btn btn-primary btn-lg result-flow__download" type="button"></button>
        <div class="result-flow__secondary"></div>
      </div>
      <div class="result-flow__stats hidden"></div>
      <div class="result-flow__actions">
        <button class="btn btn-secondary result-flow__back" type="button">Вернуться к настройкам</button>
        <button class="btn btn-secondary result-flow__restart" type="button">Обработать ещё</button>
        <button class="btn btn-secondary result-flow__preview hidden" type="button">Предпросмотр</button>
      </div>
      <section class="result-flow__continue">
        <h2>Продолжить работу</h2>
        <div class="result-flow__suggestions"></div>
      </section>
    `;
    toolPage.insertAdjacentElement('afterend', screen);
    return screen;
  }

  function readStats(source) {
    if (!source) return [];
    return Array.from(source.querySelectorAll('.stat-card')).map(card => ({
      label: card.querySelector('.stat-card__label')?.textContent.trim() || '',
      value: card.querySelector('.stat-card__value')?.textContent.trim() || '',
      accent: card.classList.contains('stat-green'),
    })).filter(stat => stat.label || stat.value);
  }

  function renderStats(stats = []) {
    const container = screen.querySelector('.result-flow__stats');
    container.replaceChildren();
    container.classList.toggle('hidden', !stats.length);
    stats.forEach(stat => {
      const card = createElement('div', 'result-flow__stat' + (stat.accent ? ' is-accent' : ''));
      card.append(
        createElement('div', 'result-flow__stat-label', stat.label),
        createElement('div', 'result-flow__stat-value', stat.value)
      );
      container.appendChild(card);
    });
  }

  function currentToolSlug() {
    const path = window.location.pathname.replace(/\/$/, '');
    const lastSegment = path.split('/').filter(Boolean).pop() || '';
    return lastSegment.replace(/\.html$/i, '');
  }

  function suggestionItems(suggestions) {
    const currentTool = currentToolSlug();
    const source = suggestions || CONTINUATION_MAP[currentTool] || Object.keys(TOOL_CATALOG);
    const resolved = source
      .map(item => typeof item === 'string' ? TOOL_CATALOG[item] : item)
      .filter(Boolean)
      .filter(item => item.href !== `/${currentTool}`);

    const unique = [];
    const used = new Set();
    resolved.forEach(item => {
      if (used.has(item.href)) return;
      used.add(item.href);
      unique.push(item);
    });

    if (unique.length < 4) {
      Object.values(TOOL_CATALOG).forEach(item => {
        if (item.href === `/${currentTool}` || used.has(item.href)) return;
        used.add(item.href);
        unique.push(item);
      });
    }

    return unique.slice(0, 4);
  }

  function renderSuggestions(suggestions) {
    const items = suggestionItems(suggestions);
    const container = screen.querySelector('.result-flow__suggestions');
    container.replaceChildren();
    items.forEach(item => {
      const link = createElement('a', 'result-flow__suggestion');
      link.href = item.href;
      const content = createElement('span', 'result-flow__suggestion-content');
      if (item.iconPath) {
        const icon = createElement('span', `result-flow__suggestion-icon ${item.iconClass || ''}`.trim());
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        svg.setAttribute('viewBox', '0 -960 960 960');
        svg.setAttribute('aria-hidden', 'true');
        path.setAttribute('d', item.iconPath);
        svg.appendChild(path);
        icon.appendChild(svg);
        content.appendChild(icon);
      }
      content.appendChild(createElement('span', 'result-flow__suggestion-label', item.label));
      link.append(
        content,
        createElement('span', 'result-flow__suggestion-arrow', '→')
      );
      container.appendChild(link);
    });
  }

  async function runAction(button, action) {
    if (!action || button.disabled) return;
    const label = button.textContent;
    button.disabled = true;
    button.innerHTML = '<span class="spinner"></span> Подготовка...';
    try {
      await action();
    } catch (error) {
      console.error(error);
      Toast.error(error.message || 'Не удалось скачать результат.');
    } finally {
      button.disabled = false;
      button.textContent = label;
    }
  }

  function hide({ clearLegacy = false } = {}) {
    if (!screen || !toolPage) return;
    requestClosePreview();
    previewConfig = null;
    screen.classList.add('hidden');
    toolPage.classList.remove('hidden');
    document.body.classList.remove('result-flow-open');
    if (clearLegacy) {
      if (legacyArea) legacyArea.classList.remove('visible');

      toolPage.querySelectorAll('.file-list .dl-btn').forEach((button) => button.remove());
      toolPage.querySelectorAll('.file-list .file-item').forEach((row) => {
        delete row._resultBlob;
        delete row._resultFilename;
      });
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function show(options = {}) {
    if (!ensureScreen()) return;
    const {
      title = 'Результат готов!',
      description = 'Обработка завершена. Результат готов к скачиванию.',
      downloadLabel = 'Скачать результат',
      onDownload,
      secondaryActions = [],
      stats = [],
      restartLabel = 'Обработать ещё',
      backLabel = 'Вернуться к настройкам',
      onRestart,
      onBack,
      suggestions,
      sourceArea = null,
      manualSource = true,
      preview = null,
    } = options;

    // Tools that call ResultFlow directly own their result area. Legacy tools pass
    // manualSource: false so the observer remains available for later processing runs.
    if (sourceArea && manualSource) sourceArea.dataset.resultFlow = 'manual';
    legacyArea = sourceArea;
    const titleElement = screen.querySelector('.result-flow__title');
    const descriptionElement = screen.querySelector('.result-flow__description');
    const downloadButton = screen.querySelector('.result-flow__download');
    const previewButton = screen.querySelector('.result-flow__preview');
    const secondary = screen.querySelector('.result-flow__secondary');
    const backButton = screen.querySelector('.result-flow__back');
    const restartButton = screen.querySelector('.result-flow__restart');

    titleElement.textContent = title;
    descriptionElement.textContent = description;
    downloadButton.textContent = downloadLabel;
    downloadButton.classList.toggle('hidden', typeof onDownload !== 'function');
    downloadButton.onclick = () => runAction(downloadButton, onDownload);

    previewConfig = normalizePreview(preview);
    previewButton.classList.toggle('hidden', !previewConfig);
    previewButton.textContent = previewConfig?.mode === 'compare' ? 'Сравнить до и после' : 'Предпросмотр';
    previewButton.onclick = () => openPreview(previewConfig);

    secondary.replaceChildren();
    secondary.classList.toggle('hidden', !secondaryActions.length);
    secondaryActions.forEach(action => {
      const button = createElement('button', 'btn btn-secondary', action.label);
      button.type = 'button';
      button.addEventListener('click', () => runAction(button, action.onClick));
      secondary.appendChild(button);
    });

    renderStats(stats);
    renderSuggestions(suggestions);

    backButton.textContent = backLabel;
    backButton.onclick = () => {
      hide({ clearLegacy: true });
      if (onBack) onBack();
    };
    restartButton.textContent = restartLabel;
    restartButton.onclick = () => {
      if (onRestart) {
        hide({ clearLegacy: true });
        onRestart();
      } else {
        window.location.reload();
      }
    };

    toolPage.classList.add('hidden');
    screen.classList.remove('hidden');
    document.body.classList.add('result-flow-open');
    window.scrollTo({ top: 0, behavior: 'auto' });
    requestAnimationFrame(() => titleElement.focus({ preventScroll: true }));
  }

  function legacyDownloadTarget(area) {
    const areaButtons = Array.from(area.querySelectorAll('button[id^="download"], .result-download'));
    const visibleButton = areaButtons.find(button => !button.classList.contains('hidden') && !button.hidden);
    if (visibleButton) return visibleButton;

    const fileButtons = Array.from(toolPage.querySelectorAll('.file-list .dl-btn'));
    if (fileButtons.length === 1) return fileButtons[0];
    return areaButtons[0] || null;
  }

  function triggerLegacyDownload(target) {
    return new Promise(resolve => {
      target.click();
      let checks = 0;
      const check = () => {
        checks++;
        if (!target.disabled || checks > 3000) {
          resolve();
          return;
        }
        setTimeout(check, 100);
      };
      setTimeout(check, 50);
    });
  }

  function showLegacy(area) {
    if (area.dataset.resultFlow === 'manual') return;
    if (!area.classList.contains('visible')) return;
    if (!ensureScreen()) return;
    const target = legacyDownloadTarget(area);
    if (!target) return;
    const fileDownloads = toolPage.querySelectorAll('.file-list .dl-btn').length;
    const isMultiple = fileDownloads > 1 || /ZIP/i.test(target.textContent);
    let downloadLabel = target.textContent.trim() || 'Скачать результат';
    if (target.classList.contains('dl-btn')) downloadLabel = 'Скачать изображение';

    show({
      title: 'Результат готов!',
      description: isMultiple
        ? 'Обработка завершена. Файлы готовы к скачиванию.'
        : 'Обработка завершена. Файл готов к скачиванию.',
      downloadLabel,
      onDownload: () => triggerLegacyDownload(target),
      stats: readStats(area.querySelector('#result-stats, .result-stats')),
      sourceArea: area,
      manualSource: false,
      preview: resolveLegacyPreview(area),
    });
  }

  function scheduleLegacy(area) {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => {
      scheduled = false;
      showLegacy(area);
    });
  }

  function initLegacyObserver() {
    const area = document.getElementById('result-area');
    if (!area || area.dataset.resultFlow === 'manual') return;
    legacyObserver?.disconnect();
    legacyObserver = new MutationObserver(() => {
      if (area.dataset.resultFlow === 'manual') return;
      if (area.classList.contains('visible')) scheduleLegacy(area);
      else if (screen && !screen.classList.contains('hidden') && legacyArea === area) hide();
    });
    legacyObserver.observe(area, { attributes: true, attributeFilter: ['class'] });
    if (area.classList.contains('visible')) scheduleLegacy(area);
  }

  return { show, hide, readStats, initLegacyObserver };
})();

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

  function qualityToPaletteSize(quality) {
    const value = normalizeQuality(quality);
    if (value >= 0.9) return 256;
    if (value >= 0.7) return 128;
    if (value >= 0.5) return 64;
    if (value >= 0.3) return 32;
    if (value >= 0.15) return 16;
    return 8;
  }

  function optimizationPaletteSizes(quality) {
    const first = qualityToPaletteSize(quality);
    const fallback = Math.max(8, first / 2);
    return first === fallback ? [first] : [first, fallback];
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
    const paletteSize = Number(config.paletteSize) || 0;
    const dither = config.dither === undefined ? quality < 0.98 : Boolean(config.dither);
    const encoder = new library.Encoder({
      width: config.width,
      height: config.height,
      workerUrl: workerUrl(),
      ...(paletteSize ? {
        colorTableSize: paletteSize,
        maxColors: paletteSize - 1,
      } : {
        maxColors: qualityToColors(quality),
      }),
      dither: dither ? 'floyd-steinberg' : undefined,
      ditherTransparency: 'floyd-steinberg',
      looped: config.looped,
      loopCount: config.loopCount,
    });

    for (let index = 0; index < frames.length; index++) {
      const frame = frames[index];
      const sourceCanvas = frameCanvas(frame);
      if (config.releaseFrameData) frame.data = null;
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
      releaseFrameData: true,
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

  async function optimize(file, options = {}) {
    const onProgress = typeof options.onProgress === 'function'
      ? options.onProgress
      : () => {};
    onProgress(5);

    const decoded = await decode(file);
    onProgress(25);

    const paletteSizes = optimizationPaletteSizes(options.quality);
    const requestedQuality = normalizeQuality(options.quality);
    const targetSaving = requestedQuality >= 0.9 ? 0.02 : requestedQuality >= 0.7 ? 0.08 : 0.15;
    let best = {
      blob: file,
      paletteSize: 256,
      optimized: false,
    };

    for (let attempt = 0; attempt < paletteSizes.length; attempt++) {
      const paletteSize = paletteSizes[attempt];
      const blob = await encodeFrames(decoded.library, {
        width: decoded.gif.width,
        height: decoded.gif.height,
        quality: options.quality,
        paletteSize,
        dither: false,
        looped: decoded.gif.looped === true,
        loopCount: decoded.gif.loopCount || 0,
      }, decoded.frames, ({ sourceCanvas }) => sourceCanvas, progress => {
        const start = 25 + Math.round((attempt / paletteSizes.length) * 70);
        const span = Math.ceil(70 / paletteSizes.length);
        onProgress(Math.min(95, start + Math.round((progress / 100) * span)));
      });

      if (blob.size < best.blob.size) {
        best = { blob, paletteSize, optimized: true };
      }
      if (blob.size <= file.size * (1 - targetSaving)) break;
    }

    decoded.frames.forEach(frame => { frame.data = null; });
    onProgress(100);
    return {
      ...best,
      width: decoded.gif.width,
      height: decoded.gif.height,
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
    optimize,
    trim,
    extractFrames,
    createTimelinePreview,
    encodeCanvas,
    qualityToColors,
    qualityToPaletteSize,
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

    worker = new Worker('/js/image-worker.js?v=3', { type: 'module' });
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

      const mode = task.mode || 'blur';
      const area = {
        x: Math.max(0, Math.round(Number(task.area.x) || 0)),
        y: Math.max(0, Math.round(Number(task.area.y) || 0)),
        width: Math.max(1, Math.round(Number(task.area.width) || 1)),
        height: Math.max(1, Math.round(Number(task.area.height) || 1)),
      };

      if (mode === 'black') {
        context.fillStyle = '#000000';
        context.fillRect(area.x, area.y, area.width, area.height);
        return;
      }

      if (mode === 'pixelate') {
        const pixelSize = Math.max(1, Number(task.pixelSize) || 16);
        const smallWidth = Math.max(1, Math.ceil(area.width / pixelSize));
        const smallHeight = Math.max(1, Math.ceil(area.height / pixelSize));
        const pixelCanvas = document.createElement('canvas');
        pixelCanvas.width = smallWidth;
        pixelCanvas.height = smallHeight;
        pixelCanvas.getContext('2d').drawImage(
          image,
          area.x, area.y, area.width, area.height,
          0, 0, smallWidth, smallHeight
        );
        context.save();
        context.imageSmoothingEnabled = false;
        context.drawImage(
          pixelCanvas,
          0, 0, smallWidth, smallHeight,
          area.x, area.y, area.width, area.height
        );
        context.restore();
        return;
      }

      const blurredCanvas = document.createElement('canvas');
      blurredCanvas.width = canvas.width;
      blurredCanvas.height = canvas.height;
      const blurredContext = blurredCanvas.getContext('2d');
      blurredContext.filter = `blur(${Math.max(0, Number(task.radius) || 0)}px)`;
      blurredContext.drawImage(image, 0, 0);
      context.save();
      context.beginPath();
      context.rect(area.x, area.y, area.width, area.height);
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


/* Dropbox file chooser */
const DropboxChooser = (() => {
  const APP_KEY = '15uli8qpuutiafj';
  const SCRIPT_ID = 'dropboxjs';
  const SCRIPT_URL = 'https://www.dropbox.com/static/api/2/dropins.js';
  let loader = null;

  function load() {
    if (window.Dropbox) return Promise.resolve(window.Dropbox);
    if (loader) return loader;

    loader = new Promise((resolve, reject) => {
      const existing = document.getElementById(SCRIPT_ID);
      if (existing) {
        existing.addEventListener('load', () => resolve(window.Dropbox), { once: true });
        existing.addEventListener('error', () => reject(new Error('Dropbox недоступен')), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = SCRIPT_URL;
      script.async = true;
      script.dataset.appKey = APP_KEY;
      const rejectUnavailable = () => {
        script.remove();
        reject(new Error('Dropbox недоступен'));
      };
      script.onload = () => window.Dropbox
        ? resolve(window.Dropbox)
        : rejectUnavailable();
      script.onerror = rejectUnavailable;
      document.head.appendChild(script);
    }).catch(error => {
      loader = null;
      throw error;
    });

    return loader;
  }

  return { load };
})();

let uploadSourceIconIndex = 0;

window.addEventListener('akd-languagechange', () => {
  const label = window.AKDI18n?.t?.('Скоро') || 'Скоро';
  document.querySelectorAll('.upload-source-tooltip').forEach(tooltip => {
    tooltip.dataset.tooltip = label;
  });
});

/* Dropzone */
class Dropzone {
  constructor(el, opts = {}) {
    this.el   = el;
    this.opts = { multiple: true, accept: [], ...opts };
    this._bind();
  }

  _bind() {
    const el = this.el;
    const sources = this._createUploadSources();
    const dropboxButton = sources.querySelector('.upload-source__button--dropbox');
    el.insertAdjacentElement('afterend', sources);
    if (navigator.onLine !== false) DropboxChooser.load().catch(() => {});

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

    dropboxButton.addEventListener('click', async event => {
      event.preventDefault();
      event.stopPropagation();
      await this._chooseDropbox(dropboxButton);
    });
  }

  _createUploadSources() {
    const wrapper = document.createElement('div');
    wrapper.className = 'upload-sources';

    const iconId = `google-drive-icon-${++uploadSourceIconIndex}`;
    wrapper.innerHTML = `
      <button class="upload-source__button upload-source__button--dropbox" type="button" aria-label="Открыть Dropbox">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 1.807 0 5.629l6 3.822 6.001-3.822L6 1.807Zm12 0-6 3.822 6 3.822 6-3.822-6-3.822ZM0 13.274l6 3.822 6.001-3.822L6 9.452 0 13.274ZM18 9.452l-6 3.822 6 3.822 6-3.822-6-3.822ZM6 18.371l6.001 3.822 6-3.822-6-3.822L6 18.371Z"/></svg>
        <span>Dropbox</span>
      </button>
      <span class="upload-source-tooltip" data-tooltip="${window.AKDI18n?.t?.('Скоро') || 'Скоро'}">
        <button class="upload-source__button upload-source__button--coming" type="button" disabled aria-label="Google Drive">
          <svg viewBox="0 0 192 192" fill="none" aria-hidden="true">
            <mask id="${iconId}-a" width="168" height="154" x="12" y="18" maskUnits="userSpaceOnUse" style="mask-type:alpha"><path fill="#b43333" d="M63.09 37c14.626-25.333 51.193-25.334 65.819 0l45.033 78c14.626 25.334-3.657 57.001-32.91 57.001H50.967c-29.253 0-47.536-31.667-32.91-57.001z"/></mask>
            <g mask="url(#${iconId}-a)"><path fill="url(#${iconId}-b)" d="M206.905 172.02h-91.888l-19.015-32.934 45.944-79.578z"/><path fill="url(#${iconId}-c)" d="M-14.919 172.006 50.04 59.494v.002L31.032 92.422h38.02L115 172.004l-129.918.001z"/><path fill="url(#${iconId}-d)" d="M96.007-20.085 141.954 59.5l-19.011 32.928H31.048z"/></g>
            <defs><linearGradient id="${iconId}-b" x1="193.6" x2="103.09" y1="165.6" y2="111.21" gradientUnits="userSpaceOnUse"><stop offset=".09" stop-color="#ffe921"/><stop offset="1" stop-color="#fec700"/></linearGradient><linearGradient id="${iconId}-c" x1="114.4" x2="15.53" y1="181.61" y2="121.8" gradientUnits="userSpaceOnUse"><stop offset=".15" stop-color="#a9a8ff"/><stop offset=".33" stop-color="#6d97ff"/><stop offset=".48" stop-color="#3186ff"/></linearGradient><linearGradient id="${iconId}-d" x1="128.88" x2="28.7" y1="37.88" y2="84.64" gradientUnits="userSpaceOnUse"><stop offset=".55" stop-color="#0ebc5f"/><stop offset=".85" stop-color="#78c9ff"/></linearGradient></defs>
          </svg>
          <span>Google Drive</span>
        </button>
      </span>
    `;
    return wrapper;
  }

  _dropboxExtensions() {
    const mimeExtensions = {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'image/avif': ['.avif'],
      'image/gif': ['.gif'],
      'image/heic': ['.heic'],
      'image/heif': ['.heif'],
      'image/svg+xml': ['.svg'],
      'image/bmp': ['.bmp'],
    };
    const extensions = this.opts.accept.flatMap(type => {
      if (type === 'image/*') return ['images'];
      return mimeExtensions[type] || [];
    });
    return extensions.length ? [...new Set(extensions)] : ['images'];
  }

  async _chooseDropbox(button) {
    if (button.disabled) return;
    if (navigator.onLine === false) {
      Toast.error(window.AKDI18n?.t?.('Для Dropbox требуется подключение к интернету.') || 'Для Dropbox требуется подключение к интернету.');
      return;
    }
    button.disabled = true;
    button.classList.add('is-loading');

    try {
      const Dropbox = await DropboxChooser.load();
      if (!Dropbox || typeof Dropbox.choose !== 'function') {
        throw new Error('Dropbox недоступен');
      }
      if (typeof Dropbox.isBrowserSupported === 'function' && !Dropbox.isBrowserSupported()) {
        throw new Error('Dropbox недоступен');
      }

      await new Promise((resolve, reject) => {
        Dropbox.choose({
          linkType: 'direct',
          multiselect: this.opts.multiple,
          extensions: this._dropboxExtensions(),
          success: async entries => {
            try {
              const selected = this.opts.multiple ? entries : entries.slice(0, 1);
              const files = await Promise.all(selected.map(entry => this._downloadDropboxFile(entry)));
              await this._handle(files);
              resolve();
            } catch (error) {
              reject(error);
            }
          },
          cancel: resolve,
        });
      });
    } catch (error) {
      console.error(error);
      Toast.error(error.message === 'Dropbox недоступен'
        ? 'Dropbox пока недоступен. Попробуйте ещё раз.'
        : 'Не удалось получить файлы из Dropbox.');
    } finally {
      button.disabled = false;
      button.classList.remove('is-loading');
    }
  }

  async _downloadDropboxFile(entry) {
    const response = await fetch(entry.link, { credentials: 'omit' });
    if (!response.ok) throw new Error('Не удалось получить файл из Dropbox');
    const blob = await response.blob();
    const name = entry.name || 'dropbox-file';
    return new File([blob], name, { type: blob.type });
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
    if (accepted.length) await this.opts.onFiles(accepted);
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
        row._sourcePreview = src;
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
    row._sourceFile = file;
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
    dl.dataset.resultFilename = filename;
    row._resultBlob = blob;
    row._resultFilename = filename;
    dl.addEventListener('click', event => event.stopPropagation());
    info.appendChild(dl);
  }
}

ResultFlow.initLegacyObserver();
