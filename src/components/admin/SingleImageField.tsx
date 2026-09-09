"use client";

import { ImagePlus, X } from "lucide-react";
import { useRef, useState } from "react";
import { AdminField } from "@/components/admin/Fields";
import { Button } from "@/components/ui/Button";
import { ACCEPTED_IMAGE_TYPES } from "@/lib/admin/product-form";

/**
 * One image: upload a file, or paste an address.
 *
 * The chosen URL rides in a hidden field so the Server Action reads it like any
 * other value; a freshly picked file is sent under `fileName` and its uploaded
 * URL replaces the hidden one server-side.
 */
export function SingleImageField({
  label,
  name,
  fileName,
  value,
  onChange,
  error,
  hint,
  optional,
}: {
  label: string;
  /** Form field carrying the URL. */
  name: string;
  /** Form field carrying an uploaded file. */
  fileName: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  optional?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [picked, setPicked] = useState<File | null>(null);

  const preview = picked ? URL.createObjectURL(picked) : value;

  return (
    <AdminField
      label={label}
      htmlFor={`${name}-url`}
      error={error}
      hint={hint}
      optional={optional}
    >
      <input type="hidden" name={name} value={value} />

      <div className="flex items-start gap-3">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[10px] border border-line bg-sand">
          {preview ? (
            <>
              {/* Plain <img>: a preview must render any pasted URL without
                  waiting on the image optimiser. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="" className="h-full w-full object-cover" />
              {picked && (
                <span className="absolute inset-x-0 bottom-0 bg-brand/90 px-1 py-0.5 text-center text-[9px] font-medium text-paper">
                  Uploads on save
                </span>
              )}
            </>
          ) : (
            <span className="flex h-full items-center justify-center text-[10px] text-muted">
              No image
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <input
            ref={input}
            name={fileName}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(",")}
            onChange={(event) => setPicked(event.target.files?.[0] ?? null)}
            className="sr-only"
          />

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => input.current?.click()}
            >
              <ImagePlus size={14} strokeWidth={1.7} />
              {picked ? "Choose another" : "Upload"}
            </Button>
            {(picked || value) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPicked(null);
                  if (input.current) input.current.value = "";
                  onChange("");
                }}
              >
                <X size={14} strokeWidth={1.8} />
                Clear
              </Button>
            )}
          </div>

          <input
            id={`${name}-url`}
            type="url"
            value={value}
            placeholder="…or paste an image address"
            onChange={(event) => onChange(event.target.value)}
            className="w-full rounded-[10px] border border-line bg-paper px-3 py-2 text-[12.5px] outline-none transition-colors placeholder:text-muted/70 focus:border-brand"
          />
        </div>
      </div>
    </AdminField>
  );
}
