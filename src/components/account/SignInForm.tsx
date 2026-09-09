"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { signInAction } from "@/app/(storefront)/account/actions";
import { FormNotice } from "@/components/account/FormNotice";
import { Field, TextInput } from "@/components/checkout/Fields";
import { Button } from "@/components/ui/Button";

export function SignInForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(signInAction, {});

  return (
    <form action={formAction} className="flex flex-col gap-1" noValidate>
      {next && <input type="hidden" name="next" value={next} />}

      <Field label="Email" htmlFor="email">
        <TextInput
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          placeholder="you@example.com"
        />
      </Field>

      <Field label="Password" htmlFor="password">
        <TextInput
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
        />
      </Field>

      {state.message && <FormNotice>{state.message}</FormNotice>}

      <Button type="submit" full size="lg" disabled={pending} className="mt-4">
        {pending && <Loader2 size={15} strokeWidth={2} className="animate-spin" />}
        {pending ? "Signing in…" : "Sign in"}
      </Button>

      <p className="mt-5 text-center text-[13px] text-muted">
        New here?{" "}
        <Link
          href={next ? `/account/register?next=${encodeURIComponent(next)}` : "/account/register"}
          className="font-medium text-brand underline-offset-4 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}
