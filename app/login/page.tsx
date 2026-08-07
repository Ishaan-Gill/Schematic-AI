"use client";

import { useState, useRef, type FormEvent, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { friendlyAuthError } from "@/lib/auth/authErrors";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log in | Schematic AI",
  description:
    "Log in to Schematic AI to access your workspace and analyze your business data.",
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();
  const router = useRouter();

  const canSubmit = email.trim() && password.trim() && !loading;

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      emailRef.current?.focus();
      return;
    }
    if (!password.trim()) {
      passwordRef.current?.focus();
      return;
    }

    if (!canSubmit) return;

    setLoading(true);
    setError("");

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (authError) {
      setError(friendlyAuthError(authError.message));
      setLoading(false);
      return;
    }

    router.push("/workspace");
  };
  useEffect(() => {
    console.log("Workspace mounted");
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0a0b0e] px-4">
      <div className="w-full max-w-sm">
        <form
          onSubmit={handleLogin}
          className="rounded-[8px] border border-[#1c1e24] bg-[#0d0f12] p-8"
        >
          <h1 className="text-xl font-medium text-[#e8eaf0]">Log in</h1>
          <p className="mt-1.5 text-[13px] text-[#6b7280]">
            Welcome back. Enter your credentials to continue.
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <input
                ref={emailRef}
                type="email"
                placeholder="Email"
                autoFocus
                autoComplete="email"
                spellCheck={false}
                autoCapitalize="none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-[8px] border border-[#1c1e24] bg-[#0a0b0e] px-3 py-2.5 text-[13px] text-[#e8eaf0] placeholder:text-[#6b7280] outline-none transition-colors focus:border-[#4fffb0]"
              />
            </div>

            <div className="relative">
              <input
                ref={passwordRef}
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-[8px] border border-[#1c1e24] bg-[#0a0b0e] px-3 py-2.5 pr-10 text-[13px] text-[#e8eaf0] placeholder:text-[#6b7280] outline-none transition-colors focus:border-[#4fffb0]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6b7280] transition-colors hover:text-[#e8eaf0]"
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>

            <div className="flex justify-end">
              <Link
                href="/reset-password"
                className="text-[12px] text-[#6b7280] transition-colors hover:text-[#e8eaf0]"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          {error && (
            <p className="mt-4 text-[13px] leading-relaxed text-[#ef4444]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="mt-6 w-full rounded-[8px] bg-[#4fffb0] px-3 py-2.5 text-[13px] font-medium text-[#030405] transition-opacity hover:opacity-90 disabled:opacity-30"
          >
            {loading ? "Logging in\u2026" : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-center text-[13px] text-[#6b7280]">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-[#e8eaf0] transition-colors hover:text-[#4fffb0]"
          >
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}
