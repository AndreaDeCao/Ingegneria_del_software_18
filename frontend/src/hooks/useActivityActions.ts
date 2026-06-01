import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export function useActivityActions(id?: string, user?: any, onUpdate?: (data: any) => void) {
  const [loading, setLoading] = useState(false);

  async function action(endpoint: string, method: string, body: any = {}) {
    if (!id) return;

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/activities/${id}/${endpoint}`, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userID: user?._id,
          userRole: user?.role,
          ...body
        }),
      });

      if (!res.ok) throw new Error("Errore");

      const updated = await res.json();
      updated.partecipantList = updated.partecipantList ?? [];

      onUpdate?.(updated);

    } finally {
      setLoading(false);
    }
  }

  return {
    loading,
    join: () => action("join", "POST"),
    leave: () => action("leave", "POST"),
    cancel: () => action("cancel", "PATCH"),
    uncancel: () => action("uncancel", "PATCH"),
    open: () => action("open", "PATCH"),
    close: () => action("close", "PATCH"),
    delete: () => action("", "DELETE"),
  };
}