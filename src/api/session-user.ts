import { supabase } from "@/lib/supabase";

export async function requireSessionUserId(): Promise<string> {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    throw error;
  }
  if (!session?.user?.id) {
    throw new Error("User not authenticated");
  }
  return session.user.id;
}
