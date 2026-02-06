from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import threading
import time
import yfinance as yf
import pandas as pd
import numpy as np
import requests
from ai import analyze_market

DISCORD_WEBHOOK = "YOUR_DISCORD_WEBHOOK"

# ================= HELPERS =================

def send_discord(msg):
    try:
        requests.post(DISCORD_WEBHOOK, json={"content": msg})
    except:
        pass


def calculate_rsi(closes, period=14):

    if len(closes) < period + 1:
        return 50

    deltas = np.diff(closes)
    gains = deltas[deltas > 0]
    losses = -deltas[deltas < 0]

    if len(gains) == 0:
        return 30
    if len(losses) == 0:
        return 70

    avg_gain = np.mean(gains[-period:])
    avg_loss = np.mean(losses[-period:])

    if avg_loss == 0:
        return 70

    rs = avg_gain / avg_loss
    return round(100 - (100 / (1 + rs)), 2)


# ================= APP =================

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

WATCHLIST = ["SPY","IWM","NFLX","TSLA"]
SCAN_RESULTS = []
SIGNAL_HISTORY = []


# ================= AUTO SCAN =================

def auto_scan():
    while True:
        for ticker in WATCHLIST:
            try:
                unusual = flow(ticker)

                if not unusual:
                    continue

                df = yf.download(ticker, period="1d", interval="5m")
                closes = df["Close"].values if not df.empty else []

                rsi = calculate_rsi(closes)

                if rsi < 35 or rsi > 65:
                    SCAN_RESULTS.append({
                        "ticker": ticker,
                        "rsi": rsi,
                        "contracts": unusual[:5]
                    })

            except:
                pass

        time.sleep(120)


# ================= ROUTES =================

@app.get("/")
def root():
    return {"status":"running"}


@app.get("/scan")
def scan():
    return SCAN_RESULTS[-50:]


@app.get("/quote/{ticker}")
def quote(ticker:str):
    t=yf.Ticker(ticker)
    info=t.info
    return {
        "symbol":ticker,
        "price":info.get("regularMarketPrice"),
        "change":info.get("regularMarketChangePercent"),
        "volume":info.get("volume")
    }


@app.get("/candles/{ticker}")
def candles(ticker:str):

    df=yf.download(ticker,period="1d",interval="5m")

    if df.empty:
        return []

    if isinstance(df.columns,pd.MultiIndex):
        df.columns=df.columns.get_level_values(0)

    df.reset_index(inplace=True)

    return [{
        "Datetime":str(r["Datetime"]),
        "Open":float(r["Open"]),
        "High":float(r["High"]),
        "Low":float(r["Low"]),
        "Close":float(r["Close"]),
        "Volume":int(r["Volume"])
    } for _,r in df.iterrows()]


@app.get("/options/{ticker}")
def options(ticker:str):

    t=yf.Ticker(ticker)

    if not t.options:
        return {"calls":[],"puts":[]}

    exp=t.options[0]
    chain=t.option_chain(exp)

    calls=[]
    puts=[]

    for _,c in chain.calls.fillna(0).iterrows():
        calls.append({
            "strike":float(c["strike"]),
            "lastPrice":float(c["lastPrice"]),
            "volume":int(c["volume"]),
            "openInterest":int(c["openInterest"]),
            "impliedVolatility":float(c.get("impliedVolatility",0))
        })

    for _,p in chain.puts.fillna(0).iterrows():
        puts.append({
            "strike":float(p["strike"]),
            "lastPrice":float(p["lastPrice"]),
            "volume":int(p["volume"]),
            "openInterest":int(p["openInterest"]),
            "impliedVolatility":float(p.get("impliedVolatility",0))
        })

    return {"calls":calls,"puts":puts}


def fetch_news(ticker):
    url=f"https://newsapi.org/v2/everything?q={ticker}&pageSize=5&apiKey=YOUR_NEWS_API"
    r=requests.get(url).json()
    return [a["title"] for a in r.get("articles",[])]


@app.get("/flow/{ticker}")
def flow(ticker:str):

    t=yf.Ticker(ticker)
    exp=t.options[0]
    chain=t.option_chain(exp)

    df=pd.concat([chain.calls,chain.puts])
    df["premium"]=df["lastPrice"]*df["volume"]*100

    unusual=df[
        (df["volume"]>df["openInterest"]*2) &
        (df["premium"]>200000)
    ]

    return unusual.to_dict(orient="records")


@app.get("/ai/{ticker}")
def ai_signal(ticker: str):

    try:
        unusual = flow(ticker)
        headlines = fetch_news(ticker)

        df = yf.download(ticker, period="1d", interval="5m")
        closes = df["Close"].values if not df.empty else []

        price = float(closes[-1]) if len(closes) else 0
        rsi = calculate_rsi(closes) if len(closes) > 15 else 50

        ai = analyze_market(ticker, unusual, headlines, price, rsi)

        bias = ai.get("bias", "NEUTRAL")

        entry = round(price,2)
        stop = round(price * 0.99,2)
        target = round(price * 1.02,2)

        if bias == "PUTS":
            stop = round(price * 1.01,2)
            target = round(price * 0.98,2)

        signal = {
            "bias": bias,
            "confidence": ai.get("confidence",0),
            "price": entry,
            "stop": stop,
            "target": target
        }

        return signal

    except Exception as e:
        print("AI ERROR:", e)

        # IMPORTANT: still return JSON so CORS works
        return JSONResponse({
            "bias": "NEUTRAL",
            "confidence": 0,
            "price": 0,
            "stop": 0,
            "target": 0
        })


@app.get("/signals")
def signals():
    return SIGNAL_HISTORY[-100:]


# ================= START =================

threading.Thread(target=auto_scan,daemon=True).start()
