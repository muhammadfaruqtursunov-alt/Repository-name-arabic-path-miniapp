/**
 * Resize an image File to a JPEG data-URL.
 * Limits width to maxWidth px, compresses with given quality.
 * Used for background photos stored in localStorage / server.
 */
export function resizeImageToDataUrl(
  file: File,
  maxWidth = 1080,
  quality = 0.72,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.naturalWidth);
      const w = Math.round(img.naturalWidth  * scale);
      const h = Math.round(img.naturalHeight * scale);

      const canvas = document.createElement('canvas');
      canvas.width  = w;
      canvas.height = h;

      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('No canvas context')); return; }

      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };

    img.src = objectUrl;
  });
}
