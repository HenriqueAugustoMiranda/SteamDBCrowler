from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup

URL = "https://www.counter-strike.net/news/updates"

def fetch_updates():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(URL, wait_until="networkidle")

        html = page.content()

        soup = BeautifulSoup(html, "html.parser")

        # Aqui você extrai as notícias reais
        items = soup.select(".blogpost")  # classe usada nas notícias

        for item in items:
            title = item.select_one(".posttitle").get_text(strip=True)
            print("Título:", title)

        browser.close()

fetch_updates()
