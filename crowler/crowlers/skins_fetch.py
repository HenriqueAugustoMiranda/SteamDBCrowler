import requests
import time
import random
from . import vpn_utils as vpn

RED = "\033[31m"
GREEN = "\033[32m"
YELLOW = "\033[33m"
BLUE = "\033[34m"
RESET = "\033[0m"

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...",
    "Mozilla/5.0 (X11; Linux x86_64)..."
]


def fetch_skins(start=0, count=10, tag_weapon="tag_weapon_ak47", retries=10):
    url = "https://steamcommunity.com/market/search/render/"
    params = {
        "appid": 730,
        "norender": 1,
        "count": count,
        "start": start,
        "search_descriptions": 0,
        "sort_column": "popular",
        "sort_dir": "desc",
        "category_730_Weapon[]": tag_weapon
    }

    for attempt in range(retries):
        try:
            headers = {"User-Agent": random.choice(USER_AGENTS)}
            response = requests.get(url, headers=headers, params=params, timeout=15)
            response.raise_for_status()
            data = response.json()
            time.sleep(random.uniform(2, 5))  # espera entre requisições normais
            return data
        except requests.exceptions.HTTPError as e:
            if response.status_code == 429:
                wait = min(60, (2 ** attempt) + random.uniform(1, 5))
                # vpn.run_ws_command(["status"])
                # vpn.connect_to_random_location()
                # vpn.run_ws_command(["status"])
                print(f"{YELLOW}[WARN]{RESET} 429 Too Many Requests. Esperando {wait:.1f}s...")
                ##vpn.connect_to_random_location()
                time.sleep(wait)
            else:
                print(f"{RED}[ERRO]{RESET} HTTP {response.status_code}: {e}")
        except Exception as e:
            print(f"{YELLOW}[WARN]{RESET} Falha em start={start}: {e}, tentando novamente...")
            time.sleep(random.uniform(1, 5))

    print(f"{RED}[ERRO]{RESET} Não conseguiu buscar start={start} após {retries} tentativas")
    return {"results": [], "total_count": 0}


