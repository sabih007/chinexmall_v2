"use client";

import { startTransition, useState } from "react";
import { createDirectUploadsAction } from "@/app/admin/actions";
import type { DirectUpload } from "@/lib/admin/uploads";

/**
 * Submits a form whose file inputs may hold product photos.
 *
 * Before the Server Action runs, every picked file is sent from the browser
 * straight to Storage at a signed URL, and its public URL takes the file's
 * place in the form data — same field name, same order. The action then reads
 * URLs where it would have read files, and the request body stays small
 * enough for a serverless host (`uploads.ts` has the numbers).
 *
 * When the store runs on files there is no bucket to send to, so the files
 * stay put and travel in the body as they always did.
 */
export function useDirectUploads(formAction: (formData: FormData) => void) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>();

  async function submit(formData: FormData, fileFields: string[]) {
    setError(undefined);

    const picked = fileFields.flatMap((field) =>
      formData
        .getAll(field)
        .filter((entry): entry is File => entry instanceof File && entry.size > 0)
        .map((file) => ({ field, file })),
    );

    if (picked.length > 0) {
      setUploading(true);
      try {
        const grant = await createDirectUploadsAction(
          picked.map(({ file }) => ({
            name: file.name,
            type: file.type,
            size: file.size,
          })),
        );

        if (grant.status === "error") {
          setError(grant.message);
          return;
        }

        if (grant.status === "direct") {
          const urls = await Promise.all(
            picked.map(({ file }, index) => put(grant.uploads[index], file)),
          );
          for (const field of fileFields) formData.delete(field);
          picked.forEach(({ field }, index) => formData.append(field, urls[index]));
        }
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Those photos could not be uploaded.",
        );
        return;
      } finally {
        setUploading(false);
      }
    }

    startTransition(() => formAction(formData));
  }

  return { submit, uploading, error };
}

/** The same headers `storage-js` sends, so the object is cached like before. */
async function put({ signedUrl, publicUrl }: DirectUpload, file: File) {
  const response = await fetch(signedUrl, {
    method: "PUT",
    headers: {
      "content-type": file.type,
      "cache-control": "max-age=31536000",
      "x-upsert": "false",
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error(
      `${file.name || "That photo"} could not be uploaded (${response.status}). Check your connection and try again.`,
    );
  }

  return publicUrl;
}
