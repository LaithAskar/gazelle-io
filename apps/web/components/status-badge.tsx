const STYLES: Record<string, string> = {
  draft: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  active: "bg-brand-50 text-brand-700",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[status] ?? "bg-slate-100 text-slate-600"}`}>
      {status}
    </span>
  );
}
