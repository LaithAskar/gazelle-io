"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createClient();

    try {
      if (mode === "signup") {
        const { data, error: signErr } = await supabase.auth.signUp({ email, password });
        if (signErr) throw signErr;
        const userId = data.user?.id;
        if (!userId) throw new Error("Sign-up did not return a user. Check email confirmation settings.");

        // Bootstrap the teacher's profile rows (RLS allows inserting your own).
        const { error: uErr } = await supabase.from("users").insert({ id: userId, email, role: "teacher" });
        if (uErr && uErr.code !== "23505") throw uErr; // ignore duplicate
        const { error: tErr } = await supabase.from("teacher_profiles").insert({ user_id: userId, name });
        if (tErr && tErr.code !== "23505") throw tErr;
      } else {
        const { error: signErr } = await supabase.auth.signInWithPassword({ email, password });
        if (signErr) throw signErr;
      }
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-brand-600">
          Gazelle<span className="text-slate-400">.io</span>
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {mode === "signup" ? "Create your teacher account" : "Sign in to your dashboard"}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          {mode === "signup" && (
            <input
              required
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          )}
          <input
            required
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            required
            type="password"
            placeholder="Password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
          </button>
        </form>

        <button
          onClick={() => {
            setMode(mode === "signup" ? "signin" : "signup");
            setError(null);
          }}
          className="mt-4 text-sm text-slate-500 hover:text-slate-800"
        >
          {mode === "signup" ? "Have an account? Sign in" : "New here? Create an account"}
        </button>
      </div>
    </div>
  );
}
