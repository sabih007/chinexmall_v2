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
  isSupportedImageUrl,
} from "./product-form";

/**
 * Product photo uploads.
 *
 * With Supabase configured, photos go to a public Storage bucket and the
 * dashboard stores the bucket URL — which is what makes uploads survive on a
 * serverless host, where the filesystem is read-only and wiped each deploy.
 *
 * The browser sends them there itself: it asks `createDirectUploads` for a
 * signed URL per file, PUTs the bytes straight to the bucket, and submits the
 * resulting public URLs in place of the files. Server Action bodies are capped
 * at 1 MB by Next and at 4.5 MB by Vercel, so photos must never travel through
 * the action — a single phone photo is enough to turn the save into a 413.
 *
 * Without Supabase, files ride in the form and land in `public/uploads`, served
 * straight off the origin. Either way this returns URLs, so nothing else in the
 * dashboard or the storefront knows the difference.
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

/** What the browser knows about a file before it has uploaded it. */
export interface UploadRequest {
  name: string;
  type: string;
  size: number;
}

/** Where the browser should PUT a file, and the URL it will have afterwards. */
export interface DirectUpload {
  signedUrl: string;
  publicUrl: string;
}

function filename(file: { type: string }): string {
  const extension = EXTENSIONS[file.type] ?? "jpg";
  const stamp = Date.now().toString(36);
  const noise = Math.random().toString(36).slice(2, 8);
  return `${stamp}-${noise}.${extension}`;
}

function check(file: UploadRequest): void {
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

/**
 * A signed Storage URL for each file the browser is about to upload, in the
 * same order. Returns null when the store runs on files: there is nowhere for
 * the browser to send them, so they travel in the form instead.
 *
 * A signed URL is good for one object and expires on its own, which is all the
 * service-role key ever lends to the browser.
 */
export async function createDirectUploads(
  files: UploadRequest[],
): Promise<DirectUpload[] | null> {
  if (!isSupabaseConfigured()) return null;

  for (const file of files) check(file);

  const bucket = requireSupabase().storage.from(IMAGE_BUCKET);

  return Promise.all(
    files.map(async (file) => {
      const name = filename(file);
      const { data, error } = await bucket.createSignedUploadUrl(name);

      if (error) {
        throw new UploadError(
          `${file.name || "That photo"} could not be uploaded: ${error.message}`,
        );
      }

      return {
        signedUrl: data.signedUrl,
        publicUrl: bucket.getPublicUrl(name).data.publicUrl,
      };
    }),
  );
}

/**
 * Turns a form's photo entries into public URLs, in the order they were
 * chosen. An entry is either a `File` still to be written, or the URL of one
 * the browser has already sent to Storage. Throws `UploadError` with a message
 * meant for the operator.
 */
export async function saveUploadedImages(
  entries: FormDataEntryValue[],
): Promise<string[]> {
  const usable = entries.filter((entry) =>
    typeof entry === "string" ? entry.trim() !== "" : entry.size > 0,
  );
  if (usable.length === 0) return [];

  for (const entry of usable) {
    if (typeof entry === "string") {
      if (!isSupportedImageUrl(entry)) {
        throw new UploadError("One of the photo addresses is not allowed.");
      }
    } else {
      check(entry);
    }
  }

  const store = isSupabaseConfigured() ? uploadToStorage : uploadToDisk;
  const urls: string[] = [];
  for (const entry of usable) {
    urls.push(typeof entry === "string" ? entry : await store(entry));
  }

  return urls;
}

/** Supabase Storage, for a photo that did arrive in the form. */
async function uploadToStorage(file: File): Promise<string> {
  const bucket = requireSupabase().storage.from(IMAGE_BUCKET);
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

  return bucket.getPublicUrl(name).data.publicUrl;
}

async function uploadToDisk(file: File): Promise<string> {
  await mkdir(UPLOAD_DIR, { recursive: true });

  const name = filename(file);
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, name), bytes);

  return `${UPLOAD_URL_PREFIX}/${name}`;
}
