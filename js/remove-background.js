import {
  configure,
  getObjectMask,
  getRuntimeInfo,
  removeBackground,
} from '/js/vendor/akd-vision/index.js';

const t = value => window.AKDI18n?.t(value) || value;

configure({
  workerUrl: `${window.location.origin}/js/vendor/akd-vision/akd-vision.worker.js`,
  cacheName: 'akd-vision-models-v1',
  useBrowserCache: true,
  useWasmCache: true,
  allowRemoteModels: true,
  allowLocalModels: false,
});

const dropzone = document.getElementById('dropzone');
const fileInput = dropzone.querySelector('input[type="file"]');
const settingsPanel = document.getElementById('settings-panel');
const actionBar = document.getElementById('action-bar');
const replaceFileBtn = document.getElementById('replace-file-btn');
const sourcePreview = document.getElementById('source-preview');
const sourceStats = document.getElementById('source-stats');
const removeBtn = document.getElementById('remove-btn');
const cancelBtn = document.getElementById('cancel-btn');
const statusPanel = document.getElementById('status-panel');
const statusText = document.getElementById('status-text');
const statusPercent = document.getElementById('status-percent');
const progressBar = document.getElementById('progress-bar');
const resultArea = document.getElementById('result-area');
const resultSummary = document.getElementById('result-summary');
const resultPreview = document.getElementById('result-preview');
const compareSource = document.getElementById('compare-source');
const compareView = document.getElementById('compare-view');
const beforeLayer = document.getElementById('before-layer');
const compareDivider = document.getElementById('compare-divider');
const compareRange = document.getElementById('compare-range');
const downloadBtn = document.getElementById('download-btn');

const STAGE_TEXT = {
  'detecting-device': 'Проверка возможностей браузера...',
  'loading-model': 'Загрузка AI-модели...',
  decoding: 'Чтение изображения...',
  preprocessing: 'Подготовка изображения...',
  inference: 'Определение объекта...',
  postprocessing: 'Уточнение краёв...',
  encoding: 'Создание PNG...',
};

let activeFile = null;
let preparedFile = null;
let sourceUrl = null;
let resultUrl = null;
let resultBlob = null;
let abortController = null;
const MAX_INPUT_SIZE = 25 * 1024 * 1024;

function revokeUrl(url) {
  if (url) URL.revokeObjectURL(url);
}

function resetResult() {
  revokeUrl(resultUrl);
  resultUrl = null;
  resultBlob = null;
  resultPreview.removeAttribute('src');
  compareSource.removeAttribute('src');
  resultSummary.textContent = '';
  resultArea.classList.remove('visible');
}

function setProgress(value, label) {
  const progress = Math.max(0, Math.min(100, Math.round(value)));
  progressBar.style.width = `${progress}%`;
  statusPercent.textContent = `${progress}%`;
  if (label) statusText.textContent = t(label);
}

function handleProgress(event) {
  const stageIndex = Object.keys(STAGE_TEXT).indexOf(event.stage);
  const stageBase = stageIndex < 0 ? 0 : (stageIndex / Object.keys(STAGE_TEXT).length) * 100;
  const stageShare = 100 / Object.keys(STAGE_TEXT).length;
  const value = stageBase + (Number.isFinite(event.progress) ? event.progress * stageShare : 0);
  setProgress(Math.min(value, 96), STAGE_TEXT[event.stage] || 'Обработка...');
}

async function getImageInfo(url) {
  const image = await FileUtils.loadImage(url);
  return { width: image.naturalWidth, height: image.naturalHeight };
}

