import { useEffect, useState } from "react";
import axios from "axios";
import CandleChart from "./CandleChart";

const WATCHLIST = ["AAPL", "TSLA", "SPY", "NFLX", "AMZN", "MO", "IWM"];
const API = "https://optionsbot-kous.onrender.com";

export default function App() {
  const [ticker, setTicker] = useState("TSLA");
  const [options, setOptions] = useState(null);
  const [candles, setCandles] = useState([]);
  const [ai, setAI] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const spot = candles.length ? candles[candles.length - 1].Close : null;

  useEffect(() => {
    axios.get(`${API}/options/${ticker}`).then(r => setOptions(r.data)).catch(() => {});
    axios.get(`${API}/candles/${ticker}`).then(r => setCandles(r.data)).catch(() => {});
    axios.get(`${API}/ai/${ticker}`).then(r => setAI(r.data)).catch(() => setAI(null));
  }, [ticker]);

  /* ---------------- HELPERS ---------------- */

  const premiumHeat = (premium, max = 1_000_000) =>
    Math.min(0.35, premium / max);

  const topStrikes = (list = []) =>
    [...list]
      .map(c => ({ ...c, premium: c.lastPrice * c.volume * 100 }))
      .sort((a, b) => b.premium - a.premium)
      .slice(0, 3)
      .map(c => c.strike);

  const topCalls = topStrikes(options?.calls);
  const topPuts = topStrikes(options?.puts);

  /* ---------------- UI ---------------- */

  return (
    <div className="h-screen bg-[#070c16] text-white flex flex-col">

      {/* TOP BAR */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#121a2b]">
        <button onClick={() => setMenuOpen(true)} className="text-xl">☰</button>
        <div className="font-semibold">{ticker}</div>
        <div className="w-6" />
      </div>

      {/* OVERLAY */}
      {menuOpen && (
        <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setMenuOpen(false)} />
      )}

      {/* WATCHLIST */}
      <div
        className={`fixed top-0 left-0 h-full w-[220px] bg-[#070c16] z-50 border-r border-[#121a2b] p-3 transition-transform
        ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex justify-between mb-3">
          <span className="text-xs text-slate-400">WATCHLIST</span>
          <button onClick={() => setMenuOpen(false)}>✕</button>
        </div>

        {WATCHLIST.map(t => (
          <div
            key={t}
            onClick={() => { setTicker(t); setMenuOpen(false); }}
            className={`px-3 py-2 mb-1 rounded cursor-pointer flex justify-between
              ${ticker === t ? "bg-[#0f172a] ring-1 ring-blue-500/40" : "hover:bg-[#0b1220]"}`}
          >
            <span>{t}</span>
            {ticker === t && <span className="text-[10px] text-green-400">ACTIVE</span>}
          </div>
        ))}
      </div>

      {/* MAIN */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">

        {/* CHART */}
        <div className="bg-[#0b1220] border border-[#121a2b] rounded-xl p-3 relative">
          <CandleChart data={candles} />

          {ai && ai.bias && ai.bias !== "NEUTRAL" && (
            <div className={`absolute top-3 right-3 px-3 py-2 rounded-xl text-xs font-bold
              ${ai.bias === "CALLS"
                ? "bg-green-500/20 text-green-400 ring-1 ring-green-500"
                : "bg-red-500/20 text-red-400 ring-1 ring-red-500"}`}>
              AI FAVORS {ai.bias}
              <div className="text-[10px] opacity-70">
                {ai.confidence || 0}% CONF
              </div>
            </div>
          )}
        </div>

        {/* OPTIONS FLOW */}
{/* NET PREMIUM BAR */}
{options && (() => {
  const callPrem = options.calls.reduce(
    (a,c)=>a + (c.lastPrice * c.volume * 100), 0
  );
  const putPrem = options.puts.reduce(
    (a,p)=>a + (p.lastPrice * p.volume * 100), 0
  );
  const total = callPrem + putPrem || 1;

  const callPct = Math.round((callPrem / total) * 100);
  const putPct = 100 - callPct;

  return (
    <div className="mb-4">
      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
        <span>CALL ${ (callPrem/1e6).toFixed(2) }M</span>
        <span>PUT ${ (putPrem/1e6).toFixed(2) }M</span>
      </div>

      <div className="h-3 w-full bg-[#0f172a] rounded-full overflow-hidden flex">
        <div
          className="bg-green-500"
          style={{ width: `${callPct}%` }}
        />
        <div
          className="bg-red-500"
          style={{ width: `${putPct}%` }}
        />
      </div>

      <div className="text-center text-[10px] mt-1 text-slate-500">
        {callPct > putPct ? "CALLS DOMINATING" : "PUTS DOMINATING"}
      </div>
    </div>
  );
})()}

        <div className="bg-[#0b1220] border border-[#121a2b] rounded-xl p-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

            {/* CALL FLOW */}
            <div>
              <div className="text-green-400 text-xs mb-2 tracking-wide">
                CALL BUYING
              </div>

              {options?.calls?.slice(0, 12).map((c, i) => {
                const premium = c.lastPrice * c.volume * 100;
		const isWall = premium > 500000;
                const heat = premiumHeat(premium);
                const atm = spot && Math.abs(c.strike - spot) < 0.75;
                const aggressive = c.volume > c.openInterest;
                const isTop = topCalls.includes(c.strike);

                return (
                  <div
                    key={i}
                    style={{ background: `rgba(34,197,94,${heat})` }}
                    className={`mb-3 p-3 rounded-xl border text-xs
                      ${atm ? "border-yellow-400" : "border-[#121a2b]"}
                      ${isTop ? "ring-1 ring-green-400" : ""}`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">
                        ${c.strike} CALL {isTop && "⭐"}
                      </span>
                      <span className="text-green-400 font-mono">
                        ${c.lastPrice}
                      </span>
                    </div>

                    <div className="flex justify-between mt-1 text-[10px] text-slate-200">
                      <span>VOL {c.volume}</span>
                      <span>OI {c.openInterest}</span>
                      <span className={aggressive ? "text-green-300" : ""}>
                        {aggressive ? "AGGRESSIVE FLOW" : "NORMAL FLOW"}
                      </span>
                    </div>
			{isWall && (
  <div className="text-[10px] mt-1 text-green-400 font-semibold">
    🧱 CALL WALL
  </div>
)}


                    <div className="text-[10px] mt-1 text-slate-300">
                      ${(premium / 1000).toFixed(0)}k premium
                    </div>
                  </div>
                );
              })}
            </div>

            {/* PUT FLOW */}
            <div>
              <div className="text-red-400 text-xs mb-2 tracking-wide">
                PUT BUYING
              </div>

              {options?.puts?.slice(0, 12).map((p, i) => {
                const premium = p.lastPrice * p.volume * 100;
		const isWall = premium > 500000;
                const heat = premiumHeat(premium);
                const atm = spot && Math.abs(p.strike - spot) < 0.75;
                const aggressive = p.volume > p.openInterest;
                const isTop = topPuts.includes(p.strike);

                return (
                  <div
                    key={i}
                    style={{ background: `rgba(239,68,68,${heat})` }}
                    className={`mb-3 p-3 rounded-xl border text-xs
                      ${atm ? "border-yellow-400" : "border-[#121a2b]"}
                      ${isTop ? "ring-1 ring-red-400" : ""}`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">
                        ${p.strike} PUT {isTop && "⭐"}
                      </span>
                      <span className="text-red-400 font-mono">
                        ${p.lastPrice}
                      </span>
                    </div>
			{isWall && (
  <div className="text-[10px] mt-1 text-red-400 font-semibold">
    🧱 PUT WALL
  </div>
)}


                    <div className="flex justify-between mt-1 text-[10px] text-slate-200">
                      <span>VOL {p.volume}</span>
                      <span>OI {p.openInterest}</span>
                      <span className={aggressive ? "text-red-300" : ""}>
                        {aggressive ? "AGGRESSIVE FLOW" : "NORMAL FLOW"}
                      </span>
                    </div>

                    <div className="text-[10px] mt-1 text-slate-300">
                      ${(premium / 1000).toFixed(0)}k premium
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
