"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await createClient().auth.signOut();
        router.push("/auth");
        router.refresh();
      }}
      className="text-sm text-slate-500 hover:text-slate-800"
    >
      Sign out
    </button>
  );
}
