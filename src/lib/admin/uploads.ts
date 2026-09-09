import "server-only";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
} from "./product-form";

/**
 * Product photo uploads.
 *
 * Files land in `public/uploads`, so they are served straight off the origin
 * and need no `images.remotePatterns` entry. That works on any Node host; on a
 * read-only serverless filesystem, point `saveUploadedImages` at S3, Supabase
 * storage or the Shopify CDN instead — it returns URLs, so nothing else in the
 * dashboard or the storefront changes.
 */

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

/** Public path prefix matching `UPLOAD_DIR`. */
export const UPLOAD_URL_PREFIX = "/uploads";

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

export class UploadError extends Error {}

function filename(file: File): string {
  const extension = EXTENSIONS[file.type] ?? "jpg";
  const stamp = Date.now().toString(36);
  const noise = Math.random().toString(36).slice(2, 8);
  return `${stamp}-${noise}.${extension}`;
}

/**
 * Writes the submitted photos and returns their public URLs, in the order they
 * were chosen. Throws `UploadError` with a message meant for the operator.
 */
export async function saveUploadedImages(files: File[]): Promise<string[]> {
  const usable = files.filter((file) => file && file.size > 0);
  if (usable.length === 0) return [];

  for (const file of usable) {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      throw new UploadError(
        `${file.name || "That file"} is not a supported image. Use JPG, PNG, WebP, AVIF or GIF.`,
      );
    }
    if (file.size > MAX_IMAGE_BYTES) {
      throw new UploadError(
        `${file.name || "That file"} is larger than ${Math.round(MAX_IMAGE_BYTES / 1024 / 1024)} MB.`,
      );
    }
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const urls: string[] = [];
  for (const file of usable) {
    const name = filename(file);
    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(UPLOAD_DIR, name), bytes);
    urls.push(`${UPLOAD_URL_PREFIX}/${name}`);
  }

  return urls;
}
