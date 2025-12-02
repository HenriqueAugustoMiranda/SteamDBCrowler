from supabase import create_client, Client
import re
import themes as t

SUPABASE_URL = "https://lpfawvedzxmjoaznbnkb.supabase.co/"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwZmF3dmVkenhtam9hem5ibmtiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjYwNDIxNywiZXhwIjoyMDcyMTgwMjE3fQ.GdhC4Q0g9IttUki13_aCd0assoMUi3Us8p7LJxQIMTk"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def normalize_weapon_type(weapon_type: str) -> str:
    if not weapon_type:
        return ""

    wp = weapon_type.lower().replace("_", " ")

    mapping = {
        "hkp2000": "p2000",
        "usp_silencer": "usp-s",
        "m4a1_silencer": "m4a1-s",
        "cz75a": "cz75 auto",
        "elite": "dual berettas",
        "knife_survival_bowie": "bowie knife",
        "knife_ursus": "ursus",
        "knife_m9_bayonet": "m9 bayonet",
        "knife_stiletto": "stiletto",
        "knife_falchion": "falchion",
        "knife_cord": "paracord",
        "knife_push": "push knife",
        "knife_tactical": "tactical",
        "knife_canis": "canis",
        "knife_widowmaker": "widowmaker",
        "knife_skeleton": "skeleton",
        "knife_butterfly": "butterfly",
        "knife_gypsy_jackknife": "gypsy jackknife",
        "knife_gut": "gut",
        "knife_outdoor": "outdoor",
        "tag_csgo_tool_sticker": "sticker",
        "tag_csgo_type_weaponcase": "case"
    }

    return mapping.get(weapon_type, wp)


def classify_skin(name: str, type_: str, weapon_type: str):
    wp_clean = normalize_weapon_type(weapon_type)
    text = f"{name} {type_} {wp_clean}".lower()

    matched = []

    for theme_name, keywords in t.themes.items():

        if not keywords or (len(keywords) == 1 and keywords[0] == ""):
            matched.append(theme_name)
            continue

        for kw in keywords:
            if kw and re.search(rf"\b{re.escape(kw)}\b", text):
                matched.append(theme_name)
                break

    return matched


def process_skins():

    print("Buscando skins usando função skinsemtema()...")

    # ⭐ Aqui fazemos try para capturar erro REAL
    try:
        resp = supabase.rpc("skinsemtema").execute()
    except Exception as e:
        print("[ERRO SUPABASE] Falha ao executar RPC skinsemtema():", e)
        return

    skins = resp.data  # sempre existe, mesmo se estiver vazio

    print(f"Encontradas {len(skins)} skins para processar")

    processed = 0
    errors = 0

    for skin in skins:
        try:
            name = skin["name"]
            type_ = skin["type"]
            weapon_type = skin.get("weapon_type", "")

            found_themes = classify_skin(name, type_, weapon_type)

            for theme in found_themes:
                supabase.table("skins_themes").upsert({
                    "name": name,
                    "theme": theme
                }).execute()

            processed += 1

            if processed % 100 == 0:
                print(f"Processadas {processed} skins...")

        except Exception as e:
            errors += 1
            print(f"[ERRO] Skin {skin.get('name','???')}: {str(e)}")

    print("\n Processamento concluído!")
    print(f"Total processado: {processed}")
    print(f"Erros: {errors}")


process_skins()
