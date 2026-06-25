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


/* Modal */
const Modal = (() => {
  let overlay = null;

  function open(title, contentHTML) {
    overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal__head">
          <h3>${title}</h3>
          <button class="modal__close" aria-label="Закрыть">✕</button>
        </div>
        <div class="modal__body">${contentHTML}</div>
      </div>
    `;
    overlay.querySelector('.modal__close').onclick = close;
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
  }

  function close() {
    if (overlay) { overlay.remove(); overlay = null; }
    document.body.style.overflow = '';
  }

  return { open, close };
})();


/* UI */
const UIUtils = {
  setDisabled(elements, disabled) {
    elements.forEach(el => {
      if (el) el.disabled = disabled;
    });
  },

  setBatchLocked(manager, elements, locked) {
    this.setDisabled(elements, locked);
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

  showBatchResult(parts, count) {
    if (parts.resultArea) parts.resultArea.classList.add('visible');
    this.setVisible(parts.downloadAllBtn, count > 1);
  },
};


/* Files */
const FileUtils = {
  formatSize(bytes) {
    if (bytes < 1024)       return bytes + ' B';
    if (bytes < 1048576)    return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
  },

  formatPct(before, after) {
    if (before === 0) return '0%';
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

  isSupportedImage(file) {
    return ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
  },

  readAsDataURL(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload  = e => res(e.target.result);
      r.onerror = () => rej(new Error('Не удалось прочитать файл'));
      r.readAsDataURL(file);
    });
  },

  readAsArrayBuffer(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload  = e => res(e.target.result);
      r.onerror = () => rej(new Error('Не удалось прочитать файл'));
      r.readAsArrayBuffer(file);
    });
  },

  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 300);
  },

  downloadDataURL(dataURL, filename) {
    const a   = document.createElement('a');
    a.href     = dataURL;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => document.body.removeChild(a), 300);
  },

  loadImage(src) {
    return new Promise((res, rej) => {
      const img = new Image();
      img.onload  = () => res(img);
      img.onerror = () => rej(new Error('Не удалось загрузить изображение'));
      img.src = src;
    });
  },

  canvasToBlob(canvas, mimeType = 'image/jpeg', quality = 0.85) {
    return new Promise((res, rej) => {
      canvas.toBlob(b => b ? res(b) : rej(new Error('Ошибка canvas')), mimeType, quality);
    });
  },

  canvasForMime(canvas, mimeType) {
    if (mimeType !== 'image/jpeg') return canvas;

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
      const prefix = location.pathname.includes('/pages/') ? '../' : '';
      script.src = prefix + 'js/vendor/jszip.min.js';
      script.onload = () => resolve(window.JSZip);
      script.onerror = () => {
        window.__akdJSZipPromise = null;
        reject(new Error('Не удалось загрузить JSZip'));
      };
      document.head.appendChild(script);
    });

    return window.__akdJSZipPromise;
  },

  async downloadZip(entries, filename, successMessage = 'ZIP скачан.') {
    try {
      const JSZipCtor = await this.loadJSZip();
      const zip = new JSZipCtor();
      entries.forEach(entry => zip.file(entry.filename, entry.blob));
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

  _handle(files) {
    const list = Array.from(files);
    const valid = this.opts.accept.length
      ? list.filter(f => this.opts.accept.some(t => {
          if (t.endsWith('/*')) return f.type.startsWith(t.slice(0,-1));
          return f.type === t;
        }))
      : list;

    if (valid.length < list.length) {
      Toast.error('Некоторые файлы имеют неподдерживаемый формат.');
    }
    if (valid.length) this.opts.onFiles(valid);
  }
}

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
        <div class="file-item__meta">${FileUtils.formatSize(file.size)}</div>
        <div class="progress-bar hidden"><div class="progress-fill"></div></div>
      </div>
      <span class="file-item__status status-pending">Ожидание</span>
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

    if (file.type.startsWith('image/') && file.type !== 'image/svg+xml') {
      FileUtils.readAsDataURL(file).then(src => {
        const thumb = row.querySelector('.file-item__thumb');
        thumb.outerHTML = `<img class="file-item__thumb" src="${src}" alt="">`;
      });
    }

    const item = { id, file, el: row };
    this.items.push(item);
    if (this.selectedId === null) this.select(id, false);
    return item;
  }

  setStatus(id, label, cls) {
    const row = this.container.querySelector(`[data-id="${id}"]`);
    if (!row) return;
    const s = row.querySelector('.file-item__status');
    s.textContent = label;
    s.className   = 'file-item__status ' + cls;
  }

  setProgress(id, pct) {
    const row = this.container.querySelector(`[data-id="${id}"]`);
    if (!row) return;
    const bar = row.querySelector('.progress-bar');
    bar.classList.remove('hidden');
    bar.querySelector('.progress-fill').style.width = pct + '%';
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
