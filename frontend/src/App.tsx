// import { useEffect, useState } from "react";
// import TrekCard from "./components/TrekCard"

import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { useTheme } from "./hooks/useTheme";
import { AuthProvider } from "./auth/AuthProvider";
import ProtectedRoute from "./auth/ProtectedRoute";


import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import AuthCallback from "./pages/auth/AuthCallback";
import RequestTemporaryPassword from "./pages/auth/RequestTemporaryPassword";

import Treks from "./pages/Treks/Treks";
import MyTreks from "./pages/Treks/FavoriteTreks";
import TrekDetails from "./pages/Treks/TrekDetails";

import Friends from "./pages/Friends";
import Home from "./pages/Home";

import Privacy from "./pages/informativa/Privacy";
import Termini from "./pages/informativa/Termini";
import Contatti from "./pages/informativa/Contatti";


import ProfilePage from "./pages/account/ProfilePage";
import SecurityPage from "./pages/account/SecurityPage";
import PolicyPage from "./pages/account/PolicyPage";

import VisualizzaDiarioPage from "./pages/diario/VisualizzaDiarioPage";
import CreaVoceDiarioPage from "./pages/diario/CreaVoceDiarioPage";
import DettagliVoceDiarioPage from "./pages/diario/DettagliVoceDiarioPage";

import VisualizzaAttivitaPage from "./pages/attivita/VisualizzaListaAttivitaPage";
import DettagliAttivita from "./pages/attivita/dettagliAttivita";
import AdminVisualizzaAttivitaPage from "./pages/attivita/AdminVisualizzaAttivitaPage";
import AdminDettagliAttivita from "./pages/attivita/AdminDettagliAttivita";
import CreaAttivitaPage from "./pages/attivita/CreaAttivitaPage";

import VersioneCorrentePage from "./pages/versione/VersioneCorrentePage";


//import Homepage from "./pages/homepage/Homepage";
//import AccountPage from "./pages/account/AccountPage";

import "./index.css";
import styles from "./App.module.css";
import ScrollToTop from "./ScrollToTop";
import GestioneSegnalazioniPage from "./pages/admin/GestioneSegnalazioniPage";




/**
 * Layout comune a tutte le pagine (comprende Navbar)
 * @param {React.ReactNode} children - Contenuto della pagina 
 */
function AppLayout({ children }: { children: React.ReactNode }) { // AppLayout è un componente che definisce la struttura comune a tutte le pagine dell'applicazione, includendo la Navbar e gestendo il tema. Tutte le pagine (Login, Register, Treks, MyTreks, Friends) saranno renderizzate all'interno di AppLayout, che si occupa di mostrare la Navbar e applicare il tema scelto dall'utente.
  const { theme, toggle } = useTheme();
  //  // const [treks, setTreks] = useState<Trek[]>([]);
  // const [treks, setTreks] = useState<Trek[]>([]);
  // const [loading, setLoading] = useState(true);

  // const [error, setError] = useState<string | null>(null);

  // const [users, setUsers] = useState<User[]>([]);
   return (
    <div className={styles.app}>
      <Navbar theme={theme} onToggleTheme={toggle} />
      {children}
      <Footer />
    </div>
  );
}

/**
 * Componenete principale con routing dell'app
 * @returns {JSX.Element} App con routing
 */
