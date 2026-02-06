import { useEffect, useState } from "react";
import axios from "axios";

function App() {

  const [ticker, setTicker] = useState("SPY");
  const [data, setData] = useState(null);

  useEffect(() => {
    axios.get(`http://localhost:8000/options/${ticker}`)
      .then(res => setData(res.data))
      .catch(err => console.error(err));
  }, [ticker]);

  return (
    <div style={{ padding: 20, background: "#0b1220", minHeight: "100vh", color: "white" }}>

      <h1>Options Tracker</h1>

      <select value={ticker} onChange={e => setTicker(e.target.value)}>
        <option>SPY</option>
        <option>IWM</option>
        <option>NFLX</option>
        <option>TSLA</option>
      </select>

      <h2>Calls</h2>

      {data?.calls?.slice(0, 10).map((c, i) => (
        <div key={i}>
          Strike {c.strike} | Vol {c.volume} | OI {c.openInterest}
        </div>
      ))}

      <h2>Puts</h2>

      {data?.puts?.slice(0, 10).map((p, i) => (
        <div key={i}>
          Strike {p.strike} | Vol {p.volume} | OI {p.openInterest}
        </div>
      ))}

    </div>
  );
}

export default App;
