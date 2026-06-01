import { createClient } from "@/lib/supabase/server";
import type { TeacherProfile } from "@gazelle/shared";
import type { User } from "@supabase/supabase-js";

export interface CurrentTeacher {
  user: User;
  teacher: TeacherProfile | null;
}

/** Resolve the signed-in user and their teacher profile, or null if unauthenticated. */
export async function getCurrentTeacher(): Promise<CurrentTeacher | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: teacher } = await supabase
    .from("teacher_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return { user, teacher: teacher ?? null };
}