export default function App() {
  return (
    <AuthProvider> {/* AuthProvider è un componente che fornisce il contesto di autenticazione a tutta l'applicazione. Avvolgendo il BrowserRouter e tutte le rotte all'interno di AuthProvider, garantiamo che qualsiasi componente possa accedere alle informazioni sull'utente autenticato e alle funzioni di login/logout tramite il contesto. */}
      <BrowserRouter> {/* BrowserRouter è un componente che gestisce la navigazione dell'applicazione. Avvolge tutte le rotte e consente di definire i percorsi e i componenti associati a ciascun percorso. In questo caso, tutte le rotte sono definite all'interno di BrowserRouter, il che significa che la navigazione tra le pagine (Login, Register, Treks, MyTreks, Friends) sarà gestita da React Router. */}
        <ScrollToTop />
                <Routes>
                  {/* Landing page */}
                  <Route path="/" element={<AppLayout><Home /></AppLayout>} />
                  <Route path="/treks/:id" element={<AppLayout><TrekDetails /></AppLayout>} />
        
                  {/* Auth */}
                  <Route path="/login"    element={<AppLayout><Login /></AppLayout>} />
                  <Route path="/register" element={<AppLayout><Register /></AppLayout>} />
                  <Route path="/forgotten-password" element={<AppLayout><RequestTemporaryPassword /></AppLayout>} />

                  {/* Treks — pubblica */}
                  <Route path="/treks" element={<AppLayout><Treks /></AppLayout>} />
        
                  {/* Route protette — navigazione principale */}
                  <Route path="/my-treks" element={<AppLayout><ProtectedRoute>
                    <MyTreks />
                  </ProtectedRoute></AppLayout>} />
                  <Route path="/friends"  element={<AppLayout><ProtectedRoute><Friends /></ProtectedRoute></AppLayout>} />
        
                  {/* Route protette — menu a tendina con sezione dinamica */}
                  
                  <Route path="/account/profile" element={<AppLayout><ProtectedRoute><ProfilePage /></ProtectedRoute></AppLayout>} />
                  <Route path="/account/security" element={<AppLayout><ProtectedRoute><SecurityPage /></ProtectedRoute></AppLayout>} />
                  <Route path="/account/policy" element={<AppLayout><ProtectedRoute><PolicyPage /></ProtectedRoute></AppLayout>} />
                  {/*<Route path="informativa/termini"  element={<AppLayout><Termini /></AppLayout>} />*/} {/* FIX ME: policy e termini stessa cosa? (fix anche in navbar.tsx) */}

                  <Route path="/diario/visualizza" element={<AppLayout><ProtectedRoute allowedRoles={["user"]}><VisualizzaDiarioPage /></ProtectedRoute></AppLayout>} />
                  <Route path="/diario/crea" element={<AppLayout><ProtectedRoute allowedRoles={["user"]}><CreaVoceDiarioPage /></ProtectedRoute></AppLayout>} />
                  <Route path="/diario/:id" element={<AppLayout><ProtectedRoute allowedRoles={["user"]}><DettagliVoceDiarioPage /></ProtectedRoute></AppLayout>} />

                  <Route path="/attivita/visualizza" element={<AppLayout><ProtectedRoute allowedRoles={["user"]}><VisualizzaAttivitaPage /></ProtectedRoute></AppLayout>} />
                  <Route path="/attivita/crea" element={<AppLayout><ProtectedRoute><CreaAttivitaPage /></ProtectedRoute></AppLayout>} />
                  <Route path="/attivita/:id" element={<AppLayout><ProtectedRoute allowedRoles={["user"]}><DettagliAttivita /></ProtectedRoute></AppLayout>} />
                  

                  <Route path="/versione/corrente" element={<AppLayout><VersioneCorrentePage /></AppLayout>} />

                  <Route path="/my-treks" element={<AppLayout><ProtectedRoute><MyTreks /></ProtectedRoute></AppLayout>} />

                  <Route path="/admin/attivita/visualizza" element={<AppLayout><ProtectedRoute allowedRoles={["admin"]}><AdminVisualizzaAttivitaPage /></ProtectedRoute></AppLayout>} />
                  <Route path="/admin/attivita/:id" element={<AppLayout><ProtectedRoute allowedRoles={["admin"]}><AdminDettagliAttivita /></ProtectedRoute></AppLayout>} />
                  <Route path="/admin/segnalazioni" element={<AppLayout><ProtectedRoute allowedRoles={["admin"]}><GestioneSegnalazioniPage /></ProtectedRoute></AppLayout>} />

                {/*
                  <Route path="/profile/profilo"  element={<AppLayout><ProtectedRoute> 
                    <ProfilePage />
                  </ProtectedRoute></AppLayout>} />

                  <Route path="/profile/termini"  element={<AppLayout><Termini /></AppLayout>} />

                  <Route path="/profile/security"  element={<AppLayout><ProtectedRoute> 
                    <SecurityPage />
                  </ProtectedRoute></AppLayout>} />

                
                  {/*<Route path="/diario/:sezione"   element={<AppLayout><ProtectedRoute>
                    <DiarioPage />
                  </ProtectedRoute></AppLayout>} />
                  <Route path="/attivita/:sezione" element={<AppLayout><ProtectedRoute>
                    <AttivitaPage />
                  </ProtectedRoute></AppLayout>} />
                  <Route path="/vers/:sezione" element={<AppLayout><VersionePage /></AppLayout>} />
                  */}
        
                  {/* Pagine statiche */}
                  <Route path="/privacy"  element={<AppLayout><Privacy /></AppLayout>} />
                  <Route path="/termini"  element={<AppLayout><Termini /></AppLayout>} />
                  <Route path="/contatti" element={<AppLayout><Contatti /></AppLayout>} />
                  
                  {/* OAuth callback */}
                  <Route path="/auth/callback" element={<AuthCallback />} />

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
