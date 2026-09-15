"use client";

import Link from "next/link";
import type * as React from "react";
import { Logo } from "@/components/logo";
import { ModeToggle } from "@/components/mode-toggle";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative flex h-dvh h-screen max-h-dvh max-h-screen w-full flex-col justify-between overflow-hidden bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      {/* Focused Emerald Primary Background Glow */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 h-[680px] w-[680px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-primary/15 via-primary/5 to-transparent blur-[140px]"
        aria-hidden="true"
      />

      {/* Header */}
      <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between px-6 pt-5 sm:px-8 sm:pt-6">
        <Link href="/" className="transition-opacity hover:opacity-90">
          <Logo size="md" />
        </Link>
        <ModeToggle />
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 mx-auto flex min-h-0 w-full max-w-6xl flex-1 items-center justify-center px-6 py-2 sm:px-8 lg:px-12">
        <div className="grid w-full grid-cols-1 items-center gap-8 md:grid-cols-12 md:gap-12 lg:gap-16">
          {/* Left Column: Clean Brand Statement */}
          <section className="hidden flex-col items-start space-y-4 md:col-span-6 md:flex lg:col-span-7">
            <h1 className="font-bold text-3xl text-foreground leading-[1.15] tracking-tight sm:text-4xl lg:text-[3.25rem]">
              Unify conversations, <br />
              CRM, and courier dispatch{" "}
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 bg-clip-text text-transparent dark:from-emerald-400 dark:via-teal-300 dark:to-emerald-200">
                in one workspace.
              </span>
            </h1>

            <p className="max-w-md font-normal text-muted-foreground text-sm leading-relaxed sm:text-base">
              SyncDocket brings real-time customer messaging, purchase history, and parcel
              fulfillment onto a single screen.
            </p>
          </section>

          {/* Right Column: Auth Form */}
          <section className="flex w-full justify-center md:col-span-6 md:justify-end lg:col-span-5">
            {children}
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 pb-4 text-muted-foreground text-xs sm:px-8 sm:pb-5">
        <p>© {new Date().getFullYear()} SyncDocket</p>
        <div className="flex gap-4">
          <Link href="#" className="transition-colors hover:text-foreground">
            Privacy
          </Link>
          <Link href="#" className="transition-colors hover:text-foreground">
            Terms
          </Link>
        </div>
      </footer>
    </div>
  );
}
