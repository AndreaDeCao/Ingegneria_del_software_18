type Trek = {
  id: number;
  name: string;
  difficulty: string;
  duration: string;
};

function TrekCard({ trek }: { trek: Trek }) {
  return (
    <div style={{
      border: "1px solid gray",
      borderRadius: "10px",
      padding: "10px",
      width: "200px"
    }}>
      <h3>{trek.name}</h3>
      <p>Difficoltà: {trek.difficulty}</p>
      <p>Durata: {trek.duration}</p>
    </div>
  );
}

export default TrekCard;