async function setFile(file) {
  resetResult();
  FileUtils.validateFile(file);
  if (file.size > MAX_INPUT_SIZE) {
    throw new Error('Для удаления фона выберите файл не больше 25 МБ.');
  }

  activeFile = file;
  preparedFile = await FileUtils.prepareRasterInput(file);

  revokeUrl(sourceUrl);
  sourceUrl = URL.createObjectURL(preparedFile);
  const dimensions = await getImageInfo(sourceUrl);
  FileUtils.validateImageSize(dimensions.width, dimensions.height);
  sourcePreview.src = sourceUrl;
  sourceStats.innerHTML = `
    <div class="stat-card"><div class="stat-card__label">${t('Формат')}</div><div class="stat-card__value">${FileUtils.getFormatLabel(file)}</div></div>
    <div class="stat-card"><div class="stat-card__label">${t('Размер')}</div><div class="stat-card__value">${dimensions.width}×${dimensions.height}</div></div>
    <div class="stat-card"><div class="stat-card__label">${t('Файл')}</div><div class="stat-card__value">${FileUtils.formatSize(file.size)}</div></div>
  `;

  dropzone.classList.add('hidden');
  settingsPanel.classList.remove('hidden');
  actionBar.classList.remove('hidden');
}

function setBusy(busy) {
  removeBtn.disabled = busy;
  replaceFileBtn.disabled = busy;
  fileInput.disabled = busy;
  statusPanel.classList.toggle('hidden', !busy);
  removeBtn.innerHTML = busy
    ? `<span class="spinner"></span> ${t('Удаление фона...')}`
    : t('Удалить фон');
}

function resultFilename() {
  const original = activeFile?.name.replace(/\.[^.]+$/, '') || 'image';
  return `${FileUtils.safeFilename(original, 'image')}-no-background.png`;
}

function showResult(result) {
  resultBlob = result.blob;
  revokeUrl(resultUrl);
  resultUrl = URL.createObjectURL(resultBlob);
  resultPreview.src = resultUrl;
  compareSource.src = sourceUrl;
  compareView.style.setProperty('--result-aspect', `${result.width} / ${result.height}`);
  compareRange.value = '50';
  updateComparison();
  resultSummary.textContent = `${result.width}×${result.height} · PNG · ${FileUtils.formatSize(resultBlob.size)}`;
  resultArea.classList.add('visible');
  requestAnimationFrame(() => resultArea.scrollIntoView({ behavior: 'smooth', block: 'start' }));
}

function updateComparison() {
  const value = Number(compareRange.value);
  beforeLayer.style.width = `${value}%`;
  compareDivider.style.left = `${value}%`;
  compareView.style.setProperty('--compare-width', `${compareView.getBoundingClientRect().width}px`);
}

new Dropzone(dropzone, {
  accept: [
    'image/jpeg', 'image/png', 'image/webp', 'image/avif',
    'image/heic', 'image/heif', 'image/svg+xml', 'image/bmp',
  ],
  multiple: false,
  async onFiles(files) {
    try {
      await setFile(files[0]);
    } catch (error) {
      console.error(error);
      Toast.error(t(error.message || 'Не удалось открыть изображение.'));
    }
  },
});

replaceFileBtn.addEventListener('click', () => fileInput.click());
compareRange.addEventListener('input', updateComparison);
window.addEventListener('resize', updateComparison);

removeBtn.addEventListener('click', async () => {
  if (!preparedFile) return;
  resetResult();
  abortController = new AbortController();
  setBusy(true);
  setProgress(0, 'Подготовка...');

  try {
    const mask = await getObjectMask(preparedFile, {
      device: 'auto',
      progress: handleProgress,
      signal: abortController.signal,
    });
    const result = await removeBackground(preparedFile, {
      mask,
      output: { format: 'image/png' },
      progress: handleProgress,
      signal: abortController.signal,
    });
    setProgress(100, 'Готово');
    showResult(result);
    const runtime = getRuntimeInfo();
    if (runtime) resultSummary.dataset.device = runtime.device;
    Toast.success(t('Фон удалён.'));
  } catch (error) {
    if (error?.name === 'AbortError') {
      Toast.info(t('Обработка отменена.'));
    } else {
      console.error(error);
      Toast.error(t('Не удалось удалить фон. Попробуйте другое изображение.'));
    }
  } finally {
    abortController = null;
    setBusy(false);
    statusPanel.classList.add('hidden');
  }
});

cancelBtn.addEventListener('click', () => abortController?.abort());
downloadBtn.addEventListener('click', () => {
  if (resultBlob) FileUtils.downloadBlob(resultBlob, resultFilename());
});

window.addEventListener('beforeunload', () => {
  abortController?.abort();
  revokeUrl(sourceUrl);
  revokeUrl(resultUrl);
});
