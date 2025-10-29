import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";

const globalBuildingCache = {};

export function useUserBuildings(userId) {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchBuildings() {
      if (!userId) return;

      if (globalBuildingCache[userId]) {
        setBuildings(globalBuildingCache[userId]);
        setLoading(false);
        return;
      }

      setLoading(true);

      const [
        { data: apartmentsData, error: apartmentsError },
        { data: garagesData, error: garagesError },
        { data: officesData, error: officesError },
      ] = await Promise.all([
        supabase
          .from("apartments")
          .select(`building:building_id (id, name, address)`)
          .eq("user_id", userId),
        supabase
          .from("garages")
          .select(`building:building_id (id, name, address)`)
          .eq("user_id", userId),
        supabase
          .from("offices")
          .select(`building:building_id (id, name, address)`)
          .eq("user_id", userId),
      ]);

      if (apartmentsError || garagesError || officesError) {
        console.error("useUserBuildings errors:", {
          apartmentsError,
          garagesError,
          officesError,
        });
        if (!cancelled) setLoading(false);
        return;
      }

      const allBuildings = [
        ...(apartmentsData || []).map((x) => x.building).filter(Boolean),
        ...(garagesData || []).map((x) => x.building).filter(Boolean),
        ...(officesData || []).map((x) => x.building).filter(Boolean),
      ];

      const uniqueById = new Map();
      for (const b of allBuildings) {
        if (!b || b.id == null) continue;
        uniqueById.set(b.id, b);
      }

      const uniqueBuildings = Array.from(uniqueById.values())
        .map((b) => ({ id: b.id, name: b.name, address: b.address }))
        .sort((a, z) => (a.name || "").localeCompare(z.name || ""));

      if (!cancelled) {
        setBuildings(uniqueBuildings);
        globalBuildingCache[userId] = uniqueBuildings;
        setLoading(false);
      }
    }

    fetchBuildings();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { buildings, loading };
}
