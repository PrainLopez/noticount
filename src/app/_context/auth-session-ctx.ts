import type { Session } from "@supabase/supabase-js";

import { createContext } from "react";

export const AuthSessionCtx = createContext<Session | null>(null);
