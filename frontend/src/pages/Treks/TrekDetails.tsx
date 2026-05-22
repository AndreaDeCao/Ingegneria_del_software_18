import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";

import { http } from "../../auth/api";
import type { Trek } from "../../types/Trek";
import appStyles from "../../App.module.css";
import styles from "./TrekDetails.module.css";
// import type { AlignCenter } from "lucide-react";

import TrekMap from "../../components/TrekMap";
import StarRating from "../../components/StarRating";
import starStyles from "../../components/StarRating.module.css";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export default function TrekDetails() {
  const { id } = useParams();

  const [trek, setTrek] = useState<Trek | null>(null);
  const [weather, setWeather] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [hoverVote, setHoverVote] = useState<number | null>(null);
  
  const { user } = useAuth(); 

  const [myVote, setMyVote] = useState<number | null>(null);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [showNoteBox, setShowNoteBox] = useState(false);
  const [myNote, setMyNote] = useState<string>("");
  
  const [routeGeojson, setRouteGeojson] = useState<any>(null);
  const [routeInfo, setRouteInfo] = useState<{ distanceMeters: number; durationSeconds: number } | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // TREK
        const trekResponse = await fetch(
          `${API_BASE}/treks/${id}`
        );

        if (!trekResponse.ok)
          throw new Error("Errore caricamento trek");

        const trekData = await trekResponse.json();
        setTrek(trekData);

        // RATING UTENTE (solo se loggato)
        if (user) {
          const ratingData = await http<{ vote: number | null; note: string }>(`/treks/${id}/rate`);
          setMyVote(ratingData.vote);
          setMyNote(ratingData.note ?? "");
        }

        // TRACCIATO
        try {
          const routeResponse = await fetch(`${API_BASE}/api/route/${id}`);
          if (routeResponse.ok) {
            const routeData = await routeResponse.json();
            setRouteGeojson(routeData.geojson);
            setRouteInfo({
              distanceMeters: routeData.distanceMeters,
              durationSeconds: routeData.durationSeconds,
            });
          }
        } catch {
          // tracciato non disponibile, la mappa mostra solo il marker
        }

        // METEO 
        const weatherResponse = await fetch(
          `${API_BASE}/api/weather/${trekData._id}`
        );

        if (!weatherResponse.ok)
          throw new Error("Errore caricamento meteo");

        const weatherData = await weatherResponse.json();
        setWeather(weatherData);

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id]);

  function getHourlyList(weather: any) {
    const hourly = weather?.weather?.["180"];
    if (!hourly) return [];

    const list = Object.entries(hourly).map(([key, value]: any) => {
      return {
        key,
        ...value,
      };
    });

    return list;
  }

  function getCurrentHourIndex(list: any[]) {
    const now = new Date().getHours();

    // approssimazione: ogni slot ≈ 3 ore
    const idx = Math.floor(now / 3);
    if (!Array.isArray(list) || list.length === 0) return idx;
    return Math.min(idx, list.length - 1);
  }

  function getDayList(weather: any) {
    const day = weather?.weather?.["1440"];
    if (!day) return [];

    const list = Object.entries(day).map(([key, value]: any) => {
      return {
        key,
        ...value,
      };
    });
    return list;
  }

  function formatSlotTime(key: string) {     // ogni step = 3 ore = 180 minuti
    // prendi solo la parte numerica finale
    const totalMinutes = parseInt(key.slice(-4)); // es: 0180, 0360
    const hours = Math.floor(totalMinutes / 60);

    const startHour = hours.toString().padStart(2, "0") + ":" + "00";
    const endHour = ((hours + 2) % 24).toString().padStart(2, "0") + ":" + "59";

    return `${startHour} - ${endHour}`;
  }

  function formatDayLabelFromKey(weather: any, key: string) {
    const start = new Date(weather.weather.start);

    const base = 144000000;
    const step = 1440;

    const numericKey = Number(key);

    const offsetDays = (numericKey - base) / step;

    const date = new Date(start);

    date.setDate(date.getDate() + offsetDays);

    return date.toLocaleDateString("it-IT", {
      weekday: "long",
      day: "2-digit",
      month: "long",
    });
  }

  function skyToText(code: string) {
    switch (code) {
      case "A": return "Sereno";
      case "B": return "Poco nuvoloso";
      case "C": return "Nuvoloso";
      case "D": return "Molto nuvoloso";
      case "F": return "Pioggia";
      case "H": return "Temporale";
      case "J": return "Variabile";
      default: return "N/D";
    }
  }

  async function shareWithFriends() {
    const shareData = {
      title: trek?.name ?? "Percorso",
      text: `Guarda questo percorso su Dolomate!`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        console.log("Condivisione annullata");
      }
    }

    // fallback: copia link negli appunti
    try {
      await navigator.clipboard.writeText(shareData.url);
      alert("Link copiato negli appunti!");
    } catch {
      alert("Impossibile condividere automaticamente. Copia il link dalla barra degli indirizzi.");
    }
  }

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

  // async function handleVote(vote: number) {
    
  //   if (!user) return;
    
  //   setRatingLoading(true);
    
  //   try {
  //     const data = await http<{ averageRating: number; ratingCount: number }>(`/treks/${id}/rate`, {
  //       method: "PUT",
  //       body: JSON.stringify({ vote, note: myNote }),
  //     });

  //     setMyVote(vote);
  //     setTrek(prev => prev ? { ...prev, averageRating: data.averageRating, ratingCount: data.ratingCount } : prev);
  //   } catch (err) {
  //     console.error("Errore voto:", err);
  //   } finally {
  //     setRatingLoading(false);
  //   }
  // }

  async function handleVote() {

  if (!user || !myVote) return;

  setRatingError(null);
  setRatingLoading(true);

  try {

    const data = await http<{ averageRating: number; ratingCount: number }>(
      `/treks/${id}/rate`,
      {
        method: "PUT",
        body: JSON.stringify({
          vote: myVote,
          note: myNote
        }),
      }
    );

    setTrek(prev =>
      prev
        ? {
            ...prev,
            averageRating: data.averageRating,
            ratingCount: data.ratingCount
          }
        : prev
    );

    // reset UI dopo salvataggio
    setShowNoteBox(false);
    // mantieni la nota in stato (se vuoi riaprire la textarea)

  } catch (err) {

    const message = err instanceof Error ? err.message : "Errore nel salvataggio del voto";
    setRatingError(message);
    console.error("Errore voto:", err);

  } finally {

    setRatingLoading(false);

  }
}

  return (
    <main className={appStyles.main}>
      <div className={appStyles.contentLayout}>
        
        {/* LEFT */}
        <section className={appStyles.leftColumn}>

          {/* HERO */}
          {/* <div className={styles.hero}> 
            <div className={styles.heroBadge}>
              SAT {trek.SatRouteNumber}
            </div>
          </div> */}

          {/* TITLE */}
          <div className={appStyles.sectionHead}>
            <h1 className={styles.pageTitle}>{trek.name}</h1>
          </div>

          {/* BADGES */}
          <div className={styles.badges}>
            <span className={appStyles.sectionCount}>
              Trek details: 
            </span>
            <span className={appStyles.sectionCount}>
              🎯 {trek.difficulty}
            </span>

            <span className={appStyles.sectionCount}>
              ⏱ {trek.duration}
            </span>

            <span className={appStyles.sectionCount}>
              📏 {trek.lengthKm ?? "-"} km
            </span>

            <span className={appStyles.sectionCount}>
              ⛰ {trek.elevationGain ?? "-"} m
            </span>
          </div>

          {/* DESCRIPTION */}
          <div className={styles.section}>
            <h2 className={appStyles.sectionTitle}>Descrizione</h2>

            <p className={appStyles.message}>
              {trek.description || "Nessuna descrizione disponibile."}
            </p>
          </div>

          {/* integrazione mappa google-Maps
          <div className={styles.mapContainer}>
            <iframe
              title="Mappa del percorso"
              src={
                trek.coordinates?.lat && trek.coordinates?.lon
                  ? `https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${trek.coordinates.lat},${trek.coordinates.lon}&zoom=13`
                  : `https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${encodeURIComponent(trek.name)}&zoom=12`
              }
              className={styles.map}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div> */}

          <div className={styles.mapContainer}>
            <TrekMap
              name={trek.name}
              coordinates={trek.coordinates}
              endCoordinates={trek.endCoordinates}
              routeGeojson={routeGeojson}
            />
          </div>
          <div className={styles.mapLegend}>
            <span>🟢 Partenza</span>
            <span>🔴 Arrivo</span>
            <span>🔵 Percorso</span>
          </div>

          {/* INFO BOX */}
          <div className={styles.infoCard}>
            <h2 className={appStyles.sectionTitle}>
              Informazioni percorso
            </h2>

            <div className={styles.infoContent}>
              <div>
                <p>
                  <strong>Partenza:</strong> {trek.startPoint}
                </p>

                <p>
                  <strong>Arrivo:</strong> {trek.endPoint}
                </p>

                <p>
                  <strong>Durata:</strong> {trek.duration}
                </p>
              </div>

              <div>
                <p> 
                  <strong>Lunghezza:</strong> {trek.lengthKm ?? "-"} km
                </p>
                <p>
                  <strong>Quota minima:</strong> {trek.minAltitude ?? "-"} m
                </p>

                <p>
                  <strong>Quota massima:</strong> {trek.maxAltitude ?? "-"} m
                </p>

                <p>
                  <strong>Dislivello:</strong> {trek.elevationGain ?? "-"} m
                </p>
              </div>
            </div>
          </div>

          {/* WEATHER BOX */}
          {weather && (
            <section className={styles.weatherBox}>
              <h2 className={appStyles.sectionTitle}>Meteo</h2>

              {(() => {
                const hourlyList = getHourlyList(weather);
                const currentHourIndex = getCurrentHourIndex(hourlyList);

                const dayList = getDayList(weather);

                if (!hourlyList || !dayList) {
                  return <p>Dati meteo non disponibili</p>;
                }

                return (
                  <div className={styles.weatherGrid}>
                    
                    {/* METEO ORARIO */}
                    <div>
                      <h3 className={appStyles.sectionSubtitle}>Previsioni orarie (oggi)</h3>

                      <div className={styles.weatherTimeline}>
                        {hourlyList.slice(currentHourIndex, 8).map((item, index) => (
                          <div
                            key={item.key}
                            className={
                              index === 0
                                ? styles.weatherActive
                                : styles.weatherItem
                            }
                          >
                            <p>
                              <span style={{ alignSelf: "center" }}>⏰</span> {formatSlotTime(item.key)}
                            </p>

                            <p><span>🌡</span> {item.temperature}°C</p>

                            <p><span>🌧</span> {item.rain_probability}%</p>

                            <p><span>💨</span> {item.wind_speed} km/h</p>

                            <p><span>❄</span> {item.snow_level} m</p>

                            <p><span>☁</span> {skyToText(item.sky_condition)}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* METEO GIORNALIERO (trend) */}
                    
                    <div>
                      <h3 className={appStyles.sectionSubtitle}>Previsioni giornaliere</h3>

                      <div className={styles.weatherTimeline}>
                        {dayList.map((item, index) => (
                          <div
                            key={item.key}
                            className={
                              index === 0
                                ? styles.weatherActive
                                : styles.weatherItem
                            }
                          >
                            <p>
                              {formatDayLabelFromKey(weather, item.key)} {/*FIXME: converti in data leggibile*/}
                            </p>

                            <p><span>🌡</span> Max: {item.temperature_maximum}°C</p>
                            <p><span>🌡</span> Min: {item.temperature_minimum}°C</p>
                            <p><span>🌧</span> Pioggia: {item.rain_fall} mm</p>
                            <p><span>🌧</span> Probabilità: {item.rain_probability}%</p>
                            <p><span>❄</span> Neve: {item.snow_level} m</p>

                            <p><span>☁</span> {skyToText(item.sky_condition)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </section>
          )}
        </section>

        {/* RIGHT */}
        <section className={appStyles.rightColumn}>
          <div className={styles.sidebar}>

            {/* SUMMARY */}
            <div className={styles.card}>
              <h3 className={appStyles.sectionTitle}>Riepilogo</h3>

              <div className={styles.summaryList}>
                <span>🎯 Difficoltà: {trek.difficulty}</span>
                <span>⏱ Durata: {trek.duration}</span>
                <span>📏 Lunghezza: {trek.lengthKm ?? "-"} km</span>
                <span>⛰ Dislivello: {trek.elevationGain ?? "-"} m</span>
              </div>
            </div>

            {/* RATING */}
            <div className={styles.card}>
              <h3 className={appStyles.sectionTitle}>Valutazione</h3>

              {/* Media attuale */}
              <div style={{ marginBottom: "0.75rem" }}>
                <StarRating rating={trek.averageRating ?? 0} />
                <p style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>
                  {trek.averageRating
                    ? `${trek.ratingCount ?? 0} vot${(trek.ratingCount ?? 0) === 1 ? "o" : "i"}`
                    : "Nessuna valutazione ancora"}
                </p>
              </div>

              {/* Stelle cliccabili (solo se loggato) */}
              {user ? (
                <div>
                  <p style={{ fontSize: "0.85rem", marginBottom: "0.4rem" }}>
                    {myVote ? `Il tuo voto: ${myVote}/5` : "Dai un voto a questo percorso:"}
                  </p>
                  <div className={starStyles.stars}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        // onClick={() => handleVote(star)}
                        onClick={() => {
                          setMyVote(star);
                          setShowNoteBox(true);
                          setRatingError(null);
                        }}
                        onMouseEnter={() => setHoverVote(star)}
                        onMouseLeave={() => setHoverVote(null)}
                        disabled={ratingLoading}
                        className={starStyles.starButton}
                      >
                        <span
                          className={`${starStyles.star} ${
                            star <= (hoverVote ?? myVote ?? 0) ? starStyles.starFull : starStyles.starEmpty
                          }`}
                        >
                          ★
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* <textarea
                    value={myNote}
                    onChange={(e) => setMyNote(e.target.value)}
                    placeholder="Aggiungi una nota (opzionale)..."
                    maxLength={500}
                    rows={3}
                    style={{
                      marginTop: "0.75rem",
                      width: "100%",
                      resize: "vertical",
                      padding: "0.4rem",
                      fontSize: "0.85rem",
                      borderRadius: "6px",
                      border: "1px solid #d1d5db",
                      boxSizing: "border-box"
                    }}
                  />
                  <button
                    onClick={() => handleVote(myVote ?? 0)}
                    disabled={ratingLoading || !myVote}
                    style={{
                      marginTop: "0.4rem",
                      fontSize: "0.8rem",
                      padding: "0.3rem 0.8rem",
                      cursor: !myVote || ratingLoading ? "not-allowed" : "pointer",
                      borderRadius: "6px",
                      border: "none",
                      background: !myVote ? "#d1d5db" : "#f59e0b",
                      color: "white"
                    }}
                  >
                    Salva nota
                  </button> */}

                  {showNoteBox && (
                    <div className={styles.noteBox}>
                      <textarea
                        className={styles.noteTextarea}
                        value={myNote}
                        onChange={(e) => setMyNote(e.target.value)}
                        placeholder="Aggiungi una nota (opzionale)..."
                        maxLength={500}
                        rows={3}
                      />

                      <button
                        className={styles.noteSaveButton}
                        onClick={handleVote}
                        disabled={ratingLoading || !myVote}
                      >
                        Salva recensione
                      </button>
                    </div>
                  )}

                  {ratingLoading && (
                    <p style={{ fontSize: "0.8rem", marginTop: "0.3rem" }}>Salvataggio...</p>
                  )}

                  {ratingError && (
                    <p style={{ fontSize: "0.8rem", marginTop: "0.3rem", color: "#b91c1c" }}>
                      {ratingError}
                    </p>
                  )}
                </div>
              ) : (
                <p style={{ fontSize: "0.85rem", color: "gray" }}>
                  Accedi per votare questo percorso.
                </p>
              )}
            </div>

            {/* ACTION CARD */}
            <div className={styles.actionCard}>
              <h3 className={styles.actionTitle}>
                Pronto per partire?
              </h3>

              <p className={styles.actionText}>
                Salva il percorso o condividilo con amici.
              </p>

              <button className={styles.saveShareButton}> {/*FIXME: aggiungi funzionalità */}
                Salva percorso
              </button>
              <button className={styles.saveShareButton} onClick={shareWithFriends}>
                Condividi con amici
              </button>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}
