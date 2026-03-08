"""Yahoo Finance — major indices and movers."""

from __future__ import annotations
import logging

log = logging.getLogger(__name__)

TICKERS = ["^GSPC", "^DJI", "^IXIC", "^HSI", "000001.SS", "^N225", "GC=F", "CL=F", "DX-Y.NYB"]
TICKER_NAMES = {
    "^GSPC": "S&P 500", "^DJI": "Dow Jones", "^IXIC": "NASDAQ",
    "^HSI": "Hang Seng", "000001.SS": "Shanghai Composite", "^N225": "Nikkei 225",
    "GC=F": "Gold", "CL=F": "Crude Oil", "DX-Y.NYB": "US Dollar Index",
}


async def fetch_finance() -> list[dict]:
    items: list[dict] = []
    try:
        import yfinance as yf
        data = yf.download(TICKERS, period="2d", group_by="ticker", progress=False, threads=True)
        for ticker in TICKERS:
            try:
                df = data[ticker] if len(TICKERS) > 1 else data
                if df.empty or len(df) < 2:
                    continue
                last = float(df["Close"].iloc[-1])
                prev = float(df["Close"].iloc[-2])
                change = (last - prev) / prev * 100 if prev else 0
                items.append({
                    "name": TICKER_NAMES.get(ticker, ticker),
                    "symbol": ticker,
                    "price": round(last, 2),
                    "change_pct": round(change, 2),
                })
            except Exception:
                continue
    except Exception as e:
        log.warning("Yahoo Finance failed: %s", e)
    return items
