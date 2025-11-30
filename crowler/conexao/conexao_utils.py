import os
from supabase import create_client, Client
from dotenv import load_dotenv
from typing import List, Dict
from crowlers import graph_skins as gs
import time

RED = "\033[31m"
GREEN = "\033[32m"
YELLOW = "\033[33m"
BLUE = "\033[34m"
RESET = "\033[0m"

SAIDA = r"saida_utils.txt"

def write_out(msg: str):
    try:
        with open(SAIDA, "a", encoding="utf-8") as f:
            f.write(msg + "\n")
    except:
        pass

load_dotenv()


url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_KEY")


if not url or not key:
    raise ValueError("As variáveis de ambiente SUPABASE_URL e SUPABASE_KEY são necessárias.")

supabase: Client = create_client(url, key)


def reconnect_client():
    global supabase
    print(f"{YELLOW}[INFO]{RESET} Recriando cliente Supabase...")
    write_out("[INFO] Recriando cliente Supabase...")
    time.sleep(1)
    supabase = create_client(url, key)


def resilient_execute(query, max_wait=15):
    
    start = time.time()

    while True:
        try:
            res = query.execute()
            return getattr(res, "data", None)

        except Exception as e:
            msg = f"{RED}[ERRO]{RESET} Falha na execução: {e}"
            print(msg); write_out(msg)

            erro = str(e)

            if ("ConnectionTerminated" in erro
                or "Missing response" in erro
                or "'NoneType'" in erro
                or "timeout" in erro):

                waited = int(time.time() - start)

                if waited < max_wait:
                    info = f"[INFO] Aguardando reconexão ({waited}/{max_wait}s)..."
                    print(f"{YELLOW}{info}{RESET}")
                    write_out(info)
                    time.sleep(1)
                    continue
                else:
                    print(f"{BLUE}[INFO]{RESET} Tempo excedido. Recriando cliente...")
                    write_out("[INFO] Recriando cliente Supabase...")
                    reconnect_client()
                    start = time.time()
                    continue

            raise e


def remove_duplicates(mat):
    real_result = []

    for arr in mat:
        seen = set()
        result = []
        for item in arr:
            name = item.get("name")
            if name not in seen:
                seen.add(name)
                result.append(item)
        real_result.append(result)
    
    return real_result


def insert_skins(skins_data: List[Dict], table_name: str):
    
    total_skins = len(skins_data)
    successful_inserts = 0
    
    for i, skin_data in enumerate(skins_data, 1):
        try:
            response = resilient_execute(
                supabase.table(table_name).insert(skin_data)
            )

            if response:
                successful_inserts += 1
                msg = f"{GREEN}[OK]{RESET} Skin {i}/{total_skins} inserida: {skin_data.get('name', 'N/A')}"
                print(msg); write_out(msg)
            else:
                msg = f"{YELLOW}[WARN]{RESET} Skin {i}/{total_skins} inserida mas sem dados de retorno: {skin_data.get('name', 'N/A')}"
                print(msg); write_out(msg)
                
        except Exception as e:
            msg = f"{RED}[ERRO]{RESET} Erro na skin {i}/{total_skins} ({skin_data.get('name', 'N/A')}): {e}"
            print(msg); write_out(msg)
    
    return successful_inserts


def update_skins(skins_data: List[Dict], table_name: str):

    total_skins = len(skins_data)
    successful_updates = 0

    for i, skin_data in enumerate(skins_data, 1):
        try:
            skin_name = skin_data.get("name")
            if not skin_name:
                msg = f"{YELLOW}[WARN]{RESET} Skin {i}/{total_skins} sem nome, ignorada."
                print(msg); write_out(msg)
                continue

            update_fields = {k: v for k, v in skin_data.items() if k in ["sell_listings", "sell_price", "sele_price_text"]}

            exists_response = resilient_execute(
                supabase.table(table_name)
                .select("name")
                .eq("name", skin_name)
                .limit(1)
            )

            if exists_response:
                response = resilient_execute(
                    supabase.table(table_name)
                    .update(update_fields)
                    .eq("name", skin_name)
                )

                if response:
                    successful_updates += 1
                    msg = f"{GREEN}[OK]{RESET} Skin {i}/{total_skins} atualizada: {skin_name}"
                    print(msg); write_out(msg)
                else:
                    msg = f"{YELLOW}[WARN]{RESET} Skin {i}/{total_skins} não teve retorno: {skin_name}"
                    print(msg); write_out(msg)

            else:
                response = resilient_execute(
                    supabase.table(table_name).insert(skin_data)
                )

                if response:
                    successful_updates += 1
                    msg = f"{GREEN}[OK]{RESET} Skin {i}/{total_skins} criada: {skin_name}"
                    print(msg); write_out(msg)
                else:
                    msg = f"{YELLOW}[WARN]{RESET} Skin {i}/{total_skins} não foi criada: {skin_name}"
                    print(msg); write_out(msg)

        except Exception as e:
            msg = f"{RED}[ERRO]{RESET} Erro na skin {i}/{total_skins} ({skin_name}): {e}"
            print(msg); write_out(msg)

    return successful_updates


