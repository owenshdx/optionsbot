import { useEffect, useState } from "react";
import axios from "axios";
import CandleChart from "./CandleChart";

const WATCHLIST = ["AAPL","TSLA","SPY","NFLX","AMZN","MO","IWM"];

export default function App() {

const [ticker,setTicker] = useState("TSLA");
const [options,setOptions] = useState(null);
const [unusualOnly,setUnusualOnly] = useState(false);
const [candles,setCandles] = useState([]);
const [ai,setAI] = useState(null);

const spot = candles.length ? candles[candles.length-1].Close : null;

useEffect(()=>{

axios.get(`${API}/options/${ticker}`).then(r=>setOptions(r.data));
axios.get(`${API}/candles/${ticker}`).then(r=>setCandles(r.data));
axios.get(`${API}/ai/${ticker}`).then(r=>setAI(r.data));

},[ticker]);

return (

<div className="h-screen bg-[#070c16] text-white flex flex-row">

{/* SIDEBAR */}
<div className="w-[220px] border-r border-[#121a2b] p-3 overflow-y-auto">

<div className="text-xs text-slate-400 mb-3">WATCHLIST</div>

{WATCHLIST.map(t=>(
<div
key={t}
onClick={()=>setTicker(t)}
className={`px-3 py-2 mb-1 rounded cursor-pointer flex justify-between items-center transition
${ticker===t?"bg-[#0f172a] ring-1 ring-blue-500/40":"hover:bg-[#0b1220]"}`}>

<span>{t}</span>
<span className="text-[10px] text-green-400">{ticker===t?"ACTIVE":""}</span>

</div>
))}

</div>

{/* MAIN */}
<div className="flex-1 p-4 space-y-3 overflow-y-auto">

{/* CHART */}
<div className="bg-[#0b1220] border border-[#121a2b] rounded-xl p-3">

<div className="text-sm mb-2">
{ticker}
<span className="text-xs text-slate-400 ml-2">INTRADAY</span>
</div>

<div className="relative">

<CandleChart data={candles} />

{ai && ai.bias !== "NEUTRAL" && (

<div className={`absolute top-3 right-3 px-4 py-2 rounded-xl text-xs font-bold shadow-lg
${ai.bias==="CALLS"
? "bg-green-500/20 text-green-400 ring-1 ring-green-500"
: "bg-red-500/20 text-red-400 ring-1 ring-red-500"}`}>

<div>AI FAVORS {ai.bias}</div>
<div className="text-[10px] opacity-70">{ai.confidence}% CONF</div>

</div>

)}

</div>

</div>

{/* OPTIONS */}
<div className="bg-[#0b1220] border border-[#121a2b] rounded-xl">

<div className="flex justify-between px-4 py-2 text-xs border-b border-[#121a2b] text-slate-400">

<span>OPTIONS FLOW</span>

<label className="flex gap-2 items-center cursor-pointer">
<input
type="checkbox"
checked={unusualOnly}
onChange={()=>setUnusualOnly(!unusualOnly)}
className="accent-blue-500"
/>
UNUSUAL
</label>

</div>

<div className="grid grid-cols-2">

{/* CALLS */}
<div className="border-r border-[#121a2b]">

<div className="text-green-400 text-xs px-4 py-1">CALLS</div>

<table className="w-full text-[11px]">

<thead className="text-slate-500 border-b border-[#121a2b]">
<tr>
<th className="px-4 text-left">STR</th>
<th>PX</th>
<th>VOL</th>
<th>OI</th>
<th>IV</th>
</tr>
</thead>

<tbody>
{options?.calls?.filter(c=>!unusualOnly||c.volume>50).slice(0,20).map((c,i)=>{

const heat=Math.min(.35,c.volume/150);
const atm = spot && Math.abs(c.strike-spot)<1;

return(

<tr key={i}
style={{background:`rgba(34,197,94,${heat})`}}
className={`border-b border-[#121a2b] ${atm?"ring-1 ring-yellow-400 bg-yellow-400/10":""}`}>

<td className="px-4">{c.strike}</td>
<td className="text-center">{c.lastPrice}</td>
<td className="text-center text-green-400">{c.volume}</td>
<td className="text-center">{c.openInterest}</td>
<td className="text-center">{(c.impliedVolatility*100).toFixed(1)}%</td>

</tr>

);

})}
</tbody>

</table>
</div>

{/* PUTS */}
<div>

<div className="text-red-400 text-xs px-4 py-1">PUTS</div>

<table className="w-full text-[11px]">

<thead className="text-slate-500 border-b border-[#121a2b]">
<tr>
<th className="px-4 text-left">STR</th>
<th>PX</th>
<th>VOL</th>
<th>OI</th>
<th>IV</th>
</tr>
</thead>

<tbody>
{options?.puts?.filter(p=>!unusualOnly||p.volume>50).slice(0,20).map((p,i)=>{

const heat=Math.min(.35,p.volume/150);
const atm = spot && Math.abs(p.strike-spot)<1;

return(

<tr key={i}
style={{background:`rgba(239,68,68,${heat})`}}
className={`border-b border-[#121a2b] ${atm?"ring-1 ring-yellow-400 bg-yellow-400/10":""}`}>

<td className="px-4">{p.strike}</td>
<td className="text-center">{p.lastPrice}</td>
<td className="text-center text-red-400">{p.volume}</td>
<td className="text-center">{p.openInterest}</td>
<td className="text-center">{(p.impliedVolatility*100).toFixed(1)}%</td>

</tr>

);

})}
</tbody>

</table>

</div>

</div>
</div>

</div>
</div>

);
}
