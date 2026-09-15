"use client";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@syncdocket/ui";
import { ArrowLeft, ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

export function OtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "your email";

  const [otpValue, setOtpValue] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [countdown, setCountdown] = React.useState(30);

  React.useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleResend = () => {
    if (countdown > 0) return;
    setCountdown(30);
    toast.success("Verification code resent!", {
      description: `A new 6-digit code has been sent to ${email}.`,
    });
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    if (otpValue.length < 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsSubmitting(false);

    toast.success("Verification successful!", {
      description: "Welcome to SyncDocket. Your account is verified.",
    });
    router.push("/");
  };

  return (
    <Card className="relative w-full max-w-[400px] rounded-2xl border border-border bg-card/90 p-5 text-center shadow-xl backdrop-blur-xl sm:p-6">
      <CardHeader className="mb-3 space-y-1 p-0">
        <div className="mx-auto mb-1 flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
          <ShieldCheck className="size-4" />
        </div>
        <CardTitle className="font-semibold text-card-foreground text-lg tracking-tight sm:text-xl">
          Two-factor verification
        </CardTitle>
        <CardDescription className="text-muted-foreground text-xs leading-relaxed">
          We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 p-0">
        <form onSubmit={handleVerify} className="space-y-4">
          <div className="flex flex-col items-center justify-center space-y-2">
            <InputOTP
              maxLength={6}
              value={otpValue}
              onChange={(value) => {
                setOtpValue(value);
                if (error) setError(null);
                if (value.length === 6) {
                  setTimeout(() => {
                    handleVerify();
                  }, 100);
                }
              }}
              containerClassName="gap-2"
            >
              <InputOTPGroup className="gap-1">
                <InputOTPSlot
                  index={0}
                  className="size-9 rounded-md border-input bg-background/70 text-foreground focus:border-primary focus:ring-1 focus:ring-primary/30"
                />
                <InputOTPSlot
                  index={1}
                  className="size-9 rounded-md border-input bg-background/70 text-foreground focus:border-primary focus:ring-1 focus:ring-primary/30"
                />
                <InputOTPSlot
                  index={2}
                  className="size-9 rounded-md border-input bg-background/70 text-foreground focus:border-primary focus:ring-1 focus:ring-primary/30"
                />
              </InputOTPGroup>
              <InputOTPSeparator className="text-muted-foreground" />
              <InputOTPGroup className="gap-1">
                <InputOTPSlot
                  index={3}
                  className="size-9 rounded-md border-input bg-background/70 text-foreground focus:border-primary focus:ring-1 focus:ring-primary/30"
                />
                <InputOTPSlot
                  index={4}
                  className="size-9 rounded-md border-input bg-background/70 text-foreground focus:border-primary focus:ring-1 focus:ring-primary/30"
                />
                <InputOTPSlot
                  index={5}
                  className="size-9 rounded-md border-input bg-background/70 text-foreground focus:border-primary focus:ring-1 focus:ring-primary/30"
                />
              </InputOTPGroup>
            </InputOTP>

            {error && <p className="text-[11px] text-destructive">{error}</p>}
          </div>

          <Button
            type="submit"
            disabled={otpValue.length < 6 || isSubmitting}
            className="flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-primary font-medium text-primary-foreground text-xs shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Verifying code...</span>
              </>
            ) : (
              <>
                <span>Verify code</span>
                <ArrowRight className="size-3.5" />
              </>
            )}
          </Button>
        </form>

        <div className="space-y-3 pt-1 text-center">
          <p className="text-[11px] text-muted-foreground">
            Didn&apos;t receive a code?{" "}
            {countdown > 0 ? (
              <span className="font-medium text-muted-foreground">Resend in {countdown}s</span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                className="font-medium text-primary underline underline-offset-2 hover:opacity-80"
              >
                Resend code
              </button>
            )}
          </p>

          <div className="border-border border-t pt-3">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-1.5 text-muted-foreground text-xs transition-colors hover:text-primary"
            >
              <ArrowLeft className="size-3.5" />
              <span>Back to log in</span>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
