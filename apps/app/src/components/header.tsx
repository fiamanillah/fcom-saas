"use client";
import type { Route } from "next";
import Link from "next/link";
import { Logo } from "./logo";
import { ModeToggle } from "./mode-toggle";

export default function Header() {
  const links: { to: Route; label: string }[] = [
    { to: "/", label: "Home" },
    { to: "/auth/login", label: "Sign in" },
  ];

  return (
    <header className="border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-14 items-center justify-between px-4 sm:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Logo size="sm" />
        </Link>
        <div className="flex items-center gap-4">
          <nav className="flex items-center gap-4 font-medium text-muted-foreground text-sm">
            {links.map(({ to, label }) => (
              <Link key={to} href={to} className="transition-colors hover:text-foreground">
                {label}
              </Link>
            ))}
          </nav>
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
