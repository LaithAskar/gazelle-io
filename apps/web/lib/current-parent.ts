import { createRequestClient } from "@/lib/supabase/server";
import type { ParentProfile } from "@gazelle/shared";
import type { User } from "@supabase/supabase-js";

export interface CurrentParent {
  user: User;
  parent: ParentProfile | null;
}

/** Resolve the signed-in user and their parent profile, or null if unauthenticated. */
export async function getCurrentParent(req?: Request): Promise<CurrentParent | null> {
  const supabase = createRequestClient(req);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: parent } = await supabase
    .from("parent_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return { user, parent: parent ?? null };
}
