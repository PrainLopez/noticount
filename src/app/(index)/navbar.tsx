"use client";

import { use } from "react";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { supabase } from "@/lib/supabase";

import { AuthSessionCtx } from "../_context/auth-session-ctx";

export default function Navbar() {
  const authSession = use(AuthSessionCtx);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error.message);
    }
    else {
      console.log("Signed out successfully");
    }
  };

  if (authSession?.user) {
    return (
      <header className="w-full justify-between items-center flex flex-row">
        <h1 className="font-mono text-4xl font-bold tracking-tight p-2">Noticount</h1>
        <HoverCard>
          <HoverCardTrigger>
            <Avatar className="m-2">
              <AvatarImage src={authSession.user.user_metadata.avatar_url} />
            </Avatar>
          </HoverCardTrigger>
          <HoverCardContent className="mx-4 flex flex-row items-center gap-4 justify-between">
            <p className="">{authSession.user.user_metadata.user_name}</p>
            <Button
              variant="default"
              onClick={handleSignOut}
            >Sign out
            </Button>
          </HoverCardContent>
        </HoverCard>
      </header>
    );
  }
}
