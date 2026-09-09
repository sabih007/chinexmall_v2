"use client";

import { ArrowLeft, ArrowRight, ImagePlus, Link2, X } from "lucide-react";
import { useId, useRef, useState } from "react";
import { AdminField } from "@/components/admin/Fields";
import { Button } from "@/components/ui/Button";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGES,
  isSupportedImageUrl,
} from "@/lib/admin/product-form";
import { cn } from "@/lib/utils";

/**
 * The photo strip on the product form.
 *
 * Two ways in: choose files (uploaded by the Server Action, which is why the
 * file input keeps its own `photos` name) or paste a URL. Already-attached
 * photos ride along in a hidden `imageUrls` field, one per line, so the whole
 * gallery survives a rejected submission.
 *
 * The first photo is the one the product card and the cart use, hence the
 * reordering arrows rather than a plain delete list.
 */
export function ImageManager({
  urls,
  onChange,
  pendingFiles,
  onFilesChange,
  error,
}: {
  urls: string[];
  onChange: (urls: string[]) => void;
  pendingFiles: File[];
  onFilesChange: (files: FileList | null) => void;
  error?: string;
}) {
  const fileInputId = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  const [urlDraft, setUrlDraft] = useState("");
  const [urlError, setUrlError] = useState<string>();

  const total = urls.length + pendingFiles.length;

  function move(index: number, by: number) {
    const next = [...urls];
    const target = index + by;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function addUrl() {
    const value = urlDraft.trim();
    if (!value) return;

    if (!isSupportedImageUrl(value)) {
      setUrlError(
        "That address is not allowed. Upload the file instead, or add its domain to images.remotePatterns in next.config.ts.",
      );
      return;
    }
    if (urls.includes(value)) {
      setUrlError("That photo is already attached.");
      return;
    }
    if (total >= MAX_IMAGES) {
      setUrlError(`A product can have at most ${MAX_IMAGES} photos.`);
      return;
    }

    onChange([...urls, value]);
    setUrlDraft("");
    setUrlError(undefined);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Hidden carrier: what the Server Action reads as the final gallery. */}
      <input type="hidden" name="imageUrls" value={urls.join("\n")} />

      {total > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {urls.map((url, index) => (
            <li
              key={url}
              className="group relative overflow-hidden rounded-[10px] border border-line bg-sand"
            >
              {/* Plain <img>: previews must render any pasted URL without
                  waiting on the image optimiser. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt=""
                className="aspect-square w-full object-cover"
              />

              {index === 0 && (
                <span className="absolute left-1.5 top-1.5 rounded-full bg-brand px-2 py-0.5 text-[10px] font-medium text-paper">
                  Main
                </span>
              )}

              <div className="absolute inset-x-1.5 bottom-1.5 flex items-center justify-between gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                <span className="flex gap-1">
                  <IconAction
                    label="Move photo earlier"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                  >
                    <ArrowLeft size={13} strokeWidth={2} />
                  </IconAction>
                  <IconAction
                    label="Move photo later"
                    onClick={() => move(index, 1)}
                    disabled={index === urls.length - 1}
                  >
                    <ArrowRight size={13} strokeWidth={2} />
                  </IconAction>
                </span>
                <IconAction
                  label="Remove photo"
                  onClick={() => onChange(urls.filter((_, i) => i !== index))}
                >
                  <X size={13} strokeWidth={2} />
                </IconAction>
              </div>
            </li>
          ))}

          {pendingFiles.map((file) => (
            <li
              key={`${file.name}-${file.size}-${file.lastModified}`}
              className="relative overflow-hidden rounded-[10px] border border-dashed border-brand/50 bg-brand-soft"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={URL.createObjectURL(file)}
                alt=""
                className="aspect-square w-full object-cover opacity-80"
              />
              <span className="absolute inset-x-0 bottom-0 bg-brand/90 px-2 py-1 text-center text-[10px] font-medium text-paper">
                Uploads on save
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileInput}
          id={fileInputId}
          name="photos"
          type="file"
          multiple
          accept={ACCEPTED_IMAGE_TYPES.join(",")}
          onChange={(event) => onFilesChange(event.target.files)}
          className="sr-only"
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => fileInput.current?.click()}
        >
          <ImagePlus size={15} strokeWidth={1.7} />
          Choose photos
        </Button>
        <span className="text-[11.5px] text-muted">
          {total}/{MAX_IMAGES} · JPG, PNG, WebP, AVIF or GIF up to 5 MB
        </span>
      </div>

      <AdminField
        label="…or paste a photo address"
        htmlFor="image-url-draft"
        error={urlError ?? error}
        optional
      >
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Link2
              size={15}
              strokeWidth={1.7}
              aria-hidden
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              id="image-url-draft"
              type="url"
              value={urlDraft}
              placeholder="https://images.unsplash.com/photo-…"
              onChange={(event) => {
                setUrlDraft(event.target.value);
                setUrlError(undefined);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addUrl();
                }
              }}
              className="w-full rounded-[10px] border border-line bg-paper py-2.5 pl-9 pr-3.5 text-[13.5px] outline-none transition-colors placeholder:text-muted/70 focus:border-brand"
            />
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={addUrl}>
            Add
          </Button>
        </div>
      </AdminField>
    </div>
  );
}

function IconAction({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex h-6 w-6 items-center justify-center rounded-full bg-ink/75 text-paper backdrop-blur transition-colors hover:bg-ink",
        disabled && "pointer-events-none opacity-30",
      )}
    >
      {children}
    </button>
  );
}
