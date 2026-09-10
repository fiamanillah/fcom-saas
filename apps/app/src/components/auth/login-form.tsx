"use client";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
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

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState(false);
  const [rememberMe, setRememberMe] = React.useState(false);

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      toast.success("Welcome back!", {
        description: `Logged in as ${value.email}.`,
      });
      router.push("/");
    },
  });

  return (
    <Card className="relative w-full max-w-[390px] rounded-2xl border border-zinc-800/80 bg-[#121319]/90 p-5 shadow-2xl backdrop-blur-xl sm:p-6">
      <CardHeader className="mb-3 space-y-0.5 p-0">
        <CardTitle className="font-semibold text-lg text-white tracking-tight sm:text-xl">
          Welcome back
        </CardTitle>
        <CardDescription className="text-xs text-zinc-400">
          Enter your credentials to access your account.
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
                      htmlFor="login-email"
                      className="font-medium text-[11px] text-zinc-300"
                    >
                      Work email
                    </FieldLabel>
                    <Input
                      id="login-email"
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
                  return undefined;
                },
              }}
            >
              {(field) => {
                const isInvalid = field.state.meta.isTouched && field.state.meta.errors.length > 0;
                return (
                  <Field data-invalid={isInvalid} className="gap-1">
                    <div className="flex items-center justify-between">
                      <FieldLabel
                        htmlFor="login-password"
                        className="font-medium text-[11px] text-zinc-300"
                      >
                        Password
                      </FieldLabel>
                      <Link
                        href="/auth/forgot-password"
                        className="text-[11px] text-zinc-400 transition-colors hover:text-zinc-200"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <InputGroup className="h-8.5 rounded-lg border-zinc-800 bg-zinc-900/60 focus-within:border-zinc-500 focus-within:ring-1 focus-within:ring-zinc-500">
                      <InputGroupInput
                        id="login-password"
                        name={field.name}
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder="Enter password"
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

            {/* Remember Me */}
            <div className="flex items-center gap-2 pt-0.5">
              <Checkbox
                id="remember-me"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(Boolean(checked))}
                className="size-3.5 rounded border-zinc-700 bg-zinc-900 data-[state=checked]:bg-zinc-100 data-[state=checked]:text-zinc-950"
              />
              <label
                htmlFor="remember-me"
                className="cursor-pointer select-none text-[11px] text-zinc-400"
              >
                Remember me for 30 days
              </label>
            </div>
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
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign in</span>
                    <ArrowRight className="size-3.5" />
                  </>
                )}
              </Button>
            )}
          </form.Subscribe>
        </form>
      </CardContent>
    </Card>
  );
}
