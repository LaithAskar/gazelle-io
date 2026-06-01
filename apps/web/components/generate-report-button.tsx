"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function GenerateReportButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        onClick={async () => {
          setBusy(true);
          setError(null);
          try {
            const res = await fetch("/api/insights", { method: "POST" });
            if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
            router.refresh();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Failed");
          } finally {
            setBusy(false);
          }
        }}
        disabled={busy}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-60"
      >
        {busy ? "Generating…" : "Generate weekly report"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
