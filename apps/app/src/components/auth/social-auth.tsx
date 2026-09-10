"use client";

import { Button } from "@syncdocket/ui";
import type * as React from "react";
import { toast } from "sonner";

export function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" className="size-3.5 shrink-0" aria-hidden="true" {...props}>
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.33 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27a7.2 7.2 0 0 1 0-4.54V6.58H1.26a11.96 11.96 0 0 0 0 10.84l4.02-3.15Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
      />
    </svg>
  );
}

export function SocialAuthButtons({ showDivider = true }: { showDivider?: boolean }) {
  const handleGoogleLogin = () => {
    toast.info("Connecting to Google...", {
      description: "Redirecting to authentication provider.",
    });
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleLogin}
        className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border-zinc-800 bg-zinc-900/50 font-medium text-xs text-zinc-200 transition-colors hover:bg-zinc-800/70 hover:text-white"
      >
        <GoogleIcon />
        <span>Continue with Google</span>
      </Button>

      {showDivider && (
        <div className="relative my-2 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-zinc-800/80 border-t" />
          </div>
          <div className="relative bg-[#121319] px-2.5">
            <span className="font-medium text-[10px] text-zinc-500 uppercase tracking-widest">
              OR
            </span>
          </div>
        </div>
      )}
    </>
  );
}
