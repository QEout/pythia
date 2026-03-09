# 天机 Tianji — 百万智能体群体智慧预测引擎

<p align="center">
  <b>🌏 中文</b> | <a href="#tianji--million-agent-swarm-intelligence-prediction-engine">English</a>
</p>

**天机使用 1,000,000 个 AI 智能体模拟世界运行，预测下一步将发生什么。**

12 位首席智能体采用 ReACT 推理模式分析实时全球数据。1,000,000 个公民智能体——拥有 5 种行为原型、信念动力学和回音室效应——模拟信息在社会中的传播。知识图谱反馈回路确保智能体从每次预测中学习。

> 泄天机于数据，见未来于群智

<p align="center">
  <img src="docs/screenshot.png" width="800" alt="天机 Tianji 仪表盘" />
</p>

## 🚀 天机的独特之处

| | 传统 AI | MiroFish | WorldMonitor | **天机 Tianji** |
|---|---|---|---|---|
| 目标 | 单次预测 | 情景模拟 | 实时监控 | **预测下一步** |
| 数据源 | 手动输入 | 手动种子 | 435+ RSS | **16 自动数据源 + 100+ RSS（全部免费）** |
| 智能体 | 单模型 | ~2K 模拟角色 | 无 | **100 万智能体，3 层架构** |
| 推理方式 | 单次推理 | ReACT（仅报告） | 无 | **12 位首席全部使用 ReACT + 4 工具** |
| 公民模型 | 无 | 每个 agent 调 LLM（$$）| 无 | **NumPy 加速：原型、信念、回音室** |
| 知识图谱 | ❌ | GraphRAG（Zep Cloud） | ❌ | **实体图谱 + 预测反馈回路** |
| 记忆系统 | ❌ | Zep Cloud（$） | ❌ | **SQLite 情景记忆（免费）** |
| 可验证 | ❌ | ❌ | 无 | **✅ 自动验证 + 记忆反馈 + 准确率仪表盘** |
| 领域覆盖 | 单领域 | 场景式 | 仅监控 | **12 领域 + 跨领域关联** |
| 成本 | $$$$ | $$ | 免费 | **< ¥500/月** |

> **WorldMonitor 告诉你正在发生什么。天机告诉你接下来会发生什么。**

## 🧠 架构

```
┌─ 数据层（16 源，智能缓存，每 6 小时） ──────────────────────────┐
│  NewsAPI · 100+ RSS · 微博热搜 · Google Trends · CoinGecko      │
│  Yahoo Finance · USGS 地震 · Open-Meteo 气候 · GDACS 灾害       │
│  ACLED 冲突 · GDELT 事件 · Polymarket · NASA FIRMS 火点          │
│  FRED 宏观经济 · WHO 疫情 · Finnhub 股票 · 恐惧贪婪指数         │
└──────────────────────┬─────────────────────────────────────────────┘
                       ▼
┌─ 实体提取 → 知识图谱（反馈回路） ─────────────────────────────────┐
│  关键词 NER + 启发式专有名词提取 → 实体图谱                       │
│  预测输出 → 图谱丰富化 · 验证结果 → 上下文更新                   │
└──────────────────────┬─────────────────────────────────────────────┘
                       ▼
┌─ 12 位首席智能体（ReACT 推理 + 情景记忆） ────────────────────────┐
│  🏛️ 政经谋士  🔬 科技先知  📱 舆情猎手  💰 金融鲨鱼             │
│  🎭 文化风向  🦢 黑天鹅猎人  🛡️ 铁壁参谋  🧬 疫情守望          │
│  🌍 盖亚之眼  🐉 龙脉探针  👻 链上幽灵  🔗 供应链猎手            │
│                                                                    │
│  每位智能体：思考 → 调用工具 → 观察 → 修正                       │
│  工具：知识图谱查询、历史战绩、交叉验证、信号获取                 │
└──────────────────────┬─────────────────────────────────────────────┘
                       ▼
┌─ 圆桌辩论 ────────────────────────────────────────────────────────┐
│  12 位智能体相互质疑 → 加权共识 + 黑天鹅标记                      │
└──────────────────────┬─────────────────────────────────────────────┘
                       ▼
┌─ 公民传播仿真（1,000,000 智能体） ────────────────────────────────┐
│  5 种原型：跟随者 · 放大器 · 怀疑者 · 反向操作者 · 意见领袖      │
│  连续信念强度 · 怀疑阈值 · 群体间信任矩阵                         │
│  回音室形成 · 反叙事涌现 · 10 人口群体 × 12 领域敏感度            │
└──────────────────────┬─────────────────────────────────────────────┘
                       ▼
┌─ 验证引擎 + 准确率仪表盘（闭合反馈回路） ─────────────────────────┐
│  每 12 小时对比预测与现实 · 更新智能体分数 + 情景记忆              │
│  具体可执行的反思教训 → 下一轮推理注入                             │
│  历史准确率：按智能体 / 领域 / 轮次 → 可视化仪表盘                │
└────────────────────────────────────────────────────────────────────┘
```

