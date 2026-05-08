import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { useTheme } from "./hooks/useTheme";

//import TrekCard from "./components/TrekCard";
//import ActivityCard from "./components/ActivityCard"; //!!!

import type { Trek } from "./types/Trek";
import type { User } from "./types/User";
import type { Activity } from "./types/Activity";
// import TrekCard, { type Trek } from "./components/TrekCard";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer"; //!!!

import Home from "./pages/Home";
import Privacy from "./pages/Privacy";
import Termini from "./pages/Termini";
import Contatti from "./pages/Contatti";



// import type {Treks} from "./types/Trek";

import "./index.css";
import styles from "./App.module.css";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
// const API_BASE = import.meta.env.VITE_API_URL; // Se VITE_API_URL è definita, la useremo come base URL per le API. Altrimenti, se non è definita, problemi, pensare se mettere valore di default


function App() {

  const { theme, toggle } = useTheme();
  
  // const [treks, setTreks] = useState<Trek[]>([]);
  const [treks, setTreks] = useState<Trek[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  /*
  const MAX_TREK_CARDS = 11; //treks.length
  const MAX_ACTIVITY_CARDS = 7; //activities.length
  const MAX_DIARY_CARDS = 5; //diaryEntries.length
  */

  // useEffect(() => {
  //   //PER USO LOCALE (localhost:3000) -> fetch("http://localhost:3000/treks") 
  //   //PER USO CON DOCKER (backend:3000) -> fetch("http://backend:3000/treks")
  //   //va solo localhost

  //   // fetch("http://backend:3000/treks")
  //   fetch("http://localhost:3000/treks")
  //     .then((res) => res.json())
  //     .then((data) => setTreks(data));
  // }, []);
  useEffect(() => {
    // setLoading(true);
  //   fetch(`${API_BASE}/treks`)
  //   .then((res) => {
  //     if (!res.ok) throw new Error("Server error: " + res.status);
  //     return res.json();
  //   })
  //   .then((data) => setTreks(data))
  //     .catch((err: Error) => {
  //     console.error("Failed to fetch treks:", err);
  //     setError(err.message);
  //     })
  //     .finally(() => setLoading(false));
  // }, []);
    fetch(`${API_BASE}/treks`)
      .then((res) => {
        if (!res.ok) throw new Error("Errore percorsi: " + res.status);
        return res.json();
      })
      .then((data) => setTreks(data))
      .catch((err: Error) => {
        console.error("Errore fetch percorsi:", err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
    }, []);
    

  useEffect(() => {
    fetch(`${API_BASE}/users`)
      .then((res) => {
        if (!res.ok) throw new Error("Errore utenti: " + res.status);
        return res.json();
      })
      .then((data) => setUsers(data))
      .catch((err: Error) => {
        console.error("Errore fetch utenti:", err);
      });
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/activities`)
      .then((res) => {
        if (!res.ok) throw new Error("Errore attività: " + res.status);
        return res.json();
      })
      .then((data) => setActivities(data))
      .catch((err: Error) => {
        console.error("Errore fetch attività:", err);
      });
  }, []);

  return (
    <>
      <div className={styles.app}>
        <Navbar theme={theme} onToggleTheme={toggle} />
          <Routes>
            {/* HOME */}
            <Route
              path="/"
              element={
                <Home
                  treks={treks}
                  activities={activities}
                  loading={loading}
                  error={error}
                />
              }
            />

            {/* ALTRE PAGINE */}
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/termini" element={<Termini />} />
            <Route path="/contatti" element={<Contatti />} />
          </Routes>
        <Footer />
      </div>
    </>
  );
}
export default App;

//riga 120