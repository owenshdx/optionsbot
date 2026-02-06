import { useEffect, useRef } from "react";
import {
  createChart,
  CandlestickSeries
} from "lightweight-charts";

export default function CandleChart({ data }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // ⛔ prevent zero-width crash
    const width = containerRef.current.clientWidth;
    if (!width) return;

    // cleanup old chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(containerRef.current, {
      width,
      height: 280,
      layout: {
        background: { color: "#0b1220" },
        textColor: "#94a3b8",
      },
      grid: {
        vertLines: { color: "#121a2b" },
        horzLines: { color: "#121a2b" },
      },
      timeScale: {
        borderColor: "#121a2b",
        timeVisible: true,
      },
      rightPriceScale: {
        borderColor: "#121a2b",
      },
    });

    chartRef.current = chart;

    // ✅ OFFICIAL v5 API (no assertions)
    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    seriesRef.current = series;

    const resize = () => {
      if (!containerRef.current) return;
      chart.applyOptions({ width: containerRef.current.clientWidth });
    };

    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current || !data?.length) return;

    seriesRef.current.setData(
      data.map(d => ({
        time: Math.floor(new Date(d.Datetime).getTime() / 1000),
        open: d.Open,
        high: d.High,
        low: d.Low,
        close: d.Close,
      }))
    );
  }, [data]);

  return (
    <div
      ref={containerRef}
      className="w-full h-[280px]"
    />
  );
}
