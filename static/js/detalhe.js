const link_inicio = "https://community.fastly.steamstatic.com/economy/image/";
const SUPABASE_URL = "https://lpfawvedzxmjoaznbnkb.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwZmF3dmVkenhtam9hem5ibmtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2MDQyMTcsImV4cCI6MjA3MjE4MDIxN30.88yKkeMhvGjnKOkLQG4Y8IMxOsulKNC8QW4TYD6I7Z4";
const { createClient } = supabase;
const client = createClient(SUPABASE_URL, SUPABASE_KEY);

let DateGraph = null;

// ------------------ FUNÇÕES ------------------

function getSkinNome() {
  const params = new URLSearchParams(window.location.search);
  return params.get("nome");
}

async function buscarSkin(nome) {
  const { data: skinData } = await client
    .from("steam_skins")
    .select("name, weapon_type, icon_url")
    .eq("name", nome)
    .single();

  const { data: precoAtual } = await client.rpc("ultimopreco", { s_name: nome });
  const { data: precoMinimo } = await client.rpc("menorpreco", { s_name: nome });

  return {
    nome: skinData?.name,
    arma: skinData?.weapon_type,
    img: skinData?.icon_url,
    preco: precoAtual || "N/A",
    menor_preco: precoMinimo || "N/A"
  };
}

async function buscarHistorico(nome) {
  const { data } = await client
    .from("price_history")
    .select("sell_price, date")
    .eq("name", nome)
    .order("date", { ascending: true });

  return data
    .map(h => ({
      preco: typeof h.sell_price === "number"
        ? h.sell_price
        : Number(String(h.sell_price).replace("$", "")) || 0,
      dateObj: new Date(h.date)
    }))
    .filter(h => !isNaN(h.preco));
}

async function buscarNoticiasRelacionadas(nome) {
  const { data } = await client.rpc("relacionar_news_skins", { s_name: nome });
  return data || [];
}

async function buscarDiscussoesRelacionadas(nome) {
  const { data } = await client.rpc("relacionar_discussions_skins", { s_name: nome });
  return data || [];
}

// ------------------ RENDERIZAÇÃO ------------------

function renderizarNoticias(lista) {
  const box = document.getElementById("news-list");
  box.innerHTML = "";

  if (lista.length === 0) {
    box.innerHTML = "<p>Nenhuma notícia encontrada.</p>";
    return;
  }

  lista.forEach(noticia => {
    const div = document.createElement("div");
    div.className = "news-item";
    div.innerHTML = `
      <h4>${noticia.titulo || "Sem título"}</h4>
      <p>${noticia.descricao || ""}</p>`;
    div.onclick = () => window.open(noticia.link, "_blank");
    box.appendChild(div);
  });
}

function renderizarDiscussoes(lista) {
  const box = document.getElementById("discussion-list");
  box.innerHTML = "";

  if (lista.length === 0) {
    box.innerHTML = "<p>Nenhuma discussão encontrada.</p>";
    return;
  }

  lista.forEach(disc => {
    const div = document.createElement("div");
    div.className = "discussion-item";
    div.innerHTML = `
      <h4>${disc.titulo || "Sem título"}</h4>
      <p>${disc.descricao || ""}</p>`;
    div.onclick = () => window.open(disc.link, "_blank");
    box.appendChild(div);
  });
}

// ------------------ ABAS (CORRIGIDO PARA SEU HTML) ------------------

