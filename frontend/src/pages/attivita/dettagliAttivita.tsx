import { useParams, Link } from "react-router-dom";
import { useState, useMemo } from "react";
import { useAuth } from "../../auth/AuthProvider";
import { useActivity } from "../../hooks/useActivity";

import { ParticipantsList } from "../../components/ParticipantsList";
import { AdminPanel } from "../../components/AdminPanel";
import { ActivityModals } from "../../components/ActivityModals";

import styles from "./attivitaPage.module.css";
import appStyles from "../../App.module.css";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export default function DettagliAttivita() {
  const { id } = useParams();
  const { user } = useAuth();

  const { activity, setActivity, loading, error } = useActivity(id);

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const currentUserID = user?._id;
  const isAdmin = user?.role === "admin";

  const isOrganizer = useMemo(() =>
    activity?.organizerID === currentUserID,
  [activity, currentUserID]);

  const isParticipant = useMemo(() =>
    activity?.partecipantList.some(p => p._id === currentUserID),
  [activity, currentUserID]);

  async function handleAction(endpoint: string, method: string) {
    setActionLoading(true);

    try {
      const res = await fetch(`${API_BASE}/activities/${id}/${endpoint}`, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userID: user?._id, userRole: user?.role }),
      });

      const updated = await res.json();
      updated.partecipantList = updated.partecipantList ?? [];

      setActivity(prev => {
        if (JSON.stringify(prev) === JSON.stringify(updated)) return prev;
        return updated;
      });

    } finally {
      setActionLoading(false);
      setActiveModal(null);
    }
  }

  async function handleDelete() {
    await fetch(`${API_BASE}/activities/${id}`, { method: "DELETE" });
  }

  async function handleReportAction(reportId: string, action: string) {
    await fetch(`${API_BASE}/activities/${id}/reports/${reportId}/${action}`, {
      method: "PATCH"
    });
  }

  if (loading) return <p>Loading...</p>;
  if (!activity) return <p>Errore</p>;

  return (
    <main className={styles.page}>
      <div className={appStyles.contentLayout}>

        <div className={appStyles.leftColumn}>
          <h1>{activity.title}</h1>

          {isAdmin && (
            <AdminPanel
              activity={activity}
              actionLoading={actionLoading}
              handleReportAction={handleReportAction}
            />
          )}

        </div>

        <div className={appStyles.rightColumn}>
          <ParticipantsList
            list={activity.partecipantList}
            isAdmin={isAdmin}
            isOrganizer={isOrganizer}
          />
        </div>

      </div>

      <ActivityModals
        activeModal={activeModal}
        setActiveModal={setActiveModal}
        actionLoading={actionLoading}
        handleAction={handleAction}
        handleDelete={handleDelete}
      />
    </main>
  );
}