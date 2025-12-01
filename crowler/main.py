#import threading
import conexao.conexao as connect
import conexao.conexao_utils as cFunc


RED = "\033[31m"
RESET = "\033[0m"
passW = "011234"


if __name__ == "__main__":
    
    x = 3
    # cFunc.imprimir_skins_sem_historico()
    # cFunc.inserir_precos()

    while x != 0:
        x = int(input("Digite 2 para Atualizar e 0 para sair!\n"))

        if x == 2:

            connect.update_DB(tag_weapon=[  #"tag_CSGO_Type_WeaponCase",
                                            #"tag_CSGO_Tool_Sticker",
                                            "tag_Type_Hands",
                                            "tag_CSGO_Tool_Keychain",
                                            "tag_Type_CustomPlayer",
                                            "tag_CSGO_Type_Spray",
                                            "tag_CSGO_Type_MusicKit",
                                            "tag_CSGO_Tool_Patch",
                                            "tag_CSGO_Type_Collectible",
                                            "tag_CSGO_Type_Ticket",
                                            "tag_CSGO_Tool_WeaponCase_KeyTag",
                                            "tag_CSGO_Tool_GiftTag",
                                            "tag_CSGO_Tool_Name_TagTag",
                                            "tag_CSGO_Type_Tool",
                                            "tag_weapon_famas",
                                            "tag_weapon_galilar",
                                            "tag_weapon_sg556",
                                            "tag_weapon_sawedoff",
                                            "tag_weapon_mag7",
                                            "tag_weapon_nova",
                                            "tag_weapon_xm1014",
                                            "tag_weapon_mp5sd",
                                            "tag_weapon_mp7",
                                            "tag_weapon_bizon",
                                            "tag_weapon_ump45",
                                            "tag_weapon_g3sg1",
                                            "tag_weapon_scar20",
                                            "tag_weapon_m249",
                                            "tag_weapon_negev",                                           
                                            "tag_weapon_taser"
                                        ])
            
        elif x == 0:
            print("Saindo...")
        else:
            print("Opção inválida!")