import { createContext } from "react";

import type { AuthSession } from "@/lib/auth-client";

export const AuthSessionCtx = createContext<AuthSession | null>(null);
