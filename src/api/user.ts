import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import type { AuthSession } from "@/src/app/_context/auth-session-ctx";

export function useSession() {
  return useQuery({
    queryKey: ["auth-session", "user"],
    queryFn: async (): Promise<AuthSession> => {
      const response = await fetch("/api/auth/session", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Session fetch failed: ${response.status}`);
      }
      const payload = (await response.json()) as { session: AuthSession };
      return payload.session;
    },
    refetchInterval: 5_000,
    refetchOnWindowFocus: true,
    throwOnError: (error) => {
      toast.error(`Error fetching session:\n ${error}`);
      return false;
    },
  });
}

export async function signOut(): Promise<void> {
  const response = await fetch("/api/auth/signout", {
    method: "POST",
    cache: "no-store",
  });
  if (!response.ok) {
    const message = `Sign out failed: ${response.status}`;
    toast.error(message);
    throw new Error(message);
  }
}
