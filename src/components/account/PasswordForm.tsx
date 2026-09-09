"use client";

import { Loader2 } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";
import { changePasswordAction } from "@/app/(storefront)/account/actions";
import { FormNotice } from "@/components/account/FormNotice";
import { Field, TextInput } from "@/components/checkout/Fields";
import { Button } from "@/components/ui/Button";
import {
  PASSWORD_HINT,
  PASSWORD_MIN,
  initialPasswordState,
} from "@/lib/account/form";

export function PasswordForm() {
  const [state, formAction, pending] = useActionState(
    changePasswordAction,
    initialPasswordState,
  );
  const form = useRef<HTMLFormElement>(null);
  const errors = state.errors ?? {};

  /* Never leave a password sitting in a field once it has been changed. */
  useEffect(() => {
    if (state.status === "saved") form.current?.reset();
  }, [state.status]);

  return (
    <form ref={form} action={formAction} className="flex flex-col gap-1" noValidate>
      <Field
        label="Current password"
        htmlFor="currentPassword"
        error={errors.currentPassword}
      >
        <TextInput
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          error={errors.currentPassword}
          required
        />
      </Field>

      <Field label="New password" htmlFor="new-password" error={errors.password}>
        <TextInput
          id="new-password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={PASSWORD_MIN}
          error={errors.password}
          required
          aria-describedby={
            errors.password ? "new-password-error" : "new-password-hint"
          }
        />
      </Field>
      {!errors.password && (
        <p id="new-password-hint" className="-mt-3 mb-1 text-[11.5px] text-muted">
          {PASSWORD_HINT}
        </p>
      )}

      {state.message && (
        <div className="mt-4">
          <FormNotice tone={state.status === "saved" ? "success" : "error"}>
            {state.message}
          </FormNotice>
        </div>
      )}

      <div className="mt-5">
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending && <Loader2 size={15} strokeWidth={2} className="animate-spin" />}
          {pending ? "Updating…" : "Update password"}
        </Button>
      </div>
    </form>
  );
}
