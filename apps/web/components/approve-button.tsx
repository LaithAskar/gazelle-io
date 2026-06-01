"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ApproveButton({ lessonId }: { lessonId: string }) {
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
            const res = await fetch(`/api/lessons/${lessonId}/approve`, { method: "POST" });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error ?? "Approve failed");
            router.refresh();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Approve failed");
          } finally {
            setBusy(false);
          }
        }}
        disabled={busy}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {busy ? "Approving…" : "Approve & build question bank"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