## 🎭 12 位智能体

| 智能体 | 领域 | 性格 |
|---|---|---|
| 🏛️ **Strategist** (政经谋士) | 政治与政策 | 冷静、理性、马基雅维利式的洞察 |
| 🔬 **Technomancer** (科技先知) | 科技与 AI | 乐观，看到指数曲线 |
| 📱 **Voxhunter** (舆情猎手) | 社交媒体与舆论 | 敏锐、犀利、预测叙事走向 |
| 💰 **Sharktooth** (金融鲨鱼) | 金融与市场 | 贪婪，追踪资金流向 |
| 🎭 **Zeitgeist** (文化风向) | 文化与娱乐 | 直觉型，感知暗流 |
| 🦢 **Cassandra** (黑天鹅猎人) | 黑天鹅事件 | 偏执、逆向思维，对的时候毁灭性强 |
| 🛡️ **Sentinel** (铁壁参谋) | 军事与防务 | 纪律严明，战区态势思维 |
| 🧬 **Vitalis** (疫情守望) | 健康与生物科技 | 谨慎、循证流行病学 |
| 🌍 **Gaia** (盖亚之眼) | 能源与气候 | 长期思考者，追踪临界点 |
| 🐉 **Dragon** (龙脉探针) | 中国焦点 | 读懂官方声明的弦外之音 |
| 👻 **Phantom** (链上幽灵) | 加密货币与 Web3 | 链上原住民，追踪巨鲸钱包 |
| 🔗 **Nexus** (供应链猎手) | 供应链与贸易 | 系统思维者，看到级联效应 |

所有智能体使用 **ReACT 推理** — 可调用 4 种工具（知识图谱查询、历史战绩、交叉验证、信号获取）后再输出预测。

## ⚡ 快速开始

```bash
# 克隆
git clone https://github.com/YOUR_USERNAME/tianji.git
cd tianji

# 安装依赖
pip install -r requirements.txt
cd frontend && npm install && npm run build && cd ..

# 配置
cp .env.example .env
# 编辑 .env：添加你的 DeepSeek API key（< ¥10/月）

# 运行
python main.py
```

打开 http://localhost:8080 ，点击 **启动预测**。

## 📊 工作原理

1. **数据采集** — 天机从 16 个数据源自动采集数据（100+ RSS、ACLED 冲突、GDELT 事件、Polymarket 赔率、NASA 火点等），智能缓存
2. **实体提取** — 关键词 NER + 启发式专有名词提取构建知识图谱；预测输出反馈回图谱
3. **ReACT 分析** — 12 位 AI 智能体使用迭代式 思考→行动→观察 循环分析数据，拥有工具调用和情景记忆
4. **圆桌辩论** — 智能体互相质疑预测，通过加权投票形成共识
5. **公民传播仿真** — 100 万智能体（5 种原型）模拟预测如何在社会中传播（怀疑者抵制、反向者反推、意见领袖放大）
6. **验证 + 反馈** — 每 12 小时对比预测与现实，将具体教训写入记忆并更新知识图谱

## 📡 数据源（16 个，全部免费）

