import requests
import concurrent.futures

PROXY_SOURCE = "https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/http.txt"
TEST_URL = "https://httpbin.org/ip"
TIMEOUT = 5


def download_proxy_list():
    """Baixa lista de proxies públicos HTTP."""
    try:
        resp = requests.get(PROXY_SOURCE, timeout=10)
        if resp.status_code == 200:
            return [line.strip() for line in resp.text.splitlines() if ":" in line]
    except:
        pass

    return []


def get_country_from_ip(ip):
    """Retorna país aproximado via IP-API."""
    try:
        r = requests.get(f"http://ip-api.com/json/{ip}", timeout=5)
        data = r.json()
        if data["status"] == "success":
            return data["countryCode"]
    except:
        pass
    return "UN"  # país desconhecido


def test_proxy(proxy):
    """Testa se o proxy está funcionando."""
    proxy_dict = {
        "http": f"http://{proxy}",
        "https": f"http://{proxy}"
    }

    try:
        r = requests.get(TEST_URL, proxies=proxy_dict, timeout=TIMEOUT)
        if r.status_code == 200:
            ip = proxy.split(":")[0]
            country = get_country_from_ip(ip)

            return {
                "http": f"http://{proxy}",
                "https": f"http://{proxy}",
                "country": country
            }
    except:
        return None


def get_working_proxies(limit=20, threads=50):
    """Valida proxies e retorna no formato desejado."""
    print("🔍 Baixando lista de proxies...")
    proxies = download_proxy_list()

    print(f"📦 Total encontrado: {len(proxies)}")
    print("🧪 Testando proxies...")

    working = []

    with concurrent.futures.ThreadPoolExecutor(max_workers=threads) as executor:
        futures = {executor.submit(test_proxy, p): p for p in proxies}

        for future in concurrent.futures.as_completed(futures):
            result = future.result()

            if result:
                print(f"✅ Funcionando: {result['http']} — País: {result['country']}")
                working.append(result)

                if len(working) >= limit:
                    break

    return working


if __name__ == "__main__":
    valid = get_working_proxies(limit=15)

    print("\n======================")
    print("🔥 PROXIES VÁLIDOS 🔥")
    print("======================")
    for p in valid:
        print(p)
