import Link from "next/link";
import { SignOutButton } from "./sign-out-button";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/lessons", label: "Lessons" },
  { href: "/students", label: "Students" },
];

export function AppShell({
  teacherName,
  children,
}: {
  teacherName?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-lg font-semibold text-brand-600">
              Gazelle<span className="text-slate-400">.io</span>
            </Link>
            <nav className="flex gap-4">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className="text-sm text-slate-600 hover:text-slate-900">
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {teacherName ? <span className="text-sm text-slate-500">{teacherName}</span> : null}
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