def adapt_for_history(all_skins):
    all_skins_adapted = []

    # Cria skins adaptadas com todos os campos
    for skin_line in all_skins:
        skins_adapted = []

        for item in skin_line:
            skin = {
                "name": item['name'],
                "sell_listings": item['sell_listings'],
                "sell_price": item['sell_price'],
                "sale_price_text": item.get('sale_price_text')  # mantemos no adaptado
            }
            skins_adapted.append(skin)

        all_skins_adapted.append(skins_adapted)

    # Remove os atributos de preço do all_skins original
    for skin_line in all_skins:
        for item in skin_line:
            for key in ['sell_price', 'sale_price_text', 'sell_listings']:
                item.pop(key, None)  # remove se existir, sem quebrar

    return all_skins_adapted, all_skins


def adapt_for_news(news):

    news = remover_duplicados_por_link(news)

    news_adapted = []
    themes_adapted = []

    for line in news:

        new = {
            "link" : line["link"],
            "titulo" : line["titulo"],
            "autor" : line["autor"],
            "date" : line["date"],
            "respostas" : line["respostas"],
            "descricao" : line["descricao"],
            "fonte" : line["fonte"]
        }

        news_adapted.append(new)

        for t in line["theme"]:

            theme = {
                "link" : line["link"],
                "theme" : t
            }

            themes_adapted.append(theme)

    return news_adapted, themes_adapted


def log_error(item, error):
    with open("error_tuples.txt", "a", encoding="utf-8") as f:
        f.write("====================================\n")
        f.write(f"Erro: {error}\n")
        f.write(f"Tupla: {item}\n")
        f.write("====================================\n\n")


def insert_news(news, themes):

    for new in news:
        try:
            existe = resilient_execute(
                supabase.table("news")
                .select("link")
                .eq("link", new["link"])
                .limit(1)
            )
        except Exception as e:
            log_error(new, f"Erro ao verificar existência: {e}")
            continue

        if existe:
            ...
        else:
            try:
                resilient_execute(
                    supabase.table("news").insert(new)
                )
                msg = f"[OK] News criada: {new['titulo']}"
                print(msg); write_out(msg)
            except Exception as e:
                log_error(new, f"Erro ao inserir: {e}")
                continue

    for theme in themes:
        try:
            existe = resilient_execute(
                supabase.table("news_themes")
                .select("link")
                .eq("link", theme["link"])
                .eq("theme", theme["theme"])
                .limit(1)
            )
        except Exception as e:
            log_error(theme, f"Erro ao verificar existência: {e}")
            continue

        if existe:
            ...
        else:
            try:
                resilient_execute(
                    supabase.table("news_themes").insert(theme)
                )
                msg = f"[OK] Tema inserido: {theme['theme']} para {theme['link']}"
                print(msg); write_out(msg)
            except Exception as e:
                log_error(theme, f"Erro ao inserir: {e}")
                continue


def remover_duplicados_por_link(resultados):
    vistos = set()
    filtrados = []

    for item in resultados:
        link = item["link"]
        if link not in vistos:
            vistos.add(link)
            filtrados.append(item)

    return filtrados


def inserir_precos():

    try:
        allskins = pegar_skins_sem_historico()

        print(f"[OK] Skins carregadas: {len(allskins)}")

    except Exception as e:
        print("[ERRO] Não consegui buscar steam_skins:", e)
        return

    for skin in allskins:

        print(f"Inserindo {skin["name"]}")

        try:

            dados = gs.graph_skins(skin["hash_name"], skin["name"])

        except Exception as e:
            
            print(f"[ERRO] Falha ao buscar gráfico de {skin['name']}: {e}")
            continue

        if not dados:
            print(f"[WARN] Nenhum dado para {skin['name']}")
            continue

        try:
            resilient_execute(
                supabase.table("price_history").insert(dados)
            )
            print(f"[OK] Inseridos {len(dados)} registros para {skin['name']}")
        except Exception as e:
            print(f"[ERRO] Falha ao inserir {skin['name']}: {e}")
            continue



def pegar_skins_sem_historico():
    response = (
        supabase
        .rpc("get_skins_without_history")
        .range(0, 11000)
        .execute()
    )
    return response.data

