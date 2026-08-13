(() => {
  const dropzone = document.getElementById('dropzone');
  const fileInput = dropzone.querySelector('input[type="file"]');
  const settingsPanel = document.getElementById('settings-panel');
  const actionBar = document.getElementById('action-bar');
  const replaceFileBtn = document.getElementById('replace-file-btn');
  const sourcePreview = document.getElementById('source-preview');
  const sourceStats = document.getElementById('source-stats');
  const outputFormat = document.getElementById('output-format');
  const qualityGroup = document.getElementById('quality-group');
  const jpgQuality = document.getElementById('jpg-quality');
  const qualityValue = document.getElementById('quality-value');
  const extractBtn = document.getElementById('extract-btn');
  const statusPanel = document.getElementById('status-panel');
  const statusText = document.getElementById('status-text');
  const statusPercent = document.getElementById('status-percent');
  const progressBar = document.getElementById('progress-bar');
  const resultArea = document.getElementById('result-area');
  const resultSummary = document.getElementById('result-summary');
  const framesGrid = document.getElementById('frames-grid');
  const downloadAllBtn = document.getElementById('download-all-btn');

  let activeFile = null;
  let sourceUrl = null;
  let extractedFrames = [];

  function formatTime(milliseconds) {
    return `${(milliseconds / 1000).toFixed(2).replace('.', ',')} с`;
  }

  function baseName() {
    return FileUtils.safeFilename(activeFile?.name.replace(/\.[^.]+$/, '') || 'gif', 'gif');
  }

  function frameFilename(index, extension) {
    return `${baseName()}_frame-${String(index + 1).padStart(3, '0')}.${extension}`;
  }

  function clearExtractedFrames() {
    extractedFrames.forEach(frame => URL.revokeObjectURL(frame.url));
    extractedFrames = [];
    framesGrid.innerHTML = '';
    resultSummary.textContent = '';
    resultArea.classList.remove('visible');
  }

  function setProgress(value, text) {
    const progress = Math.max(0, Math.min(100, Math.round(value)));
    statusPercent.textContent = `${progress}%`;
    progressBar.style.width = `${progress}%`;
    if (text) statusText.textContent = text;
  }

  function resetSource() {
    clearExtractedFrames();
    activeFile = null;
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    sourceUrl = null;
    sourcePreview.removeAttribute('src');
    sourceStats.innerHTML = '';
    settingsPanel.classList.add('hidden');
    actionBar.classList.add('hidden');
    statusPanel.classList.add('hidden');
    dropzone.classList.remove('hidden');
  }

  async function setFile(file) {
    clearExtractedFrames();
    const details = await GifProcessor.inspect(file);
    activeFile = file;

    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    sourceUrl = URL.createObjectURL(file);
    sourcePreview.src = sourceUrl;
    sourceStats.innerHTML = `
      <div class="stat-card"><div class="stat-card__label">Кадров</div><div class="stat-card__value">${details.frameCount}</div></div>
      <div class="stat-card"><div class="stat-card__label">Длительность</div><div class="stat-card__value">${formatTime(details.duration)}</div></div>
      <div class="stat-card"><div class="stat-card__label">Размер</div><div class="stat-card__value">${details.width}×${details.height}</div></div>
    `;

    dropzone.classList.add('hidden');
    settingsPanel.classList.remove('hidden');
    actionBar.classList.remove('hidden');
  }

  function renderFrames(result) {
    const extension = result.mimeType === 'image/jpeg' ? 'jpg' : 'png';
    extractedFrames = result.frames.map(frame => ({
      ...frame,
      extension,
      filename: frameFilename(frame.index, extension),
      url: URL.createObjectURL(frame.blob),
    }));

    const fragment = document.createDocumentFragment();
    extractedFrames.forEach(frame => {
      const card = document.createElement('article');
      card.className = 'gif-frame-card';

      const image = document.createElement('img');
      image.src = frame.url;
      image.alt = `Кадр ${frame.index + 1}`;
      image.loading = 'lazy';
      image.decoding = 'async';

      const info = document.createElement('div');
      info.className = 'gif-frame-card__info';
      const title = document.createElement('strong');
      title.textContent = `Кадр ${frame.index + 1}`;
      const meta = document.createElement('span');
      meta.textContent = `${formatTime(frame.start)} · ${FileUtils.formatSize(frame.blob.size)}`;
      info.append(title, meta);

      const download = document.createElement('button');
      download.className = 'btn btn-sm btn-secondary';
      download.type = 'button';
      download.textContent = 'Скачать';
      download.addEventListener('click', () => FileUtils.downloadBlob(frame.blob, frame.filename));

      card.append(image, info, download);
      fragment.appendChild(card);
    });

    framesGrid.appendChild(fragment);
    resultSummary.textContent = `${result.frameCount} кадров · ${extension.toUpperCase()} · ${FileUtils.formatSize(result.totalSize)}`;
    resultArea.classList.add('visible');
  }

  new Dropzone(dropzone, {
    accept: ['image/gif'],
    multiple: false,
    async onFiles(files) {
      try {
        await setFile(files[0]);
      } catch (error) {
        console.error(error);
        Toast.error(error.message || 'Не удалось открыть GIF.');
        resetSource();
      }
    },
  });

  replaceFileBtn.addEventListener('click', () => fileInput.click());

  outputFormat.addEventListener('change', () => {
    qualityGroup.classList.toggle('hidden', outputFormat.value !== 'jpg');
    clearExtractedFrames();
  });

  jpgQuality.addEventListener('input', () => {
    qualityValue.textContent = `${jpgQuality.value}%`;
    clearExtractedFrames();
  });

  extractBtn.addEventListener('click', async () => {
    if (!activeFile) return;
    clearExtractedFrames();
    extractBtn.disabled = true;
    replaceFileBtn.disabled = true;
    downloadAllBtn.disabled = true;
    extractBtn.innerHTML = '<span class="spinner"></span> Извлечение...';
    statusPanel.classList.remove('hidden');
    setProgress(0, 'Подготовка кадров...');

    try {
      const result = await GifProcessor.extractFrames(activeFile, {
        mimeType: outputFormat.value === 'jpg' ? 'image/jpeg' : 'image/png',
        quality: Number(jpgQuality.value) / 100,
        onProgress(progress) {
          setProgress(progress, progress < 25 ? 'Чтение GIF...' : 'Создание кадров...');
        },
      });
      renderFrames(result);
      setProgress(100, 'Кадры готовы.');
      Toast.success('Все кадры GIF извлечены.');
    } catch (error) {
      console.error(error);
      statusPanel.classList.add('hidden');
      Toast.error(error.message || 'Не удалось извлечь кадры GIF.');
    } finally {
      extractBtn.disabled = false;
      replaceFileBtn.disabled = false;
      downloadAllBtn.disabled = false;
      extractBtn.textContent = 'Извлечь кадры';
    }
  });

  downloadAllBtn.addEventListener('click', async () => {
    if (!extractedFrames.length) return;
    downloadAllBtn.disabled = true;
    downloadAllBtn.innerHTML = '<span class="spinner"></span> Архивация...';
    try {
      await FileUtils.downloadZip(
        extractedFrames.map(frame => ({ blob: frame.blob, filename: frame.filename })),
        `${baseName()}_frames.zip`,
        'ZIP с кадрами скачан.',
      );
    } finally {
      downloadAllBtn.disabled = false;
      downloadAllBtn.textContent = 'Скачать всё (ZIP)';
    }
  });

  window.addEventListener('pagehide', () => {
    clearExtractedFrames();
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
  });
})();
