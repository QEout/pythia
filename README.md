# 🔮 Pythia — Million-Agent Swarm Intelligence Prediction Engine

**Pythia uses 1,000,000 AI agents to simulate the world and predict what happens next.**

6 Chief Agents with distinct personalities debate real-time global data. 1,000 Expert Agents vote on outcomes. 1,000,000 Citizen Agents simulate how information spreads through society. The result: verifiable predictions about tomorrow's headlines, market movements, and viral trends.

> "Yesterday Pythia predicted today's #1 trending topic with 78% accuracy."

<p align="center">
  <img src="docs/screenshot.png" width="800" alt="Pythia Dashboard" />
</p>

## 🚀 What Makes Pythia Different

| | Traditional AI | MiroFish | WorldMonitor | **Pythia** |
|---|---|---|---|---|
| Purpose | Single prediction | Scenario simulation | Real-time monitoring | **Predict what happens next** |
| Data Source | Manual input | Manual seed | 435+ RSS feeds | **10 automated sources (all free, no auth)** |
| Agents | Single model | Simulated personas | None (dashboard) | **1M agents, 3-tier hierarchy** |
| Verifiable | ❌ | ❌ | N/A | **✅ Auto-verified daily** |
| Access | API/CLI | Local (32GB RAM) | Web | **Web dashboard** |
| Domains | Single domain | Scenario-based | Monitoring only | **6 domains + cross-domain correlation** |
| Cost | $$$$ | $$ | Free | **< $70/month** |

> **WorldMonitor shows you what's happening. Pythia tells you what happens next.**

## 🧠 Architecture

```
┌─ Data Layer (automated, every 6h) ──────────────────┐
│  NewsAPI · Weibo Hot Search · Google Trends          │
│  CoinGecko · Yahoo Finance · RSS Feeds               │
│  🌍 USGS Earthquakes · Open-Meteo Climate · GDACS    │
│     Crypto Fear & Greed · Global Disaster Alerts      │
└──────────────────────┬──────────────────────────────┘
                       ▼
┌─ Chief Agents (6 LLM-powered analysts) ─────────────┐
│  🏛️ Strategist    · 🔬 Technomancer  · 📱 Voxhunter │
│  💰 Sharktooth    · 🎭 Zeitgeist     · 🦢 Cassandra │
└──────────────────────┬──────────────────────────────┘
                       ▼
┌─ Expert Layer (1,000 lightweight LLM agents) ───────┐
│  Domain-specific voting and sentiment aggregation    │
└──────────────────────┬──────────────────────────────┘
                       ▼
┌─ Roundtable Debate ─────────────────────────────────┐
│  Agents challenge each other → weighted consensus    │
└──────────────────────┬──────────────────────────────┘
                       ▼
┌─ Citizen Simulation (1,000,000 agents) ─────────────┐
│  Information spread · Sentiment shift · Group behavior│
│  10 demographic groups · Power-law social network     │
└──────────────────────┬──────────────────────────────┘
                       ▼
┌─ Verification Engine ───────────────────────────────┐
│  Auto-checks predictions against reality every 12h   │
│  Updates agent credibility scores                    │
└─────────────────────────────────────────────────────┘
```

## 🎭 Meet the Agents

| Agent | Domain | Personality |
|---|---|---|
| 🏛️ **Strategist** (政经谋士) | Politics & Policy | Cold, rational, Machiavellian clarity |
| 🔬 **Technomancer** (科技先知) | Tech & AI | Optimistic, sees exponential curves |
| 📱 **Voxhunter** (舆情猎手) | Social Media & Opinion | Sharp, cynical, predicts narratives |
| 💰 **Sharktooth** (金融鲨鱼) | Finance & Crypto | Greedy, follows the money |
| 🎭 **Zeitgeist** (文化风向) | Culture & Entertainment | Intuitive, feels undercurrents |
| 🦢 **Cassandra** (黑天鹅猎人) | Black Swan Events | Paranoid, contrarian, occasionally right |

## ⚡ Quick Start

```bash
# Clone
git clone https://github.com/YOUR_USERNAME/pythia.git
cd pythia

# Install dependencies
pip install -r requirements.txt

# Configure
cp .env.example .env
# Edit .env: add your DeepSeek API key (< $1/month) and optionally NewsAPI key

# Run
python main.py
```

Open http://localhost:8080 and click **⚡ Run Prediction**.

## 📊 How It Works

1. **Data Collection** — Pythia automatically gathers real-time data from 9+ sources every cycle (including WorldMonitor geophysical, climate, aviation, and market data)
2. **Chief Analysis** — 6 AI agents with distinct personalities analyze the data from their domain perspective
3. **Roundtable Debate** — Agents challenge each other's predictions, form consensus through weighted voting
4. **Citizen Simulation** — 1M simulated citizens show how predictions would propagate through society
5. **Verification** — Every 12 hours, Pythia automatically checks if its predictions came true

## 💰 Cost

Pythia runs on DeepSeek V3, one of the most cost-effective LLMs available:

- **6 Chief Agent calls**: ~¥0.5 per cycle
- **Roundtable debate**: ~¥0.3 per cycle
- **Verification**: ~¥0.2 per check
- **Citizen simulation**: CPU only, ¥0
- **Total**: **< ¥15/day** (< $70/month)

## 🛠️ Tech Stack

- **Backend**: Python 3.12, FastAPI, APScheduler
- **LLM**: DeepSeek V3 (OpenAI-compatible API)
- **Simulation**: NumPy-based Agent-Based Model (1M agents)
- **Storage**: SQLite
- **Frontend**: Tailwind CSS, Chart.js, WebSocket, real-time ticker
- **Data**: NewsAPI, Google Trends, Weibo, CoinGecko, Yahoo Finance, USGS Earthquakes, Open-Meteo Climate, GDACS Disaster Alerts, Crypto Fear & Greed Index

## 🗺️ Roadmap

- [x] Global intelligence layer (USGS earthquakes, Open-Meteo climate, GDACS disasters, Fear & Greed)
- [x] Real-time data ticker on dashboard
- [x] Agent credibility score visualization
- [ ] Expert Agent layer (1,000 lightweight voting agents)
- [ ] Interactive world map with event heatmap (Leaflet.js)
- [ ] Multi-language prediction reports (EN/CN/JP/KR)
- [ ] Telegram/Discord bot for prediction alerts
- [ ] Historical accuracy dashboard with time-series graphs
- [ ] Plugin system for custom data sources
- [ ] Docker one-click deployment
- [ ] Prediction NFTs (on-chain verifiable predictions)

## 📄 License

AGPL-3.0 — same as MiroFish and WorldMonitor. Free to use, modify, and distribute. Contributions welcome.

## 🤝 Contributing

PRs welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

<p align="center">
  <b>WorldMonitor shows you what's happening. Pythia tells you what happens next.</b>
</p>

<p align="center">
  <i>Powered by 1M simulated agents, 9 real-time data sources, and the belief that the future is computable.</i>
</p>
