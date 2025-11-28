import requests
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

# Normaliza qualquer formato de data para YYYY-MM-DD HH:MM:SS
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

    return texto_data  # fallback

# Coleta todos os links de notícias
def get_DUST2_links():

    all_links = []
    offset = 0
    step = 30

    while True:
        print(f"Buscando offset {offset}...")
        resp = requests.get(f"{arquivo_url}?offset={offset}")
        if resp.status_code != 200:
            break

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

# Baixa e processa todas as notícias
def get_DUST2_news(retries=5, timeout=15):

    links = get_DUST2_links()
    return [fetch_DUST2_news(link, retries, timeout) for link in links]

# Baixa e extrai campos de uma notícia
def fetch_DUST2_news(link, retries=5, timeout=15):

    print("\n" + "="*70)
    print(f"Baixando: {link}")
    print("="*70)

    html_text = None

    # Tentativas com retry
    for tent in range(1, retries + 1):
        try:
            headers = {"User-Agent": random.choice(USER_AGENTS)}
            print(f"GET tentativa {tent}/{retries}")
            resp = requests.get(link, headers=headers, timeout=timeout)
            resp.raise_for_status()
            html_text = resp.text
            print("OK.")
            break
        except Exception as e:
            print(f"Erro: {e}")
            if tent == retries:
                raise
            print("Retry...")

    soup = BeautifulSoup(html_text, "html.parser")

    # Título
    title_sel = soup.find("h1", class_="headline") or soup.find("h1")
    title = title_sel.get_text(strip=True) if title_sel else ""
    print(f"[TITLE] {title}")

    # Data
    date_raw = ""
    date_block = soup.find("div", class_="article-info-published-time")
    if date_block:
        span = date_block.find("span")
        date_raw = span.get_text(" ", strip=True) if span else date_block.get_text(" ", strip=True)
    else:
        meta_time = soup.find("meta", {"property": "og:article:published_time"}) or soup.find("time")
        if meta_time and meta_time.get("content"):
            date_raw = meta_time["content"].strip()

    date = normalizar_data_dust2(date_raw) if date_raw else ""
    print(f"[DATE] {date}")

    # Descrição
    desc_meta = soup.find("meta", attrs={"name": "description"})
    description = desc_meta["content"].strip() if desc_meta and desc_meta.get("content") else ""
    print(f"[DESC] {description}")

    # Autor
    author_block = soup.find("div", class_="article-info-author")
    if author_block:
        author = author_block.get_text(" ", strip=True).replace("Escrito por", "").strip()
    else:
        meta = soup.find("meta", {"property": "og:article:author"})
        author = meta["content"].strip() if meta else ""
    print(f"[AUTHOR] {author}")

    # Conteúdo
    print("[CONTENT] extraindo...")
    content = ""
    content_container = (
        soup.select_one("div.news-item-content-container[itemprop='articleBody']")
        or soup.select_one("div.news-item-content-container")
        or soup.find("div", class_="article-body")
        or soup.find("div", class_="prose")
    )

    if content_container:
        ps = content_container.find_all("p")
        content = "\n".join([p.get_text(strip=True) for p in ps])
        print(f"[CONTENT] {len(ps)} parágrafos.")
    else:
        print("[CONTENT] não encontrado.")

    # Classificação
    temas = c.classify_text(title, content)
    print(f"[THEMES] {temas}")

    # Resultado final
    resultado = {
        "theme": temas,
        "titulo": title,
        "link": link,
        "autor": author,
        "date": date,
        "respostas": content,
        "descricao": description,
        "fonte": "DUST2"
    }

    print("[OK] notícia pronta.")
    print("="*70)
    return resultado