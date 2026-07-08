"use client";

import { useEffect, useState } from "react";

/** Shows the teacher's class code, generating it on first visit. */
export function ClassCodeCard({ initialCode }: { initialCode: string | null }) {
  const [code, setCode] = useState<string | null>(initialCode);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (code) return;
    let cancelled = false;
    fetch("/api/teacher/class-code")
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to load class code");
        if (!cancelled) setCode(json.classCode);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load class code");
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  async function copy() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable — the code is visible to copy manually.
    }
  }

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-brand-500/30 bg-brand-50 px-5 py-4">
      <div>
        <h2 className="text-sm font-semibold text-brand-700">Your class code</h2>
        <p className="mt-0.5 text-sm text-slate-600">
          Share this with parents — they enter it in the Gazelle app to link their child to your class.
        </p>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
      <div className="flex items-center gap-3">
        <span className="rounded-lg border border-brand-500/40 bg-white px-4 py-2 font-mono text-xl font-bold tracking-[0.2em] text-brand-700">
          {code ?? "······"}
        </span>
        <button
          onClick={copy}
          disabled={!code}
          className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}
