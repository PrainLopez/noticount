"use client";

import { Github } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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

  const signInWithGitHub = async () => {
    const redirect = "/signin";

    setIsLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}${redirect}`,
      },
    });

    if (error) {
      console.error("Error signing in:", error.message);
      // TODO: show notification to user
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
          onClick={signInWithGitHub}
          disabled={isLoading}
          className="w-full max-w-xs"
          size="lg"
        >
          <Github className="size-5" />
          {isLoading ? "Signing in..." : "Sign in with GitHub"}
        </Button>
      </CardContent>
    </Card>
  );
}
