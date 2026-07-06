import { createContext } from "react";

export type AuthSession = {
  userId: string;
  email: string | null;
  avatarUrl: string | null;
  userName: string | null;
  provider: string | null;
} | null;

export const AuthSessionCtx = createContext<AuthSession>(null);
