import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { useTheme } from "./hooks/useTheme";
import Navbar from "./components/Navbar";
import Homepage from "./pages/homepage/Homepage";
import AccountPage from "./pages/account/AccountPage";
import DiarioPage from "./pages/account/DiarioPage";
import AttivitaPage from "./pages/account/AttivitaPage";
import VersionePage from "./pages/account/VersionePage";
import "./index.css"

/**
 * Layout comune a tutte le pagine (comprende Navbar)
 * @param {React.ReactNode} children - Contenuto della pagina 
 */
function AppLayout({ children }: { children: React.ReactNode}) {
  const { theme, toggle } = useTheme();
  return(
    <>
     <Navbar theme={theme} onToggleTheme={toggle}/>
     {children}
    </>
  );
}

/**
 * Componenete principale con routing dell'app
 * @returns {JSX.Element} App con routing
 */
export default function App() {
  return(
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Homepage />}/> 
          <Route path="/account/:sezione" element={<AccountPage />}/> 
          <Route path="/diario/:sezione" element={<DiarioPage />} />
          <Route path="/attivita/:sezione" element={<AttivitaPage />} />
          <Route path="/vers/:sezione" element={<VersionePage />} />
          <Route path="*" element={<Navigate to="/" replace/>}/> 
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}