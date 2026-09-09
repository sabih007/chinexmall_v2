"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { registerAction } from "@/app/(storefront)/account/actions";
import { FormNotice } from "@/components/account/FormNotice";
import { Field, TextInput } from "@/components/checkout/Fields";
import { Button } from "@/components/ui/Button";
import {
  PASSWORD_HINT,
  PASSWORD_MIN,
  initialRegisterState,
} from "@/lib/account/form";

/**
 * Create an account.
 *
 * Validation is the server's — the same `validateRegistration` the action runs
 * — so the browser's own bubbles are switched off with `noValidate` and every
 * message a shopper sees comes from one place.
 */
export function RegisterForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(
    registerAction,
    initialRegisterState,
  );
  const errors = state.errors ?? {};
  const values = state.values;

  return (
    <form action={formAction} className="flex flex-col gap-1" noValidate>
      {next && <input type="hidden" name="next" value={next} />}

      <div className="grid gap-x-4 sm:grid-cols-2">
        <Field label="First name" htmlFor="firstName" error={errors.firstName}>
          <TextInput
            id="firstName"
            name="firstName"
            autoComplete="given-name"
            defaultValue={values?.firstName}
            error={errors.firstName}
            required
          />
        </Field>

        <Field label="Last name" htmlFor="lastName" error={errors.lastName}>
          <TextInput
            id="lastName"
            name="lastName"
            autoComplete="family-name"
            defaultValue={values?.lastName}
            error={errors.lastName}
            required
          />
        </Field>
      </div>

      <Field label="Email" htmlFor="email" error={errors.email}>
        <TextInput
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          defaultValue={values?.email}
          error={errors.email}
          required
        />
      </Field>

      <Field label="Mobile number" htmlFor="phone" error={errors.phone}>
        <TextInput
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="0300 1234567"
          defaultValue={values?.phone}
          error={errors.phone}
          required
        />
      </Field>

      <Field label="Password" htmlFor="password" error={errors.password}>
        <TextInput
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={PASSWORD_MIN}
          error={errors.password}
          required
          aria-describedby={errors.password ? "password-error" : "password-hint"}
        />
      </Field>
      {!errors.password && (
        <p id="password-hint" className="-mt-3 mb-1 text-[11.5px] text-muted">
          {PASSWORD_HINT}
        </p>
      )}

      <label className="mt-3 flex cursor-pointer items-start gap-3 text-[12.5px] leading-relaxed text-ink-soft">
        <input
          type="checkbox"
          name="marketingOptIn"
          defaultChecked={values?.marketingOptIn}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-line accent-brand"
        />
        Email me new arrivals and member-only prices. No noise, once a week.
      </label>

      {state.message && (
        <div className="mt-4">
          <FormNotice>{state.message}</FormNotice>
        </div>
      )}

      <Button type="submit" full size="lg" disabled={pending} className="mt-5">
        {pending && <Loader2 size={15} strokeWidth={2} className="animate-spin" />}
        {pending ? "Creating account…" : "Create account"}
      </Button>

      <p className="mt-5 text-center text-[13px] text-muted">
        Already have an account?{" "}
        <Link
          href={next ? `/account/login?next=${encodeURIComponent(next)}` : "/account/login"}
          className="font-medium text-brand underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
