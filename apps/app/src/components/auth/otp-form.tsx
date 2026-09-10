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
    <Card className="relative w-full max-w-[390px] rounded-2xl border border-zinc-800/80 bg-[#121319]/90 p-5 text-center shadow-2xl backdrop-blur-xl sm:p-6">
      <CardHeader className="mb-3 space-y-0.5 p-0">
        <div className="mx-auto mb-2 flex size-8 items-center justify-center rounded-lg bg-zinc-800/60 text-zinc-300">
          <ShieldCheck className="size-4" />
        </div>
        <CardTitle className="font-semibold text-lg text-white tracking-tight sm:text-xl">
          Two-factor verification
        </CardTitle>
        <CardDescription className="text-xs text-zinc-400 leading-relaxed">
          We sent a 6-digit code to <span className="font-medium text-zinc-200">{email}</span>.
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
                  // Auto submit when 6 digits are typed
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
                  className="size-9 rounded-md border-zinc-800 bg-zinc-900/60 text-zinc-100"
                />
                <InputOTPSlot
                  index={1}
                  className="size-9 rounded-md border-zinc-800 bg-zinc-900/60 text-zinc-100"
                />
                <InputOTPSlot
                  index={2}
                  className="size-9 rounded-md border-zinc-800 bg-zinc-900/60 text-zinc-100"
                />
              </InputOTPGroup>
              <InputOTPSeparator className="text-zinc-600" />
              <InputOTPGroup className="gap-1">
                <InputOTPSlot
                  index={3}
                  className="size-9 rounded-md border-zinc-800 bg-zinc-900/60 text-zinc-100"
                />
                <InputOTPSlot
                  index={4}
                  className="size-9 rounded-md border-zinc-800 bg-zinc-900/60 text-zinc-100"
                />
                <InputOTPSlot
                  index={5}
                  className="size-9 rounded-md border-zinc-800 bg-zinc-900/60 text-zinc-100"
                />
              </InputOTPGroup>
            </InputOTP>

            {error && <p className="text-[11px] text-rose-400">{error}</p>}
          </div>

          <Button
            type="submit"
            disabled={otpValue.length < 6 || isSubmitting}
            className="flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-zinc-100 font-medium text-xs text-zinc-950 shadow-sm transition-colors hover:bg-white disabled:opacity-60"
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
          <p className="text-[11px] text-zinc-400">
            Didn&apos;t receive a code?{" "}
            {countdown > 0 ? (
              <span className="font-medium text-zinc-500">Resend in {countdown}s</span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                className="font-medium text-zinc-200 underline underline-offset-2 hover:text-white"
              >
                Resend code
              </button>
            )}
          </p>

          <div className="border-zinc-800/80 border-t pt-3">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-1.5 text-xs text-zinc-400 transition-colors hover:text-zinc-200"
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
