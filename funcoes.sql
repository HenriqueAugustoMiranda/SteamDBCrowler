/*
=========================================================
 Projeto: Steam Skins & Market Analysis
 Banco: PostgreSQL
 Descrição:
   Conjunto de funções SQL para análise de skins,
   histórico de preços, notícias e discussões,
   com relacionamento temático e filtros temporais.
=========================================================
*/


/* =======================================================
   SKINS — CONSULTAS BÁSICAS
======================================================= */

-- Skins que não possuem histórico de preço
CREATE OR REPLACE FUNCTION get_skins_without_history()
RETURNS TABLE (hash_name text, name text)
LANGUAGE sql
AS $$
    SELECT s.hash_name, s.name
    FROM steam_skins s
    LEFT JOIN price_history p ON s.name = p.name
    WHERE p.name IS NULL;
$$;


-- Skins que possuem histórico de preço (com paginação)
CREATE OR REPLACE FUNCTION skins_com_preco(
    s_offset integer,
    s_limit  integer
)
RETURNS SETOF steam_skins
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
        SELECT s.*
        FROM steam_skins s
        WHERE EXISTS (
            SELECT 1
            FROM price_history p
            WHERE p.name = s.name
        )
        ORDER BY s.name
        OFFSET s_offset
        LIMIT s_limit;
END;
$$;


-- Skins sem tema associado
CREATE OR REPLACE FUNCTION skinsemtema()
RETURNS SETOF steam_skins
LANGUAGE sql
STABLE
AS $$
    SELECT s.*
    FROM steam_skins s
    WHERE NOT EXISTS (
        SELECT 1
        FROM skins_themes t
        WHERE t.name = s.name
    );
$$;


-- Relaciona skins que compartilham o mesmo tema
CREATE OR REPLACE FUNCTION relacionarskins(s_name varchar)
RETURNS SETOF steam_skins
LANGUAGE sql
AS $$
    SELECT s.*
    FROM steam_skins s
    WHERE s.name IN (
        SELECT st2.name
        FROM skins_themes st1
        JOIN skins_themes st2 ON st1.theme = st2.theme
        WHERE st1.name = s_name
          AND st2.name <> s_name
    );
$$;


/* =======================================================
   PREÇOS — ANÁLISES
======================================================= */

-- Último preço registrado
CREATE OR REPLACE FUNCTION ultimopreco(s_name varchar)
RETURNS numeric
LANGUAGE sql
STABLE
AS $$
    SELECT p.sell_price
    FROM price_history p
    WHERE p.name = s_name
    ORDER BY p.date DESC
    LIMIT 1;
$$;


-- Maior preço histórico
CREATE OR REPLACE FUNCTION maiorpreco(s_name varchar)
RETURNS numeric
LANGUAGE sql
STABLE
AS $$
    SELECT p.sell_price
    FROM price_history p
    WHERE p.name = s_name
    ORDER BY p.sell_price DESC
    LIMIT 1;
$$;


-- Menor preço histórico
CREATE OR REPLACE FUNCTION menorpreco(s_name varchar)
RETURNS numeric
LANGUAGE sql
STABLE
AS $$
    SELECT p.sell_price
    FROM price_history p
    WHERE p.name = s_name
    ORDER BY p.sell_price ASC
    LIMIT 1;
$$;


-- Média de preço em uma janela de ±5 dias (máx. 30 registros)
CREATE OR REPLACE FUNCTION mediapreco(
    s_name      varchar,
    target_date timestamptz
)
RETURNS numeric
LANGUAGE sql
STABLE
AS $$
    SELECT AVG(sub.sell_price)
    FROM (
        SELECT sell_price
        FROM price_history
        WHERE name = s_name
          AND date BETWEEN (target_date - INTERVAL '5 days')
                        AND (target_date + INTERVAL '5 days')
        ORDER BY date DESC
        LIMIT 30
    ) sub;
$$;


/* =======================================================
   NOTÍCIAS — CONSULTAS GERAIS
======================================================= */

