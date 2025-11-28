import aiohttp
import asyncio
from noticesCrowler.utils import dust2_utils as d2
from noticesCrowler.utils import redit_utils as rdt
from noticesCrowler.utils import steam_utils as stm


REDDIT_SUBREDDITS = ["CS2AboutSkins", "cs2", "Jarnefeld"]
MAX_PAGES_STEAM = 100
REDDIT_LIMIT = 25


async def main(type):

    if(type == 0):
        # --- Steam ---
        print(f"Baixando posts da Steam...")
        timeout = aiohttp.ClientTimeout(total=30)  # evita expirar rápido
        async with aiohttp.ClientSession(timeout=timeout) as session:
            tasks = [stm.fetch_steam_page(session, page) for page in range(1, MAX_PAGES_STEAM + 1)]
            pages = await asyncio.gather(*tasks)

        all_posts = []
        for result in pages:
            if result:
                page_num, html_text = result
                discussions = stm.process_steam_page(page_num, html_text)
                all_posts.extend(discussions)

        # --- Reddit (vários subreddits) ---
        for subreddit in REDDIT_SUBREDDITS:
            print(f"Baixando posts do r/{subreddit}...")
            reddit_posts = rdt.fetch_reddit_posts(subreddit, REDDIT_LIMIT)
            all_posts.extend(reddit_posts)

        print(f"Baixando posts da DUST2...")
        d2_news = d2.get_DUST2_news()
        all_posts.extend(d2_news)

    if type == 1:
        
        print(f"Baixando posts da Steam...")
        timeout = aiohttp.ClientTimeout(total=30)  # evita expirar rápido
        async with aiohttp.ClientSession(timeout=timeout) as session:
            tasks = [stm.fetch_steam_page(session, page) for page in range(1, MAX_PAGES_STEAM + 1)]
            pages = await asyncio.gather(*tasks)

        all_posts = []
        for result in pages:
            if result:
                page_num, html_text = result
                discussions = stm.process_steam_page(page_num, html_text)
                all_posts.extend(discussions)

    if type == 2:
         
         all_posts = []

         for subreddit in REDDIT_SUBREDDITS:
            print(f"Baixando posts do r/{subreddit}...")
            reddit_posts = rdt.fetch_reddit_posts(subreddit, REDDIT_LIMIT)
            all_posts.extend(reddit_posts)

    if type == 3:

        all_posts = []

        print(f"Baixando posts da DUST2...")
        d2_news = d2.get_DUST2_news()
        all_posts.extend(d2_news)


    return all_posts