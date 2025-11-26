# SteamDBCrowler
SteamDBCrowler

https://github.com/HenriqueAugustoMiranda/SteamDBCrowler/issues/3

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