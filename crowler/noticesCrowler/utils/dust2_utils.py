import aiohttp
import asyncio
import random
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from datetime import datetime, timedelta
import re

from noticesCrowler.classifier import classifier as c

base_url = "https://www.dust2.com.br"
arquivo_url = f"{base_url}/arquivo"

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...",
    "Mozilla/5.0 (X11; Linux x86_64)..."
]

# ---------- PARTE 1: PEGAR LINKS (mesmo código, só com session reutilizada) ----------

async def fetch(session, url):
    headers = {"User-Agent": random.choice(USER_AGENTS)}
    async with session.get(url, headers=headers) as resp:
        return await resp.text()

async def get_DUST2_links():
    offset = 5310
    step = 30
    links = []

    async with aiohttp.ClientSession() as session:
        while True:
            print(f"Buscando offset {offset}...")
            html = await fetch(session, f"{arquivo_url}?offset={offset}")
            soup = BeautifulSoup(html, "html.parser")

            links_found = 0
            for a in soup.find_all("a", href=True):
                full = urljoin(base_url, a["href"])
                if full.startswith(f"{base_url}/noticias"):
                    links.append(full)
                    links_found += 1

            if links_found == 0:
                break

            offset += step

    return list(set(links))


# ---------- PARTE 2: PROCESSAR AS NOTÍCIAS EM PARALELO ----------

SEM = asyncio.Semaphore(40)  # até 40 simultâneas (seguro)

async def fetch_news(session, link):

    async with SEM:  # limita concorrência pra não tomar block
        html = await fetch(session, link)

    soup = BeautifulSoup(html, "html.parser")

    title = soup.find("h1", class_="headline")
    title = title.get_text(strip=True) if title else ""

    date_block = soup.find("div", class_="article-info-published-time")
    date_raw = date_block.get_text(" ", strip=True) if date_block else ""
    # (chama sua função)
    # date = normalizar_data_dust2(date_raw)

    content_container = soup.find("div", class_="news-item-content-container")
    if content_container:
        ps = content_container.find_all("p")
        content = "\n".join(p.get_text(strip=True) for p in ps)
    else:
        content = ""

    temas = c.classify_text(title, content)

    return {
        "theme": temas,
        "titulo": title,
        "link": link,
        "respostas": content,
        "date": date_raw,
    }


async def main_fast():
    links = await get_DUST2_links()

    async with aiohttp.ClientSession() as session:
        tasks = [fetch_news(session, link) for link in links]
        results = await asyncio.gather(*tasks)

    return results


async def get_DUST2_news():
    return await main_fast()


