# 天机 Tianji — Million-Agent Swarm Intelligence Prediction Engine

**天机 uses 1,000,000 AI agents to simulate the world and predict what happens next.**

12 Chief Agents with ReACT reasoning debate real-time global data. 1,000,000 Citizen Agents — with 5 behavioral archetypes, belief dynamics, and echo chamber effects — simulate how information spreads through society. Knowledge graph feedback loops ensure agents learn from every prediction.

> 泄天机于数据，见未来于群智
> *Reveal the heavenly secrets from data, see the future through swarm intelligence.*

<p align="center">
  <img src="docs/screenshot.png" width="800" alt="天机 Tianji Dashboard" />
</p>

## 🚀 What Makes Tianji Different

| | Traditional AI | MiroFish | WorldMonitor | **天机 Tianji** |
|---|---|---|---|---|
| Purpose | Single prediction | Scenario simulation | Real-time monitoring | **Predict what happens next** |
| Data Source | Manual input | Manual seed | 435+ RSS feeds | **13 automated sources + 30+ RSS (all free)** |
| Agents | Single model | ~2K simulated personas | None (dashboard) | **1M agents, 3-tier hierarchy** |
| Agent Reasoning | Single-shot | ReACT (report only) | N/A | **ReACT with 4 tools for all 12 chiefs** |
| Citizen Model | None | LLM per agent ($$$) | None | **NumPy: archetypes, beliefs, echo chambers** |
| Knowledge Graph | ❌ | GraphRAG (Zep Cloud) | ❌ | **Entity graph with prediction feedback loop** |
| Memory | ❌ | Zep Cloud ($) | ❌ | **SQLite episodic memory (free)** |
| Verifiable | ❌ | ❌ | N/A | **✅ Auto-verified with memory feedback** |
| Domains | Single | Scenario-based | Monitoring only | **12 domains + cross-domain correlation** |
| Cost | $$$$ | $$ | Free | **< $70/month** |

> **WorldMonitor shows you what's happening. 天机 tells you what happens next.**

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
┌─ Entity Extraction → Knowledge Graph (feedback loop) ─────────┐
│  Fast keyword NER → Entity graph update                        │
│  Prediction outputs → graph enrichment                         │
│  Verification results → graph context update                   │
└──────────────────────┬─────────────────────────────────────────┘
                       ▼
┌─ 12 Chief Agents (ReACT reasoning + episodic memory) ─────────┐
│  🏛️ Strategist  🔬 Technomancer  📱 Voxhunter  💰 Sharktooth │
│  🎭 Zeitgeist   🦢 Cassandra    🛡️ Sentinel    🧬 Vitalis    │
│  🌍 Gaia        🐉 Dragon       👻 Phantom     🔗 Nexus      │
│                                                                │
│  Each agent can: Think → Call Tools → Observe → Revise         │
│  Tools: query_knowledge_graph, check_track_record,             │
│         cross_validate, get_recent_signals                     │
└──────────────────────┬─────────────────────────────────────────┘
                       ▼
┌─ Roundtable Debate ───────────────────────────────────────────┐
│  12 agents challenge each other → weighted consensus           │
│  Wildcards flagged by lone dissenters (Cassandra, etc.)        │
└──────────────────────┬─────────────────────────────────────────┘
                       ▼
┌─ Advanced Citizen Simulation (1,000,000 agents) ──────────────┐
│  5 archetypes: Follower · Amplifier · Skeptic ·                │
│                Contrarian · Opinion Leader                      │
│  Continuous belief strength (not binary activation)             │
│  Skepticism thresholds · Inter-group trust matrix              │
│  Echo chamber formation · Counter-narrative emergence           │
│  10 demographic groups × 12 domain sensitivities               │
└──────────────────────┬─────────────────────────────────────────┘
                       ▼
┌─ Verification Engine (closes the feedback loop) ──────────────┐
│  Auto-checks predictions against reality every 12h             │
│  Updates agent scores + episodic memory (lessons learned)      │
│  Feeds verification results back into knowledge graph          │
└────────────────────────────────────────────────────────────────┘
```

## 🎭 Meet the 12 Agents

| Agent | Domain | Personality |
|---|---|---|
| 🏛️ **Strategist** (政经谋士) | Politics & Policy | Cold, rational, Machiavellian clarity |
| 🔬 **Technomancer** (科技先知) | Tech & AI | Optimistic, sees exponential curves |
| 📱 **Voxhunter** (舆情猎手) | Social Media & Opinion | Sharp, cynical, predicts narratives |
| 💰 **Sharktooth** (金融鲨鱼) | Finance & Markets | Greedy, follows the money |
| 🎭 **Zeitgeist** (文化风向) | Culture & Entertainment | Intuitive, feels undercurrents |
| 🦢 **Cassandra** (黑天鹅猎人) | Black Swan Events | Paranoid, contrarian, devastating when right |
| 🛡️ **Sentinel** (铁壁参谋) | Military & Defense | Disciplined, thinks in theater posture |
| 🧬 **Vitalis** (疫情守望) | Health & Biotech | Cautious, evidence-driven epidemiology |
| 🌍 **Gaia** (盖亚之眼) | Energy & Climate | Long-term thinker, tracks tipping points |
| 🐉 **Dragon** (龙脉探针) | China Focus | Reads between the lines of official statements |
| 👻 **Phantom** (链上幽灵) | Crypto & Web3 | Lives on-chain, tracks whale wallets |
| 🔗 **Nexus** (供应链猎手) | Supply Chain & Trade | Systems thinker, sees cascade effects |

All agents use **ReACT reasoning** — they can call 4 tools (query knowledge graph, check track record, cross-validate, get recent signals) before finalizing predictions.

## ⚡ Quick Start

```bash
# Clone
git clone https://github.com/YOUR_USERNAME/tianji.git
cd tianji

