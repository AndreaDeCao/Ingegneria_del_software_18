import { useEffect, useState } from "react";
import TrekCard from "./components/TrekCard";

type Trek = {
  id: number;
  name: string;
  difficulty: string;
  duration: string;
};

function App() {
  const [treks, setTreks] = useState<Trek[]>([]);


  useEffect(() => {
    //PER USO LOCALE (localhost:3000) -> fetch("http://localhost:3000/treks")
    //PER USO CON DOCKER (backend:3000) -> fetch("http://backend:3000/treks")


    // fetch("http://backend:3000/treks")
    
    fetch("http://localhost:3000/treks")
      .then((res) => res.json())
      .then((data) => setTreks(data));
  }, []);

  return (
    <div>
      <h1>Dolomate</h1>

      <div style={{ display: "flex", gap: "10px" }}>
        {treks.map((trek) => (
          <TrekCard key={trek.id} trek={trek} />
        ))}
      </div>
    </div>
  );
}

export default App;