| 数据源 | 模块 | 认证 | 更新频率 | 提供内容 |
|---|---|---|---|---|
| NewsAPI | `news.py` | 可选 key | 5 分钟 | 英文头条新闻 |
| 100+ RSS | `news.py` | 无 | 5 分钟 | 分类全球新闻 |
| 微博热搜 | `weibo.py` | 无 | 5 分钟 | 中文社交媒体趋势 |
| Google Trends | `trends.py` | 无 | 5 分钟 | 美国 + 中国搜索趋势 |
| CoinGecko | `crypto.py` | 无 | 2 分钟 | Top 20 加密货币 + 热门币 |
| Yahoo Finance | `finance.py` | 无 | 2 分钟 | 主要指数、黄金、原油、美元 |
| USGS 地震 | `worldmonitor.py` | 无 | 15 分钟 | 24 小时内 M2.5+ 地震 |
| Open-Meteo | `worldmonitor.py` | 无 | 15 分钟 | 8 大城市极端天气 |
| GDACS 灾害 | `worldmonitor.py` | 无 | 15 分钟 | 全球灾害预警 |
| 恐惧贪婪指数 | `worldmonitor.py` | 无 | 15 分钟 | 市场情绪指数 |
| ACLED 冲突 | `acled.py` | 无 | 1 小时 | 武装冲突、抗议、暴力 |
| GDELT 事件 | `gdelt.py` | 无 | 15 分钟 | 全球事件分析、情绪趋势 |
| Polymarket | `polymarket.py` | 无 | 5 分钟 | 预测市场赔率 |
| NASA FIRMS | `nasa_firms.py` | 无 | 15 分钟 | 全球卫星火点检测 |
| FRED 宏观经济 | `fred.py` | API key | 1 小时 | GDP、失业率、CPI、利率等 |
| WHO 疫情 | `who.py` | 无 | 1 小时 | 疾病暴发新闻 + COVID 全球数据 |
| Finnhub 股票 | `finnhub.py` | API key | 2 分钟 | 15 只主要股票实时报价 |

## 💰 成本

天机运行在 DeepSeek V3 上，性价比极高：

- **12 位首席分析**（含 ReACT）：~¥1.5/轮
- **圆桌辩论**：~¥0.5/轮
- **验证**：~¥0.3/次
- **公民仿真**：仅 CPU，¥0
- **所有数据源**：免费
- **总计**：**< ¥25/天**（< ¥500/月）

## 🛠️ 技术栈

- **后端**：Python 3.12, FastAPI, APScheduler
- **LLM**：DeepSeek V3（OpenAI 兼容 API）
- **推理**：ReACT 模式 + 4 工具（知识图谱、战绩、交叉验证、信号）
- **仿真**：NumPy ABM（100 万智能体、5 原型、信念动力学、回音室）
- **存储**：SQLite（预测、记忆、实体图谱）
- **缓存**：内存 TTL 缓存，防踩踏，错误降级
- **前端**：React + Vite + TypeScript, Tailwind CSS, Recharts, D3.js, Leaflet, i18next (中/英)
- **数据**：16 个数据源 — 全部免费，全部自动化

## 🗺️ 路线图

- [x] 16 自动数据源（全部免费）
- [x] 12 位首席智能体 + ReACT 推理
- [x] 知识图谱 + 预测反馈回路
- [x] 高级公民仿真（原型、信念、回音室）
- [x] 情景记忆 + 验证反馈 + 反思机制
- [x] React 仪表盘 + i18n（中/英）
- [x] 交互式世界地图 + 事件标记
- [x] D3.js 知识图谱可视化
- [x] 历史准确率仪表盘
- [ ] 专家智能体层（1,000 轻量投票智能体）
- [ ] Telegram/Discord 预测推送机器人
- [ ] Docker 一键部署
- [ ] 自定义数据源插件系统

## 📄 许可证

AGPL-3.0 — 自由使用、修改和分发。欢迎贡献。

---

<a id="tianji--million-agent-swarm-intelligence-prediction-engine"></a>

# Tianji 天机 — Million-Agent Swarm Intelligence Prediction Engine

<p align="center">
  <a href="#天机-tianji--百万智能体群体智慧预测引擎">🌏 中文</a> | <b>English</b>
</p>

**Tianji uses 1,000,000 AI agents to simulate the world and predict what happens next.**

12 Chief Agents with ReACT reasoning debate real-time global data. 1,000,000 Citizen Agents — with 5 behavioral archetypes, belief dynamics, and echo chamber effects — simulate how information spreads through society. Knowledge graph feedback loops ensure agents learn from every prediction.

