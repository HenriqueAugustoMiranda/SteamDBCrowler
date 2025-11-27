import asyncio
import requests
import time
from noticesCrowler.classifier import classifier as c


HEADERS = {"User-Agent": "Mozilla/5.0"}
SEM = asyncio.Semaphore(5)


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
