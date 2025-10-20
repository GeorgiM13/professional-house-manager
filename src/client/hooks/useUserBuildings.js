import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";

const globalBuildingCache = {};

export function useUserBuildings(userId) {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBuildings() {
      if (!userId) return;

      if (globalBuildingCache[userId]) {
        setBuildings(globalBuildingCache[userId]);
        setLoading(false);
        return;
      }

      const [{ data: apartmentsData, error: apartmentsError }, { data: garagesData, error: garagesError }] =
        await Promise.all([
          supabase
            .from("apartments")
            .select(`building:building_id (id, name, address)`)
            .eq("user_id", userId),
          supabase
            .from("garages")
            .select(`building:building_id (id, name, address)`)
            .eq("user_id", userId),
        ]);

      if (!apartmentsError && !garagesError) {
        const allBuildings = [
          ...(apartmentsData || []).map((a) => a.building),
          ...(garagesData || []).map((g) => g.building),
        ];

        const uniqueBuildings = Array.from(
          new Map(allBuildings.map((b) => [b.id, b])).values()
        );

        setBuildings(uniqueBuildings);
        globalBuildingCache[userId] = uniqueBuildings;
      }

      setLoading(false);
    }

    fetchBuildings();
  }, [userId]);

  return { buildings, loading };
}