-- Todas as notícias da fonte DUST2
CREATE OR REPLACE FUNCTION d2_news()
RETURNS SETOF news
LANGUAGE sql
STABLE
AS $$
    SELECT *
    FROM news
    WHERE fonte = 'DUST2';
$$;


-- Atualiza a data de uma notícia
CREATE OR REPLACE FUNCTION update_d2_dates(
    n_link varchar,
    n_date varchar
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE news
    SET date = n_date
    WHERE link = n_link;
END;
$$;


/* =======================================================
   RELAÇÃO ENTRE SKINS E NOTÍCIAS
======================================================= */

-- Notícias DUST2 relacionadas a uma skin
CREATE OR REPLACE FUNCTION relacionar_news_skins(s_name varchar)
RETURNS TABLE (
    titulo     varchar,
    autor      varchar,
    link       varchar,
    respostas  varchar,
    descricao  varchar,
    fonte      varchar,
    date       timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT nw.*
    FROM news nw
    WHERE nw.fonte = 'DUST2'
      AND nw.link IN (
          SELECT nt.link
          FROM news_themes nt
          WHERE nt.theme IN (
              SELECT st.theme
              FROM skins_themes st
              WHERE lower(trim(st.name)) = lower(trim(s_name))
          )
      )
    LIMIT 10;
$$;


-- Discussões relacionadas a uma skin (ordenadas por engajamento)
CREATE OR REPLACE FUNCTION relacionar_discussions_skins(s_name varchar)
RETURNS TABLE (
    titulo     varchar,
    autor      varchar,
    link       varchar,
    respostas  varchar,
    descricao  varchar,
    fonte      varchar,
    date       timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT nw.*
    FROM news nw
    WHERE nw.fonte <> 'DUST2'
      AND nw.link IN (
          SELECT nt.link
          FROM news_themes nt
          WHERE nt.theme IN (
              SELECT st.theme
              FROM skins_themes st
              WHERE lower(trim(st.name)) = lower(trim(s_name))
          )
      )
    ORDER BY replace(nw.respostas, ',', '')::integer DESC
    LIMIT 10;
$$;


/* =======================================================
   FILTROS TEMPORAIS (JANELA DE TEMPO)
======================================================= */

-- Notícias DUST2 relacionadas à skin em uma janela de ±5 dias
CREATE OR REPLACE FUNCTION news_skins_date_gap(
    s_name      varchar,
    target_date timestamptz
)
RETURNS TABLE (
    titulo     varchar,
    autor      varchar,
    link       varchar,
    respostas  varchar,
    descricao  varchar,
    fonte      varchar,
    date       timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT nw.*
    FROM news nw
    WHERE nw.fonte = 'DUST2'
      AND nw.date BETWEEN (target_date - INTERVAL '5 days')
                      AND (target_date + INTERVAL '5 days')
      AND nw.link IN (
          SELECT nt.link
          FROM news_themes nt
          WHERE nt.theme IN (
              SELECT st.theme
              FROM skins_themes st
              WHERE lower(trim(st.name)) = lower(trim(s_name))
          )
      )
    ORDER BY nw.date DESC
    LIMIT 10;
$$;


-- Discussões relacionadas à skin em uma janela de ±5 dias
CREATE OR REPLACE FUNCTION discussion_skins_date_gap(
    s_name      varchar,
    target_date timestamptz
)
RETURNS TABLE (
    titulo     varchar,
    autor      varchar,
    link       varchar,
    respostas  varchar,
    descricao  varchar,
    fonte      varchar,
    date       timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT nw.*
    FROM news nw
    WHERE nw.fonte <> 'DUST2'
      AND nw.date BETWEEN (target_date - INTERVAL '5 days')
                      AND (target_date + INTERVAL '5 days')
      AND nw.link IN (
          SELECT nt.link
          FROM news_themes nt
          WHERE nt.theme IN (
              SELECT st.theme
              FROM skins_themes st
              WHERE lower(trim(st.name)) = lower(trim(s_name))
          )
      )
    ORDER BY nw.date DESC
    LIMIT 10;
$$;
