"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

import { useSession } from "@/src/api/user";
import { AuthSessionCtx } from "@/src/app/_context/auth-session-ctx";

export default function AuthCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: authSession, error } = useSession();

  useEffect(() => {
    if (error) {
      toast.warning(`Error fetching session: ${error.message}`);
      router.replace("/signin");
      return;
    }
    if (authSession === null) {
      router.replace("/signin");
    }
  }, [authSession, error, router]);

  return (
    <AuthSessionCtx value={authSession ?? null}>
      {children}
    </AuthSessionCtx>
  );
}
