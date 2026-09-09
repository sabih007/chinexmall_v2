"use client";

import { AlertCircle, Loader2, LogIn } from "lucide-react";
import { useActionState } from "react";
import { AdminField, AdminInput } from "@/components/admin/Fields";
import { Button } from "@/components/ui/Button";
import { loginAction } from "@/app/admin/actions";

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(loginAction, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {next && <input type="hidden" name="next" value={next} />}

      <AdminField label="Password" htmlFor="password">
        <AdminInput
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          autoFocus
          required
          placeholder="••••••••"
        />
      </AdminField>

      {state.message && (
        <p
          role="alert"
          className="flex items-start gap-2.5 rounded-[10px] border border-accent/30 bg-accent-soft px-3.5 py-2.5 text-[12.5px] leading-relaxed text-accent"
        >
          <AlertCircle size={15} strokeWidth={1.8} className="mt-px shrink-0" />
          {state.message}
        </p>
      )}

      <Button type="submit" full disabled={pending}>
        {pending ? (
          <Loader2 size={15} strokeWidth={2} className="animate-spin" />
        ) : (
          <LogIn size={15} strokeWidth={1.8} />
        )}
        {pending ? "Checking…" : "Sign in"}
      </Button>
    </form>
  );
}
