"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function handlePasswordSignup(e) {
  e.preventDefault();
  setLoading(true);
  setMessage("");

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    setLoading(false);
    setMessage(error.message);
    return;
  }

  if (data.user) {
    await supabase.from("profiles").insert({
      user_id: data.user.id,
      name: "",
      blood_type: "",
      allergies: "",
    });
  }

  setLoading(false);
  router.push("/");
}

  async function handleMagicLink() {
    if (!email) {
      setMessage("Enter your email first.");
      return;
    }
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithOtp({ email });

    setLoading(false);
    setMessage(error ? error.message : "Check your email for a login link.");
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="w-full max-w-sm bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-semibold mb-1" style={{ color: "var(--color-text)" }}>
          Create your account
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>
          Your health records, always with you.
        </p>

        <form onSubmit={handlePasswordSignup} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border rounded-lg px-3 py-2 text-sm"
            style={{ borderColor: "var(--color-border)" }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            style={{ borderColor: "var(--color-border)" }}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg py-2 text-sm font-medium text-white"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <div className="flex items-center gap-2 my-4">
          <div className="flex-1 h-px" style={{ backgroundColor: "var(--color-border)" }} />
          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>or</span>
          <div className="flex-1 h-px" style={{ backgroundColor: "var(--color-border)" }} />
        </div>

        <button
          onClick={handleMagicLink}
          disabled={loading}
          className="w-full rounded-lg py-2 text-sm font-medium border"
          style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}
        >
          Send magic link instead
        </button>

        {message && (
          <p className="text-sm mt-4 text-center" style={{ color: "var(--color-text-muted)" }}>
            {message}
          </p>
        )}

        <p className="text-sm text-center mt-6" style={{ color: "var(--color-text-muted)" }}>
          Already have an account?{" "}
          <a href="/login" style={{ color: "var(--color-primary)" }} className="font-medium">
            Log in
          </a>
        </p>
      </div>
    </main>
  );
}