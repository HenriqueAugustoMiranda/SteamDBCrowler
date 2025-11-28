from . import conexao_utils as cFunc
from crowlers import skins_scraper as sksc
from noticesCrowler import main as nC
import asyncio

RED = "\033[31m"
GREEN = "\033[32m"
YELLOW = "\033[33m"
BLUE = "\033[34m"
RESET = "\033[0m"

SAIDA = r"saida.txt"   # CAMINHO DA SAÍDA

def write_out(msg: str):
    try:
        with open(SAIDA, "a", encoding="utf-8") as f:
            f.write(msg + "\n")
    except:
        pass

def populate_DB():
    try:
        msg = f"{BLUE}[...]{RESET} Coletando skins da Steam..."
        print(msg); write_out(msg)

        all_skins = sksc.get_all_skins()
        all_skins = cFunc.remove_duplicates(all_skins)
        skins_adapted = cFunc.adapt_for_history(all_skins)

        if not all_skins:
            msg = f"{RED}[ERRO]{RESET} Nenhuma skin foi coletada"
            print(msg); write_out(msg)
            exit()
        
        msg = "Inserindo no Supabase..."
        print(msg); write_out(msg)

        msg = "table steam:"
        print(msg); write_out(msg)
        for skin_line in all_skins:
            inserted_count = cFunc.insert_skins(skin_line, "steam_skins")

        msg = f"\n{GREEN}Concluído!{RESET} {inserted_count}/{len(all_skins)} skins inseridas com sucesso!"
        print(msg); write_out(msg)

        msg = "table history:"
        print(msg); write_out(msg)

        for skin_adapted_line in skins_adapted:
            inserted_count = cFunc.insert_skins(skin_adapted_line, "price_history")

        msg = f"\n{GREEN}Concluído!{RESET} {inserted_count}/{len(skins_adapted)} skins inseridas com sucesso!"
        print(msg); write_out(msg)
        
        msg = f"\n{BLUE}[...]{RESET} Verificando dados inseridos..."
        print(msg); write_out(msg)

    except Exception as e:
        msg = f"{RED}[ERRO]{RESET} Erro durante a execução: {e}"
        print(msg); write_out(msg)


def update_DB(tag_weapon=[]):
    try:

        type = 3

        while type <= 3:

            news_data = asyncio.run(nC.main(type))
            news, themes = cFunc.adapt_for_news(news_data)
            cFunc.insert_news(news, themes)

            type+=1

        msg = f"{BLUE}[...]{RESET} Coletando skins da Steam..."
        print(msg); write_out(msg)

        tags = [1]

        for tag in tag_weapon:

            tags[0] = tag

            all_skins = cFunc.remove_duplicates(sksc.get_all_skins(tags))
            skins_adapted, all_skins = cFunc.adapt_for_history(all_skins)
            
            if not all_skins:
                msg = f"{BLUE}[ERRO]{RESET} Nenhuma skin foi coletada"
                print(msg); write_out(msg)
                exit()
            
            msg = "Atualizando no Supabase..."
            print(msg); write_out(msg)

            msg = "table steam:"
            print(msg); write_out(msg)
            for skin_line in all_skins:
                inserted_count = cFunc.update_skins(skin_line, "steam_skins")

            msg = f"\n{GREEN}Concluído!{RESET} {inserted_count}/{len(skins_adapted)} skins inseridas com sucesso!"
            print(msg); write_out(msg)

            msg = "table history:"
            print(msg); write_out(msg)
            for skin_adapted_line in skins_adapted:
                inserted_count = cFunc.insert_skins(skin_adapted_line, "price_history")

            msg = f"\n{GREEN}Concluído!{RESET} {inserted_count}/{len(skins_adapted)} skins atualizadas com sucesso!"
            print(msg); write_out(msg)
            
            msg = f"\n{BLUE}[...]{RESET} Verificando dados atualizados..."
            print(msg); write_out(msg)

    except Exception as e:
        msg = f"{RED}[ERRO]{RESET} Erro durante a execução: {e}"
        print(msg); write_out(msg)
