import { useEffect, useState } from "react";
import axios from "axios";
import CandleChart from "./CandleChart";

const WATCHLIST = ["AAPL","TSLA","SPY","NFLX","AMZN","MO","IWM"];
const API = import.meta.env.VITE_API_URL;

export default function App() {

const [ticker,setTicker] = useState("TSLA");
const [options,setOptions] = useState(null);
const [candles,setCandles] = useState([]);
const [ai,setAI] = useState(null);
const [menuOpen,setMenuOpen] = useState(false);
const [touchStart,setTouchStart] = useState(null);

const spot = candles.length ? candles[candles.length-1].Close : null;

// swipe left / right between tickers
const handleTouchStart = e => setTouchStart(e.touches[0].clientX);
const handleTouchEnd = e => {
  if(!touchStart) return;
  const diff = touchStart - e.changedTouches[0].clientX;
  const idx = WATCHLIST.indexOf(ticker);
  if(diff > 60 && idx < WATCHLIST.length-1) setTicker(WATCHLIST[idx+1]);
  if(diff < -60 && idx > 0) setTicker(WATCHLIST[idx-1]);
};

useEffect(()=>{
  axios.get(`${API}/options/${ticker}`).then(r=>setOptions(r.data)).catch(()=>{});
  axios.get(`${API}/candles/${ticker}`).then(r=>setCandles(r.data)).catch(()=>{});
  axios.get(`${API}/ai/${ticker}`).then(r=>setAI(r.data)).catch(()=>setAI(null));
},[ticker]);

return (

<div
onTouchStart={handleTouchStart}
onTouchEnd={handleTouchEnd}
className="h-screen bg-[#070c16] text-white flex flex-col pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">

{/* TOP BAR (MOBILE) */}
<div className="flex items-center justify-between px-4 py-3 border-b border-[#121a2b]">
<button onClick={()=>setMenuOpen(true)} className="text-lg">☰</button>
<div className="font-medium">{ticker}</div>
<div className="w-6" />
</div>

{/* OVERLAY */}
{menuOpen && (
<div className="fixed inset-0 bg-black/60 z-40" onClick={()=>setMenuOpen(false)} />
)}

{/* WATCHLIST DRAWER */}
<div className={`fixed top-0 left-0 h-full w-[220px] bg-[#070c16] z-50 border-r border-[#121a2b] p-3
transition-transform ${menuOpen?"translate-x-0":"-translate-x-full"}`}>

<div className="flex justify-between mb-3">
<span className="text-xs text-slate-400">WATCHLIST</span>
<button onClick={()=>setMenuOpen(false)}>✕</button>
</div>

{WATCHLIST.map(t=>(
<div key={t}
onClick={()=>{setTicker(t);setMenuOpen(false);}}
className={`px-3 py-2 mb-1 rounded cursor-pointer flex justify-between
${ticker===t?"bg-[#0f172a] ring-1 ring-blue-500/40":"hover:bg-[#0b1220]"}`}>
<span>{t}</span>
<span className="text-[10px] text-green-400">{ticker===t?"ACTIVE":""}</span>
</div>
))}
</div>

{/* MAIN CONTENT */}
<div className="flex-1 p-3 overflow-y-auto space-y-3">

{/* CHART */}
<div className="bg-[#0b1220] border border-[#121a2b] rounded-xl p-3 relative">
<CandleChart data={candles} />

{ai && ai.bias !== "NEUTRAL" && (
<div className={`absolute top-3 right-3 px-3 py-2 rounded-xl text-xs font-bold
${ai.bias==="CALLS"
? "bg-green-500/20 text-green-400 ring-1 ring-green-500"
: "bg-red-500/20 text-red-400 ring-1 ring-red-500"}`}>
AI FAVORS {ai.bias}<br/>
<span className="text-[10px] opacity-70">{ai.confidence||0}%</span>
</div>
)}
</div>

{/* OPTIONS FLOW */}
<div className="bg-[#0b1220] border border-[#121a2b] rounded-xl p-3">

<div className="grid grid-cols-2 gap-3">

{/* CALLS */}
<div>
<div className="text-green-400 text-xs mb-2">CALL BUYING</div>

{options?.calls?.slice(0,12).map((c,i)=>{
  const itm = spot && c.strike < spot;
  const atm = spot && Math.abs(c.strike - spot) < 1;
  const strength = c.volume > c.openInterest ? "AGGRESSIVE" : "PASSIVE";

  return (
    <div
      key={i}
      className={`mb-2 rounded-lg p-2 text-xs border
      ${atm ? "border-yellow-400 bg-yellow-400/10" : "border-[#121a2b]"}
      ${c.volume > 300 ? "bg-green-500/10" : "bg-[#0b1220]"}`}
    >

      <div className="flex justify-between">
        <span className="font-semibold">${c.strike} CALL</span>
        <span className="text-green-400">${c.lastPrice}</span>
      </div>

      <div className="flex justify-between text-[10px] text-slate-400 mt-1">
        <span>VOL {c.volume}</span>
        <span>OI {c.openInterest}</span>
        <span>{strength}</span>
      </div>

      <div className="text-[10px] mt-1 text-slate-500">
        {itm ? "IN THE MONEY" : atm ? "AT THE MONEY" : "OUT OF THE MONEY"}
      </div>

    </div>
  );
})}

</div>

{/* PUTS */}
<div>
<div className="text-red-400 text-xs mb-2">PUT BUYING</div>

{options?.puts?.slice(0,12).map((p,i)=>{
  const itm = spot && p.strike > spot;
  const atm = spot && Math.abs(p.strike - spot) < 1;
  const strength = p.volume > p.openInterest ? "AGGRESSIVE" : "PASSIVE";

  return (
    <div
      key={i}
      className={`mb-2 rounded-lg p-2 text-xs border
      ${atm ? "border-yellow-400 bg-yellow-400/10" : "border-[#121a2b]"}
      ${p.volume > 300 ? "bg-red-500/10" : "bg-[#0b1220]"}`}
    >

      <div className="flex justify-between">
        <span className="font-semibold">${p.strike} PUT</span>
        <span className="text-red-400">${p.lastPrice}</span>
      </div>

      <div className="flex justify-between text-[10px] text-slate-400 mt-1">
        <span>VOL {p.volume}</span>
        <span>OI {p.openInterest}</span>
        <span>{strength}</span>
      </div>

      <div className="text-[10px] mt-1 text-slate-500">
        {itm ? "IN THE MONEY" : atm ? "AT THE MONEY" : "OUT OF THE MONEY"}
      </div>

       </div>
    </div>

    </div>
  </div>
</div>
);
}

