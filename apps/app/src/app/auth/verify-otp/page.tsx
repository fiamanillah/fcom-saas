import * as React from "react";
import { OtpForm } from "@/components/auth";

export default function VerifyOtpPage() {
  return (
    <React.Suspense
      fallback={
        <div className="h-64 w-full max-w-[390px] animate-pulse rounded-2xl bg-zinc-900/50" />
      }
    >
      <OtpForm />
    </React.Suspense>
  );
}