# Install dependencies
pip install -r requirements.txt
cd frontend && npm install && npm run build && cd ..

# Configure
cp .env.example .env
# Edit .env: add your DeepSeek API key (< $1/month)

# Run
python main.py
```

Open http://localhost:8080 and click **Run Prediction**.

## 📊 How It Works

1. **Data Collection** — 天机 gathers data from 13 sources (30+ RSS feeds, ACLED conflicts, GDELT events, Polymarket odds, NASA fire data, and more) with intelligent caching
2. **Entity Extraction** — Fast keyword NER builds a knowledge graph; prediction outputs feed back into the graph
3. **ReACT Analysis** — 12 AI agents analyze data using iterative Think→Act→Observe loops, with tool access and episodic memory
4. **Roundtable Debate** — Agents challenge each other's predictions, form consensus through weighted voting
5. **Citizen Simulation** — 1M agents with 5 archetypes show how predictions would propagate (skeptics resist, contrarians push back, opinion leaders amplify)
6. **Verification + Feedback** — Every 12 hours, 天机 checks predictions against reality, writes lessons to agent memory AND updates the knowledge graph

## 📡 Data Sources (13 total, all free)

| Source | Module | Auth | Update Freq | What it provides |
|---|---|---|---|---|
| NewsAPI | `news.py` | Optional key | 5 min cache | 30 English top headlines |
| 30+ RSS Feeds | `news.py` | None | 5 min cache | Categorized global news |
| Weibo Hot Search | `weibo.py` | None | 5 min cache | Chinese social media trends |
| Google Trends | `trends.py` | None | 5 min cache | US + China trending searches |
| CoinGecko | `crypto.py` | None | 2 min cache | Top 20 crypto + trending coins |
| Yahoo Finance | `finance.py` | None | 2 min cache | Major indices, gold, oil, USD |
| USGS Earthquakes | `worldmonitor.py` | None | 15 min cache | M2.5+ earthquakes in last 24h |
| Open-Meteo | `worldmonitor.py` | None | 15 min cache | Weather extremes for 8 major cities |
| GDACS Disasters | `worldmonitor.py` | None | 15 min cache | Global disaster alerts |
| Crypto Fear & Greed | `worldmonitor.py` | None | 15 min cache | Market sentiment index |
| ACLED Conflicts | `acled.py` | None | 1 hr cache | Armed conflicts, protests, violence |
| GDELT Events | `gdelt.py` | None | 15 min cache | Global event analysis, tone trends |
| Polymarket | `polymarket.py` | None | 5 min cache | Prediction market odds |
| NASA FIRMS | `nasa_firms.py` | None | 15 min cache | Satellite fire detections worldwide |

## 🧠 Inspired By

### WorldMonitor (33.5k stars)
- Categorized RSS feeds, cache-aside pattern, multi-source aggregation

### MiroFish (6.4k stars)
- Agent memory concept (Zep/Graphiti), GraphRAG knowledge graph, memory-guided prediction
- **New**: ReACT-style reasoning (adapted from MiroFish's ReportAgent pattern)
- **New**: Knowledge graph feedback loop (predictions enrich graph, verification updates context)

### Key Differentiators
- **Fully automated** — no manual seed material required
- **12 domain agents** with ReACT reasoning and tool access
- **1M citizen simulation** with 5 behavioral archetypes and echo chamber dynamics
- **Zero-dependency memory** — SQLite-based, no cloud services
- **Knowledge graph feedback loop** — predictions ↔ graph ↔ verification

## 💰 Cost

天机 runs on DeepSeek V3, one of the most cost-effective LLMs:

- **12 Chief Agent calls** (with ReACT): ~¥1.5 per cycle
- **Roundtable debate**: ~¥0.5 per cycle
- **Verification**: ~¥0.3 per check
- **Citizen simulation**: CPU only, ¥0
- **All data sources**: Free
- **Total**: **< ¥25/day** (< $100/month)

## 🛠️ Tech Stack

- **Backend**: Python 3.12, FastAPI, APScheduler
- **LLM**: DeepSeek V3 (OpenAI-compatible API)
- **Agent Reasoning**: ReACT pattern with 4 tools (knowledge graph, track record, cross-validation, signals)
- **Simulation**: NumPy ABM (1M agents, 5 archetypes, belief dynamics, echo chambers)
- **Storage**: SQLite (predictions, agent memory, entity graph)
- **Caching**: In-memory with TTL, stampede prevention, stale-on-error
- **Frontend**: React + Vite + TypeScript, Tailwind CSS, Recharts, i18next (EN/CN)
- **Data**: 13 sources — all free, all automated

## 🗺️ Roadmap

- [x] 13 automated data sources (all free)
- [x] 12 Chief Agents with ReACT reasoning
- [x] Knowledge graph with prediction feedback loop
- [x] Advanced citizen simulation (archetypes, beliefs, echo chambers)
- [x] Agent episodic memory with verification feedback
- [x] React dashboard with i18n (EN/CN)
- [ ] Interactive world map with event heatmap
- [ ] D3.js knowledge graph visualization
- [ ] Expert Agent layer (1,000 lightweight voting agents)
- [ ] Telegram/Discord bot for prediction alerts
- [ ] Historical accuracy dashboard
- [ ] Docker one-click deployment
- [ ] Plugin system for custom data sources

## 📄 License

AGPL-3.0 — Free to use, modify, and distribute. Contributions welcome.

---

<p align="center">
  <b>WorldMonitor shows you what's happening. 天机 tells you what happens next.</b>
</p>

<p align="center">
  <i>泄天机于数据，见未来于群智</i>
</p>
