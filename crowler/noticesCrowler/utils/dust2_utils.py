import requests
import random
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from noticesCrowler.classifier import classifier as c

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

    return data
    
        
def fetch_DUST2_news(link, retries=5, timeout=15):

    for tent in range(retries):
        try:
            headers = {"User-Agent": random.choice(USER_AGENTS)}
            response = requests.get(link, headers=headers, timeout=timeout)
            response.raise_for_status()
            html = response.text
            break
        except Exception as e:
            if tent == retries - 1:
                raise e

    soup = BeautifulSoup(html, "html.parser")

    title_el = soup.find("h1")
    title = title_el.get_text(strip=True) if title_el else ""

    date_el = soup.find("span", class_="text-sm text-zinc-400")
    date = date_el.get_text(strip=True) if date_el else ""

    desc_el = soup.find("meta", attrs={"name": "description"})
    description = desc_el["content"] if desc_el else ""

    author_meta = soup.find("meta", {"property": "og:article:author"})
    author = author_meta["content"].strip() if author_meta else ""

    content_el = soup.find("div", class_="prose")
    if content_el:
        paragraphs = [p.get_text(strip=True) for p in content_el.find_all("p")]
        content = "\n".join(paragraphs)
    else:
        content = ""

    title_safe = str(title)
    content_safe = str(content)

    temas = c.classify_text(title_safe, content_safe)

    return {
        "theme": temas,
        "titulo": title,
        "link": link,
        "autor": author,
        "date": date,
        "respostas": content,
        "descricao": description,
        "fonte": "DUST2"
    }

