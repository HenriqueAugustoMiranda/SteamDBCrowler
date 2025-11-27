import requests
import random
from bs4 import BeautifulSoup
from urllib.parse import urljoin

base_url = "https://www.dust2.com.br"
arquivo_url = f"{base_url}/arquivo"

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...",
    "Mozilla/5.0 (X11; Linux x86_64)..."
]


def get_DUST2_links():

    all_links = []
    offset = 0
    step = 30

    while True:
        print(f"Buscando notícias com offset {offset}...")
        resp = requests.get(f"{arquivo_url}?offset={offset}")
        if resp.status_code != 200:
            break  # acabou a página

        soup = BeautifulSoup(resp.text, "html.parser")
        links_found = 0
        for a in soup.find_all("a", href=True):
            full_url = urljoin(base_url, a["href"])
            if full_url.startswith(f"{base_url}/noticias") and full_url not in all_links:
                all_links.append(full_url)
                links_found += 1

        if links_found == 0:
            break

        offset += step

    return all_links

def get_DUST2_news(retries=5, timeout=15):
    
    links = get_DUST2_links()
    data = []

    for link in links:
        data.append(fetch_DUST2_news(link=link, retries=retries, timeout=timeout))

    
        
        


                
def fetch_DUST2_news(link, retries=5, timeout=15):

    for tent in range(retries):
            
            try:
                headers = {"User-Agent": random.choice(USER_AGENTS)}
                response = requests.get(link, headers=headers, timeout=timeout)
                response.raise_for_status()

            except Exception as e:
