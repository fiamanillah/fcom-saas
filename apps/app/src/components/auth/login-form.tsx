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
    <Card className="relative w-full max-w-[400px] rounded-2xl border border-border bg-card/90 p-5 shadow-xl backdrop-blur-xl sm:p-6">
      <CardHeader className="mb-3 space-y-1 p-0">
        <CardTitle className="font-semibold text-card-foreground text-lg tracking-tight sm:text-xl">
          Sign in to SyncDocket
        </CardTitle>
        <CardDescription className="text-muted-foreground text-xs">
          Enter your credentials to access your omnichannel workspace.
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
                      className="font-medium text-[11px] text-foreground"
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
                      className="h-8.5 rounded-lg border-input bg-background/70 px-3 text-foreground text-xs placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/30"
                    />
                    {isInvalid && (
                      <FieldError className="text-[11px] text-destructive">
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
                        className="font-medium text-[11px] text-foreground"
                      >
                        Password
                      </FieldLabel>
                      <Link
                        href="/auth/forgot-password"
                        className="text-[11px] text-muted-foreground transition-colors hover:text-primary"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <InputGroup className="h-8.5 rounded-lg border-input bg-background/70 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30">
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
                        className="px-3 text-foreground text-xs placeholder:text-muted-foreground"
                      />
                      <InputGroupAddon align="inline-end" className="pr-1.5">
                        <InputGroupButton
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-muted-foreground hover:text-foreground"
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
                      <FieldError className="text-[11px] text-destructive">
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
                className="size-3.5 rounded border-input bg-background data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
              />
              <label
                htmlFor="remember-me"
                className="cursor-pointer select-none text-[11px] text-muted-foreground hover:text-foreground"
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
                className="mt-1.5 flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-primary font-medium text-primary-foreground text-xs shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign in to Workspace</span>
                    <ArrowRight className="size-3.5" />
                  </>
                )}
              </Button>
            )}
          </form.Subscribe>
        </form>

        <p className="text-center text-muted-foreground text-xs">
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/signup"
            className="font-medium text-primary underline underline-offset-4 transition-colors hover:opacity-80"
          >
            Start free trial
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