function configurarAbas() {
  // IDs possíveis (compatibilidade com versões antigas/novas)
  const possibleAbaNoticias = ["chooseN", "aba-noticias"];
  const possibleAbaDiscuss  = ["chooseD", "aba-discuss"];
  const possibleNewsBoxes   = ["news-section", "news-box"];
  const possibleDiscussBoxes = ["discussion-container", "discussion-box"];

  // pega o primeiro elemento existente dentre os ids
  const pickEl = (ids) => {
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) return el;
    }
    return null;
  };

  const abaNoticias = pickEl(possibleAbaNoticias);
  const abaDiscuss  = pickEl(possibleAbaDiscuss);
  const boxNoticias = pickEl(possibleNewsBoxes);
  const boxDiscuss  = pickEl(possibleDiscussBoxes);

  // debug: se faltar algo, loga e tenta continuar
  if (!abaNoticias) console.warn("configurarAbas: abaNoticias não encontrada. IDs esperados:", possibleAbaNoticias);
  if (!abaDiscuss)  console.warn("configurarAbas: abaDiscuss não encontrada. IDs esperados:", possibleAbaDiscuss);
  if (!boxNoticias) console.warn("configurarAbas: boxNoticias não encontrada. IDs esperados:", possibleNewsBoxes);
  if (!boxDiscuss)  console.warn("configurarAbas: boxDiscuss não encontrada. IDs esperados:", possibleDiscussBoxes);

  // garante que existam containers antes de continuar
  if (!boxNoticias && !boxDiscuss) {
    console.warn("configurarAbas: nenhum container de abas encontrado. abortando configuração.");
    return;
  }

  // inicializa estado visual (notícias visível por padrão)
  if (boxNoticias) boxNoticias.style.display = "block";
  if (boxDiscuss)  boxDiscuss.style.display = "none";

  // deixa h2/tab acessível como botão (role + tabindex + cursor)
  const prepareAsButton = (el) => {
    if (!el) return;
    el.setAttribute("role", "button");
    el.setAttribute("tabindex", "0");
    el.style.cursor = "pointer";
    // tecla Enter ou Space também ativa
    el.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        el.click();
      }
    });
  };

  prepareAsButton(abaNoticias);
  prepareAsButton(abaDiscuss);

  // utilitários de ativação
  const ativarNoticias = () => {
    if (abaNoticias) abaNoticias.classList.add("active");
    if (abaDiscuss)  abaDiscuss.classList.remove("active");
    if (boxNoticias) boxNoticias.style.display = "block";
    if (boxDiscuss)  boxDiscuss.style.display = "none";
  };

  const ativarDiscuss = () => {
    if (abaDiscuss)  abaDiscuss.classList.add("active");
    if (abaNoticias) abaNoticias.classList.remove("active");
    if (boxNoticias) boxNoticias.style.display = "none";
    if (boxDiscuss)  boxDiscuss.style.display = "block";
  };

  // listeners só se existirem
  if (abaNoticias) {
    abaNoticias.addEventListener("click", () => {
      ativarNoticias();
      // opcional: rolar para o topo da aba
      boxNoticias?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  } else {
    // fallback: se não tem botão, garante notícias visíveis
    ativarNoticias();
  }

  if (abaDiscuss) {
    abaDiscuss.addEventListener("click", () => {
      ativarDiscuss();
      boxDiscuss?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  // retorna helpers (útil para testes)
  return { ativarNoticias, ativarDiscuss };
}



// ------------------ GRÁFICO ------------------

function renderizarGrafico(historico) {
  const ctx = document.getElementById("grafico").getContext("2d");

  new Chart(ctx, {
    type: "line",
    data: {
      labels: historico.map(h => h.dateObj.toISOString().split("T")[0]),
      datasets: [
        {
          label: "Preço (US$)",
          data: historico.map(h => h.preco),
          borderColor: "#28a745",
          backgroundColor: "rgba(40,167,69,0.1)",
          fill: true,
          tension: 0.2,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHitRadius: 20
        }
      ]
    },
    options: {
      onClick: (evt, elems) => {
        if (elems.length > 0) {
          const index = elems[0].index;
          DateGraph = historico[index].dateObj.toISOString().split("T")[0];
          console.log("DateGraph =", DateGraph);
        }
      }
    }
  });
}

// ------------------ INICIALIZAÇÃO ------------------

async function renderizarDetalhe() {
  const nome = getSkinNome()?.trim();
  const skin = await buscarSkin(nome);
  const historico = await buscarHistorico(nome);
  const noticias = await buscarNoticiasRelacionadas(nome);
  const discussoes = await buscarDiscussoesRelacionadas(nome);

  document.getElementById("skin-nome").textContent = skin.nome;
  document.getElementById("skin-img").src = link_inicio + skin.img;

  document.getElementById("skin-info").innerHTML = `
      <strong>Arma:</strong> ${skin.arma}<br>
      <strong>Preço atual:</strong> ${skin.preco}<br>
      <strong>Menor preço:</strong> ${skin.menor_preco}
  `;

  if (historico.length > 0) renderizarGrafico(historico);

  renderizarNoticias(noticias);
  renderizarDiscussoes(discussoes);
  configurarAbas();
}

renderizarDetalhe();
