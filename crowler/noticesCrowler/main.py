import aiohttp
import asyncio
from bs4 import BeautifulSoup
import html
import requests
import time
from . import classifier as c


STEAM_BASE_URL = "https://steamcommunity.com/app/730/discussions/?fp="
CSUPDATES_URL = "https://www.counter-strike.net/news/updates"
REDDIT_SUBREDDITS = ["CS2AboutSkins", "cs2", "CS2Trading"]
#SAIDA = "noticias_unificadas.txt"
MAX_PAGES_STEAM = 100
REDDIT_LIMIT = 25
HEADERS = {"User-Agent": "Mozilla/5.0"}
SEM = asyncio.Semaphore(5)


# ------------------ Funções Steam ------------------
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

# ----------------------------------------------------

# ------------------ Funções Reddit ------------------
def fetch_reddit_posts(subreddit, limit=25):
    base_url = f"https://www.reddit.com/r/{subreddit}/.json"
    after = None
    resultados = []

    while True:
        params = {"limit": limit}
        if after:
            params["after"] = after

        response = requests.get(base_url, headers=HEADERS, params=params)
        if response.status_code != 200:
            print(f"Erro ao acessar Reddit r/{subreddit}: {response.status_code}")
            break

        data = response.json()
        posts = data["data"]["children"]
        if not posts:
            break

        for post in posts:
            p_data = post["data"]
            title = p_data.get("title", "Sem título")
            author = p_data.get("author", "Desconhecido")
            link = "https://reddit.com" + p_data.get("permalink", "")
            selftext = p_data.get("selftext", "")
            temas = c.classify_text(title, selftext)

            resultados.append({
                "theme": temas,
                "titulo": title,
                "link": link,
                "autor": author,
                "respostas": p_data.get("num_comments", 0),
                "descricao": selftext,
                "fonte": f"Reddit r/{subreddit}"
            })

        after = data["data"].get("after")
        if not after:
            break

        time.sleep(1)

    return resultados

# ------------------ Main unificada ------------------
async def main():
    # --- Steam ---
    timeout = aiohttp.ClientTimeout(total=30)  # evita expirar rápido
    async with aiohttp.ClientSession(timeout=timeout) as session:
        tasks = [fetch_steam_page(session, page) for page in range(1, MAX_PAGES_STEAM + 1)]
        pages = await asyncio.gather(*tasks)

    all_posts = []
    for result in pages:
        if result:
            page_num, html_text = result
            discussions = process_steam_page(page_num, html_text)
            all_posts.extend(discussions)

    # --- Reddit (vários subreddits) ---
    for subreddit in REDDIT_SUBREDDITS:
        print(f"Baixando posts do r/{subreddit}...")
        reddit_posts = fetch_reddit_posts(subreddit, REDDIT_LIMIT)
        all_posts.extend(reddit_posts)

    return all_posts
    # --- Salvar tudo em um único arquivo ---
    #with open(SAIDA, "w", encoding="utf-8") as out:
    #    out.write("LISTA UNIFICADA DE POSTS / DISCUSSÕES\n\n")
    #    for d in all_posts:
    #        out.write(f"Fonte: {d['fonte']}\n")
    #        out.write(f"Themes: {d['temas']}\n")
    #        out.write(f"Título: {d['titulo']}\n")
    #        out.write(f"Link: {d['link']}\n")
    #        out.write(f"Autor: {d['author']}\n")
    #        out.write(f"Respostas: {d['replies']}\n")
    #        out.write("Descrição:\n")
    #        out.write(d['descricao'] + "\n")
    #       out.write("-" * 80 + "\n\n")

    #print(f"\n✔ FINALIZADO e salvo em '{SAIDA}'")

# ------------------ Executar ------------------
#asyncio.run(main())
