import { useEffect, useState, useCallback } from "react";
import type { ActivityPopulated } from "../types/ActivityPopulated";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
const POLL_INTERVAL_MS = 15000;

export function useActivity(id?: string) {
  const [activity, setActivity] = useState<ActivityPopulated | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivity = useCallback(async () => {
    if (!id) return;

    try {
      const res = await fetch(`${API_BASE}/activities/${id}`);
      if (!res.ok) return;

      const data: ActivityPopulated = await res.json();
      data.partecipantList = data.partecipantList ?? [];

      setActivity(prev => {
        if (JSON.stringify(prev) === JSON.stringify(data)) return prev;
        return data;
      });

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  useEffect(() => {
    const interval = setInterval(fetchActivity, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchActivity]);

  return { activity, setActivity, loading, error };
}