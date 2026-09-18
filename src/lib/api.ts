import { supabase } from "@/lib/supabase";
import { CVData } from "@/lib/types";
import { ThemeId } from "@/themes";

export type Plan = "free" | "basic" | "pro";

export interface ProfileRow {
  id: string;
  user_id: string;
  slug: string;
  name: string;
  email: string;
  plan: Plan;
  is_public: boolean;
  theme: ThemeId;
  data: CVData;
  updated_at: string;
}

export function fetchProfileBySlug(slug: string) {
  return supabase.from("profiles").select("*").eq("slug", slug).maybeSingle();
}

export function fetchOwnProfile(userId: string) {
  return supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle();
}

export function saveProfile(
  userId: string,
  updates: Partial<Pick<ProfileRow, "data" | "theme" | "is_public">>
) {
  return supabase.from("profiles").update(updates).eq("user_id", userId).select().single();
}

export function signup(input: { name: string; email: string; password: string; slug: string }) {
  return supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: { data: { name: input.name, slug: input.slug } },
  });
}

export function login(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export function logout() {
  return supabase.auth.signOut();
}

export async function checkSlugAvailable(slug: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("slug_available", { check_slug: slug });
  if (error) throw error;
  return Boolean(data);
}
