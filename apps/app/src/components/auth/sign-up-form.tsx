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
    <Card className="relative w-full max-w-[400px] rounded-2xl border border-border bg-card/90 p-5 shadow-xl backdrop-blur-xl sm:p-6">
      <CardHeader className="mb-3 space-y-1 p-0">
        <CardTitle className="font-semibold text-card-foreground text-lg tracking-tight sm:text-xl">
          Start your 14-day trial
        </CardTitle>
        <CardDescription className="text-muted-foreground text-xs">
          Unify chats, CRM, and courier logistics. No credit card required.
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
                      className="font-medium text-[11px] text-foreground"
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
                      className="font-medium text-[11px] text-foreground"
                    >
                      Password
                    </FieldLabel>
                    <InputGroup className="h-8.5 rounded-lg border-input bg-background/70 focus-within:border-primary focus-within:ring-primary/30">
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
                    <span>Creating workspace...</span>
                  </>
                ) : (
                  <>
                    <span>Start 14-Day Free Trial</span>
                    <ArrowRight className="size-3.5" />
                  </>
                )}
              </Button>
            )}
          </form.Subscribe>
        </form>

        <p className="text-center text-muted-foreground text-xs">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="font-medium text-primary underline underline-offset-4 transition-colors hover:opacity-80"
          >
            Log in
          </Link>
        </p>

        <div className="space-y-1.5 pt-0.5 text-center text-[10.5px]">
          <p className="text-muted-foreground leading-normal">
            By continuing you agree to SyncDocket&apos;s{" "}
            <Link
              href="#"
              className="text-foreground underline underline-offset-2 hover:text-primary"
            >
              Terms
            </Link>{" "}
            and{" "}
            <Link
              href="#"
              className="text-foreground underline underline-offset-2 hover:text-primary"
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
