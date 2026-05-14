import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import type { Trek } from "../types/Trek";
import appStyles from "../App.module.css";
import styles from "./TrekDetails.module.css";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export default function TrekDetails() {
  const { id } = useParams();

  const [trek, setTrek] = useState<Trek | null>(null);
  const [weather, setWeather] = useState<any>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  // Fetch meteo
useEffect(() => {
  async function fetchData() {
    try {
      setLoading(true);
      setWeatherLoading(true);

      // TREK
      const trekResponse = await fetch(
        `${API_BASE}/treks/${id}`
      );

      if (!trekResponse.ok)
        throw new Error("Errore caricamento trek");

      const trekData = await trekResponse.json();
      setTrek(trekData);

      // METEO (usa id trek, come hai già fatto backend)
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
      setWeatherLoading(false);
    }
  }

  fetchData();
}, [id]);


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

  return (
    <main className={appStyles.main}>
      <div className={appStyles.contentLayout}>
        
        {/* LEFT */}
        <section className={appStyles.leftColumn}>

          {/* HERO */}
          <div className={styles.hero}> {/*FIXME: aggiungi immagine */}
            <div className={styles.heroBadge}>
              SAT {trek.SatRouteNumber}
            </div>
          </div>

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

              <p>
                <strong>Condizioni:</strong>{" "}
                {trek.condizioniAttuali || "Non disponibili"}
              </p>
{weather && (
  <section>
    <h2>Meteo</h2>

    {(() => {
      const firstDay = Object.values(
        weather.weather
      )[0] as any;

      const firstForecast = Object.values(
        firstDay
      )[0] as any;

      return (
        <div>
          <p>
            Località: {weather.meteoLocation}
          </p>

          <p>
            Temperatura:
            {" "}
            {firstForecast.temperature}°C
          </p>

          <p>
            Probabilità pioggia:
            {" "}
            {firstForecast.rain_probability}%
          </p>

          <p>
            Quota neve:
            {" "}
            {firstForecast.snow_level} m
          </p>

          <p>
            Vento:
            {" "}
            {firstForecast.wind_speed} km/h
          </p>
        </div>
      );
    })()}
  </section>
)}
            </div>
          </div>
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
              <button className={styles.saveShareButton}>
                Condividi con amici
              </button>
            </div>

          </div>
        </section>

      </div>
    </main>
  );
}