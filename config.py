import os
from dotenv import load_dotenv

load_dotenv()

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
DEEPSEEK_BASE_URL = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
DEEPSEEK_MODEL = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")
NEWSAPI_KEY = os.getenv("NEWSAPI_KEY", "")
FRED_API_KEY = os.getenv("FRED_API_KEY", "")
FINNHUB_API_KEY = os.getenv("FINNHUB_API_KEY", "")

PREDICTION_INTERVAL_HOURS = int(os.getenv("PREDICTION_INTERVAL_HOURS", "6"))
CITIZEN_AGENT_COUNT = int(os.getenv("CITIZEN_AGENT_COUNT", "1000000"))
EXPERT_AGENT_COUNT = int(os.getenv("EXPERT_AGENT_COUNT", "1000"))

DB_PATH = os.getenv("DB_PATH", "pythia.db")

CACHE_TTL_DEFAULT = int(os.getenv("CACHE_TTL_DEFAULT", "300"))
DEEP_ENTITY_EXTRACTION = os.getenv("DEEP_ENTITY_EXTRACTION", "false").lower() == "true"
PREDICTION_LANGUAGE = os.getenv("PREDICTION_LANGUAGE", "en")  # "en", "zh", or "both"
