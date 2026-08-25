"use client"

import { useState, useRef, useEffect, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { Eye, EyeOff } from "lucide-react"
import { friendlyAuthError } from "@/lib/auth/authErrors"
import { CircleCheck } from "lucide-react"
import { AuthShell } from "@/components/auth/AuthShell"

type Mode = "request" | "reset" | "sent"

export default function ResetPasswordPage() {
  const [mode, setMode] = useState<Mode>("request")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const confirmRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()
  const router = useRouter()
  const origin =
    typeof window !== "undefined" ? window.location.origin : ""

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user?.aud === "authenticated") {
        setMode("reset")
      }
    })
  }, [supabase])

  const canSendEmail = email.trim() && !loading

  const handleRequestReset = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      emailRef.current?.focus()
      return
    }
    if (!canSendEmail) return

    setLoading(true)
    setError("")

    const { error: authError } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: `${origin}/auth/callback?next=/reset-password` },
    )

    if (authError) {
      setError(friendlyAuthError(authError.message))
      setLoading(false)
      return
    }

    setMode("sent")
    setLoading(false)
  }

  const passwordsMatch = password === confirmPassword
  const canReset = password && confirmPassword && passwordsMatch && !loading

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault()
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
    if (!canReset) return

    setLoading(true)
    setError("")

    const { error: authError } = await supabase.auth.updateUser({ password })

    if (authError) {
      setError(friendlyAuthError(authError.message))
      setLoading(false)
      return
    }

    setLoading(false)
    router.push("/workspace")
  }

  if (mode === "sent") {
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
              We&apos;ve sent a password reset link if an account exists for that email.
            </p>
          </div>
          <Link href="/login" className="auth-button">
            Back to login
          </Link>
        </div>
      </AuthShell>
    )
  }

  if (mode === "reset") {
    return (
      <AuthShell>
        <div className="auth-col">
          <form onSubmit={handleResetPassword} className="auth-card">
            <p className="auth-kicker">Schematic AI / Account recovery</p>
            <h1 className="auth-title">
              Reset your <i>password.</i>
            </h1>
            <p className="auth-sub">
              Enter your new password below.
            </p>

            <div className="auth-fields">
              <div className="auth-field--relative">
                <input
                  ref={passwordRef}
                  type={showPassword ? "text" : "password"}
                  placeholder="New password"
                  autoFocus
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
                  placeholder="Confirm new password"
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

            <button
              type="submit"
              disabled={!canReset}
              className="auth-button"
            >
              {loading ? "Updating password\u2026" : "Update password"}
            </button>
          </form>

          <p className="auth-swap">
            <Link href="/login">Back to login</Link>
          </p>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <div className="auth-col">
        <form onSubmit={handleRequestReset} className="auth-card">
          <p className="auth-kicker">Schematic AI / Account recovery</p>
          <h1 className="auth-title">
            Reset your <i>password.</i>
          </h1>
          <p className="auth-sub">
            Enter your account email and we&apos;ll send you a password reset link.
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
          </div>

          {error && (
            <p role="alert" className="auth-error">{error}</p>
          )}

          <button
            type="submit"
            disabled={!canSendEmail}
            className="auth-button"
          >
            {loading ? "Sending reset link\u2026" : "Send reset link"}
          </button>
        </form>

        <p className="auth-swap">
          <Link href="/login">Back to login</Link>
        </p>
      </div>
    </AuthShell>
  )
}
