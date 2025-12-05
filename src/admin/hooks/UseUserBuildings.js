import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";

export function useUserBuildings(userId) {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchBuildings() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("buildings")
          .select("*")
          .order("name", { ascending: true });

        if (error) {
          console.error("Грешка при зареждане на сгради:", error);
          if (!cancelled) setBuildings([]);
        } else {
          if (!cancelled) setBuildings(data || []);
        }
      } catch (err) {
        console.error("System error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchBuildings();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { buildings, loading };
}

export default useUserBuildings;