> *Reveal the heavenly secrets from data, see the future through swarm intelligence.*

<p align="center">
  <img src="docs/screenshot.png" width="800" alt="Tianji Dashboard" />
</p>

## 🚀 What Makes Tianji Different

| | Traditional AI | MiroFish | WorldMonitor | **Tianji 天机** |
|---|---|---|---|---|
| Purpose | Single prediction | Scenario simulation | Real-time monitoring | **Predict what happens next** |
| Data Source | Manual input | Manual seed | 435+ RSS feeds | **16 automated sources + 100+ RSS (all free)** |
| Agents | Single model | ~2K simulated personas | None (dashboard) | **1M agents, 3-tier hierarchy** |
| Agent Reasoning | Single-shot | ReACT (report only) | N/A | **ReACT with 4 tools for all 12 chiefs** |
| Citizen Model | None | LLM per agent ($$$) | None | **NumPy: archetypes, beliefs, echo chambers** |
| Knowledge Graph | ❌ | GraphRAG (Zep Cloud) | ❌ | **Entity graph with prediction feedback loop** |
| Memory | ❌ | Zep Cloud ($) | ❌ | **SQLite episodic memory (free)** |
| Verifiable | ❌ | ❌ | N/A | **✅ Auto-verified + memory feedback + accuracy dashboard** |
| Domains | Single | Scenario-based | Monitoring only | **12 domains + cross-domain correlation** |
| Cost | $$$$ | $$ | Free | **< $70/month** |

> **WorldMonitor shows you what's happening. Tianji tells you what happens next.**

## 🧠 Architecture

