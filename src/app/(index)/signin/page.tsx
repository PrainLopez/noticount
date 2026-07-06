"use client";

import { Github, HatGlasses } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/src/api/user";

export default function LoginPage() {
  const router = useRouter();
  const { data: authSession, isLoading } = useSession();
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    if (!isLoading && authSession?.userId) {
      router.replace("/record");
    }
  }, [authSession, isLoading, router]);

  const signIn = async (options: "github" | "anonymous") => {
    setIsSigningIn(true);

    try {
      switch (options) {
        case "github": {
          const { error } = await supabase.auth.signInWithOAuth({
            provider: "github",
            options: {
              redirectTo: `${window.location.origin}/signin`,
            },
          });

          if (error) {
            toast.error(`Error signing in: ${error.message}`);
            setIsSigningIn(false);
          }
          break;
        }
        case "anonymous": {
          const { error } = await supabase.auth.signInAnonymously();

          if (error) {
            toast.error(`Error signing in: ${error.message}`);
            setIsSigningIn(false);
            return;
          }
          router.replace("/record");
          break;
        }
      }
    }
    catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`Error signing in: ${message}`);
      setIsSigningIn(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>
          Sign in to your account using GitHub
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <Button
          onClick={() => void signIn("github")}
          disabled={isSigningIn}
          className="w-full max-w-xs"
          size="lg"
        >
          <Github className="size-5" />
          {isSigningIn ? "Signing in..." : "Sign in with GitHub"}
        </Button>
        <Button
          onClick={() => void signIn("anonymous")}
          disabled={isSigningIn}
          className="w-full max-w-xs"
          size="lg"
        >
          <HatGlasses className="size-5" />
          {isSigningIn ? "Signing in..." : "Sign in anonymously"}
        </Button>
      </CardContent>
    </Card>
  );
}
