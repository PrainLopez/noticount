"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/lib/supabase";

import { UidContext } from "../_context/uid-context";

export default function AuthCheck({ children }: { children: React.ReactNode }) {
  const [uid, setUid] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        toast.warning(`Error fetching session: ${error.message}`);
        router.replace("/signin");
        return;
      }
      if (!session) {
        router.replace("/signin");
        return;
      }
      setUid(session.user.id);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          router.replace("/signin");
        }
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
    <UidContext value={uid}>
      {children}
    </UidContext>
  );
}
