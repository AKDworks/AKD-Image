const MAX_IMAGE_PIXELS = 40 * 1000 * 1000;
const MAX_IMAGE_SIDE = 16384;

function validateSize(width, height) {
  if (!width || !height) throw new Error('Изображение содержит некорректные размеры');
  if (width > MAX_IMAGE_SIDE || height > MAX_IMAGE_SIDE) {
    throw new Error(`Сторона изображения не должна превышать ${MAX_IMAGE_SIDE} px`);
  }
  if (width * height > MAX_IMAGE_PIXELS) {
    throw new Error('Разрешение изображения превышает лимит 40 мегапикселей');
  }
}

async function decodeImage(blob) {
  try {
    return await createImageBitmap(blob, { imageOrientation: 'from-image' });
  } catch {
    return createImageBitmap(blob);
  }
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

function getOutputSize(bitmap, task) {
  if (task.type === 'resize') return getResizeSize(bitmap.width, bitmap.height, task);
  if (task.type === 'crop') {
    return {
      width: Math.max(1, Math.round(task.area.width)),
      height: Math.max(1, Math.round(task.area.height)),
    };
  }
  if (task.type === 'rotate' && Math.abs(Number(task.rotation)) % 180 === 90) {
    return { width: bitmap.height, height: bitmap.width };
  }
  return { width: bitmap.width, height: bitmap.height };
}

function prepareCanvas(width, height, mimeType) {
  validateSize(width, height);
  const canvas = new OffscreenCanvas(width, height);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas недоступен');

  if (['image/jpeg', 'image/heic', 'image/heif', 'image/bmp'].includes(mimeType)) {
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
  }

  return { canvas, context };
}

function drawImage(bitmap, canvas, context, task) {
  if (task.type === 'resize') {
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return;
  }

  if (task.type === 'rotate') {
    context.translate(canvas.width / 2, canvas.height / 2);
    context.rotate((Number(task.rotation) || 0) * Math.PI / 180);
    context.scale(task.flipH ? -1 : 1, task.flipV ? -1 : 1);
    context.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2);
    return;
  }

  if (task.type === 'pixelate') {
    const pixelSize = Math.max(1, Number(task.pixelSize) || 10);
    const smallWidth = Math.max(1, Math.floor(bitmap.width / pixelSize));
    const smallHeight = Math.max(1, Math.floor(bitmap.height / pixelSize));
    const smallCanvas = new OffscreenCanvas(smallWidth, smallHeight);
    const smallContext = smallCanvas.getContext('2d');
    smallContext.drawImage(bitmap, 0, 0, smallWidth, smallHeight);
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
      bitmap,
      area.x, area.y, area.width, area.height,
      0, 0, canvas.width, canvas.height
    );
    return;
  }

  if (task.type === 'effects') {
    if (!('filter' in context)) throw new Error('WORKER_FILTER_UNSUPPORTED');
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
    context.drawImage(bitmap, 0, 0);
    return;
  }

  if (task.type === 'blurArea') {
    if (!('filter' in context)) throw new Error('WORKER_FILTER_UNSUPPORTED');
    context.drawImage(bitmap, 0, 0);
    const blurredCanvas = new OffscreenCanvas(canvas.width, canvas.height);
    const blurredContext = blurredCanvas.getContext('2d');
    blurredContext.filter = `blur(${Math.max(0, Number(task.radius) || 0)}px)`;
    blurredContext.drawImage(bitmap, 0, 0);
    context.save();
    context.beginPath();
    context.rect(task.area.x, task.area.y, task.area.width, task.area.height);
    context.clip();
    context.drawImage(blurredCanvas, 0, 0);
    context.restore();
    return;
  }

  context.drawImage(bitmap, 0, 0);
}

async function encodeCanvas(canvas, mimeType, quality) {
  let blob;

  if (mimeType === 'image/avif') {
    const avif = await import('./vendor/avif/encode.js');
    blob = await avif.encodeCanvas(canvas, quality);
  } else {
    blob = await canvas.convertToBlob({ type: mimeType, quality });
  }

  if (!blob || blob.type !== mimeType) {
    throw new Error('Браузер не поддерживает выбранный формат');
  }
  return blob;
}

self.addEventListener('message', async event => {
  const { id, file, task } = event.data;
  let bitmap = null;

  try {
    self.postMessage({ id, progress: 25 });
    bitmap = await decodeImage(file);
    validateSize(bitmap.width, bitmap.height);

    const size = getOutputSize(bitmap, task);
    const { canvas, context } = prepareCanvas(size.width, size.height, task.mimeType);

    self.postMessage({ id, progress: 55 });
    drawImage(bitmap, canvas, context, task);

    self.postMessage({ id, progress: 80 });
    const blob = await encodeCanvas(canvas, task.mimeType, task.quality);

    self.postMessage({
      id,
      result: {
        blob,
        width: canvas.width,
        height: canvas.height,
        originalWidth: bitmap.width,
        originalHeight: bitmap.height,
      },
    });
  } catch (error) {
    self.postMessage({
      id,
      error: error instanceof Error ? error.message : String(error),
    });
  } finally {
    if (bitmap) bitmap.close();
  }
});
