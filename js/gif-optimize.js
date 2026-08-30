/* Local animated GIF optimization */
(function () {
  const dropzoneEl = document.getElementById('dropzone');
  const fileListEl = document.getElementById('file-list');
  const settingsEl = document.getElementById('settings-panel');
  const actionBarEl = document.getElementById('action-bar');
  const countEl = document.getElementById('file-count');
  const optimizeBtn = document.getElementById('optimize-btn');
  const clearBtn = document.getElementById('clear-btn');
  const resultArea = document.getElementById('result-area');
  const resultStats = document.getElementById('result-stats');
  const downloadAllBtn = document.getElementById('download-all-btn');
  const previewCanvas = document.getElementById('preview-canvas');
  const previewMeta = document.getElementById('preview-meta');
  const qualityInput = document.getElementById('quality');
  const qualityValue = document.getElementById('quality-val');

  const manager = new FileListManager(fileListEl);
  let files = [];
  let results = [];
  let previewResult = null;

  qualityInput.addEventListener('input', () => {
    qualityValue.textContent = `${qualityInput.value}%`;
    previewScheduler.schedule();
  });

  fileListEl.addEventListener('file-removed', event => {
    files = files.filter(entry => entry.item.id !== event.detail.id);
    updateUI();
  });

  new Dropzone(dropzoneEl, {
    accept: ['image/gif'],
    multiple: true,
    onFiles(newFiles) {
      newFiles.forEach(file => files.push({ file, item: manager.add(file) }));
      updateUI();
    },
  });

  function updateUI() {
    const hasFiles = UIUtils.updateBatchLayout(
      { dropzoneEl, fileListEl, settingsEl, actionBarEl, countEl },
      files.length,
    );
    UIUtils.resetBatchResult({ resultArea, resultStats, downloadAllBtn });
    previewScheduler.cancel();
    previewCanvas.classList.add('hidden');
    previewMeta.classList.add('hidden');
    previewMeta.textContent = '';
    previewResult = null;
    results = [];
    if (hasFiles) previewScheduler.refresh();
  }

  async function optimize(file, onProgress) {
    return GifProcessor.optimize(file, {
      quality: Number(qualityInput.value) / 100,
      onProgress,
    });
  }

  fileListEl.addEventListener('file-selected', () => previewScheduler.refresh());

  const previewScheduler = UIUtils.createPreviewScheduler(async isCurrent => {
    const selected = manager.getSelectedItem();
    if (!selected) return;

    const file = selected.file;
    const quality = Number(qualityInput.value);
    previewMeta.textContent = 'Рассчитываю размер после оптимизации...';
    previewMeta.classList.remove('hidden');

    const cached = previewResult?.file === file && previewResult.quality === quality
      ? previewResult.processed
      : await optimize(file);
    if (!isCurrent()) return;

    previewResult = { file, quality, processed: cached };
    const image = await FileUtils.loadImage(await FileUtils.readAsDataURL(cached.blob));
    if (!isCurrent()) return;

    previewCanvas.width = image.naturalWidth;
    previewCanvas.height = image.naturalHeight;
    const context = previewCanvas.getContext('2d');
    context.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    context.drawImage(image, 0, 0);
    previewCanvas.classList.remove('hidden');

    const change = FileUtils.formatPct(file.size, cached.blob.size);
    const paletteHint = cached.optimized
      ? ` · палитра до ${cached.paletteSize} цветов`
      : ' · исходный GIF уже оптимизирован';
    previewMeta.textContent = `Прогноз: ${FileUtils.formatSize(file.size)} → ${FileUtils.formatSize(cached.blob.size)} (${change})${paletteHint}. Показан первый кадр GIF.`;
  });

  function plural(count, one, few, many) {
    const remainder = count % 10;
    if (count % 100 >= 11 && count % 100 <= 19) return many;
    if (remainder === 1) return one;
    if (remainder >= 2 && remainder <= 4) return few;
    return many;
  }

  clearBtn.addEventListener('click', () => {
    files = [];
    manager.clear();
    updateUI();
  });

  optimizeBtn.addEventListener('click', async () => {
    if (!files.length) return;

    optimizeBtn.disabled = true;
    UIUtils.setBatchLocked(manager, [clearBtn, downloadAllBtn], true);
    optimizeBtn.innerHTML = '<span class="spinner"></span> Оптимизирую...';
    results = [];
    let errors = 0;
    let totalBefore = 0;
    let totalAfter = 0;
    const previewItems = [];

    for (const { file, item } of files) {
      manager.setStatus(item.id, 'Обработка...', 'status-processing');
      manager.setProgress(item.id, 10);

      try {
        const cached = previewResult?.file === file && previewResult.quality === Number(qualityInput.value)
          ? previewResult.processed
          : null;
        const processed = cached || await optimize(file, progress => manager.setProgress(item.id, progress));
        const blob = processed.blob;
        const filename = processed.optimized
          ? file.name.replace(/\.[^.]+$/, '') + '_optimized.gif'
          : file.name;
        const change = FileUtils.formatPct(file.size, blob.size);

        manager.setProgress(item.id, 100);
        manager.setStatus(item.id, processed.optimized ? change : 'Уже оптимизирован', 'status-done');
        manager.setMeta(item.id, `${FileUtils.formatSize(file.size)} → ${FileUtils.formatSize(blob.size)}`);

        results.push({ blob, filename });
        previewItems.push({ before: file, after: blob, label: filename });
        totalBefore += file.size;
        totalAfter += blob.size;
      } catch (error) {
        errors++;
        manager.setStatus(item.id, 'Ошибка', 'status-error');
        manager.setMeta(item.id, error.message || 'Не удалось оптимизировать GIF');
        console.error(error);
      }
    }

    if (results.length) {
      const change = FileUtils.formatPct(totalBefore, totalAfter);
      resultStats.innerHTML = `
        <div class="stat-card"><div class="stat-card__label">До</div><div class="stat-card__value">${FileUtils.formatSize(totalBefore)}</div></div>
        <div class="stat-card"><div class="stat-card__label">После</div><div class="stat-card__value">${FileUtils.formatSize(totalAfter)}</div></div>
        <div class="stat-card stat-green"><div class="stat-card__label">Изменение</div><div class="stat-card__value">${change}</div></div>
      `;
      UIUtils.showBatchResult({ resultArea, downloadAllBtn }, results.length);
      ResultFlow.show({
        title: 'Результат готов!',
        description: 'GIF-анимации оптимизированы и готовы к скачиванию.',
        downloadLabel: results.length === 1 ? 'Скачать GIF' : 'Скачать всё (ZIP)',
        onDownload: () => results.length === 1
          ? FileUtils.downloadBlob(results[0].blob, results[0].filename)
          : FileUtils.downloadZip(results, 'akd-gif-optimized.zip'),
        stats: ResultFlow.readStats(resultStats),
        sourceArea: resultArea,
        preview: {
          mode: 'compare',
          items: previewItems,
        },
        onRestart: () => {
          files = [];
          manager.clear();
          updateUI();
        },
      });
      Toast.success('Оптимизация GIF завершена.');
    }

    if (errors) Toast.error(`Не удалось обработать ${plural(errors, 'файл', 'файла', 'файлов')}.`);

    optimizeBtn.disabled = false;
    UIUtils.setBatchLocked(manager, [clearBtn, downloadAllBtn], false);
    optimizeBtn.textContent = 'Оптимизировать всё';
  });

  downloadAllBtn.addEventListener('click', async () => {
    await FileUtils.downloadZip(results, 'akd-gif-optimized.zip');
  });
})();
