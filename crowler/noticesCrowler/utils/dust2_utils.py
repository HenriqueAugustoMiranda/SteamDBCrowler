import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

base_url = "https://www.dust2.com.br"
arquivo_url = f"{base_url}/arquivo"

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

