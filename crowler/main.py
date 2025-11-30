#import threading
import conexao.conexao as connect


RED = "\033[31m"
RESET = "\033[0m"
passW = "011234"


if __name__ == "__main__":
    
    x = 3

    while x != 0:
        x = int(input("Digite 1 para Popular Banco, 2 para Atualizar e 0 para sair!\n"))

        if x == 1:
            print("BURRO! BURRO! BURRO!")
        elif x == 2:

            connect.update_DB(tag_weapon=[  "tag_weapon_elite",
                                            "tag_weapon_cz75a",
                                            "tag_weapon_deagle",
                                            "tag_weapon_fiveseven",
                                            "tag_weapon_glock",
                                            "tag_weapon_hkp2000",
                                            "tag_weapon_p250",
                                            "tag_weapon_revolver",
                                            "tag_weapon_tec9",
                                            "tag_weapon_usp_silencer",
                                            "tag_weapon_ak47",
                                            "tag_weapon_aug",
                                            "tag_weapon_famas",
                                            "tag_weapon_galilar",
                                            "tag_weapon_m4a1_silencer"
                                        ])
            
        elif x == 0:
            print("Saindo...")
        else:
            print("Opção inválida!")