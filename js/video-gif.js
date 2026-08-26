/* Local video and GIF conversion */
(() => {
  const MAX_FILE_SIZE = 100 * 1024 * 1024;
  const MAX_DURATION = 60;
  const MIN_FRAGMENT_SECONDS = 0.1;
  const TIMELINE_HEIGHT = 64;
  const CORE_URL = '/js/vendor/ffmpeg/ffmpeg-core.js';
  const WASM_URL = '/js/vendor/ffmpeg/ffmpeg-core.wasm';
  const validModes = {
    video: {
      accept: 'video/mp4,video/webm,.mp4,.webm',
      extensions: ['mp4', 'webm'],
      mimeTypes: ['video/mp4', 'video/webm'],
    },
    gif: {
      accept: 'image/gif,.gif',
      extensions: ['gif'],
      mimeTypes: ['image/gif'],
    },
  };

  const elements = {
    videoTab: document.getElementById('video-to-gif-tab'),
    gifTab: document.getElementById('gif-to-video-tab'),
    dropzone: document.getElementById('media-dropzone'),
    input: document.getElementById('media-input'),
    dropzoneTitle: document.getElementById('dropzone-title'),
    dropzoneFormats: document.getElementById('dropzone-formats'),
    settingsPanel: document.getElementById('settings-panel'),
    actionBar: document.getElementById('action-bar'),
    replaceFile: document.getElementById('replace-file-btn'),
    videoPreview: document.getElementById('video-preview'),
    gifPreview: document.getElementById('gif-preview'),
    sourceStats: document.getElementById('source-stats'),
    videoSettings: document.getElementById('video-settings'),
    gifSettings: document.getElementById('gif-settings'),
    start: document.getElementById('fragment-start'),
    end: document.getElementById('fragment-end'),
    startRange: document.getElementById('fragment-start-range'),
    endRange: document.getElementById('fragment-end-range'),
    timeline: document.getElementById('video-timeline'),
    timelineFrames: document.getElementById('video-timeline-frames'),
    timelineSelection: document.getElementById('video-timeline-selection'),
    timelineDrag: document.getElementById('video-timeline-drag'),
    timelinePlayhead: document.getElementById('video-timeline-playhead'),
    timelineDuration: document.getElementById('video-timeline-duration'),
    selectionSummary: document.getElementById('video-selection-summary'),
    width: document.getElementById('gif-width'),
    fps: document.getElementById('gif-fps'),
    colors: document.getElementById('gif-colors'),
    format: document.getElementById('video-format'),
    quality: document.getElementById('video-quality'),
    convert: document.getElementById('convert-btn'),
    statusPanel: document.getElementById('status-panel'),
    statusText: document.getElementById('status-text'),
    statusPercent: document.getElementById('status-percent'),
    progressBar: document.getElementById('progress-bar'),
    resultArea: document.getElementById('result-area'),
    resultStats: document.getElementById('result-stats'),
    resultVideo: document.getElementById('result-video'),
    resultGif: document.getElementById('result-gif'),
    download: document.getElementById('download-btn'),
  };

  let mode = 'video';
  let activeFile = null;
  let metadata = null;
  let sourceUrl = null;
  let resultUrl = null;
  let resultBlob = null;
  let resultName = '';
  let ffmpeg = null;
  let processing = false;
  let timelineRevision = 0;
  let segmentDrag = null;
  let playheadAnimationFrame = 0;

  function extension(file) {
    return file.name.split('.').pop()?.toLowerCase() || '';
  }

  function baseName(file) {
    return file.name.replace(/\.[^.]+$/, '').replace(/[^a-zа-яё0-9_-]+/gi, '-').replace(/^-+|-+$/g, '') || 'result';
  }

  function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} Б`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
    return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
  }

  function formatDuration(seconds) {
    return `${seconds.toFixed(2).replace('.', ',')} с`;
  }

  function readSeconds(input, fallback) {
    const value = Number(input.value);
    return Number.isFinite(value) ? value : fallback;
  }

  function selectionDurationLimit() {
    if (!metadata) return 0;
    return Math.min(metadata.duration, Math.floor((metadata.duration + Number.EPSILON) * 100) / 100);
  }

  function resetVideoTimeline() {
    timelineRevision++;
    window.cancelAnimationFrame(playheadAnimationFrame);
    playheadAnimationFrame = 0;
    segmentDrag = null;
    elements.timelineFrames.replaceChildren();
    elements.timelineFrames.style.removeProperty('grid-template-columns');
    elements.timelineSelection.style.left = '0';
    elements.timelineSelection.style.width = '0';
    elements.timelineDrag.style.left = '0';
    elements.timelineDrag.style.width = '0';
    elements.timelineDrag.classList.remove('is-dragging');
    elements.timelineDrag.setAttribute('aria-valuemax', '0');
    elements.timelineDrag.setAttribute('aria-valuenow', '0');
    elements.timelinePlayhead.style.left = '0';
    elements.timelinePlayhead.style.opacity = '0';
    elements.timelineDuration.textContent = '0,00 с';
    elements.selectionSummary.textContent = '';
    elements.startRange.max = '0';
    elements.endRange.max = '0';
    elements.startRange.value = '0';
    elements.endRange.value = '0';
  }

  function updateVideoPlayhead(position = elements.videoPreview.currentTime) {
    if (!metadata || mode !== 'video' || !Number.isFinite(position)) return;
    const percent = Math.min(100, Math.max(0, (position / metadata.duration) * 100));
    elements.timelinePlayhead.style.left = `${percent}%`;
    elements.timelinePlayhead.style.opacity = '1';
  }

  function stopPlayheadAnimation() {
    window.cancelAnimationFrame(playheadAnimationFrame);
    playheadAnimationFrame = 0;
    updateVideoPlayhead();
  }

  function startPlayheadAnimation() {
    window.cancelAnimationFrame(playheadAnimationFrame);
    const update = () => {
      updateVideoPlayhead();
      if (!elements.videoPreview.paused && !elements.videoPreview.ended) {
        playheadAnimationFrame = window.requestAnimationFrame(update);
      } else {
        playheadAnimationFrame = 0;
      }
    };
    update();
  }

  function syncVideoSelection(changed, { seekPreview = true, normalizeInputs = true } = {}) {
    if (!metadata || mode !== 'video') return;
    const maxSeconds = selectionDurationLimit();
    const minDuration = Math.min(MIN_FRAGMENT_SECONDS, maxSeconds);
    let start = Math.min(Math.max(0, readSeconds(elements.start, 0)), Math.max(0, maxSeconds - minDuration));
    let end = Math.min(Math.max(minDuration, readSeconds(elements.end, maxSeconds)), maxSeconds);

    if (end - start < minDuration) {
      if (changed === 'end') start = Math.max(0, end - minDuration);
      else end = Math.min(maxSeconds, start + minDuration);
    }

    if (normalizeInputs) {
      elements.start.value = start.toFixed(2);
      elements.end.value = end.toFixed(2);
    } else if (changed === 'start') {
      elements.end.value = end.toFixed(2);
    } else {
      elements.start.value = start.toFixed(2);
    }
    elements.startRange.value = String(start);
    elements.endRange.value = String(end);
    const selectionLeft = `${(start / maxSeconds) * 100}%`;
    const selectionWidth = `${((end - start) / maxSeconds) * 100}%`;
    elements.timelineSelection.style.left = selectionLeft;
    elements.timelineSelection.style.width = selectionWidth;
    elements.timelineDrag.style.left = selectionLeft;
    elements.timelineDrag.style.width = selectionWidth;
    elements.timelineDrag.setAttribute('aria-valuemax', String(Math.max(0, maxSeconds - (end - start))));
    elements.timelineDrag.setAttribute('aria-valuenow', start.toFixed(2));
    elements.selectionSummary.textContent = `Будет сохранён фрагмент: ${formatDuration(start)} – ${formatDuration(end)} (${formatDuration(end - start)}).`;

    if (seekPreview && Number.isFinite(elements.videoPreview.duration)) {
      const target = changed === 'end' ? Math.max(0, end - 0.01) : start;
      try {
        elements.videoPreview.currentTime = target;
        updateVideoPlayhead(target);
      } catch { /* Preview may still be loading. */ }
    }
    clearResult();
  }

  function moveSelectedSegment(nextStart, seekPreview = true) {
    if (!metadata || mode !== 'video') return;
    const maxSeconds = selectionDurationLimit();
    const start = readSeconds(elements.start, 0);
    const end = readSeconds(elements.end, maxSeconds);
    const duration = Math.round((end - start) * 100) / 100;
    const clampedStart = Math.min(Math.max(0, Math.round(nextStart * 100) / 100), Math.max(0, maxSeconds - duration));
    elements.start.value = clampedStart.toFixed(2);
    elements.end.value = Math.min(maxSeconds, clampedStart + duration).toFixed(2);
    syncVideoSelection('segment', { seekPreview });
  }

  function beginSegmentDrag(event) {
    if (!metadata || mode !== 'video' || (event.button !== undefined && event.button !== 0)) return;
    const width = elements.timeline.getBoundingClientRect().width;
    if (!width) return;
    segmentDrag = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      start: readSeconds(elements.start, 0),
      pixelsPerSecond: width / selectionDurationLimit(),
    };
    elements.timelineDrag.classList.add('is-dragging');
    elements.timelineDrag.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  function continueSegmentDrag(event) {
    if (!segmentDrag || event.pointerId !== segmentDrag.pointerId) return;
    const deltaSeconds = (event.clientX - segmentDrag.clientX) / segmentDrag.pixelsPerSecond;
    moveSelectedSegment(segmentDrag.start + deltaSeconds);
  }

  function endSegmentDrag(event) {
    if (!segmentDrag || event.pointerId !== segmentDrag.pointerId) return;
    if (elements.timelineDrag.hasPointerCapture(event.pointerId)) {
      elements.timelineDrag.releasePointerCapture(event.pointerId);
    }
    elements.timelineDrag.classList.remove('is-dragging');
    segmentDrag = null;
  }

  function waitForVideoData(video) {
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const timer = window.setTimeout(() => finish(new Error('Не удалось подготовить кадры видео')), 15000);
      const finish = error => {
        window.clearTimeout(timer);
        video.removeEventListener('loadeddata', onLoad);
        video.removeEventListener('error', onError);
        if (error) reject(error);
        else resolve();
      };
      const onLoad = () => finish();
      const onError = () => finish(new Error('Не удалось подготовить кадры видео'));
      video.addEventListener('loadeddata', onLoad, { once: true });
      video.addEventListener('error', onError, { once: true });
    });
  }

  function seekVideo(video, time) {
    if (Math.abs(video.currentTime - time) < 0.01 && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      const timer = window.setTimeout(() => finish(new Error('Не удалось получить кадр видео')), 5000);
      const finish = error => {
        window.clearTimeout(timer);
        video.removeEventListener('seeked', onSeeked);
        video.removeEventListener('error', onError);
        if (error) reject(error);
        else resolve();
      };
      const onSeeked = () => finish();
      const onError = () => finish(new Error('Не удалось получить кадр видео'));
      video.addEventListener('seeked', onSeeked, { once: true });
      video.addEventListener('error', onError, { once: true });
      video.currentTime = time;
    });
  }

  async function renderVideoTimeline() {
    const revision = ++timelineRevision;
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    video.src = sourceUrl;

    try {
      await waitForVideoData(video);
      const frameCount = Math.min(16, Math.max(8, Math.round(metadata.duration / 3)));
      const lastTime = Math.max(0, metadata.duration - 0.05);
      const canvas = document.createElement('canvas');
      canvas.height = TIMELINE_HEIGHT;
      canvas.width = Math.max(80, Math.min(160, Math.round(TIMELINE_HEIGHT * metadata.width / metadata.height)));
      const context = canvas.getContext('2d');
      const fragment = document.createDocumentFragment();

      for (let index = 0; index < frameCount; index++) {
        if (revision !== timelineRevision) return;
        const time = frameCount === 1 ? 0 : (lastTime * index) / (frameCount - 1);
        await seekVideo(video, time);
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const image = document.createElement('img');
        image.src = canvas.toDataURL('image/jpeg', 0.72);
        image.alt = '';
        fragment.appendChild(image);
      }

      if (revision !== timelineRevision) return;
      elements.timelineFrames.replaceChildren(fragment);
      elements.timelineFrames.style.gridTemplateColumns = `repeat(${frameCount}, minmax(0, 1fr))`;
    } finally {
      video.removeAttribute('src');
      video.load();
    }
  }

  function setProgress(value, text) {
    const progress = Math.min(100, Math.max(0, Math.round(Number(value) || 0)));
    elements.statusPanel.classList.remove('hidden');
    elements.statusText.textContent = text;
    elements.statusPercent.textContent = `${progress}%`;
    elements.progressBar.style.width = `${progress}%`;
  }

  function clearResult() {
    resultBlob = null;
    resultName = '';
    elements.resultArea.classList.remove('visible');
    elements.resultVideo.classList.add('hidden');
    elements.resultGif.classList.add('hidden');
    elements.resultVideo.removeAttribute('src');
    elements.resultGif.removeAttribute('src');
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    resultUrl = null;
  }

  function clearSource() {
    activeFile = null;
    metadata = null;
    resetVideoTimeline();
    elements.input.value = '';
    elements.settingsPanel.classList.add('hidden');
    elements.actionBar.classList.add('hidden');
    elements.dropzone.classList.remove('hidden', 'drag-over');
    elements.videoPreview.pause();
    elements.videoPreview.removeAttribute('src');
    elements.gifPreview.removeAttribute('src');
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    sourceUrl = null;
    clearResult();
  }

  function renderFormats() {
    const labels = mode === 'video' ? ['MP4', 'WEBM'] : ['GIF'];
    elements.dropzoneFormats.replaceChildren(...labels.map(label => {
      const badge = document.createElement('span');
      badge.className = 'fmt-badge';
      badge.textContent = label;
      return badge;
    }));
  }

  function setMode(nextMode) {
    if (processing || mode === nextMode) return;
    mode = nextMode;
    clearSource();
    const videoMode = mode === 'video';
    elements.videoTab.classList.toggle('active', videoMode);
    elements.gifTab.classList.toggle('active', !videoMode);
    elements.videoTab.setAttribute('aria-selected', String(videoMode));
    elements.gifTab.setAttribute('aria-selected', String(!videoMode));
    elements.input.accept = validModes[mode].accept;
    elements.dropzoneTitle.textContent = videoMode ? 'Добавьте видео' : 'Добавьте GIF';
    elements.videoSettings.classList.toggle('hidden', !videoMode);
    elements.gifSettings.classList.toggle('hidden', videoMode);
    elements.convert.textContent = videoMode ? 'Создать GIF' : 'Создать видео';
    renderFormats();
  }

  function validateFile(file) {
    if (!file) throw new Error('Файл не выбран');
    const maxSize = mode === 'gif' ? FileUtils.MAX_GIF_FILE_SIZE : MAX_FILE_SIZE;
    if (file.size > maxSize) {
      throw new Error(`Размер ${mode === 'gif' ? 'GIF' : 'видео'} не должен превышать ${mode === 'gif' ? '25' : '100'} МБ`);
    }
    const rules = validModes[mode];
    const validExtension = rules.extensions.includes(extension(file));
    const validMime = !file.type || rules.mimeTypes.includes(file.type.toLowerCase());
    if (!validExtension || !validMime) {
      throw new Error(mode === 'video' ? 'Выберите видео MP4 или WebM' : 'Выберите GIF-анимацию');
    }
  }

  function readVideoMetadata(url) {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const timer = window.setTimeout(() => reject(new Error('Не удалось прочитать параметры видео')), 15000);
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.clearTimeout(timer);
        resolve({
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
        });
      };
      video.onerror = () => {
        window.clearTimeout(timer);
        reject(new Error('Браузер не смог открыть это видео'));
      };
      video.src = url;
    });
  }

  async function inspectFile(file) {
    if (mode === 'video') return readVideoMetadata(sourceUrl);
    const info = await GifProcessor.inspect(file);
    return {
      duration: info.duration / 1000,
      width: info.width,
      height: info.height,
      frameCount: info.frameCount,
    };
  }

  function renderSource() {
    const isVideo = mode === 'video';
    elements.videoPreview.classList.toggle('hidden', !isVideo);
    elements.gifPreview.classList.toggle('hidden', isVideo);
    if (isVideo) elements.videoPreview.src = sourceUrl;
    else elements.gifPreview.src = sourceUrl;

    const stats = [
      ['Длительность', formatDuration(metadata.duration)],
      ['Размер', `${metadata.width}×${metadata.height}`],
      [mode === 'gif' ? 'Кадров' : 'Файл', mode === 'gif' ? String(metadata.frameCount) : formatSize(activeFile.size)],
    ];
    elements.sourceStats.innerHTML = stats.map(([label, value]) => `
      <div class="stat-card"><div class="stat-card__label">${label}</div><div class="stat-card__value">${value}</div></div>
    `).join('');

    if (isVideo) {
      const selectionLimit = selectionDurationLimit();
      const maxSeconds = selectionLimit.toFixed(2);
      elements.start.max = Math.max(0, selectionLimit - MIN_FRAGMENT_SECONDS).toFixed(2);
      elements.end.max = maxSeconds;
      elements.startRange.max = maxSeconds;
      elements.endRange.max = maxSeconds;
      elements.start.value = '0';
      elements.end.value = Math.min(selectionLimit, 10).toFixed(2);
      elements.timelineDuration.textContent = formatDuration(metadata.duration);
      syncVideoSelection('start', { seekPreview: false });
      updateVideoPlayhead(0);
    }
    elements.dropzone.classList.add('hidden');
    elements.settingsPanel.classList.remove('hidden');
    elements.actionBar.classList.remove('hidden');
    if (isVideo) {
      renderVideoTimeline().catch(error => {
        if (mode === 'video' && activeFile) console.warn(error);
      });
    }
  }

  async function selectFile(file) {
    if (processing) return;
    try {
      validateFile(file);
      clearResult();
      if (sourceUrl) URL.revokeObjectURL(sourceUrl);
      sourceUrl = URL.createObjectURL(file);
      activeFile = file;
      metadata = await inspectFile(file);
      if (!Number.isFinite(metadata.duration) || metadata.duration <= 0) throw new Error('Не удалось определить длительность файла');
      if (metadata.duration > MAX_DURATION) throw new Error('Длительность файла не должна превышать 60 секунд');
      if (mode === 'video' && metadata.duration + Number.EPSILON < MIN_FRAGMENT_SECONDS) {
        throw new Error('Видео должно быть не короче 0,1 секунды');
      }
      renderSource();
    } catch (error) {
      if (sourceUrl) URL.revokeObjectURL(sourceUrl);
      sourceUrl = null;
      activeFile = null;
      metadata = null;
      elements.input.value = '';
      Toast.error(error.message || 'Не удалось открыть файл');
    }
  }

  async function ensureFFmpeg() {
    if (ffmpeg?.loaded) return;
    if (!window.FFmpegWASM?.FFmpeg) throw new Error('Не удалось загрузить модуль FFmpeg');
    if (!ffmpeg) {
      ffmpeg = new window.FFmpegWASM.FFmpeg();
      ffmpeg.on('progress', ({ progress }) => {
        if (Number.isFinite(progress)) setProgress(15 + progress * 80, 'Конвертация файла...');
      });
    }
    setProgress(5, 'Загрузка локального модуля FFmpeg...');
    await ffmpeg.load({ coreURL: CORE_URL, wasmURL: WASM_URL });
    setProgress(12, 'Подготовка файла...');
  }

  function videoToGifArgs(inputName, outputName) {
    const start = Number(elements.start.value);
    const end = Number(elements.end.value);
    const fragmentDuration = Math.round((end - start) * 100) / 100;
    if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end > metadata.duration || fragmentDuration < MIN_FRAGMENT_SECONDS) {
      throw new Error('Проверьте начало и конец фрагмента');
    }
    const selectedWidth = elements.width.value === 'original'
      ? metadata.width
      : Math.min(metadata.width, Number(elements.width.value));
    const fps = Number(elements.fps.value);
    const colors = Number(elements.colors.value);
    const filter = `fps=${fps},scale=${selectedWidth}:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=${colors}:stats_mode=diff[p];[s1][p]paletteuse=dither=sierra2_4a:diff_mode=rectangle`;
    return [
      '-ss', start.toFixed(2),
      '-t', fragmentDuration.toFixed(2),
      '-i', inputName,
      '-vf', filter,
      '-loop', '0',
      outputName,
    ];
  }

  function gifToVideoArgs(inputName, outputName) {
    const quality = elements.quality.value;
    if (elements.format.value === 'webm') {
      const crf = { high: '28', balanced: '34', small: '40' }[quality];
      return ['-i', inputName, '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', crf, '-pix_fmt', 'yuv420p', '-an', outputName];
    }
    const crf = { high: '20', balanced: '24', small: '28' }[quality];
    return [
      '-i', inputName,
      '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-crf', crf,
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      '-an',
      outputName,
    ];
  }

  function renderResult(blob, outputName) {
    clearResult();
    resultBlob = blob;
    resultName = outputName;
    resultUrl = URL.createObjectURL(blob);
    const isGif = mode === 'video';
    elements.resultGif.classList.toggle('hidden', !isGif);
    elements.resultVideo.classList.toggle('hidden', isGif);
    if (isGif) elements.resultGif.src = resultUrl;
    else elements.resultVideo.src = resultUrl;
    elements.resultStats.innerHTML = `
      <div class="stat-card"><div class="stat-card__label">Формат</div><div class="stat-card__value">${isGif ? 'GIF' : elements.format.value.toUpperCase()}</div></div>
      <div class="stat-card stat-green"><div class="stat-card__label">Размер файла</div><div class="stat-card__value">${formatSize(blob.size)}</div></div>
    `;
    elements.download.textContent = `Скачать ${isGif ? 'GIF' : elements.format.value.toUpperCase()}`;
    elements.resultArea.classList.add('visible');
    elements.resultArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  async function convert() {
    if (!activeFile || processing) return;
    processing = true;
    elements.convert.disabled = true;
    clearResult();
    const inputName = `input-${Date.now()}.${extension(activeFile)}`;
    const outputExtension = mode === 'video' ? 'gif' : elements.format.value;
    const outputName = `${baseName(activeFile)}-converted.${outputExtension}`;
    try {
      const args = mode === 'video'
        ? videoToGifArgs(inputName, outputName)
        : gifToVideoArgs(inputName, outputName);
      await ensureFFmpeg();
      await ffmpeg.writeFile(inputName, new Uint8Array(await activeFile.arrayBuffer()));
      setProgress(15, 'Конвертация файла...');
      const exitCode = await ffmpeg.exec(args, 5 * 60 * 1000);
      if (exitCode !== 0) throw new Error('FFmpeg не смог преобразовать этот файл');
      setProgress(97, 'Подготовка результата...');
      const data = await ffmpeg.readFile(outputName);
      const mime = outputExtension === 'gif' ? 'image/gif' : outputExtension === 'mp4' ? 'video/mp4' : 'video/webm';
      renderResult(new Blob([data], { type: mime }), outputName);
      setProgress(100, 'Готово');
      Toast.success('Конвертация завершена');
    } catch (error) {
      console.error(error);
      elements.statusPanel.classList.add('hidden');
      Toast.error(error.message || 'Не удалось преобразовать файл');
    } finally {
      processing = false;
      elements.convert.disabled = false;
      try { await ffmpeg?.deleteFile(inputName); } catch { /* File may not have been created. */ }
      try { await ffmpeg?.deleteFile(outputName); } catch { /* File may not have been created. */ }
      try { ffmpeg?.terminate(); } catch { /* Worker may already be stopped after an error. */ }
      ffmpeg = null;
    }
  }

  elements.videoTab.addEventListener('click', () => setMode('video'));
  elements.gifTab.addEventListener('click', () => setMode('gif'));
  elements.dropzone.addEventListener('click', event => {
    if (event.target !== elements.input) elements.input.click();
  });
  elements.dropzone.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      elements.input.click();
    }
  });
  elements.input.addEventListener('change', () => selectFile(elements.input.files[0]));
  elements.replaceFile.addEventListener('click', () => elements.input.click());
  elements.dropzone.addEventListener('dragover', event => {
    event.preventDefault();
    elements.dropzone.classList.add('drag-over');
  });
  elements.dropzone.addEventListener('dragleave', () => elements.dropzone.classList.remove('drag-over'));
  elements.dropzone.addEventListener('drop', event => {
    event.preventDefault();
    elements.dropzone.classList.remove('drag-over');
    selectFile(event.dataTransfer.files[0]);
  });
  elements.startRange.addEventListener('input', () => {
    elements.start.value = elements.startRange.value;
    syncVideoSelection('start');
  });
  elements.endRange.addEventListener('input', () => {
    elements.end.value = elements.endRange.value;
    syncVideoSelection('end');
  });
  elements.start.addEventListener('input', () => {
    if (elements.start.value !== '') syncVideoSelection('start', { normalizeInputs: false });
  });
  elements.end.addEventListener('input', () => {
    if (elements.end.value !== '') syncVideoSelection('end', { normalizeInputs: false });
  });
  elements.start.addEventListener('change', () => syncVideoSelection('start'));
  elements.end.addEventListener('change', () => syncVideoSelection('end'));
  elements.timelineDrag.addEventListener('pointerdown', beginSegmentDrag);
  elements.timelineDrag.addEventListener('pointermove', continueSegmentDrag);
  elements.timelineDrag.addEventListener('pointerup', endSegmentDrag);
  elements.timelineDrag.addEventListener('pointercancel', endSegmentDrag);
  elements.timelineDrag.addEventListener('lostpointercapture', endSegmentDrag);
  elements.timelineDrag.addEventListener('keydown', event => {
    if (!metadata || mode !== 'video') return;
    const duration = readSeconds(elements.end, 0) - readSeconds(elements.start, 0);
    const maxStart = Math.max(0, selectionDurationLimit() - duration);
    let nextStart = readSeconds(elements.start, 0);
    if (event.key === 'ArrowLeft') nextStart -= event.shiftKey ? 0.1 : 0.01;
    else if (event.key === 'ArrowRight') nextStart += event.shiftKey ? 0.1 : 0.01;
    else if (event.key === 'Home') nextStart = 0;
    else if (event.key === 'End') nextStart = maxStart;
    else return;
    event.preventDefault();
    moveSelectedSegment(nextStart);
  });
  elements.videoPreview.addEventListener('play', startPlayheadAnimation);
  elements.videoPreview.addEventListener('pause', stopPlayheadAnimation);
  elements.videoPreview.addEventListener('ended', stopPlayheadAnimation);
  elements.videoPreview.addEventListener('timeupdate', () => updateVideoPlayhead());
  elements.videoPreview.addEventListener('seeked', () => updateVideoPlayhead());
  elements.videoPreview.addEventListener('loadedmetadata', () => updateVideoPlayhead());
  elements.convert.addEventListener('click', convert);
  elements.download.addEventListener('click', () => {
    if (!resultUrl || !resultBlob) return;
    const link = document.createElement('a');
    link.href = resultUrl;
    link.download = resultName;
    link.click();
  });

  window.addEventListener('beforeunload', () => {
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    ffmpeg?.terminate();
  });
})();
