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
const [tab,setTab] = useState("chart");
const [touchStart,setTouchStart] = useState(null);

const spot = candles.length ? candles[candles.length-1].Close : null;

// swipe
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
className="h-screen bg-[#070c16] text-white flex flex-col md:flex-row pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">

{/* MOBILE TOP BAR */}
<div className="md:hidden flex justify-between items-center px-4 py-3 border-b border-[#121a2b]">
<button onClick={()=>setMenuOpen(true)}>☰</button>
<div>{ticker}</div>
</div>

{/* OVERLAY */}
{menuOpen && <div className="fixed inset-0 bg-black/60 z-40" onClick={()=>setMenuOpen(false)}/>}

{/* WATCHLIST */}
<div className={`fixed md:relative z-50 md:z-auto top-0 left-0 h-full w-[220px] bg-[#070c16] border-r border-[#121a2b] p-3
transition-transform ${menuOpen?"translate-x-0":"-translate-x-full"} md:translate-x-0`}>

<div className="flex justify-between mb-3 md:hidden">
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

{/* MAIN */}
<div className="flex-1 p-3 overflow-y-auto">

{/* CHART */}
{tab==="chart" && (
<div className="bg-[#0b1220] border border-[#121a2b] rounded-xl p-3 relative">

<CandleChart data={candles}/>

{ai && ai.bias!=="NEUTRAL" && (
<div className={`absolute top-3 right-3 px-3 py-2 rounded-xl text-xs
${ai.bias==="CALLS"?"bg-green-500/20 text-green-400":"bg-red-500/20 text-red-400"}`}>
AI {ai.bias}<br/>{ai.confidence||0}%
</div>
)}

</div>
)}

{/* OPTIONS */}
{tab==="options" && (
<div className="bg-[#0b1220] border border-[#121a2b] rounded-xl grid grid-cols-2">

<div className="border-r border-[#121a2b]">
<div className="text-green-400 text-xs px-3 py-1">CALLS</div>
{options?.calls?.slice(0,20).map((c,i)=>{
const heat=Math.min(.35,c.volume/150);
const atm = spot && Math.abs(c.strike-spot)<1;
return(
<div key={i}
style={{background:`rgba(34,197,94,${heat})`}}
className={`px-2 py-1 text-xs ${atm?"ring-1 ring-yellow-400":""}`}>
{c.strike} | {c.lastPrice} | <span className="text-green-400">{c.volume}</span>
</div>
);
})}
</div>

<div>
<div className="text-red-400 text-xs px-3 py-1">PUTS</div>
{options?.puts?.slice(0,20).map((p,i)=>{
const heat=Math.min(.35,p.volume/150);
const atm = spot && Math.abs(p.strike-spot)<1;
return(
<div key={i}
style={{background:`rgba(239,68,68,${heat})`}}
className={`px-2 py-1 text-xs ${atm?"ring-1 ring-yellow-400":""}`}>
{p.strike} | {p.lastPrice} | <span className="text-red-400">{p.volume}</span>
</div>
);
})}
</div>

</div>
)}

{/* AI */}
{tab==="ai" && (
<div className="bg-[#0b1220] border border-[#121a2b] rounded-xl p-4 text-center">
<div className="text-xl">{ai?.bias||"NEUTRAL"}</div>
<div className="text-slate-400">{ai?.confidence||0}%</div>
</div>
)}

</div>

{/* BOTTOM NAV */}
<div className="fixed bottom-0 left-0 right-0 bg-[#070c16] border-t border-[#121a2b] flex justify-around text-xs md:hidden pb-[env(safe-area-inset-bottom)]">
<button onClick={()=>setTab("chart")} className={tab==="chart"?"text-blue-400":""}>Chart</button>
<button onClick={()=>setTab("options")} className={tab==="options"?"text-blue-400":""}>Options</button>
<button onClick={()=>setTab("ai")} className={tab==="ai"?"text-blue-400":""}>AI</button>
</div>

</div>
);
}
