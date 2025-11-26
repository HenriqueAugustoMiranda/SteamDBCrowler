import requests
import time
import random
##from . import proxies as p

RED = "\033[31m"
GREEN = "\033[32m"
YELLOW = "\033[33m"
BLUE = "\033[34m"
RESET = "\033[0m"


#proxies_list = p.get_working_proxies(limit=20)
current_proxy = 0


#def get_proxy():
    #global current_proxy
    #p = proxies_list[current_proxy]
    #current_proxy = (current_proxy + 1) % len(proxies_list)
    #return p


def fetch_skins(start=0, count=10, tag_weapon="tag_weapon_ak47", retries=100):
    
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
            response = requests.get(url, params=params, timeout=15)#,  proxies=get_proxy())
            response.raise_for_status()
            data = response.json()
            return data
        except requests.exceptions.HTTPError as e:
            if response.status_code == 429:
                wait = (random.uniform(3, 6)) + 30 + attempt #* 10
                #current_proxy+=1
                print(f"{YELLOW}[WARN]{RESET} 429 Too Many Requests. Tentando de novo em {wait}s...")
                time.sleep(wait)
            else:
                print(f"{RED}[ERRO]{RESET} HTTP Error {response.status_code}: {e}")
                return {"results": [], "total_count": 0}
        except Exception as e:
            print(f"{RED}[ERRO]{RESET} Falha ao buscar starting em {start}: {e}")
            return {"results": [], "total_count": 0}
        
    print(f"{RED}[ERRO]{RESET} Não conseguiu buscar starting em {start} depois de {retries} tentativas")
    return {"results": [], "total_count": 0}


def fetch_skin_by_name(skin_name, start=0, count=10, retries=100):
    url = "https://steamcommunity.com/market/search/render/"
    params = {
        "appid": 730,
        "norender": 1,
        "count": count,
        "start": start,
        "search_descriptions": 0,
        "sort_column": "popular",
        "sort_dir": "desc",
        "query": skin_name  # pesquisa pelo nome da skin
    }

    for attempt in range(retries):
        try:
            response = requests.get(url, params=params, timeout=15)
            response.raise_for_status()
            data = response.json()
            return data
        except requests.exceptions.HTTPError as e:
            if response.status_code == 429:
                wait = (random.uniform(3, 6)) + 60 + attempt * 10
                print(f"{YELLOW}[WARN]{RESET} 429 Too Many Requests. Tentando de novo em {wait}s...")
                time.sleep(wait)
            else:
                print(f"{RED}[ERRO]{RESET} HTTP Error {response.status_code}: {e}")
                return {"results": [], "total_count": 0}
        except Exception as e:
            print(f"{RED}[ERRO]{RESET} Falha ao buscar '{skin_name}' start={start}: {e}")
            return {"results": [], "total_count": 0}

    print(f"{RED}[ERRO]{RESET} Não conseguiu buscar '{skin_name}' depois de {retries} tentativas")
    return {"results": [], "total_count": 0}


def fetch_skin_by_name(skin_name, start=0, count=10, retries=100):
    url = "https://steamcommunity.com/market/search/render/"
    params = {
        "appid": 730,
        "norender": 1,
        "count": count,
        "start": start,
        "search_descriptions": 0,
        "sort_column": "popular",
        "sort_dir": "desc",
        "query": skin_name,  # pesquisa pelo nome da skin
        #"currency": 1
    }

    for attempt in range(retries):
        try:
            response = requests.get(url, params=params, timeout=15)
            response.raise_for_status()
            data = response.json()
            return data
        except requests.exceptions.HTTPError as e:
            if response.status_code == 429:
                wait = (random.uniform(3, 6)) + 60 + attempt * 10
                print(f"{YELLOW}[WARN]{RESET} 429 Too Many Requests. Tentando de novo em {wait}s...")
                time.sleep(wait)
            else:
                print(f"{RED}[ERRO]{RESET} HTTP Error {response.status_code}: {e}")
                return {"results": [], "total_count": 0}
        except Exception as e:
            print(f"{RED}[ERRO]{RESET} Falha ao buscar '{skin_name}' start={start}: {e}")
            return {"results": [], "total_count": 0}

    print(f"{RED}[ERRO]{RESET} Não conseguiu buscar '{skin_name}' depois de {retries} tentativas")
    return {"results": [], "total_count": 0}