// import { useEffect, useState } from "react";
// import TrekCard from "./components/TrekCard"

import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import { useTheme } from "./hooks/useTheme";
import { AuthProvider } from "./auth/AuthProvider";
import ProtectedRoute from "./auth/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Treks from "./pages/Treks";
import MyTreks from "./pages/MyTreks";
import Friends from "./pages/Friends";

function AppLayout({ children }: { children: React.ReactNode }) { // AppLayout è un componente che definisce la struttura comune a tutte le pagine dell'applicazione, includendo la Navbar e gestendo il tema. Tutte le pagine (Login, Register, Treks, MyTreks, Friends) saranno renderizzate all'interno di AppLayout, che si occupa di mostrare la Navbar e applicare il tema scelto dall'utente.
  const { theme, toggle } = useTheme();
  //  // const [treks, setTreks] = useState<Trek[]>([]);
  // const [treks, setTreks] = useState<Trek[]>([]);
  // const [loading, setLoading] = useState(true);

  // const [error, setError] = useState<string | null>(null);

  // const [users, setUsers] = useState<User[]>([]);
  return (
    <>
      <Navbar theme={theme} onToggleTheme={toggle} />
      {children}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider> {/* AuthProvider è un componente che fornisce il contesto di autenticazione a tutta l'applicazione. Avvolgendo il BrowserRouter e tutte le rotte all'interno di AuthProvider, garantiamo che qualsiasi componente possa accedere alle informazioni sull'utente autenticato e alle funzioni di login/logout tramite il contesto. */}
      <BrowserRouter> {/* BrowserRouter è un componente che gestisce la navigazione dell'applicazione. Avvolge tutte le rotte e consente di definire i percorsi e i componenti associati a ciascun percorso. In questo caso, tutte le rotte sono definite all'interno di BrowserRouter, il che significa che la navigazione tra le pagine (Login, Register, Treks, MyTreks, Friends) sarà gestita da React Router. */}
        <Routes>
          <Route
            path="/"     /*UGUALE A /treks   */
            element={
              <AppLayout>
                <Treks />
              </AppLayout>
            }
          />
          <Route
            path="/login"
            element={
              <AppLayout>
                <Login />
              </AppLayout>
            }
          />
          <Route
            path="/register"
            element={
              <AppLayout>
                <Register />
              </AppLayout>
            }
          />
          <Route
            path="/treks"
            element={
              <AppLayout>
                <Treks />
              </AppLayout>
            }
          />
          <Route
            path="/my-treks"
            element={
              <AppLayout>
                <ProtectedRoute>
                  <MyTreks />
                </ProtectedRoute>
              </AppLayout>
            }
          />
          <Route
            path="/friends"
            element={
              <AppLayout>
                <ProtectedRoute>
                  <Friends />
                </ProtectedRoute>
              </AppLayout>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
