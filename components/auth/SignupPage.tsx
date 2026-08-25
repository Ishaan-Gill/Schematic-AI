"use client"

import { useState, useRef, type FormEvent } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { CircleCheck, Eye, EyeOff } from "lucide-react"
import { friendlyAuthError } from "@/lib/auth/authErrors"
import { AuthShell } from "./AuthShell"

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const confirmRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()
  const origin =
    typeof window !== "undefined" ? window.location.origin : ""

  const passwordsMatch = password === confirmPassword
  const canSubmit =
    email.trim() &&
    password &&
    confirmPassword &&
    passwordsMatch &&
    !loading

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault()

    if (!email.trim()) {
      emailRef.current?.focus()
      return
    }
    if (!password) {
      passwordRef.current?.focus()
      return
    }
    if (!confirmPassword) {
      confirmRef.current?.focus()
      return
    }
    if (!passwordsMatch) {
      setError("Passwords do not match.")
      confirmRef.current?.focus()
      return
    }

    if (!canSubmit) return

    setLoading(true)
    setError("")

    const { error: authError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback?next=/workspace`,
      },
    })

    if (authError) {
      setError(friendlyAuthError(authError.message))
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <AuthShell>
        <div className="auth-col">
          <div className="auth-card auth-card--center">
            <p className="auth-kicker">Schematic AI / Verify</p>
            <div className="auth-badge">
              <CircleCheck className="size-6" />
            </div>
            <h1 className="auth-title">
              Check your <i>email.</i>
            </h1>
            <p className="auth-sub">
              We&apos;ve sent you a verification link.
              <br />
              Please verify your email before logging in.
            </p>
          </div>
          <Link href="/login" className="auth-button">
            Back to log in
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <div className="auth-col">
        <form onSubmit={handleSignUp} className="auth-card">
          <p className="auth-kicker">Schematic AI / Start free</p>
          <h1 className="auth-title">
            Create your <i>account.</i>
          </h1>
          <p className="auth-sub">
            Start analyzing your data with AI-powered insights.
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
                autoComplete="new-password"
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
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>

            <p className="auth-hint">Minimum 8 characters.</p>

            <div className="auth-field--relative">
              <input
                ref={confirmRef}
                type={showConfirm ? "text" : "password"}
                placeholder="Confirm Password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="auth-input"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                tabIndex={-1}
                aria-label={showConfirm ? "Hide password" : "Show password"}
                className="auth-toggle"
              >
                {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p role="alert" className="auth-error">{error}</p>
          )}

          <button type="submit" disabled={!canSubmit} className="auth-button">
            {loading ? "Creating account\u2026" : "Create account"}
          </button>
        </form>

        <p className="auth-swap">
          Already have an account?{" "}
          <Link href="/login">Log in</Link>
        </p>
      </div>
    </AuthShell>
  )
}
