# SteamDBCrowler

SteamDBCrowler é um projeto de coleta, organização e análise de dados relacionados a skins do Steam, integrando crawler, banco de dados relacional em PostgreSQL e visualização web.

O sistema cruza informações de mercado com conteúdo textual (notícias e discussões), permitindo análises históricas, temáticas e temporais.

Site: https://skinsviewer.onrender.com

---

## Objetivo do Projeto

Construir uma base de dados estruturada que permita:

- Analisar a variação de preços de skins ao longo do tempo
- Relacionar skins com notícias e discussões relevantes
- Identificar tendências por tema e por período
- Disponibilizar dados organizados para consumo por uma aplicação web

---

## Banco de Dados (PostgreSQL)

O banco foi modelado com foco em integridade referencial, histórico temporal e consultas analíticas.

### Principais Tabelas

- steam_skins — informações básicas das skins
- price_history — histórico de preços e volume
- news — notícias e discussões
- skins_themes / news_themes — relacionamento temático
- users / interest — usuários e interesses
- days_resumed — resumo diário com análise textual

### Scripts SQL

- schema.sql — criação completa das tabelas
- functions.sql — funções SQL e PL/pgSQL para consultas avançadas

---

## Funções SQL Implementadas

O projeto utiliza funções SQL para:

- Análise de preços
  - último preço registrado
  - maior e menor preço histórico
  - média em janela temporal (±5 dias)
- Relacionamento entre skins por tema
- Associação de skins com notícias e discussões
- Filtros temporais baseados em data
- Paginação de resultados e otimização com EXISTS
- Controle de acesso utilizando SECURITY DEFINER

As funções foram projetadas para uso direto pela aplicação e para consultas analíticas.

---

## Visualização Web

Os dados processados pelo banco são consumidos por uma aplicação web que permite:

- Visualizar skins e seus preços
- Explorar notícias e discussões relacionadas
- Navegar por temas

Site: https://skinsviewer.onrender.com

---

## Guia Rápido de Git (Contribuição)

### Configuração Inicial

```bash
git config --global user.name "Seu Nome"
git config --global user.email "seuemail@example.com"
