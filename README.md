# SteamDBCrowler
SteamDBCrowler

Guia Rápido de Git e Controle de Branches

    Configuração Inicial

        Definir nome e e-mail: git config –global user.name “Seu Nome” git
        config –global user.email “seuemail@example.com”

        Criar e Clonar Repositórios

        git init git clone URL_DO_REPOSITORIO

    Branches

        Criar branch: git checkout -b nome_da_branch

        Trocar de branch: git checkout nome_da_branch

        Listar branches: git branch

        Apagar branch local: git branch -d nome_da_branch

        Apagar branch remota: git push origin –delete nome_da_branch

        Enviar Código

    Adicionar arquivos: git add . Commit: git commit -m “mensagem” Enviar:
    git push origin nome_da_branch Primeiro envio: git push -u origin
    nome_da_branch

    Pull Requests

        1.  Envie sua branch
        2.  Vá ao site e crie o Pull Request
        3.  Descreva e envie

    Atualizar Projeto

        git pull git checkout sua_branch git pull origin main git fetch git
        rebase origin/main

    Verificar Estado

        git status git diff

    Remotos

        git remote -v git remote add origin URL git remote set-url origin
        NOVA_URL

    Histórico

        git log git log –oneline git log –oneline –graph –decorate –all

    Outros

        git reset –soft HEAD~1 git reset –hard HEAD~1 git checkout – arquivo git
        stash git stash pop

    Tarefas:
        https://github.com/HenriqueAugustoMiranda/SteamDBCrowler/issues/3

    Link do site:
        https://skinsviewer.onrender.com


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
                                            "tag_weapon_m4a1_silencer",
                                            "tag_weapon_m4a1",
                                            "tag_weapon_sg556",
                                            "tag_weapon_sawedoff",
                                            "tag_weapon_mag7",
                                            "tag_weapon_nova",
                                            "tag_weapon_xm1014",
                                            "tag_weapon_knife_push",
                                            "tag_weapon_bayonet",
                                            "tag_weapon_knife_m9_bayonet",
                                            "tag_weapon_knife_flip",
                                            "tag_weapon_knife_butterfly",
                                            "tag_weapon_knife_falchion",
                                            "tag_weapon_knife_survival_bowie",
                                            "tag_weapon_knife_css",
                                            "tag_weapon_knife_cord",
                                            "tag_weapon_knife_canis",
                                            "tag_weapon_knife_tactical",
                                            "tag_weapon_knife_skeleton",
                                            "tag_weapon_knife_gut",
                                            "tag_weapon_knife_kukri",
                                            "tag_weapon_knife_gypsy_jackknife",
                                            "tag_weapon_knife_outdoor",
                                            "tag_weapon_knife_stiletto",
                                            "tag_weapon_knife_widowmaker",
                                            "tag_weapon_knife_ursus",
                                            "tag_weapon_knife_karambit",
                                            "tag_weapon_mac10",
                                            "tag_weapon_mp5sd",
                                            "tag_weapon_mp7",
                                            "tag_weapon_mp9",
                                            "tag_weapon_p90",
                                            "tag_weapon_bizon",
                                            "tag_weapon_ump45",
                                            "tag_weapon_awp",
                                            "tag_weapon_g3sg1",
                                            "tag_weapon_scar20",
                                            "tag_weapon_ssg08",
                                            "tag_weapon_m249",
                                            "tag_weapon_negev",
                                            "tag_CSGO_Type_WeaponCase",
                                            "tag_CSGO_Tool_Sticker",
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
                                            "tag_weapon_taser"
                                        ])