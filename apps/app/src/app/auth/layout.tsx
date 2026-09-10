"use client";

import type * as React from "react";

// Partner logos
function PartnerLogos() {
  return (
    <div className="relative z-10 mx-auto w-full max-w-5xl shrink-0 px-4 pt-1 pb-3 text-center">
      <p className="mb-2.5 select-none font-semibold text-[10px] text-zinc-500 uppercase tracking-[0.22em]">
        Teams shipping with SyncDocket
      </p>
      <div className="flex flex-wrap items-center justify-center gap-6 text-zinc-400 sm:gap-10">
        {/* Stripe */}
        <div className="flex items-center space-x-1 font-bold text-[#635BFF] text-lg tracking-tight transition-opacity hover:opacity-90">
          <span>stripe</span>
        </div>

        {/* OpenAI */}
        <div className="flex items-center space-x-1.5 font-semibold text-sm text-zinc-300 tracking-tight transition-colors hover:text-white">
          <svg className="size-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.5045 4.5045 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.8956zm16.0993 3.8558L12.6 8.3829l2.02-1.1638a.0804.0804 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.4047-.686zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L8.907 9.2298V6.8974a.0662.0662 0 0 1 .0331-.0615l4.8493-2.8056a4.4992 4.4992 0 0 1 6.6433 4.6757zm-11.458-1.579l2.0154-1.1639a.071.071 0 0 1 .071 0l4.835 2.7913a4.4944 4.4944 0 0 1-.7427 8.0805l-.0142-.0852-4.7736-2.7676a.7948.7948 0 0 0-.7853 0l-5.8333 3.3685v-2.3324a.0804.0804 0 0 1 .0332-.0615zm1.2208 4.2341l2.8009-1.614 2.801 1.614v3.228l-2.801 1.614-2.8009-1.614z" />
          </svg>
          <span className="font-semibold text-sm">OpenAI</span>
        </div>

        {/* Anthropic */}
        <div className="flex items-center font-semibold text-xs text-zinc-300 tracking-wider transition-colors hover:text-white">
          <span>ANTHROP\C</span>
        </div>

        {/* Slack */}
        <div className="flex items-center space-x-1.5 font-bold text-zinc-300 transition-colors hover:text-white">
          <svg className="size-3.5" viewBox="0 0 127 127" fill="none" aria-hidden="true">
            <path
              d="M27.2 79.9a13.6 13.6 0 0 1-13.6-13.6 13.6 13.6 0 0 1 13.6-13.6h13.6v27.2H27.2zm6.8 6.8a13.6 13.6 0 0 1 13.6-13.6 13.6 13.6 0 0 1 13.6 13.6v34a13.6 13.6 0 0 1-13.6 13.6 13.6 13.6 0 0 1-13.6-13.6v-34z"
              fill="#E01E5A"
            />
            <path
              d="M47.6 27.2a13.6 13.6 0 0 1 13.6-13.6 13.6 13.6 0 0 1 13.6 13.6v13.6H47.6V27.2zm-6.8 6.8a13.6 13.6 0 0 1 13.6 13.6 13.6 13.6 0 0 1 13.6 13.6H6.8a13.6 13.6 0 0 1-13.6-13.6 13.6 13.6 0 0 1 13.6-13.6h34z"
              fill="#36C5F0"
            />
            <path
              d="M99.8 47.6a13.6 13.6 0 0 1 13.6 13.6 13.6 13.6 0 0 1-13.6 13.6H86.2V47.6h13.6zm-6.8-6.8a13.6 13.6 0 0 1-13.6 13.6 13.6 13.6 0 0 1 13.6 13.6V6.8a13.6 13.6 0 0 1 13.6-13.6 13.6 13.6 0 0 1 13.6 13.6v34z"
              fill="#2EB67D"
            />
            <path
              d="M79.4 99.8a13.6 13.6 0 0 1-13.6 13.6 13.6 13.6 0 0 1-13.6-13.6V86.2h27.2v13.6zm6.8-6.8a13.6 13.6 0 0 1-13.6-13.6 13.6 13.6 0 0 1 13.6 13.6h34a13.6 13.6 0 0 1 13.6 13.6 13.6 13.6 0 0 1-13.6 13.6h-34z"
              fill="#ECB22E"
            />
          </svg>
          <span className="font-semibold text-sm tracking-tight">slack</span>
        </div>

        {/* Mintlify */}
        <div className="flex items-center space-x-1.5 font-semibold text-xs text-zinc-300 transition-colors hover:text-white">
          <div className="size-3 rounded-full bg-[#0FD984]" />
          <span className="font-medium text-sm tracking-tight">mintlify</span>
        </div>

        {/* Resend */}
        <div className="flex items-center font-bold text-base text-zinc-200 tracking-wider transition-colors hover:text-white">
          <span>Resend</span>
        </div>
      </div>
    </div>
  );
}

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative flex h-dvh h-screen max-h-dvh max-h-screen w-full flex-col justify-between overflow-hidden bg-[#08090d] text-zinc-100 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {/* Subtle dual-tone glow mesh */}
      <div
        className="pointer-events-none absolute -top-32 left-1/3 h-[520px] w-[520px] rounded-full bg-gradient-to-br from-amber-600/18 via-rose-600/10 to-transparent blur-[130px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-1/4 -right-16 h-[540px] w-[540px] rounded-full bg-gradient-to-tr from-purple-700/22 via-indigo-600/15 to-transparent blur-[140px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-24 left-8 h-[440px] w-[440px] rounded-full bg-gradient-to-tr from-blue-900/15 via-indigo-950/10 to-transparent blur-[130px]"
        aria-hidden="true"
      />

      {/* Main Centered 2-Column Section */}
      <main className="relative z-10 mx-auto flex min-h-0 w-full max-w-6xl flex-1 items-center justify-center px-4 py-2 sm:px-8 lg:px-12">
        <div className="grid w-full grid-cols-1 items-center gap-6 md:grid-cols-12 md:gap-8 lg:gap-14">
          {/* Left Column: Hero & Branding */}
          <section className="flex flex-col items-start space-y-3 sm:space-y-4 md:col-span-6 lg:col-span-7">
            {/* Headline */}
            <h1 className="font-bold text-3xl text-white leading-[1.08] tracking-tight sm:text-4xl lg:text-[3.25rem]">
              The UI layer to <br />
              grow your{" "}
              <span className="bg-gradient-to-r from-[#FF7A00] via-[#FF3B69] to-[#A855F7] bg-clip-text text-transparent">
                product.
              </span>
            </h1>

            {/* Subtitle Description */}
            <p className="max-w-md pt-0.5 font-normal text-xs text-zinc-400 leading-relaxed sm:text-sm lg:text-base">
              A premium block library built on shadcn. Auth, billing, dashboards, and settings.
              Production-ready the day you clone it.
            </p>
          </section>

          {/* Right Column: Active Card View */}
          <section className="flex w-full justify-center md:col-span-6 md:justify-end lg:col-span-5">
            {children}
          </section>
        </div>
      </main>

      {/* Footer / Partner Logos */}
      <PartnerLogos />
    </div>
  );
}
