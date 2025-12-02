import asyncio
from bs4 import BeautifulSoup
import html
from datetime import datetime, timedelta
from noticesCrowler.classifier import classifier as c


STEAM_BASE_URL = "https://steamcommunity.com/app/730/discussions/?fp="
HEADERS = {"User-Agent": "Mozilla/5.0"}
SEM = asyncio.Semaphore(5)



def parse_steam_date(raw_date: str):
    
    raw = raw_date.strip().lower()

    now = datetime.now()

    if "minutes ago" in raw:
        mins = int(raw.split(" minutes")[0])
        return (now - timedelta(minutes=mins)).strftime("%Y-%m-%d %H:%M:%S")

    if "minute ago" in raw:
        mins = int(raw.split(" minute")[0])
        return (now - timedelta(minutes=mins)).strftime("%Y-%m-%d %H:%M:%S")

    if "hours ago" in raw:
        hrs = int(raw.split(" hours")[0])
        return (now - timedelta(hours=hrs)).strftime("%Y-%m-%d %H:%M:%S")

    if "hour ago" in raw:
        hrs = int(raw.split(" hour")[0])
        return (now - timedelta(hours=hrs)).strftime("%Y-%m-%d %H:%M:%S")

    if "yesterday" in raw:
        time_part = raw.split("@")[1].strip()
        date = (now - timedelta(days=1)).strftime("%Y-%m-%d")
        dt = datetime.strptime(date + " " + time_part, "%Y-%m-%d %I:%M%p")
        return dt.strftime("%Y-%m-%d %H:%M:%S")

    try:
        cleaned = raw.replace(",", "")
        parts = cleaned.split("@")
        date_part = parts[0].strip().title()
        time_part = parts[1].strip()

        if len(date_part.split()) == 2:
            date_part += " " + str(now.year)

        dt = datetime.strptime(date_part + " " + time_part, "%d %b %Y %I:%M%p")
        return dt.strftime("%Y-%m-%d %H:%M:%S")
    except:
        return None



async def fetch_steam_page(session, page, retries=5):
    url = STEAM_BASE_URL + str(page)

    for tent in range(1, retries + 1):
        try:
            async with SEM:
                async with session.get(url, headers=HEADERS, timeout=20) as response:
                    if response.status != 200:
                        print(f"Erro Steam {page}: {response.status}")
                        return None
                    text = await response.text()
                    return page, text

        except Exception as e:
            print(f"[Tentativa {tent}/5] Erro ao acessar Steam {page}: {e}")

            if any(msg in str(e) for msg in [
                "TimeoutError",
                "semáforo expirou",
                "ConnectionResetError",
                "Cannot connect"
            ]):
                await asyncio.sleep(2)
                continue

            return None

    print(f"[FALHA PERMANENTE] Steam página {page}")
    return None



def process_steam_page(page, html_text):
    soup = BeautifulSoup(html_text, "html.parser")
    discussions = soup.select(".forum_topic")
    if not discussions:
        return []

    resultados = []

    for d in discussions:
        titulo = d.select_one(".forum_topic_name").get_text(strip=True) if d.select_one(".forum_topic_name") else "Sem título"
        link = d.select_one("a.forum_topic_overlay")["href"] if d.select_one("a.forum_topic_overlay") else "Sem link"

        raw_date = d.select_one(".forum_topic_lastpost")
        data_formatada = parse_steam_date(raw_date.get_text(strip=True)) if raw_date else None

        tooltip_raw = d.get("data-tooltip-forum", "")
        descricao = "Sem descrição"
        if tooltip_raw:
            tooltip_html = html.unescape(tooltip_raw)
            tooltip_soup = BeautifulSoup(tooltip_html, "html.parser")
            hover_text = tooltip_soup.select_one(".topic_hover_text")
            if hover_text:
                descricao = hover_text.get_text("\n", strip=True)

        author = d.select_one(".forum_topic_op").get_text(strip=True) if d.select_one(".forum_topic_op") else "Desconhecido"
        replies = d.select_one(".forum_topic_reply_count").get_text(strip=True) if d.select_one(".forum_topic_reply_count") else "0"

        temas = c.classify_text(titulo, descricao)

        resultados.append({
            "theme": temas,
            "titulo": titulo,
            "link": link,
            "autor": author,
            "date": data_formatada,
            "respostas": replies,
            "descricao": descricao,
            "fonte": "Steam"
        })

    return resultados
