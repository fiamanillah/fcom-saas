"use client";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
} from "@syncdocket/ui";
import { useForm } from "@tanstack/react-form";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [submittedEmail, setSubmittedEmail] = React.useState("");

  const form = useForm({
    defaultValues: {
      email: "",
    },
    onSubmit: async ({ value }) => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setSubmittedEmail(value.email);
      setIsSubmitted(true);
      toast.success("Password recovery email sent!", {
        description: `Instructions sent to ${value.email}`,
      });
    },
  });

  if (isSubmitted) {
    return (
      <Card className="relative w-full max-w-[390px] rounded-2xl border border-zinc-800/80 bg-[#121319]/90 p-5 text-center shadow-2xl backdrop-blur-xl sm:p-6">
        <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
          <CheckCircle2 className="size-5" />
        </div>
        <CardTitle className="mb-1 font-semibold text-lg text-white tracking-tight sm:text-xl">
          Check your inbox
        </CardTitle>
        <CardDescription className="mb-4 text-xs text-zinc-400 leading-relaxed">
          We&apos;ve sent a password recovery link to{" "}
          <span className="font-medium text-zinc-200">{submittedEmail}</span>.
        </CardDescription>

        <div className="space-y-2">
          <Button
            type="button"
            onClick={() =>
              router.push(`/auth/reset-password?email=${encodeURIComponent(submittedEmail)}`)
            }
            className="flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-zinc-100 font-medium text-xs text-zinc-950 shadow-sm transition-colors hover:bg-white"
          >
            <span>Proceed to set new password</span>
            <ArrowRight className="size-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsSubmitted(false)}
            className="flex h-8 w-full items-center justify-center text-xs text-zinc-400 hover:text-zinc-200"
          >
            Try a different email
          </Button>
        </div>

        <div className="mt-4 border-zinc-800/80 border-t pt-3">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 transition-colors hover:text-zinc-200"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to log in</span>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="relative w-full max-w-[390px] rounded-2xl border border-zinc-800/80 bg-[#121319]/90 p-5 shadow-2xl backdrop-blur-xl sm:p-6">
      <CardHeader className="mb-3 space-y-0.5 p-0">
        <div className="mb-2 flex size-8 items-center justify-center rounded-lg bg-zinc-800/60 text-zinc-300">
          <Mail className="size-4" />
        </div>
        <CardTitle className="font-semibold text-lg text-white tracking-tight sm:text-xl">
          Reset your password
        </CardTitle>
        <CardDescription className="text-xs text-zinc-400 leading-relaxed">
          Enter your registered email and we&apos;ll send you a password reset link.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3 p-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-3"
          noValidate
        >
          <FieldGroup className="gap-2.5">
            <form.Field
              name="email"
              validators={{
                onChange: ({ value }) => {
                  if (!value?.trim()) return "Work email is required";
                  if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value.trim())) {
                    return "Please enter a valid work email address";
                  }
                  return undefined;
                },
              }}
            >
              {(field) => {
                const isInvalid = field.state.meta.isTouched && field.state.meta.errors.length > 0;
                return (
                  <Field data-invalid={isInvalid} className="gap-1">
                    <FieldLabel
                      htmlFor="reset-email"
                      className="font-medium text-[11px] text-zinc-300"
                    >
                      Work email
                    </FieldLabel>
                    <Input
                      id="reset-email"
                      name={field.name}
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="you@company.com"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      className="h-8.5 rounded-lg border-zinc-800 bg-zinc-900/60 px-3 text-xs text-zinc-100 placeholder:text-zinc-600 focus-visible:border-zinc-500 focus-visible:ring-1 focus-visible:ring-zinc-500"
                    />
                    {isInvalid && (
                      <FieldError className="text-[11px] text-rose-400">
                        {field.state.meta.errors[0]}
                      </FieldError>
                    )}
                  </Field>
                );
              }}
            </form.Field>
          </FieldGroup>

          <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
            {([canSubmit, isSubmitting]) => (
              <Button
                type="submit"
                disabled={!canSubmit || isSubmitting}
                className="mt-1 flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-zinc-100 font-medium text-xs text-zinc-950 shadow-sm transition-colors hover:bg-white disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Sending recovery email...</span>
                  </>
                ) : (
                  <>
                    <span>Send recovery link</span>
                    <ArrowRight className="size-3.5" />
                  </>
                )}
              </Button>
            )}
          </form.Subscribe>
        </form>

        <div className="pt-2 text-center">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 transition-colors hover:text-zinc-200"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to log in</span>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
