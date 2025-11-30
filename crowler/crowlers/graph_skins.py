import requests
import re
import json
import random
import time
from datetime import datetime, timedelta
from . import user_agents as ua

session = requests.Session()

REQUEST_MIN_DELAY = 0.8
REQUEST_MAX_DELAY = 2.2

BATCH_DELAY = (4, 9)
SAFE_MODE_DELAY = (15, 30)

MAX_RETRIES = 10

CACHE_EXPIRATION_MINUTES = 30  # 0 = sem cache
_page_cache = {}  # interno


def get_from_cache(url):
    if CACHE_EXPIRATION_MINUTES == 0:
        return None

    if url in _page_cache:
        data, timestamp = _page_cache[url]
        if datetime.now() - timestamp < timedelta(minutes=CACHE_EXPIRATION_MINUTES):
            print("[CACHE] Usando HTML do cache.")
            return data

    return None

def save_to_cache(url, data):
    if CACHE_EXPIRATION_MINUTES > 0:
        _page_cache[url] = (data, datetime.now())


def extrair_precos(url):

    cached = get_from_cache(url)
    if cached:
        html = cached
    else:
        html = baixar_html_com_resiliencia(url)
        save_to_cache(url, html)

    print("[INFO] Extraindo bloco line1...")

    match = re.search(r'var\s+line1\s*=\s*(\[[^\;]+])', html)
    if not match:
        raise ValueError("Não encontrei a variável 'line1' no HTML.")

    data_str = match.group(1).replace("'", '"')

    try:
        data = json.loads(data_str)
    except Exception as e:
        raise ValueError(f"Erro ao converter dados para JSON: {e}")

    print(f"[OK] Capturados {len(data)} registros de preço.")
    return data


def baixar_html_com_resiliencia(url):

    print(f"[INFO] Baixando HTML de: {url}")

    safe_mode = False

    for attempt in range(MAX_RETRIES):

        headers = {
            "User-Agent": random.choice(ua.USER_AGENTS),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
            "Referer": "https://steamcommunity.com/market/",
            "DNT": "1",
            "Upgrade-Insecure-Requests": "1"
        }

        try:
            r = session.get(url, headers=headers, timeout=15)

            if r.status_code == 429:
                wait = exponential_wait(attempt, safe_mode)
                print(f"[WARN] 429 Too Many Requests — aguardando {wait:.1f}s (safe_mode={safe_mode})...")
                time.sleep(wait)

                if attempt >= 3:
                    safe_mode = True
                continue

            r.raise_for_status()
            html = r.text

            time.sleep(random.uniform(REQUEST_MIN_DELAY, REQUEST_MAX_DELAY))

            return html

        except Exception as e:
            wait = random.uniform(3, 6)
            print(f"[WARN] Falha: {e} — aguardando {wait:.1f}s...")
            time.sleep(wait)

    raise Exception("[FATAL] Falhou após todas as tentativas.")


def exponential_wait(attempt, safe_mode):
    if safe_mode:
        return random.uniform(*SAFE_MODE_DELAY)
    return min(90, (2 ** attempt) + random.uniform(1, 4))


def processar_dados(name, data):

    resultados = []

    for item in data:
        resultados.append({
            "name": name,
            "date": item[0],
            "sell_price": float(item[1]),
            "sell_listings": int(item[2]) if len(item) > 2 else None
        })

    return resultados


def graph_skins(hash_name, name, index=None, total=None):

    if index is not None and total is not None:
        print(f"[INFO] [{index}/{total}] Baixando: {name}")

    url = f"https://steamcommunity.com/market/listings/730/{hash_name}"

    try:
        dados = extrair_precos(url)
        return processar_dados(name, dados)

    except Exception as e:
        print(f"[ERRO] Falha em {name}: {e}")
        return []


def batch_delay():
    d = random.uniform(*BATCH_DELAY)
    print(f"[INFO] Aguardando {d:.1f}s para resfriar (lote concluído)...")
    time.sleep(d)
