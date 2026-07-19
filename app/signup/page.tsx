"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const supabase = createClient();

  const handleSignUp = async () => {
    setLoading(true);
    setError("");
  
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
  
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    
    setLoading(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-3xl font-bold">Create your account</h1>

        <p className="text-muted-foreground">Sign up to use Schematic.ai</p>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border p-3"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border p-3"
          />

          <button
            className="w-full rounded-md bg-white text-black p-3 disabled:opacity-50"
            disabled={loading}
            onClick={() => handleSignUp()}
          >
            {loading ? "Creating..." : "Create Account"}
          </button>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      </div>
    </main>
  );
}
