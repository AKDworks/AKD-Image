/* Toast notifications */
const Toast = (() => {
  let container = null;

  function getContainer() {
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
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


/* File utilities */
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

  async downloadZip(entries, filename, successMessage = 'ZIP скачан!') {
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


/* Dropzone helper */
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


/* File list manager */
class FileListManager {
  constructor(containerEl) {
    this.container = containerEl;
    this.items = [];
  }

  clear() {
    this.items = [];
    this.container.innerHTML = '';
  }

  add(file) {
    const id  = Date.now() + Math.random();
    const ext = FileUtils.getExt(file.name).toUpperCase();
    const row = document.createElement('div');
    row.className = 'file-item';
    row.dataset.id = id;
    row.innerHTML = `
      <div class="file-item__thumb-wrap">
        <div class="file-item__thumb" style="width:44px;height:44px;background:#E5E7EB;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:700;color:#6B7280;">${ext}</div>
      </div>
      <div class="file-item__info">
        <div class="file-item__name" title="${file.name}">${file.name}</div>
        <div class="file-item__meta">${FileUtils.formatSize(file.size)}</div>
        <div class="progress-bar hidden"><div class="progress-fill" style="width:0%"></div></div>
      </div>
      <span class="file-item__status status-pending">Ожидание</span>
      <button class="btn-icon remove-btn" title="Удалить">✕</button>
    `;
    this.container.appendChild(row);

    const btn = row.querySelector('.remove-btn');
    btn.onclick = () => {
      row.remove();
      this.items = this.items.filter(i => i.id !== id);
      this.container.dispatchEvent(new CustomEvent('file-removed', { detail: { id } }));
    };

    if (file.type.startsWith('image/') && file.type !== 'image/svg+xml') {
      FileUtils.readAsDataURL(file).then(src => {
        const thumb = row.querySelector('.file-item__thumb');
        thumb.outerHTML = `<img class="file-item__thumb" src="${src}" alt="">`;
      });
    }

    const item = { id, file, el: row };
    this.items.push(item);
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
    info.appendChild(dl);
  }
}


/* Mobile navigation */
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const nav    = document.querySelector('.site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => nav.classList.toggle('open'));
  }

  const current = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.site-nav a').forEach(a => {
    const href = a.getAttribute('href').split('/').pop();
    if (href === current) a.classList.add('active');
  });
});
