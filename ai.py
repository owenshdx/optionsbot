import certfix
import os, json
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SYSTEM = """
You are a professional options trading AI.

You receive:
- Unusual options flow
- RSI momentum
- Current price
- News headlines

Return STRICT JSON:

{
 "bias":"CALLS|PUTS|NEUTRAL",
 "confidence":0-100,
 "summary":"short",
 "reasons":["",""],
 "suggested_trades":[
   {
     "type":"CALL or PUT",
     "strike":"number",
     "expiration":"weekly",
     "logic":"why"
   }
 ]
}

JSON ONLY.
"""

def analyze_market(ticker, unusual, headlines, price, rsi):

    flow_text = ""
    for f in unusual[:8]:
        flow_text += f"Strike {f.get('strike')} premium {round(f.get('premium',0))}\n"

    news = "\n".join(headlines[:5])

    prompt = f"""
Ticker: {ticker}
Current Price: {price}
RSI: {rsi}

Unusual Flow:
{flow_text}

News:
{news}
"""

    r = client.responses.create(
        model="gpt-4.1-mini",
        input=[
            {"role":"system","content":SYSTEM},
            {"role":"user","content":prompt}
        ]
    )

    raw = r.output_text

    try:
        return json.loads(raw)
    except:
        return {
            "bias":"NEUTRAL",
            "confidence":50,
            "summary":raw,
            "reasons":[],
            "suggested_trades":[]
        }
