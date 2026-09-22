import fs from "node:fs";
import path from "node:path";

const MAX_IMAGES_PER_DIAMOND = 6;
const DIAMOND_IMAGES_DIR = path.join(process.cwd(), "public", "images", "diamonds");

/**
 * Returns the public URLs of the images that actually exist on disk for a
 * given SKU (checking slots 1.jpg through 6.jpg), so the UI never renders a
 * broken <img> for a diamond that has fewer than 6 photos.
 */
export function getDiamondImages(sku: string): string[] {
  const images: string[] = [];
  for (let i = 1; i <= MAX_IMAGES_PER_DIAMOND; i++) {
    const filePath = path.join(DIAMOND_IMAGES_DIR, sku, `${i}.jpg`);
    if (fs.existsSync(filePath)) {
      images.push(`/images/diamonds/${sku}/${i}.jpg`);
    }
  }
  return images;
}

/**
 * Returns the public URL of this SKU's video.mp4 (a short turntable/fire
 * clip, common in the trade for showing brilliance photos can't capture),
 * or null if none was provided.
 */
export function getDiamondVideo(sku: string): string | null {
  const filePath = path.join(DIAMOND_IMAGES_DIR, sku, "video.mp4");
  return fs.existsSync(filePath) ? `/images/diamonds/${sku}/video.mp4` : null;
}
