/**
 * Resize an image (File or existing data-URL) to a JPEG data-URL.
 * Limits longest side to maxWidth px, compresses at given quality.
 */
function loadImageSrc(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload  = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function resizeImageToDataUrl(
  source: File | string,
  maxWidth = 1080,
  quality  = 0.72,
): Promise<string> {
  let src: string;
  let revokeAfter = false;

  if (typeof source === 'string') {
    src = source;
  } else {
    src = URL.createObjectURL(source);
    revokeAfter = true;
  }

  const img = await loadImageSrc(src);
  if (revokeAfter) URL.revokeObjectURL(src);

  const scale = Math.min(1, maxWidth / img.naturalWidth);
  const w = Math.round(img.naturalWidth  * scale);
  const h = Math.round(img.naturalHeight * scale);

  const canvas = document.createElement('canvas');
  canvas.width  = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No canvas context');
  ctx.drawImage(img, 0, 0, w, h);

  return canvas.toDataURL('image/jpeg', quality);
}
