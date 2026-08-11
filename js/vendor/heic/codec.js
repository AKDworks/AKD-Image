let codecPromise = null;

const MAX_PIXELS = 20 * 1000 * 1000;
const MAX_SIDE = 8192;

async function getCodec() {
  if (!codecPromise) {
    codecPromise = import('./heic-codec.js')
      .then(({ default: createHeicCodec }) => createHeicCodec({
        locateFile: file => file.endsWith('.wasm')
          ? new URL('./heic-codec.wasm', import.meta.url).href
          : new URL(file, import.meta.url).href,
      }));
  }
  return codecPromise;
}

function validateDimensions(width, height) {
  if (!width || !height || width > MAX_SIDE || height > MAX_SIDE || width * height > MAX_PIXELS) {
    throw new Error('HEIC поддерживает изображения до 20 Мп и 8192 px по стороне.');
  }
}

function codecError(codec, fallback) {
  const pointer = codec._akd_heic_last_error();
  return new Error(pointer ? codec.UTF8ToString(pointer) : fallback);
}

export async function decode(file) {
  const codec = await getCodec();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const inputPointer = codec._malloc(bytes.byteLength);
  const outputPointer = codec._malloc(4);
  const widthPointer = codec._malloc(4);
  const heightPointer = codec._malloc(4);

  try {
    codec.HEAPU8.set(bytes, inputPointer);
    const status = codec._akd_heic_decode(
      inputPointer,
      bytes.byteLength,
      outputPointer,
      widthPointer,
      heightPointer
    );
    if (status !== 0) throw codecError(codec, 'Не удалось открыть HEIC/HEIF.');

    const pixelPointer = codec.HEAPU32[outputPointer >>> 2];
    const width = codec.HEAP32[widthPointer >>> 2];
    const height = codec.HEAP32[heightPointer >>> 2];
    validateDimensions(width, height);

    try {
      const pixels = new Uint8ClampedArray(
        codec.HEAPU8.slice(pixelPointer, pixelPointer + width * height * 4)
      );
      return { pixels, width, height };
    } finally {
      codec._akd_heic_free(pixelPointer);
    }
  } finally {
    codec._free(inputPointer);
    codec._free(outputPointer);
    codec._free(widthPointer);
    codec._free(heightPointer);
  }
}

export async function encodeCanvas(canvas, quality = 0.85) {
  const width = canvas.width;
  const height = canvas.height;
  validateDimensions(width, height);

  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Canvas недоступен для сохранения HEIC.');

  const codec = await getCodec();
  const pixels = context.getImageData(0, 0, width, height).data;
  const inputPointer = codec._malloc(pixels.byteLength);
  const outputPointer = codec._malloc(4);
  const outputSizePointer = codec._malloc(4);

  try {
    codec.HEAPU8.set(pixels, inputPointer);
    const status = codec._akd_heic_encode(
      inputPointer,
      width,
      height,
      Math.round(Math.max(0.01, Math.min(1, quality)) * 100),
      outputPointer,
      outputSizePointer
    );
    if (status !== 0) throw codecError(codec, 'Не удалось сохранить HEIC.');

    const encodedPointer = codec.HEAPU32[outputPointer >>> 2];
    const encodedSize = codec.HEAPU32[outputSizePointer >>> 2];
    const bytes = codec.HEAPU8.slice(encodedPointer, encodedPointer + encodedSize);
    codec._akd_heic_free(encodedPointer);
    return new Blob([bytes], { type: 'image/heic' });
  } finally {
    codec._free(inputPointer);
    codec._free(outputPointer);
    codec._free(outputSizePointer);
  }
}

export const limits = Object.freeze({
  maxPixels: MAX_PIXELS,
  maxSide: MAX_SIDE,
});
