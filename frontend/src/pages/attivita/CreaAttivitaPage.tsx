import { useEffect, useState } from "react";
import styles from "./attivitaPage.module.css";
import appStyles from "../../App.module.css";

import type { Trek } from "../../types/Trek";
import { useAuth } from "../../auth/AuthProvider";
import { Link } from "react-router-dom";

export default function CreaAttivitaPage() {
  const { user } = useAuth();

  const [treks, setTreks] = useState<Trek[]>([]);
  const [title, setTitle] = useState("");
  const [selectedTrek, setSelectedTrek] = useState("");
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [activityDate, setActivityDate] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [travelMode, setTravelMode] = useState("");

  useEffect(() => {
    async function fetchTreks() {
      try {
        const res = await fetch("http://localhost:3000/treks");
        const data = await res.json();

        const sorted = data.sort((a: Trek, b: Trek) =>
          a.name.localeCompare(b.name)
        );

        setTreks(sorted);
      } catch (err) {
        console.error(err);
        showMessage("Errore nel caricamento dei trek");
      }
    }

    fetchTreks();
  }, []);

  function showMessage(msg: string) {
    setMessage(msg);

    setTimeout(() => {
      setMessage("");
    }, 3000);
  }

  function handleTrekChange(trekID: string) {
    setSelectedTrek(trekID);
    const trek = treks.find((t) => t._id === trekID);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    showMessage("");

    const now = new Date();
    const selectedDate = new Date(activityDate);

    if (isNaN(selectedDate.getTime())) {
      showMessage("Data non valida");
      return;
    }

    if (selectedDate < now) {
      showMessage("La data deve essere futura");
      return;
    }

    try {
      const body = {
        title,
        description,
        activityDate: selectedDate.toISOString(),
        maxParticipants,
        trekID: selectedTrek,
        travelMode,
        status: "Aperto",
        organizerID: user?._id,
      };

      const res = await fetch("http://localhost:3000/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Errore backend");
      }

      showMessage("Attività creata con successo ✔");
      // reset
      setTitle("");
      setDescription("");
      setActivityDate("");
      setSelectedTrek("");
      setTravelMode("");
      setMaxParticipants(10);
    } catch (err: any) {
      console.error(err);
      showMessage(err.message || "Errore nella creazione attività");
    }
  }

  return (
    <main className={styles.page}>
      <div className={appStyles.contentLayout}>
        
        <div className={appStyles.leftColumn}>
          
          <div style={{ paddingBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',}}>
              <h1 className={styles.pageTitle}>Crea Attività</h1>

              <Link to="/attivita/visualizza" className={styles.primaryButton}>
                Apri Lista Attività
              </Link>
          </div>


          {/* FORM */}
          <form className={styles.formCard} onSubmit={handleSubmit}>

            <div className={styles.section}>
              <label className={styles.label}>Titolo attività</label>
              <input
                className={styles.input}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className={styles.section}>
              <label className={styles.label}>Trek</label>
              <select
                className={styles.input}
                value={selectedTrek}
                onChange={(e) => handleTrekChange(e.target.value)}
                required
              >
                <option value="">Seleziona un trek</option>
                {treks.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.section}>
              <label className={styles.label}>Modalità percorso</label>

              <select 
                className={styles.input}
                value={travelMode}
                onChange={(e) => setTravelMode(e.target.value)}
                required
              >
                <option value="">Seleziona modalità</option> {/* FIXME: aggiorna DATABASE, la lista delle modalità non esiste (model e type gia aggiornati)*/}
                <option value="walking">A piedi</option>
                <option value="bicycling">In bici</option>
              </select>
            </div>

            <div className={styles.grid}>

              <div className={styles.section}>
                <label className={styles.label}>Partecipanti max</label>
                <input
                  className={styles.input}
                  type="number"
                  min={1}
                  max={50}
                  value={maxParticipants}
                  onChange={(e) =>
                    setMaxParticipants(Number(e.target.value))
                  }
                  required
                />
              </div>

              <div className={styles.section}>
                <label className={styles.label}>Data</label>
                <input
                  className={styles.input}
                  type="datetime-local"
                  value={activityDate}
                  onChange={(e) => setActivityDate(e.target.value)}
                  required
                />
              </div>

            </div>

            <div className={styles.section}>
              <label className={styles.label}>Descrizione</label>
              <textarea
                className={styles.textarea}
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <button className={styles.primaryButton}>
              Crea attività
            </button>

            {message && <p className={styles.message}>{message}</p>}
          </form>

        </div>
      </div>
    </main>
  );
}