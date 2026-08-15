"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { AuthSessionCtx } from "@/src/app/_context/auth-session-ctx";

export default function AuthCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, isPending, error } = authClient.useSession();

  useEffect(() => {
    if (isPending) {
      return;
    }
    if (error) {
      toast.warning(`Error fetching session: ${error.message ?? `status ${error.status ?? "unknown"}`}`);
    }
    if (!session) {
      router.replace("/signin");
    }
  }, [session, isPending, error, router]);

  return (
    <AuthSessionCtx value={session}>
      {children}
    </AuthSessionCtx>
  );
}
