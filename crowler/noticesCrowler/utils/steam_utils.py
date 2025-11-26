import asyncio
from bs4 import BeautifulSoup
import html
from noticesCrowler.classifier import classifier as c


STEAM_BASE_URL = "https://steamcommunity.com/app/730/discussions/?fp="
HEADERS = {"User-Agent": "Mozilla/5.0"}
SEM = asyncio.Semaphore(5)


async def fetch_steam_page(session, page, retries=5):
    url = STEAM_BASE_URL + str(page)

    for tent in range(1, retries + 1):
        try:
            async with SEM:  # limita requisições simultâneas
                async with session.get(url, headers=HEADERS, timeout=20) as response:
                    if response.status != 200:
                        print(f"Erro Steam {page}: {response.status}")
                        return None
                    text = await response.text()
                    return page, text

        except Exception as e:
            print(f"[Tentativa {tent}/5] Erro ao acessar Steam {page}: {e}")

            # Erros típicos que DEVEM ter retry
            if any(msg in str(e) for msg in [
                "TimeoutError",
                "semáforo expirou",
                "ConnectionResetError",
                "Cannot connect"
            ]):
                await asyncio.sleep(2)  # espera antes de tentar de novo
                continue

            # erro inesperado → não parar o programa
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
            "respostas": replies,
            "descricao": descricao,
            "fonte": "Steam"
        })
    return resultados