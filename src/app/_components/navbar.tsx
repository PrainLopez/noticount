"use client";

import { use } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { AuthSessionCtx } from "../_context/auth-session-ctx";

export default function Navbar() {
  const authSession = use(AuthSessionCtx);

  if (authSession?.userId) {
    return (
      <nav className="w-full flex flex-row items-center justify-between gap-2 px-2 py-3 border-b">
        <h1 className="font-mono text-2xl font-bold tracking-tight">Noticount</h1>
        <div className="flex flex-row items-center gap-2">
          <Avatar className="size-8">
            <AvatarImage src={authSession.avatarUrl ?? undefined} />
            <AvatarFallback>{(authSession.userName ?? authSession.email ?? "?").slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <p className="">{authSession.userName ?? authSession.email}</p>
        </div>
      </nav>
    );
  }

  return (
    <nav className="w-full flex flex-row items-center justify-between gap-2 px-2 py-3 border-b">
      <h1 className="font-mono text-2xl font-bold tracking-tight">Noticount</h1>
    </nav>
  );
}
