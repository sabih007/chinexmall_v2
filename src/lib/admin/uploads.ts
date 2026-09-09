import "server-only";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  IMAGE_BUCKET,
  isSupabaseConfigured,
  requireSupabase,
} from "@/lib/supabase/client";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
} from "./product-form";

/**
 * Product photo uploads.
 *
 * With Supabase configured, photos go to a public Storage bucket and the
 * dashboard stores the bucket URL — which is what makes uploads survive on a
 * serverless host, where the filesystem is read-only and wiped each deploy.
 *
 * Without it, files land in `public/uploads` and are served straight off the
 * origin. Either way this returns URLs, so nothing else in the dashboard or the
 * storefront knows the difference.
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

  return isSupabaseConfigured()
    ? uploadToStorage(usable)
    : uploadToDisk(usable);
}

/** Supabase Storage — the path a serverless deployment must take. */
async function uploadToStorage(files: File[]): Promise<string[]> {
  const bucket = requireSupabase().storage.from(IMAGE_BUCKET);
  const urls: string[] = [];

  for (const file of files) {
    const name = filename(file);
    const { error } = await bucket.upload(name, file, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false,
    });

    if (error) {
      throw new UploadError(
        `${file.name || "That photo"} could not be uploaded: ${error.message}`,
      );
    }

    urls.push(bucket.getPublicUrl(name).data.publicUrl);
  }

  return urls;
}

async function uploadToDisk(files: File[]): Promise<string[]> {
  await mkdir(UPLOAD_DIR, { recursive: true });

  const urls: string[] = [];
  for (const file of files) {
    const name = filename(file);
    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(UPLOAD_DIR, name), bytes);
    urls.push(`${UPLOAD_URL_PREFIX}/${name}`);
  }

  return urls;
}
