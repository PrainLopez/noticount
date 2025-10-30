"use client";

import type { Session } from "@supabase/supabase-js";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/lib/supabase";
import { AuthSessionCtx } from "@/src/app/_context/auth-session-ctx";

export default function AuthCheck({ children }: { children: React.ReactNode }) {
  const [authSession, setAuthSession] = useState<Session | null>(null);

  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        toast.warning(`Error fetching session: ${error.message}`);
        router.replace("/signin");
        return;
      }
      // console.log(session?.user.id);
      if (!session) {
        router.replace("/signin");
      }

      setAuthSession(session);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          router.replace("/signin");
        }

        setAuthSession(session);
      },
    );

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [router]);

  // if (isLoading) {
  //   return (
  //     <div className="flex flex-col items-center justify-start w-full min-h-screen font-medium">
  //       <main className="flex flex-col content-center items-start justify-start w-full max-w-3xl p-4 gap-4">
  //         <h1 className="font-mono text-4xl font-bold tracking-tight p-2">Noticount</h1>
  //       </main>
  //     </div>
  //   );
  // }

  return (
    <AuthSessionCtx value={authSession}>
      {children}
    </AuthSessionCtx>
  );
}
