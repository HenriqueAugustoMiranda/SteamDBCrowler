from . import skins_fetch as sk
import time
import random
from urllib.parse import quote, unquote

RED = "\033[31m"
GREEN = "\033[32m"
YELLOW = "\033[33m"
BLUE = "\033[34m"
RESET = "\033[0m"

def get_all_skins(tag_weapon=["tag_weapon_elite"], max_pages=50):
    
    all_skins = []
    count = 10
    start = 0
    page = 0
    total_count = float('inf')

    for weapon in tag_weapon:
        
        collum_skins = []

        while start < total_count and page < max_pages:

            data = sk.fetch_skins(start, count, weapon)
            results = data.get("results", [])
            total_count = data.get("total_count", 0)
            
            if not results:
                nome = (weapon.replace("tag_weapon_", ""))
                print(f"{BLUE}[INFO]{RESET} Nenhum resultado encontrado na página {page}, Skins: {RED}{nome}{RESET}, encerrando.")
                break

            for item in results:

                skin_data = {

                    #Informacoes de Identificacao
                    "name": item["name"],
                    "hash_name": quote(item["name"]),
                    
                    #Informacoes de Mercado
                    "sell_listings": item.get("sell_listings", 0),
                    "sell_price": item.get("sell_price_text", ""),
                    "sale_price_text": item.get("sale_price_text", ""),
                    
                    #Informacoes do Item
                    "type": item["asset_description"].get("type", ""),
                    "weapon_type": weapon.replace("tag_weapon_", ""),
                    
                    #Informacoes de Exibicao
                    "icon_url": item["asset_description"].get("icon_url", ""),
                    "name_color": item["asset_description"].get("name_color", "")
                    }
                                    
                collum_skins.append(skin_data)
            nome = (weapon.replace("tag_weapon_", ""))
            print(f"{GREEN}[OK]{RESET} Página {page} -> {len(results)} skins (Total: {len(skin_data)}/{total_count})  Skins: {RED}{nome}{RESET}")

            start += count
            page += 1

        all_skins.append(collum_skins)
        count = 10
        start = 0
        page = 0
        total_count = float('inf')

    return all_skins

def get_skin(skin_name):

    item = sk.fetch_skin_by_name(skin_name)  

    if not item:
        print(f"{YELLOW}[WARN]{RESET} Skin '{skin_name}' não encontrada.")
        return None

    skin_data = {
        # Informações de Identificação
        "name": unquote(skin_name),
        "hash_name": skin_name,

        # Informações de Mercado
        "sell_listings": item.get("sell_listings", 0),
        "sell_price": item.get("sell_price_text", ""),
        "sale_price_text": item.get("sale_price_text", ""),
    }

    print(f"{GREEN}[OK]{RESET} Skin '{skin_name}' carregada com sucesso.")
    for key, value in skin_data.items():
        print(f"  {key}: {value}")
        
    return skin_data

#x = str(input())
#get_skin(x)