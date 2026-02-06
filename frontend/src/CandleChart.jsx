import { useEffect, useRef } from "react";
import { createChart, CandlestickSeries, LineSeries } from "lightweight-charts";

function SMA(data, period = 50) {
  return data.map((d, i) => {
    if (i < period) return null;
    const slice = data.slice(i - period, i);
    const avg = slice.reduce((a,b)=>a+b.close,0)/period;
    return { time:d.time, value:avg };
  }).filter(Boolean);
}

function RSI(data, period = 14) {
  let gains=[], losses=[], out=[];
  for(let i=1;i<data.length;i++){
    const diff=data[i].close-data[i-1].close;
    gains.push(diff>0?diff:0);
    losses.push(diff<0?Math.abs(diff):0);
    if(i>=period){
      const g=gains.slice(-period).reduce((a,b)=>a+b,0)/period;
      const l=losses.slice(-period).reduce((a,b)=>a+b,0)/period;
      const rs=g/(l||1);
      out.push({time:data[i].time,value:100-(100/(1+rs))});
    }
  }
  return out;
}

export default function CandleChart({ data }) {

  const priceRef = useRef();
  const rsiRef = useRef();

  useEffect(()=>{

    if(!data?.length) return;

    priceRef.current.innerHTML="";
    rsiRef.current.innerHTML="";

    const priceChart = createChart(priceRef.current,{
      height:320,
      layout:{background:{color:"#0b1220"},textColor:"#ccc"},
      grid:{vertLines:{color:"#1f2937"},horzLines:{color:"#1f2937"}}
    });

    const candleSeries = priceChart.addSeries(CandlestickSeries,{
      upColor:"#22c55e",
      downColor:"#ef4444",
      wickUpColor:"#22c55e",
      wickDownColor:"#ef4444",
      borderVisible:false
    });

    const smaSeries = priceChart.addSeries(LineSeries,{
      color:"#facc15",
      lineWidth:2
    });

    const rsiChart = createChart(rsiRef.current,{
      height:120,
      layout:{background:{color:"#0b1220"},textColor:"#ccc"},
      grid:{vertLines:{color:"#1f2937"},horzLines:{color:"#1f2937"}}
    });

    const rsiSeries = rsiChart.addSeries(LineSeries,{color:"#38bdf8"});

    const formatted = data.map(c=>({
      time:Math.floor(new Date(c.Datetime).getTime()/1000),
      open:c.Open,
      high:c.High,
      low:c.Low,
      close:c.Close
    }));

    candleSeries.setData(formatted);
    smaSeries.setData(SMA(formatted));
    rsiSeries.setData(RSI(formatted));

    priceChart.timeScale().fitContent();
    rsiChart.timeScale().fitContent();

  },[data]);

  return (
    <>
      <div ref={priceRef}/>
      <div ref={rsiRef} className="mt-2"/>
    </>
  );
}
