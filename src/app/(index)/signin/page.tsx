"use client";

import { Github, HatGlasses } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      // console.log(data?.session?.user ?? "No user session");

      if (error) {
        console.error("Error fetching session:", error.message);
        return;
      }
      if (data?.session?.user) {
        router.replace("/record");
      }
    };
    checkSession();
  }, [router]);

  const signIn = async (options: "github" | "anonymous") => {
    setIsLoading(true);

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
        }
        break;
      }
      case "anonymous": {
        const { error } = await supabase.auth.signInAnonymously();

        if (error) {
          toast.error(`Error signing in: ${error.message}`);
        }
        break;
      }
    }

    setIsLoading(false);
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
          disabled={isLoading}
          className="w-full max-w-xs"
          size="lg"
        >
          <Github className="size-5" />
          {isLoading ? "Signing in..." : "Sign in with GitHub"}
        </Button>
        <Button
          onClick={() => void signIn("anonymous")}
          disabled={isLoading}
          className="w-full max-w-xs"
          size="lg"
        >
          <HatGlasses className="size-5" />
          {isLoading ? "Signing in..." : "Sign in anonymously"}
        </Button>
      </CardContent>
    </Card>
  );
}
