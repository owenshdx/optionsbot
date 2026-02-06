import { useEffect, useRef } from "react";
import { createChart } from "lightweight-charts";

export default function CandleChart({ data }) {
  const ref = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);

  useEffect(() => {
    if (!ref.current) return;

    // destroy old chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

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
      timeScale: {
        borderColor: "#121a2b",
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: "#121a2b",
      },
    });

    chartRef.current = chart;

    // ✅ v5 way to add candlesticks
    const candles = chart.addSeries({
      type: "Candlestick",
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    seriesRef.current = candles;

    const resize = () => {
      chart.applyOptions({ width: ref.current.clientWidth });
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

  return <div ref={ref} className="w-full h-[300px]" />;
}
