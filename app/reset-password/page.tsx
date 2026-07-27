"use client"

import { useState, useRef, useEffect, type FormEvent } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { Eye, EyeOff } from "lucide-react"
import { friendlyAuthError } from "@/lib/auth/authErrors"

type Mode = "request" | "reset" | "sent" | "done"

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
      { redirectTo: `${window.location.origin}/reset-password` },
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

    setMode("done")
    setLoading(false)
  }

  if (mode === "sent") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0a0b0e] px-4">
        <div className="w-full max-w-sm">
          <div className="rounded-[8px] border border-[#1c1e24] bg-[#0d0f12] p-8 text-center">
            <h1 className="text-xl font-medium text-[#e8eaf0]">Check your email</h1>
            <p className="mt-3 text-[13px] leading-relaxed text-[#6b7280]">
              We&apos;ve sent a password reset link if an account exists for that email.
            </p>
          </div>
          <Link
            href="/login"
            className="mt-6 block w-full rounded-[8px] bg-[#4fffb0] px-3 py-2.5 text-center text-[13px] font-medium text-[#030405] transition-opacity hover:opacity-90"
          >
            Back to login
          </Link>
        </div>
      </main>
    )
  }

  if (mode === "done") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0a0b0e] px-4">
        <div className="w-full max-w-sm">
          <div className="rounded-[8px] border border-[#1c1e24] bg-[#0d0f12] p-8 text-center">
            <h1 className="text-xl font-medium text-[#e8eaf0]">Password updated</h1>
            <p className="mt-3 text-[13px] leading-relaxed text-[#6b7280]">
              Your password has been changed successfully.
            </p>
          </div>
          <Link
            href="/login"
            className="mt-6 block w-full rounded-[8px] bg-[#4fffb0] px-3 py-2.5 text-center text-[13px] font-medium text-[#030405] transition-opacity hover:opacity-90"
          >
            Go to login
          </Link>
        </div>
      </main>
    )
  }

  if (mode === "reset") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0a0b0e] px-4">
        <div className="w-full max-w-sm">
          <form onSubmit={handleResetPassword} className="rounded-[8px] border border-[#1c1e24] bg-[#0d0f12] p-8">
            <h1 className="text-xl font-medium text-[#e8eaf0]">Reset your password</h1>
            <p className="mt-1.5 text-[13px] text-[#6b7280]">
              Enter your new password below.
            </p>

            <div className="mt-6 space-y-4">
              <div className="relative">
                <input
                  ref={passwordRef}
                  type={showPassword ? "text" : "password"}
                  placeholder="New password"
                  autoFocus
                  autoComplete="new-password"
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
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>

              <p className="-mt-2 text-[11px] text-[#6b7280]">Minimum 8 characters.</p>

              <div className="relative">
                <input
                  ref={confirmRef}
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-[8px] border border-[#1c1e24] bg-[#0a0b0e] px-3 py-2.5 pr-10 text-[13px] text-[#e8eaf0] placeholder:text-[#6b7280] outline-none transition-colors focus:border-[#4fffb0]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  tabIndex={-1}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6b7280] transition-colors hover:text-[#e8eaf0]"
                >
                  {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="mt-4 text-[13px] leading-relaxed text-[#ef4444]">{error}</p>
            )}

            <button
              type="submit"
              disabled={!canReset}
              className="mt-6 w-full rounded-[8px] bg-[#4fffb0] px-3 py-2.5 text-[13px] font-medium text-[#030405] transition-opacity hover:opacity-90 disabled:opacity-30"
            >
              {loading ? "Updating password\u2026" : "Update password"}
            </button>
          </form>

          <p className="mt-6 text-center text-[13px] text-[#6b7280]">
            <Link href="/login" className="text-[#e8eaf0] transition-colors hover:text-[#4fffb0]">
              Back to login
            </Link>
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0a0b0e] px-4">
      <div className="w-full max-w-sm">
        <form onSubmit={handleRequestReset} className="rounded-[8px] border border-[#1c1e24] bg-[#0d0f12] p-8">
          <h1 className="text-xl font-medium text-[#e8eaf0]">Reset your password</h1>
          <p className="mt-1.5 text-[13px] text-[#6b7280]">
            Enter your account email and we&apos;ll send you a password reset link.
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
          </div>

          {error && (
            <p className="mt-4 text-[13px] leading-relaxed text-[#ef4444]">{error}</p>
          )}

          <button
            type="submit"
            disabled={!canSendEmail}
            className="mt-6 w-full rounded-[8px] bg-[#4fffb0] px-3 py-2.5 text-[13px] font-medium text-[#030405] transition-opacity hover:opacity-90 disabled:opacity-30"
          >
            {loading ? "Sending reset link\u2026" : "Send reset link"}
          </button>
        </form>

        <p className="mt-6 text-center text-[13px] text-[#6b7280]">
          <Link href="/login" className="text-[#e8eaf0] transition-colors hover:text-[#4fffb0]">
            Back to login
          </Link>
        </p>
      </div>
    </main>
  )
}
