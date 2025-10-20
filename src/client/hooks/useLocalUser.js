import { useMemo } from "react";

export function useLocalUser() {
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch (_) {
      return null;
    }
  }, []);

  const userId = user?.id ?? null;
  return { user, userId };
}