```
┌─ Data Layer (16 sources, cached, every 6h) ─────────────────────┐
│  NewsAPI · 100+ RSS feeds · Weibo Hot Search · Google Trends     │
│  CoinGecko · Yahoo Finance · USGS Earthquakes · Open-Meteo      │
│  GDACS Disasters · ACLED Conflicts · GDELT Events · Polymarket  │
│  NASA FIRMS Fires · Crypto Fear & Greed · FRED Macro · WHO      │
│  Finnhub Stock Quotes                                            │
└──────────────────────┬───────────────────────────────────────────┘
                       ▼
┌─ Entity Extraction → Knowledge Graph (feedback loop) ───────────┐
│  Keyword NER + heuristic proper noun extraction → entity graph   │
│  Prediction outputs → graph enrichment                           │
│  Verification results → graph context update                     │
└──────────────────────┬───────────────────────────────────────────┘
                       ▼
┌─ 12 Chief Agents (ReACT reasoning + episodic memory) ───────────┐
│  🏛️ Strategist  🔬 Technomancer  📱 Voxhunter  💰 Sharktooth   │
│  🎭 Zeitgeist   🦢 Cassandra    🛡️ Sentinel    🧬 Vitalis      │
│  🌍 Gaia        🐉 Dragon       👻 Phantom     🔗 Nexus        │
│                                                                  │
│  Each agent: Think → Act (call tools) → Observe → Revise        │
│  Tools: query_knowledge_graph, check_track_record,               │
│         cross_validate, get_recent_signals                       │
└──────────────────────┬───────────────────────────────────────────┘
                       ▼
┌─ Roundtable Debate ─────────────────────────────────────────────┐
│  12 agents challenge each other → weighted consensus             │
│  Wildcards flagged by lone dissenters (Cassandra, etc.)          │
└──────────────────────┬───────────────────────────────────────────┘
                       ▼
┌─ Citizen Simulation (1,000,000 agents) ─────────────────────────┐
│  5 archetypes: Follower · Amplifier · Skeptic ·                  │
│                Contrarian · Opinion Leader                        │
│  Continuous belief strength · Skepticism thresholds              │
│  Inter-group trust matrix · Echo chamber formation               │
│  Counter-narrative emergence · 10 groups × 12 domains            │
└──────────────────────┬───────────────────────────────────────────┘
                       ▼
┌─ Verification Engine + Accuracy Dashboard (feedback loop) ──────┐
│  Auto-checks predictions against reality every 12h               │
│  Updates agent scores + episodic memory (actionable lessons)     │
│  Historical accuracy: by agent / domain / round → visual dash   │
└──────────────────────────────────────────────────────────────────┘
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

1. **Data Collection** — Tianji gathers data from 16 sources (100+ RSS feeds, ACLED conflicts, GDELT events, Polymarket odds, NASA fire data, FRED macro, WHO health, Finnhub stocks) with intelligent caching
2. **Entity Extraction** — Keyword NER + heuristic proper noun extraction builds a knowledge graph; prediction outputs feed back into the graph
3. **ReACT Analysis** — 12 AI agents analyze data using iterative Think→Act→Observe loops, with tool access and episodic memory
4. **Roundtable Debate** — Agents challenge each other's predictions, form consensus through weighted voting
5. **Citizen Simulation** — 1M agents with 5 archetypes show how predictions would propagate (skeptics resist, contrarians push back, opinion leaders amplify)
6. **Verification + Feedback** — Every 12 hours, Tianji checks predictions against reality, writes actionable lessons to agent memory AND updates the knowledge graph

## 📡 Data Sources (16 total, all free)

| Source | Module | Auth | Update Freq | What it provides |
|---|---|---|---|---|
| NewsAPI | `news.py` | Optional key | 5 min cache | English top headlines |
| 100+ RSS Feeds | `news.py` | None | 5 min cache | Categorized global news |
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
| FRED Macro Economy | `fred.py` | API key | 1 hr cache | GDP, unemployment, CPI, yields, etc. |
| WHO Health Alerts | `who.py` | None | 1 hr cache | Disease outbreak news + COVID stats |
| Finnhub Stocks | `finnhub.py` | API key | 2 min cache | 15 major stock real-time quotes |

## 🧠 Inspired By

### WorldMonitor (33.5k stars)
- Categorized RSS feeds, cache-aside pattern, multi-source aggregation

### MiroFish (6.4k stars)
- Agent memory concept (Zep/Graphiti), GraphRAG knowledge graph, memory-guided prediction
- **Adapted**: ReACT-style reasoning (from MiroFish's ReportAgent pattern)
- **Adapted**: Knowledge graph feedback loop (predictions enrich graph, verification updates context)

### Key Differentiators
- **Fully automated** — no manual seed material required
- **12 domain agents** with ReACT reasoning and tool access
- **1M citizen simulation** with 5 behavioral archetypes and echo chamber dynamics
- **Zero-dependency memory** — SQLite-based, no cloud services
- **Knowledge graph feedback loop** — predictions ↔ graph ↔ verification
- **Accuracy dashboard** — historical hit rate by agent, domain, and round

## 💰 Cost

Tianji runs on DeepSeek V3, one of the most cost-effective LLMs:

- **12 Chief Agent calls** (with ReACT): ~¥1.5 per cycle
- **Roundtable debate**: ~¥0.5 per cycle
- **Verification**: ~¥0.3 per check
- **Citizen simulation**: CPU only, ¥0
- **All data sources**: Free
- **Total**: **< ¥25/day** (< $70/month)

## 🛠️ Tech Stack

- **Backend**: Python 3.12, FastAPI, APScheduler
- **LLM**: DeepSeek V3 (OpenAI-compatible API)
- **Agent Reasoning**: ReACT pattern with 4 tools (knowledge graph, track record, cross-validation, signals)
- **Simulation**: NumPy ABM (1M agents, 5 archetypes, belief dynamics, echo chambers)
- **Storage**: SQLite (predictions, agent memory, entity graph)
- **Caching**: In-memory with TTL, stampede prevention, stale-on-error
- **Frontend**: React + Vite + TypeScript, Tailwind CSS, Recharts, D3.js, Leaflet, i18next (EN/CN)
- **Data**: 16 sources — all free, all automated

## 🗺️ Roadmap

- [x] 16 automated data sources (all free)
- [x] 12 Chief Agents with ReACT reasoning
- [x] Knowledge graph with prediction feedback loop
- [x] Advanced citizen simulation (archetypes, beliefs, echo chambers)
- [x] Agent episodic memory with verification feedback + reflection
- [x] React dashboard with i18n (EN/CN)
- [x] Interactive world map with event markers
- [x] D3.js knowledge graph visualization
- [x] Historical accuracy dashboard
- [ ] Expert Agent layer (1,000 lightweight voting agents)
- [ ] Telegram/Discord bot for prediction alerts
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
