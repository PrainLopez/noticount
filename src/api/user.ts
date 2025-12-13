import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/lib/supabase";

export function useSession() {
  return (useQuery({
    queryKey: ["auth-session", "user"],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        return Promise.reject(error);
      }
      return data.session;
    },
    throwOnError: (error) => {
      toast.error(`Error fetching session:\n ${error}`);
      return false;
    },
  }));
}
