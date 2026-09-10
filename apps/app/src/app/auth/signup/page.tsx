import Link from "next/link";
import { SignUpForm } from "@/components/auth";

export default function SignUpPage() {
  return (
    <>
      <div className="fixed top-4 right-4 z-30 flex items-center gap-2 text-xs sm:top-6 sm:right-8 sm:text-sm">
        <span className="text-zinc-400">Already have an account?</span>
        <Link
          href="/auth/login"
          className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-medium text-xs text-zinc-200 shadow-sm backdrop-blur-md transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
        >
          Log in
        </Link>
      </div>
      <SignUpForm />
    </>
  );
}
