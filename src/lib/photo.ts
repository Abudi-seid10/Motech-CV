/**
 * Center-crops an image file to a square and re-encodes it as a small JPEG
 * data URL. JPEG specifically because @react-pdf/renderer can't embed WebP,
 * and a ~480px square keeps the profile row's JSON small.
 */
export async function fileToPhotoDataUrl(file: File, size = 480): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Pick an image file (JPG or PNG).");
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("Couldn't read that image — try a JPG or PNG.");
  }
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Image processing isn't available in this browser.");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, size, size);
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.85);
}
