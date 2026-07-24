/*
 * AVIF encoding wrapper for @jsquash/avif 2.1.1.
 * The bundled codec is licensed under Apache-2.0; see LICENSE in this folder.
 */
import createAvifEncoder from './avif_enc.js';

let encoderPromise;

const DEFAULT_OPTIONS = {
  quality: 85,
  qualityAlpha: -1,
  denoiseLevel: 0,
  tileColsLog2: 0,
  tileRowsLog2: 0,
  speed: 6,
  subsample: 1,
  chromaDeltaQ: false,
  sharpness: 0,
  tune: 0,
  enableSharpYUV: false,
  bitDepth: 8
};

function loadEncoder() {
  if (!encoderPromise) {
    encoderPromise = createAvifEncoder({
      locateFile: path => new URL(path, import.meta.url).href
    });
  }
  return encoderPromise;
}

export async function encodeCanvas(canvas, quality = 0.85) {
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Не удалось прочитать изображение для AVIF');

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const encoder = await loadEncoder();
  const output = encoder.encode(
    new Uint8Array(imageData.data.buffer, imageData.data.byteOffset, imageData.data.byteLength),
    imageData.width,
    imageData.height,
    {
      ...DEFAULT_OPTIONS,
      quality: Math.round(Math.max(0, Math.min(1, quality)) * 100)
    }
  );

  if (!output) throw new Error('Не удалось закодировать изображение в AVIF');
  return new Blob([new Uint8Array(output)], { type: 'image/avif' });
}
