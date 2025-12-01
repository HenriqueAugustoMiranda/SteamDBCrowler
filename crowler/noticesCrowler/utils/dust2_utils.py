import aiohttp
import asyncio
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from datetime import datetime, timedelta
import random
import re
from datetime import datetime
from noticesCrowler.classifier import classifier as c

meses = {
    "janeiro": 1, "fevereiro": 2, "março": 3, "abril": 4,
    "maio": 5, "junho": 6, "julho": 7, "agosto": 8,
    "setembro": 9, "outubro": 10, "novembro": 11, "dezembro": 12
}

BASE = "https://www.dust2.com.br"
ARQUIVO = f"{BASE}/arquivo"

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...",
    "Mozilla/5.0 (X11; Linux x86_64)..."
]


def correct_date(data_str):

    partes = data_str.split()

    dia = int(partes[0])
    mes = meses[partes[2]]
    ano = int(partes[4])
    hora, minuto = partes[6].split(":")

    return f"{ano}-{mes:02d}-{dia:02d} {hora}:{minuto}:00"


async def fetch(session, url):
    headers = {"User-Agent": random.choice(USER_AGENTS)}
    try:
        print(f"[FETCH] Baixando: {url}")
        async with session.get(url, headers=headers) as resp:
            if resp.status != 200:
                print(f"[FETCH][ERRO] Status {resp.status} em {url}")
                return None
            text = await resp.text()
            print(f"[FETCH][OK] {url}")
            return text
    except Exception as e:
        print(f"[FETCH][EXCEPTION] {url} -> {e}")
        return None


async def get_links():
    all_links = []
    offset = 0
    limit = 120
    step = 30

    async with aiohttp.ClientSession() as session:

        while offset <= limit:
            url = f"{ARQUIVO}?offset={offset}"
            print(f"\n[LINKS] Coletando offset {offset}")

            html = await fetch(session, url)
            if not html:
                print("[LINKS] HTML vazio, parando.")
                break

            soup = BeautifulSoup(html, "html.parser")
            links_found = 0

            for a in soup.find_all("a", href=True):
                full = urljoin(BASE, a["href"])
                if full.startswith(f"{BASE}/noticias"):
                    if full not in all_links:
                        all_links.append(full)
                        links_found += 1

            print(f"[LINKS] Encontrados neste offset: {links_found}")

            if links_found == 0:
                print("[LINKS] Nenhum link novo, fim.")
                break

            offset += step

    print(f"\n[LINKS] TOTAL = {len(all_links)}")
    return all_links



async def fetch_news(session, link):
    print(f"\n[NEWS] Baixando notícia: {link}")
    html = await fetch(session, link)

    if not html:
        print(f"[NEWS][ERRO] Falhou: {link}")
        return None

    soup = BeautifulSoup(html, "html.parser")

    # Título
    title_el = soup.find("h1", class_="headline") or soup.find("h1")
    title = title_el.get_text(strip=True) if title_el else ""
    print(f"[NEWS][TITLE] {title}")

    # Data
    date_block = soup.find("div", class_="article-info-published-time")
    span = date_block.find("span") if date_block else None
    date_raw = span.get_text(" ", strip=True) if span else ""
    date = correct_date(date_raw)
    print(f"[NEWS][DATE] {date}")

    # Descrição
    meta_desc = soup.find("meta", {"name": "description"})
    description = meta_desc["content"].strip() if meta_desc else ""
    print(f"[NEWS][DESC] {description[:50]}...")

    # Autor
    author_block = soup.find("div", class_="article-info-author")
    author = ""
    if author_block:
        author = author_block.get_text(" ", strip=True).replace("Escrito por", "").strip()
    print(f"[NEWS][AUTHOR] {author}")

    # Conteúdo
    content_block = (
        soup.select_one("div.news-item-content-container[itemprop='articleBody']")
        or soup.find("div", class_="article-body")
    )

    content = ""
    if content_block:
        paragraphs = content_block.find_all("p")
        content = "\n".join([p.get_text(strip=True) for p in paragraphs])
        print(f"[NEWS][CONTENT] {len(paragraphs)} parágrafos")
    else:
        print("[NEWS][CONTENT] NENHUM parágrafo encontrado")

    # Classificação
    temas = c.classify_text(title, content)
    print(f"[NEWS][THEMES] {temas}")

    print(f"[NEWS][OK] Finalizada: {link}")

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


async def get_all_news(concurrency=200):
    links = await get_links()
    print(f"\n[MAIN] TOTAL DE LINKS = {len(links)}\n")

    sem = asyncio.Semaphore(concurrency)

    async with aiohttp.ClientSession() as session:

        async def safe_fetch(link):
            async with sem:
                print(f"[QUEUE] Iniciando tarefa para: {link}")
                result = await fetch_news(session, link)
                print(f"[QUEUE] Finalizada tarefa: {link}")
                return result

        tasks = [asyncio.create_task(safe_fetch(l)) for l in links]
        results = await asyncio.gather(*tasks)

    filtered = [r for r in results if r]
    print(f"\n[MAIN] TOTAL PROCESSADAS = {len(filtered)}")
    return filtered


async def get_DUST2_news():
    return await get_all_news()