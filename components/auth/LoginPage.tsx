"use client";

import { useState, useRef, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { friendlyAuthError } from "@/lib/auth/authErrors";
import { AuthShell } from "./AuthShell";

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

  return (
    <AuthShell>
      <div className="auth-col">
        <form onSubmit={handleLogin} className="auth-card">
          <p className="auth-kicker">Schematic AI / Welcome back</p>
          <h1 className="auth-title">
            Log <i>in.</i>
          </h1>
          <p className="auth-sub">
            Welcome back. Enter your credentials to continue.
          </p>

          <div className="auth-fields">
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
                className="auth-input"
              />
            </div>

            <div className="auth-field--relative">
              <input
                ref={passwordRef}
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="auth-toggle"
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>

            <div className="auth-row-end">
              <Link href="/reset-password" className="auth-quiet-link">
                Forgot password?
              </Link>
            </div>
          </div>

          {error && (
            <p role="alert" className="auth-error">
              {error}
            </p>
          )}

          <button type="submit" disabled={!canSubmit} className="auth-button">
            {loading ? "Logging in\u2026" : "Log in"}
          </button>
        </form>

        <p className="auth-swap">
          Don&apos;t have an account?{" "}
          <Link href="/signup">Create one</Link>
        </p>
      </div>
    </AuthShell>
  );
}
