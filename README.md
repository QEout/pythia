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
| Data Source | Manual input | Manual seed | 435+ RSS feeds | **13 automated sources + 30+ RSS feeds (all free)** |
| Agents | Single model | Simulated personas | None (dashboard) | **1M agents, 3-tier hierarchy with memory** |
| Knowledge Graph | ❌ | GraphRAG (Zep) | ❌ | **Entity graph with cross-round learning** |
| Caching | ❌ | ❌ | 3-tier (mem→Redis→upstream) | **In-memory with stampede prevention** |
| Verifiable | ❌ | ❌ | N/A | **✅ Auto-verified with memory feedback** |
| Access | API/CLI | Local (32GB RAM) | Web | **Web dashboard** |
| Domains | Single domain | Scenario-based | Monitoring only | **6 domains + cross-domain correlation** |
| Cost | $$$$ | $$ | Free | **< $70/month** |

> **WorldMonitor shows you what's happening. Pythia tells you what happens next.**

## 🧠 Architecture

```
┌─ Data Layer (13 sources, cached, every 6h) ────────────────────┐
│  NewsAPI · 30+ RSS feeds (categorized) · Weibo Hot Search      │
│  Google Trends · CoinGecko · Yahoo Finance                     │
│  🌍 USGS Earthquakes · Open-Meteo Climate · GDACS Disasters   │
│  ⚔️ ACLED Conflicts · 📰 GDELT Events · 🎯 Polymarket        │
│  🔥 NASA FIRMS Fires · Crypto Fear & Greed                    │
└──────────────────────┬─────────────────────────────────────────┘
                       ▼
┌─ Entity Extraction Layer ──────────────────────────────────────┐
│  Fast keyword NER → Knowledge graph update                     │
│  Trending entity detection · Cross-source correlation          │
└──────────────────────┬─────────────────────────────────────────┘
                       ▼
┌─ Chief Agents (6 LLM-powered, with episodic memory) ──────────┐
│  🏛️ Strategist    · 🔬 Technomancer  · 📱 Voxhunter          │
│  💰 Sharktooth    · 🎭 Zeitgeist     · 🦢 Cassandra          │
│  Each agent receives: world data + prediction history +        │
│  entity graph context → calibrated confidence                  │
└──────────────────────┬─────────────────────────────────────────┘
                       ▼
┌─ Expert Layer (1,000 lightweight LLM agents) ──────────────────┐
│  Domain-specific voting and sentiment aggregation              │
└──────────────────────┬─────────────────────────────────────────┘
                       ▼
┌─ Roundtable Debate ───────────────────────────────────────────┐
│  Agents challenge each other → weighted consensus              │
└──────────────────────┬─────────────────────────────────────────┘
                       ▼
┌─ Citizen Simulation (1,000,000 agents) ────────────────────────┐
│  Information spread · Sentiment shift · Group behavior         │
│  10 demographic groups · Power-law social network              │
└──────────────────────┬─────────────────────────────────────────┘
                       ▼
┌─ Verification Engine (with memory feedback) ──────────────────┐
│  Auto-checks predictions against reality every 12h             │
│  Updates agent credibility scores                              │
│  Writes lessons back to agent memory → cross-round learning    │
└────────────────────────────────────────────────────────────────┘
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

Each agent now has **episodic memory** — they remember their past predictions and outcomes, learning to calibrate confidence over time.

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

1. **Data Collection** — Pythia gathers data from 13 sources (30+ RSS feeds, ACLED conflicts, GDELT events, Polymarket odds, NASA fire data, and more) with intelligent caching
2. **Entity Extraction** — Fast keyword NER builds a knowledge graph of trending entities (countries, people, companies, topics) with cross-source correlation
3. **Chief Analysis** — 6 AI agents analyze data from their domain, informed by their prediction history and the entity graph
4. **Roundtable Debate** — Agents challenge each other's predictions, form consensus through weighted voting
5. **Citizen Simulation** — 1M simulated citizens show how predictions would propagate through society
6. **Verification + Learning** — Every 12 hours, Pythia checks predictions against reality and writes lessons back into agent memory

## 📡 Data Sources (13 total, all free)

| Source | Module | Auth | Update Freq | What it provides |
|---|---|---|---|---|
| NewsAPI | `news.py` | Optional key | 5 min cache | 30 English top headlines |
| 30+ RSS Feeds | `news.py` | None | 5 min cache | Categorized global news (geopolitics, tech, finance, defense, MENA, Asia) |
| Weibo Hot Search | `weibo.py` | None | 5 min cache | Chinese social media trends |
| Google Trends | `trends.py` | None | 5 min cache | US + China trending searches |
| CoinGecko | `crypto.py` | None | 2 min cache | Top 20 crypto + trending coins |
| Yahoo Finance | `finance.py` | None | 2 min cache | Major indices, gold, oil, USD |
| USGS Earthquakes | `worldmonitor.py` | None | 15 min cache | M2.5+ earthquakes in last 24h |
| Open-Meteo | `worldmonitor.py` | None | 15 min cache | Weather extremes for 8 major cities |
| GDACS Disasters | `worldmonitor.py` | None | 15 min cache | Global disaster alerts |
| Crypto Fear & Greed | `worldmonitor.py` | None | 15 min cache | Market sentiment index |
| ACLED Conflicts | `acled.py` | None (public) | 1 hr cache | Armed conflicts, protests, violence |
| GDELT Events | `gdelt.py` | None | 15 min cache | Global event analysis, tone trends |
| Polymarket | `polymarket.py` | None | 5 min cache | Prediction market odds |
| NASA FIRMS | `nasa_firms.py` | None | 15 min cache | Satellite fire detections worldwide |

## 🧠 Inspired By

### WorldMonitor (33.5k stars)
- **Categorized RSS feeds** — We adopted their approach of organizing feeds by domain (geopolitics, tech, finance, defense, MENA, Asia) so each agent gets relevant data
- **Cache-aside pattern** — Our caching layer uses stampede prevention and stale-on-error fallback, inspired by WorldMonitor's 3-tier cache
- **Multi-source aggregation** — We integrated similar free APIs (ACLED, GDELT, NASA FIRMS, Polymarket) that WorldMonitor uses for its data layers

### MiroFish (6.3k stars)
- **Agent memory** — Our episodic memory system is inspired by MiroFish's Zep/Graphiti temporal knowledge graph, but uses local SQLite instead of cloud services
- **Entity extraction** — Our knowledge graph layer borrows from MiroFish's GraphRAG approach, using fast keyword NER with optional LLM-powered deep extraction
- **Memory-guided prediction** — Like MiroFish's agents with long-term memory, our agents receive their prediction history + outcomes to calibrate confidence

### Key Differentiators
- **Fully automated** — No manual seed material required (unlike MiroFish)
- **Verifiable** — Auto-verification with memory feedback loop
- **Zero-dependency memory** — SQLite-based, no Zep Cloud / Neo4j required
- **13 free data sources** — No expensive API keys needed

## 💰 Cost

Pythia runs on DeepSeek V3, one of the most cost-effective LLMs available:

- **6 Chief Agent calls**: ~¥0.5 per cycle
- **Roundtable debate**: ~¥0.3 per cycle
- **Verification**: ~¥0.2 per check
- **Citizen simulation**: CPU only, ¥0
- **All data sources**: Free
- **Total**: **< ¥15/day** (< $70/month)

## 🛠️ Tech Stack

- **Backend**: Python 3.12, FastAPI, APScheduler
- **LLM**: DeepSeek V3 (OpenAI-compatible API)
- **Simulation**: NumPy-based Agent-Based Model (1M agents)
- **Storage**: SQLite (predictions, agent memory, entity graph)
- **Caching**: In-memory with TTL, stampede prevention, stale-on-error
- **Frontend**: Tailwind CSS, Chart.js, WebSocket, real-time ticker
- **Data**: 13 sources — NewsAPI, 30+ RSS, Google Trends, Weibo, CoinGecko, Yahoo Finance, USGS, Open-Meteo, GDACS, Fear & Greed, ACLED, GDELT, Polymarket, NASA FIRMS

## 🗺️ Roadmap

- [x] Global intelligence layer (USGS earthquakes, Open-Meteo climate, GDACS disasters, Fear & Greed)
- [x] Real-time data ticker on dashboard
- [x] Agent credibility score visualization
- [x] Categorized RSS feeds (30+ feeds across 7 categories)
- [x] ACLED armed conflict data integration
- [x] GDELT global event analysis
- [x] Polymarket prediction market odds
- [x] NASA FIRMS satellite fire detection
- [x] In-memory caching with stampede prevention
- [x] Agent episodic memory (MiroFish-inspired)
- [x] Entity extraction / knowledge graph
- [x] Memory-informed prediction (cross-round learning)
- [ ] Expert Agent layer (1,000 lightweight voting agents)
- [ ] Interactive world map with event heatmap (Leaflet.js)
- [ ] Multi-language prediction reports (EN/CN/JP/KR)
- [ ] Telegram/Discord bot for prediction alerts
- [ ] Historical accuracy dashboard with time-series graphs
- [ ] Plugin system for custom data sources
- [ ] Docker one-click deployment

## 📄 License

AGPL-3.0 — same as MiroFish and WorldMonitor. Free to use, modify, and distribute. Contributions welcome.

## 🤝 Contributing

PRs welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

<p align="center">
  <b>WorldMonitor shows you what's happening. Pythia tells you what happens next.</b>
</p>

<p align="center">
  <i>Powered by 1M simulated agents, 13 real-time data sources, and the belief that the future is computable.</i>
</p>
