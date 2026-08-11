const HEIC_TYPES = new Set(['image/heic', 'image/heif']);
const MAX_RASTER_PIXELS = 40 * 1000 * 1000;
const MAX_RASTER_SIDE = 16384;
const MAX_BMP_PIXELS = 20 * 1000 * 1000;

function validateDimensions(width, height, maxPixels = MAX_RASTER_PIXELS) {
  if (!width || !height || width > MAX_RASTER_SIDE || height > MAX_RASTER_SIDE) {
    throw new Error(`Сторона изображения не должна превышать ${MAX_RASTER_SIDE} px.`);
  }
  if (width * height > maxPixels) {
    throw new Error(`Разрешение изображения превышает лимит ${maxPixels / 1000000} мегапикселей.`);
  }
}

function canvasToPng(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error('Не удалось подготовить изображение для обработки.'));
    }, 'image/png');
  });
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Не удалось прочитать изображение.'));
    reader.readAsDataURL(blob);
  });
}

function loadBrowserImage(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Не удалось открыть SVG-изображение.'));
    };
    image.src = url;
  });
}

function sanitizeSvg(source) {
  const documentNode = new DOMParser().parseFromString(source, 'image/svg+xml');
  if (documentNode.querySelector('parsererror') || documentNode.documentElement.localName !== 'svg') {
    throw new Error('SVG содержит некорректную разметку.');
  }

  documentNode.querySelectorAll('script, foreignObject, iframe, object, embed').forEach(node => node.remove());
  documentNode.querySelectorAll('style').forEach(style => {
    style.textContent = style.textContent
      .replace(/@import\s+(?:url\()?[^;]+;?/gi, '')
      .replace(/url\(\s*(['"]?)(?!#)[^)]+\1\s*\)/gi, 'none');
  });
  documentNode.querySelectorAll('*').forEach(element => {
    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim();
      const compactValue = value.replace(/\s+/g, '').toLowerCase();
      const isEvent = name.startsWith('on');
      const isExternalReference = (name === 'href' || name.endsWith(':href') || name === 'src') &&
        !value.startsWith('#') && !compactValue.startsWith('data:image/');
      const hasUnsafeUrl = compactValue.includes('javascript:') ||
        (/url\((?!['"]?#)/i.test(value) && /(?:https?:|\/\/|data:)/i.test(value));

      const isExternalStyle = name === 'style' && /(?:@import|url\(\s*['"]?(?!#))/i.test(value);

      if (isEvent || isExternalReference || hasUnsafeUrl || isExternalStyle) {
        element.removeAttribute(attribute.name);
      }
    }
  });

  return new XMLSerializer().serializeToString(documentNode.documentElement);
}

async function rasterizeSvg(file) {
  const source = await file.text();
  const sanitized = sanitizeSvg(source);
  const svgBlob = new Blob([sanitized], { type: 'image/svg+xml' });
  const image = await loadBrowserImage(svgBlob);
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  validateDimensions(width, height);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d').drawImage(image, 0, 0, width, height);
  return canvasToPng(canvas);
}

async function decodeHeic(file) {
  const { decode } = await import('./vendor/heic/codec.js');
  const { pixels, width, height } = await decode(file);
  validateDimensions(width, height);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d').putImageData(new ImageData(pixels, width, height), 0, 0);
  return canvasToPng(canvas);
}

export async function prepareInput(file, mimeType) {
  if (HEIC_TYPES.has(mimeType)) return decodeHeic(file);
  if (mimeType === 'image/svg+xml') return rasterizeSvg(file);
  return file;
}

export async function toDisplayDataUrl(file, mimeType) {
  return blobToDataUrl(await prepareInput(file, mimeType));
}

function writeUint16(view, offset, value) {
  view.setUint16(offset, value, true);
}

function writeUint32(view, offset, value) {
  view.setUint32(offset, value, true);
}

function encodeBmp(canvas) {
  const width = canvas.width;
  const height = canvas.height;
  validateDimensions(width, height, MAX_BMP_PIXELS);

  const context = canvas.getContext('2d', { willReadFrequently: true });
  const pixels = context.getImageData(0, 0, width, height).data;
  const rowSize = Math.ceil(width * 3 / 4) * 4;
  const pixelBytes = rowSize * height;
  const buffer = new ArrayBuffer(54 + pixelBytes);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  bytes[0] = 0x42;
  bytes[1] = 0x4D;
  writeUint32(view, 2, buffer.byteLength);
  writeUint32(view, 10, 54);
  writeUint32(view, 14, 40);
  writeUint32(view, 18, width);
  writeUint32(view, 22, height);
  writeUint16(view, 26, 1);
  writeUint16(view, 28, 24);
  writeUint32(view, 34, pixelBytes);
  writeUint32(view, 38, 2835);
  writeUint32(view, 42, 2835);

  for (let y = 0; y < height; y += 1) {
    const sourceY = height - 1 - y;
    let target = 54 + y * rowSize;
    for (let x = 0; x < width; x += 1) {
      const source = (sourceY * width + x) * 4;
      const alpha = pixels[source + 3];
      bytes[target++] = (pixels[source + 2] * alpha + 255 * (255 - alpha)) / 255;
      bytes[target++] = (pixels[source + 1] * alpha + 255 * (255 - alpha)) / 255;
      bytes[target++] = (pixels[source] * alpha + 255 * (255 - alpha)) / 255;
    }
  }

  return new Blob([buffer], { type: 'image/bmp' });
}

export async function encodeCanvas(canvas, mimeType, quality) {
  if (HEIC_TYPES.has(mimeType)) {
    const heic = await import('./vendor/heic/codec.js');
    return heic.encodeCanvas(canvas, quality);
  }
  if (mimeType === 'image/bmp') return encodeBmp(canvas);
  throw new Error('Для выбранного формата не найден кодек.');
}
