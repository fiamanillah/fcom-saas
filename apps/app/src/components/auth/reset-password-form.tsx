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
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@syncdocket/ui";
import { useForm } from "@tanstack/react-form";
import { ArrowLeft, ArrowRight, Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

export function ResetPasswordForm() {
  const router = useRouter();
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const form = useForm({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    validators: {
      onChange: ({ value }) => {
        if (value.password && value.confirmPassword && value.password !== value.confirmPassword) {
          return "Passwords do not match";
        }
        return undefined;
      },
    },
    onSubmit: async () => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      toast.success("Password updated successfully!", {
        description: "You can now log in with your new password.",
      });
      router.push("/auth/login");
    },
  });

  return (
    <Card className="relative w-full max-w-[400px] rounded-2xl border border-border bg-card/90 p-5 shadow-xl backdrop-blur-xl sm:p-6">
      <CardHeader className="mb-3 space-y-1 p-0">
        <div className="mb-1 flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
          <KeyRound className="size-4" />
        </div>
        <CardTitle className="font-semibold text-card-foreground text-lg tracking-tight sm:text-xl">
          Set new password
        </CardTitle>
        <CardDescription className="text-muted-foreground text-xs">
          Your new password must be at least 8 characters.
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
            {/* New Password */}
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
                      htmlFor="new-password"
                      className="font-medium text-[11px] text-foreground"
                    >
                      New password
                    </FieldLabel>
                    <InputGroup className="h-8.5 rounded-lg border-input bg-background/70 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30">
                      <InputGroupInput
                        id="new-password"
                        name={field.name}
                        type={showNewPassword ? "text" : "password"}
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
                          aria-label={showNewPassword ? "Hide password" : "Show password"}
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {showNewPassword ? (
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

            {/* Confirm Password */}
            <form.Field
              name="confirmPassword"
              validators={{
                onChange: ({ value }) => {
                  if (!value) return "Please confirm your password";
                  if (value !== form.getFieldValue("password")) {
                    return "Passwords do not match";
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
                      htmlFor="confirm-password"
                      className="font-medium text-[11px] text-foreground"
                    >
                      Confirm password
                    </FieldLabel>
                    <InputGroup className="h-8.5 rounded-lg border-input bg-background/70 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30">
                      <InputGroupInput
                        id="confirm-password"
                        name={field.name}
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="Re-enter password"
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
                          aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {showConfirmPassword ? (
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
                className="mt-1 flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-primary font-medium text-primary-foreground text-xs shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Updating password...</span>
                  </>
                ) : (
                  <>
                    <span>Update password</span>
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
            className="inline-flex items-center gap-1.5 text-muted-foreground text-xs transition-colors hover:text-primary"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to log in</span>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
