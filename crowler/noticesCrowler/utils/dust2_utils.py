import aiohttp
import asyncio
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from datetime import datetime, timedelta
import random
import re
from noticesCrowler.classifier import classifier as c


BASE = "https://www.dust2.com.br"
ARQUIVO = f"{BASE}/arquivo"

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...",
    "Mozilla/5.0 (X11; Linux x86_64)..."
]


def normalizar_data_dust2(texto_data: str) -> str:
    if not texto_data:
        return ""

    t = texto_data.strip().lower()
    agora = datetime.now()

    m_dias = re.search(r"há\s+(\d+)\s+dias?", t)
    if m_dias:
        return (agora - timedelta(days=int(m_dias.group(1)))).strftime("%Y-%m-%d %H:%M:%S")

    m_horas = re.search(r"há\s+(\d+)\s+horas?", t)
    if m_horas:
        return (agora - timedelta(hours=int(m_horas.group(1)))).strftime("%Y-%m-%d %H:%M:%S")

    try:
        return datetime.strptime(t, "%d/%m/%Y").strftime("%Y-%m-%d %H:%M:%S")
    except:
        pass

    try:
        return datetime.strptime(t, "%d/%m/%Y às %H:%M").strftime("%Y-%m-%d %H:%M:%S")
    except:
        pass

    meses = {
        "jan": "jan", "fev": "feb", "mar": "mar", "abr": "apr",
        "mai": "may", "jun": "jun", "jul": "jul", "ago": "aug",
        "set": "sep", "out": "oct", "nov": "nov", "dez": "dec"
    }

    m = re.search(r"(\d{1,2})\s+([a-zç]{3})[a-z]*\s+(\d{4})", t)
    if m:
        dia, mes_pt, ano = m.groups()
        mes_en = meses.get(mes_pt[:3])
        if mes_en:
            try:
                return datetime.strptime(f"{dia} {mes_en} {ano}", "%d %b %Y").strftime("%Y-%m-%d %H:%M:%S")
            except:
                pass

    try:
        iso = t.replace("z", "").replace("t", " ")
        return datetime.fromisoformat(iso).strftime("%Y-%m-%d %H:%M:%S")
    except:
        pass

    return texto_data


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
    offset = 5310
    step = 30

    async with aiohttp.ClientSession() as session:
        while True:
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
    date = normalizar_data_dust2(date_raw)
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
