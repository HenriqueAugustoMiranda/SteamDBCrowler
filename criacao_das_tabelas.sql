/*
=========================================================
 Projeto: Steam Skins & Market Analysis
 Banco: PostgreSQL
 Descrição:
   Esquema relacional para armazenamento de skins,
   usuários, histórico de preços, notícias, temas
   e relacionamentos de interesse.
=========================================================
*/


/* =======================================================
   USUÁRIOS
======================================================= */

CREATE TABLE public.users (
    ft_name         varchar NOT NULL,
    lt_name         varchar NOT NULL,
    email           varchar NOT NULL,
    password_hash   varchar NOT NULL,
    password_salt   varchar NOT NULL,

    CONSTRAINT users_pkey PRIMARY KEY (email)
);


/* =======================================================
   SKINS
======================================================= */

CREATE TABLE public.steam_skins (
    name            varchar NOT NULL,
    hash_name       varchar NOT NULL,
    type            varchar,
    weapon_type     varchar,
    icon_url        text,
    name_color      varchar,
    created_at      timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at      timestamp without time zone DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT steam_skins_pkey PRIMARY KEY (name),
    CONSTRAINT steam_skins_name_unique UNIQUE (name)
);


/* =======================================================
   HISTÓRICO DE PREÇOS
======================================================= */

CREATE TABLE public.price_history (
    name            varchar NOT NULL,
    date            timestamp without time zone NOT NULL,
    sell_price      numeric,
    sell_listings   integer,

    CONSTRAINT price_history_pkey PRIMARY KEY (name, date),
    CONSTRAINT price_history_name_fkey
        FOREIGN KEY (name)
        REFERENCES public.steam_skins(name)
);


/* =======================================================
   TEMAS DAS SKINS
======================================================= */

CREATE TABLE public.skins_themes (
    name    varchar NOT NULL,
    theme   varchar NOT NULL,

    CONSTRAINT skins_themes_pkey PRIMARY KEY (name, theme),
    CONSTRAINT skins_themes_name_fkey
        FOREIGN KEY (name)
        REFERENCES public.steam_skins(name)
);


/* =======================================================
   NOTÍCIAS
======================================================= */

CREATE TABLE public.news (
    titulo      varchar NOT NULL,
    autor       varchar NOT NULL,
    link        varchar NOT NULL,
    respostas   varchar NOT NULL,
    descricao   varchar NOT NULL,
    fonte       varchar NOT NULL,
    date        timestamp with time zone,

    CONSTRAINT news_pkey PRIMARY KEY (link)
);


/* =======================================================
   TEMAS DAS NOTÍCIAS
======================================================= */

CREATE TABLE public.news_themes (
    theme   varchar NOT NULL,
    link    varchar NOT NULL,

    CONSTRAINT news_themes_pkey PRIMARY KEY (theme, link),
    CONSTRAINT news_themes_link_fkey
        FOREIGN KEY (link)
        REFERENCES public.news(link)
);


/* =======================================================
   INTERESSE DE USUÁRIOS EM SKINS
======================================================= */

CREATE TABLE public.interest (
    skin    varchar NOT NULL,
    email   varchar NOT NULL,

    CONSTRAINT interest_pkey PRIMARY KEY (skin, email),
    CONSTRAINT interest_skin_fkey
        FOREIGN KEY (skin)
        REFERENCES public.steam_skins(name),
    CONSTRAINT interest_email_fkey
        FOREIGN KEY (email)
        REFERENCES public.users(email)
);


/* =======================================================
   RESUMO DIÁRIO (ANÁLISE TEXTUAL)
======================================================= */

CREATE TABLE public.days_resumed (
    dia         date NOT NULL,
    resumo      text NOT NULL,
    pchave1     varchar,
    pchave2     varchar,
    pchave3     varchar,
    pchave4     varchar,
    pchave5     varchar,
    sentimento  varchar,

    CONSTRAINT days_resumed_pkey PRIMARY KEY (dia)
);
