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
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@syncdocket/ui";
import { useForm } from "@tanstack/react-form";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { SocialAuthButtons } from "./social-auth";

export function SignUpForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState(false);

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      toast.success("Account created! Check your email for verification.", {
        description: `We sent a 6-digit confirmation code to ${value.email}.`,
      });
      router.push(`/auth/verify-otp?email=${encodeURIComponent(value.email)}`);
    },
  });

  return (
    <Card className="relative w-full max-w-[390px] rounded-2xl border border-zinc-800/80 bg-[#121319]/90 p-5 shadow-2xl backdrop-blur-xl sm:p-6">
      <CardHeader className="mb-3 space-y-0.5 p-0">
        <CardTitle className="font-semibold text-lg text-white tracking-tight sm:text-xl">
          Start your 14-day trial
        </CardTitle>
        <CardDescription className="text-xs text-zinc-400">
          No credit card. No sales call. Just ship.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3 p-0">
        <SocialAuthButtons />

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
            {/* Work Email Field */}
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
                      htmlFor="signup-email"
                      className="font-medium text-[11px] text-zinc-300"
                    >
                      Work email
                    </FieldLabel>
                    <Input
                      id="signup-email"
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

            {/* Password Field */}
            <form.Field
              name="password"
              validators={{
                onChange: ({ value }) => {
                  if (!value) return "Password is required";
                  if (value.length < 8) return "Password must be at least 8 characters";
                  return undefined;
                },
              }}
            >
              {(field) => {
                const isInvalid = field.state.meta.isTouched && field.state.meta.errors.length > 0;
                return (
                  <Field data-invalid={isInvalid} className="gap-1">
                    <FieldLabel
                      htmlFor="signup-password"
                      className="font-medium text-[11px] text-zinc-300"
                    >
                      Password
                    </FieldLabel>
                    <InputGroup className="h-8.5 rounded-lg border-zinc-800 bg-zinc-900/60 focus-within:border-zinc-500 focus-within:ring-1 focus-within:ring-zinc-500">
                      <InputGroupInput
                        id="signup-password"
                        name={field.name}
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="8+ characters"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        className="px-3 text-xs text-zinc-100 placeholder:text-zinc-600"
                      />
                      <InputGroupAddon align="inline-end" className="pr-1.5">
                        <InputGroupButton
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-zinc-400 hover:text-zinc-200"
                        >
                          {showPassword ? (
                            <EyeOff className="size-3.5" />
                          ) : (
                            <Eye className="size-3.5" />
                          )}
                        </InputGroupButton>
                      </InputGroupAddon>
                    </InputGroup>
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
                className="mt-1.5 flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-zinc-100 font-medium text-xs text-zinc-950 shadow-sm transition-colors hover:bg-white disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Starting trial...</span>
                  </>
                ) : (
                  <>
                    <span>Start free trial</span>
                    <ArrowRight className="size-3.5" />
                  </>
                )}
              </Button>
            )}
          </form.Subscribe>
        </form>

        <div className="space-y-1.5 pt-1 text-center text-[10.5px]">
          <p className="text-zinc-500 leading-normal">
            By continuing you agree to SyncDocket&apos;s{" "}
            <Link
              href="#"
              className="text-zinc-400 underline underline-offset-2 hover:text-zinc-200"
            >
              Terms
            </Link>{" "}
            and{" "}
            <Link
              href="#"
              className="text-zinc-400 underline underline-offset-2 hover:text-zinc-200"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
