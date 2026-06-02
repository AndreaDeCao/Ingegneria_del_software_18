import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";

import { useAuth } from "../../auth/AuthProvider";
import { http } from "../../auth/api";
import type { Trek } from "../../types/Trek";
import appStyles from "../../App.module.css";
import styles from "../treks/TrekDetails.module.css";

import StarRating from "../../components/StarRating";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export default function TrekDetailsAdmin() {
  const { id } = useParams();
  const { user } = useAuth();

  const [trek, setTrek] = useState<Trek | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [segnalazioni, setSegnalazioni] = useState<any[]>([]);
  const [segnalazioniLoading, setSegnalazioniLoading] = useState(false);
  const [segnalazioniError, setSegnalazioniError] = useState<string | null>(null);
  const [segnActionLoading, setSegnActionLoading] = useState(false);

  // ── fetch trek ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`${API_BASE}/treks/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Errore caricamento trek");
        return res.json();
      })
      .then(setTrek)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  // ── fetch segnalazioni ──────────────────────────────────────────────────────
  const fetchSegnalazioni = useCallback(async () => {
    if (!id) return;
    setSegnalazioniLoading(true);
    setSegnalazioniError(null);
    try {
      const data = await http<any[]>(`/api/diary/segnalazioni?trekId=${id}`);
      setSegnalazioni(data);
    } catch (err: any) {
      setSegnalazioniError(err.message);
    } finally {
      setSegnalazioniLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSegnalazioni();
  }, [fetchSegnalazioni]);

  // ── azioni segnalazioni ─────────────────────────────────────────────────────
  const handleGestisci = useCallback(
    async (entryId: string, action: "gestisci" | "riapri") => {
      setSegnActionLoading(true);
      try {
        await http(`/api/diary/segnalazioni/${entryId}/${action}`, {
          method: "PATCH",
        });
        await fetchSegnalazioni();
      } catch (err: any) {
        setSegnalazioniError(err.message);
      } finally {
        setSegnActionLoading(false);
      }
    },
    [fetchSegnalazioni]
  );

  // ── loading / error ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className={appStyles.main}>
        <p className={appStyles.message}>Caricamento percorso...</p>
      </main>
    );
  }

  if (error || !trek) {
    return (
      <main className={appStyles.main}>
        <p className={appStyles.messageError}>
          {error || "Errore nel caricamento del percorso"}
        </p>
      </main>
    );
  }

  const aperte = segnalazioni.filter((s) => !s.segnalazione.gestitaDaAdmin);
  const gestite = segnalazioni.filter((s) => s.segnalazione.gestitaDaAdmin);

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <main className={appStyles.main}>
      <div className={appStyles.contentLayout}>

        {/* ── SINISTRA ── */}
        <section className={appStyles.leftColumn}>

          {/* TITOLO */}
          <div className={appStyles.sectionHead}>
            <h1 className={styles.pageTitle}>{trek.name}</h1>
          </div>

          {/* DESCRIZIONE */}
          <div className={styles.section}>
            <h2 className={appStyles.sectionTitle}>Descrizione</h2>
            <p className={appStyles.message}>
              {trek.description || "Nessuna descrizione disponibile."}
            </p>
          </div>

          {/* INFO */}
          <div className={styles.infoCard}>
            <h2 className={appStyles.sectionTitle}>
              Informazioni del percorso predefinito
            </h2>
            <div className={styles.infoContent}>
              <div>
                <p><strong>Partenza:</strong> {trek.startPoint ?? "—"}</p>
                <p><strong>Arrivo:</strong> {trek.endPoint ?? "—"}</p>
                <p><strong>Durata:</strong> {trek.duration ?? "—"}</p>
              </div>
              <div>
                <p><strong>Lunghezza:</strong> {trek.lengthKm ?? "—"} km</p>
                <p><strong>Quota minima:</strong> {trek.minAltitude ?? "—"} m</p>
                <p><strong>Quota massima:</strong> {trek.maxAltitude ?? "—"} m</p>
                <p><strong>Dislivello:</strong> {trek.elevationGain ?? "—"} m</p>
              </div>
            </div>
          </div>

          {/* SEGNALAZIONI */}
          <div className={styles.section}>
            <h2 className={appStyles.sectionTitle}>
              Segnalazioni dagli utenti
              {aperte.length > 0 && ` (${aperte.length} aperte)`}
            </h2>

            {segnalazioniLoading && (
              <p className={appStyles.message}>Caricamento...</p>
            )}
            {segnalazioniError && (
              <p className={appStyles.messageError}>{segnalazioniError}</p>
            )}
            {!segnalazioniLoading && segnalazioni.length === 0 && (
              <p className={appStyles.message}>
                Nessuna segnalazione per questo percorso.
              </p>
            )}

            {/* aperte */}
            {aperte.length > 0 && (
              <>
                <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>
                  Aperte
                </p>
                {aperte.map((entry: any) => (
                  <div
                    key={entry._id}
                    style={{
                      borderBottom: "1px solid var(--border)",
                      paddingBottom: "0.75rem",
                      marginBottom: "0.75rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.85rem",
                      }}
                    >
                      <span>
                        {entry.userId?.nickname
                          ? `@${entry.userId.nickname}`
                          : entry.userId?.email ?? "Utente"}
                      </span>
                      <span>
                        {new Date(entry.createdAt).toLocaleDateString("it-IT")}
                      </span>
                    </div>

                    {entry.userId?.email && (
                      <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        {entry.userId.email}
                      </p>
                    )}

                    <p style={{ margin: "0.3rem 0", fontWeight: 600 }}>
                      {entry.segnalazione.tipo}
                    </p>

                    {entry.segnalazione.descrizione && (
                      <p style={{ fontSize: "0.9rem" }}>
                        {entry.segnalazione.descrizione}
                      </p>
                    )}

                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      Voce: <em>{entry.titolo}</em> —{" "}
                      {new Date(entry.data).toLocaleDateString("it-IT")}
                    </p>

                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                      <button
                        onClick={() => handleGestisci(entry._id, "gestisci")}
                        disabled={segnActionLoading}
                      >
                        Segna come gestita
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* gestite */}
            {gestite.length > 0 && (
              <>
                <p style={{ fontWeight: 600, margin: "1rem 0 0.5rem" }}>
                  Gestite
                </p>
                {gestite.map((entry: any) => (
                  <div
                    key={entry._id}
                    style={{
                      borderBottom: "1px solid var(--border)",
                      paddingBottom: "0.75rem",
                      marginBottom: "0.75rem",
                      opacity: 0.7,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.85rem",
                      }}
                    >
                      <span>
                        {entry.userId?.nickname
                          ? `@${entry.userId.nickname}`
                          : entry.userId?.email ?? "Utente"}
                      </span>
                      <span style={{ color: "green" }}>✓ Gestita</span>
                    </div>

                    <p style={{ margin: "0.3rem 0", fontWeight: 600 }}>
                      {entry.segnalazione.tipo}
                    </p>

                    {entry.segnalazione.descrizione && (
                      <p style={{ fontSize: "0.9rem" }}>
                        {entry.segnalazione.descrizione}
                      </p>
                    )}

                    <button
                      onClick={() => handleGestisci(entry._id, "riapri")}
                      disabled={segnActionLoading}
                      style={{ marginTop: "0.4rem", fontSize: "0.8rem" }}
                    >
                      Riapri
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>

        </section>

        {/* ── DESTRA ── */}
        <section className={appStyles.rightColumn}>
          <div className={styles.sidebar}>

            <div className={styles.card}>
              <h3 className={appStyles.sectionTitle}>Valutazione</h3>
              <div style={{ marginBottom: "0.75rem" }}>
                <StarRating rating={trek.averageRating ?? 0} />
                <p style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>
                  {trek.averageRating
                    ? `${trek.ratingCount ?? 0} vot${(trek.ratingCount ?? 0) === 1 ? "o" : "i"}`
                    : "Nessuna valutazione ancora"}
                </p>
              </div>
            </div>

          </div>
        </section>

      </div>
    </main>
  );
}
