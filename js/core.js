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

  syncGifOutput(select, files) {
    if (!select) return;
    const hasGif = files.some(entry => FileUtils.isGif(entry.file || entry));
    if (hasGif) {
      select.value = select.querySelector('option[value="same"]') ? 'same' : 'image/gif';
    }
    select.disabled = hasGif;
    select.title = hasGif ? 'Анимированный GIF сохраняется только как GIF' : '';
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
  MAX_BATCH_FILES: 50,
  MAX_BATCH_SIZE: 250 * 1024 * 1024,
  MAX_ZIP_SIZE: 500 * 1024 * 1024,
  MAX_IMAGE_PIXELS: 40 * 1000 * 1000,
  MAX_IMAGE_SIDE: 16384,
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'],

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
    if (file?.type) return file.type.toLowerCase();
    const extension = this.getExt(file?.name || '');
    return {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      avif: 'image/avif',
      gif: 'image/gif',
    }[extension] || '';
  },

  getFormatLabel(file) {
    return {
      'image/jpeg': 'JPG',
      'image/png': 'PNG',
      'image/webp': 'WebP',
      'image/avif': 'AVIF',
      'image/gif': 'GIF',
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
    return selectedMime === 'same' ? this.getFileMime(file) : selectedMime;
  },

  extensionForMime(mime) {
    return {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/avif': 'avif',
      'image/gif': 'gif',
    }[mime] || 'png';
  },

  isGif(file) {
    return this.getFileMime(file) === 'image/gif';
  },

  isSupportedImage(file) {
    return this.SUPPORTED_IMAGE_TYPES.includes(this.getFileMime(file));
  },

  validateFile(file) {
    if (!(file instanceof Blob)) throw new Error('Некорректный файл');
    const limit = this.isGif(file) ? this.MAX_GIF_FILE_SIZE : this.MAX_FILE_SIZE;
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
      for (let offset = 8; offset + 4 <= boxSize; offset += 4) {
        const brand = String.fromCharCode(...bytes.slice(offset, offset + 4));
        if (brand === 'avif' || brand === 'avis') return 'image/avif';
      }
    }
    return '';
  },

  readAsDataURL(file) {
    this.validateFile(file);
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload  = e => res(e.target.result);
      r.onerror = () => rej(new Error('Не удалось прочитать файл'));
      r.readAsDataURL(file);
    });
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
      const sourceUrl = URL.createObjectURL(file);
      try {
        const image = await this.loadImage(sourceUrl);
        width = image.naturalWidth;
        height = image.naturalHeight;
      } finally {
        URL.revokeObjectURL(sourceUrl);
      }
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

    worker = new Worker('/js/image-worker.js?v=1', { type: 'module' });
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

    if (task.mimeType === 'image/jpeg') {
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

    if (canUseWorker()) {
      try {
        return await runInWorker(file, task, onProgress);
      } catch (error) {
        console.warn('Фоновая обработка недоступна, используется обычный Canvas.', error);
      }
    }

    return runOnMainThread(file, task, onProgress);
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
        : FileUtils.MAX_FILE_SIZE;
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

    if (file.type.startsWith('image/') && file.type !== 'image/svg+xml') {
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
