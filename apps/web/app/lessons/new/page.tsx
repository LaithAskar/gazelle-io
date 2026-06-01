"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const GRADES = [0, 1, 2, 3, 4, 5, 6];

export default function NewLessonPage() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [grade, setGrade] = useState(3);
  const [subject, setSubject] = useState("math");
  const [objectives, setObjectives] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/lessons/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, grade, subject, objectives, durationMinutes }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Generation failed");
      router.push(`/lessons/${json.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Link href="/lessons" className="text-sm text-slate-500 hover:text-slate-800">
        ← Back to lessons
      </Link>
      <h1 className="mt-3 text-2xl font-semibold">New lesson plan</h1>
      <p className="mt-1 text-sm text-slate-500">
        The Planner grounds your plan in Common Core standards and saves it as a draft for your review.
      </p>

      <form onSubmit={generate} className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-6">
        <label className="block">
          <span className="text-sm font-medium">Topic</span>
          <input
            required
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Introduction to multiplication as equal groups"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium">Grade</span>
            <select
              value={grade}
              onChange={(e) => setGrade(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {GRADES.map((g) => (
                <option key={g} value={g}>
                  {g === 0 ? "Kindergarten" : `Grade ${g}`}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium">Subject</span>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="math">Math</option>
              <option value="ela">English Language Arts</option>
            </select>
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium">Objectives (optional)</span>
          <textarea
            value={objectives}
            onChange={(e) => setObjectives(e.target.value)}
            rows={3}
            placeholder="What should students be able to do by the end?"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Duration (minutes)</span>
          <input
            type="number"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value))}
            className="mt-1 w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {busy ? "Generating plan…" : "Generate lesson plan"}
        </button>
        {busy && (
          <p className="text-xs text-slate-400">
            This calls the Planner agent (and may take a few seconds).
          </p>
        )}
      </form>
    </div>
  );
}
