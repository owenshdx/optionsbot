import { useEffect, useRef } from "react";
import { createChart } from "lightweight-charts";

export default function CandleChart({ data }) {
  const ref = useRef();

  useEffect(() => {
    if (!data || !data.length) return;

    const chart = createChart(ref.current, {
      width: ref.current.clientWidth,
      height: 300,
      layout: {
        background: { color: "#0b1220" },
        textColor: "#94a3b8",
      },
      grid: {
        vertLines: { color: "#121a2b" },
        horzLines: { color: "#121a2b" },
      },
      timeScale: { borderColor: "#121a2b" },
    });

    const candles = chart.addCandlestickSeries({
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    candles.setData(
      data.map(d => ({
        time: Math.floor(new Date(d.Datetime).getTime() / 1000),
        open: d.Open,
        high: d.High,
        low: d.Low,
        close: d.Close,
      }))
    );

    const resize = () =>
      chart.applyOptions({ width: ref.current.clientWidth });
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      chart.remove();
    };
  }, [data]);

  return <div ref={ref} className="w-full h-[300px]" />;
}
