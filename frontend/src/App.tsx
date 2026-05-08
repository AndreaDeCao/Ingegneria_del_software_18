import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { useTheme } from "./hooks/useTheme";
import Navbar from "./components/Navbar";
import Homepage from "./pages/homepage/Homepage";
import Profilo from "./pages/Account/Profilo";
import Sicurezza from "./pages/Account/Sicurezza";
import PolicyAndCookies from "./pages/Account/Policy";
import "./index.css"

function AppLayout({ children }: { children: React.ReactNode}) {
  const { theme, toggle } = useTheme();
  return(
    <>
     <Navbar theme={theme} onToggleTheme={toggle}/>
     {children}
    </>
  );
}

export default function App() {
  return(
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout><Homepage /></AppLayout>}/> 
        <Route path="/profilo" element={<AppLayout><Profilo /></AppLayout>}/> 
        <Route path="/sicurezza" element={<AppLayout><Sicurezza /></AppLayout>}/> 
        <Route path="/policy" element={<AppLayout><PolicyAndCookies /></AppLayout>}/> 
        <Route path="*" element={<Navigate to="/" replace/>}/> 
      </Routes>
    </BrowserRouter>
  );
}