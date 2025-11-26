from flask import Flask, request, jsonify, render_template
import requests
from flask_cors import CORS
from urllib.parse import quote, unquote
import time
import random
import os

app = Flask(__name__, static_folder="static", template_folder="templates")
CORS(app)

# Rota principal para servir o index.html
@app.route("/")
def home():
    return render_template("index.html")

# Rota para atualizar skin via POST
@app.route("/update", methods=["POST"])
def update():
    data = request.get_json()
    skin_name = data.get("skin_name")

    if not skin_name:
        return jsonify({"status": "error", "msg": "skin_name não enviado"}), 400

    result = update_one_skin(skin_name)
    return jsonify({"status": "ok", "result": result})


# Funções do seu crowler
def fetch_skin_by_name(skin_name, start=0, count=10, retries=100):
    url = "https://steamcommunity.com/market/search/render/"
    params = {
        "appid": 730,
        "norender": 1,
        "count": count,
        "start": start,
        "search_descriptions": 0,
        "sort_column": "popular",
        "sort_dir": "desc",
        "query": skin_name
    }

    for attempt in range(retries):
        try:
            response = requests.get(url, params=params, timeout=15)
            response.raise_for_status()
            data = response.json()
            return data
        except requests.exceptions.HTTPError as e:
            if response.status_code == 429:
                wait = (random.uniform(3, 6)) + 60 + attempt * 10
                print(f"[WARN] 429 Too Many Requests. Tentando de novo em {wait}s...")
                time.sleep(wait)
            else:
                print(f"[ERRO] HTTP Error {response.status_code}: {e}")
                return {"results": [], "total_count": 0}
        except Exception as e:
            print(f"[ERRO] Falha ao buscar '{skin_name}' start={start}: {e}")
            return {"results": [], "total_count": 0}

    print(f"[ERRO] Não conseguiu buscar '{skin_name}' depois de {retries} tentativas")
    return {"results": [], "total_count": 0}


def get_skin(skin_name):
    item = fetch_skin_by_name(skin_name)

    if not item:
        print(f"[WARN] Skin '{skin_name}' não encontrada.")
        return None

    skin_data = {
        "name": unquote(skin_name),
        "hash_name": skin_name,
        "sell_listings": item.get("sell_listings", 0),
        "sell_price": item.get("sell_price_text", ""),
        "sale_price_text": item.get("sale_price_text", ""),
    }

    print(f"[OK] Skin '{skin_name}' carregada com sucesso.")
    for key, value in skin_data.items():
        print(f"  {key}: {value}")
        
    return skin_data


def update_one_skin(skin_name):
    try:
        msg = f"[...] Coletando skin: {skin_name} da Steam..."
        print(msg)

        skin = get_skin(skin_name)
        return skin  # retornando para o frontend
    except Exception as e:
        msg = f"[ERRO] Erro durante a execução: {e}"
        print(msg)
        return None


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
