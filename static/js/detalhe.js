const link_inicio = "https://community.fastly.steamstatic.com/economy/image/";
const SUPABASE_URL = "https://lpfawvedzxmjoaznbnkb.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwZmF3dmVkenhtam9hem5ibmtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2MDQyMTcsImV4cCI6MjA3MjE4MDIxN30.88yKkeMhvGjnKOkLQG4Y8IMxOsulKNC8QW4TYD6I7Z4";
const { createClient } = supabase;
const client = createClient(SUPABASE_URL, SUPABASE_KEY);

const btnLimparData = document.getElementById("btn-limpar-data");
let DateGraph = null;
let marcadorDataset = null; // armazenará o dataset do marcador

// ------------------ FUNÇÕES AUXILIARES ------------------

function getSkinNome() {
  const params = new URLSearchParams(window.location.search);
  return params.get("nome");
}

// ------------------ BUSCAS ------------------

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

// Funções por data (confirme os nomes no Supabase!)
async function buscarNoticiasRelacionadasDia(nome) {
  const { data } = await client.rpc("news_skins_date_gap", { s_name: nome, target_date: DateGraph });
  return data || [];
}

async function buscarDiscussoesRelacionadasDia(nome) {
  const { data } = await client.rpc("discussion_skins_date_gap", { s_name: nome, target_date: DateGraph });
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

// ------------------ ABAS ------------------

function configurarAbas() {
  const possibleAbaNoticias = ["chooseN", "aba-noticias"];
  const possibleAbaDiscuss = ["chooseD", "aba-discuss"];
  const possibleNewsBoxes = ["news-section", "news-box"];
  const possibleDiscussBoxes = ["discussion-container", "discussion-box"];

  const pickEl = (ids) => ids.map(id => document.getElementById(id)).find(el => el);

  const abaNoticias = pickEl(possibleAbaNoticias);
  const abaDiscuss = pickEl(possibleAbaDiscuss);
  const boxNoticias = pickEl(possibleNewsBoxes);
  const boxDiscuss = pickEl(possibleDiscussBoxes);

  if (!boxNoticias && !boxDiscuss) return;

  // Estado inicial
  if (boxNoticias) boxNoticias.style.display = "block";
  if (boxDiscuss) boxDiscuss.style.display = "none";
  if (abaNoticias) abaNoticias.classList.add("active");

  const prepareAsButton = (el) => {
    if (!el) return;
    el.setAttribute("role", "button");
    el.setAttribute("tabindex", "0");
    el.style.cursor = "pointer";
    el.addEventListener("keydown", ev => {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        el.click();
      }
    });
  };

  prepareAsButton(abaNoticias);
  prepareAsButton(abaDiscuss);

  const ativarNoticias = () => {
    if (abaNoticias) abaNoticias.classList.add("active");
    if (abaDiscuss) abaDiscuss.classList.remove("active");
    if (boxNoticias) boxNoticias.style.display = "block";
    if (boxDiscuss) boxDiscuss.style.display = "none";
  };

  const ativarDiscuss = () => {
    if (abaDiscuss) abaDiscuss.classList.add("active");
    if (abaNoticias) abaNoticias.classList.remove("active");
    if (boxNoticias) boxNoticias.style.display = "none";
    if (boxDiscuss) boxDiscuss.style.display = "block";
  };

  if (abaNoticias) abaNoticias.addEventListener("click", () => {
    ativarNoticias();
    // boxNoticias?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  if (abaDiscuss) abaDiscuss.addEventListener("click", () => {
    ativarDiscuss();
    // boxDiscuss?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  return { ativarNoticias, ativarDiscuss };
}

// ------------------ GRÁFICO ------------------
function renderizarGrafico(historico) {
  const ctx = document.getElementById('grafico').getContext('2d');

  const grafico = new Chart(ctx, {
    type: 'line',
    data: {
      labels: historico.map(h => h.dateObj.toISOString().split('T')[0]),
      datasets: [
        {
          label: 'Preço (US$)',
          data: historico.map(h => h.preco),
          borderColor: '#28a745',
          backgroundColor: 'rgba(40,167,69,0.1)',
          fill: true,
          tension: 0.2,
          borderWidth: 0.6,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHitRadius: 20
        }
      ]
    },
    options: {
      onClick: async (event, elements) => {
        if (elements.length > 0) {
          const index = elements[0].index;
          const DateGraph = historico[index].dateObj;
          console.log("Data clicada:", DateGraph);

          // --- Atualiza notícias e discussões ---
          const nome = getSkinNome()?.trim();
          const noticiasDia = await buscarNoticiasRelacionadasDia(nome);
          const discussoesDia = await buscarDiscussoesRelacionadasDia(nome);

          renderizarNoticias(noticiasDia);
          renderizarDiscussoes(discussoesDia);

          // --- Adiciona bolinha vermelha ---
          const valor = historico[index].preco;

          // Remove marcador anterior
          if (marcadorDataset) {
            grafico.data.datasets.pop();
          }

          marcadorDataset = {
            label: 'Marcador',
            data: [{ x: index, y: valor }],
            pointBackgroundColor: 'red',
            pointRadius: 8,
            type: 'scatter',
            showLine: false
          };

          grafico.data.datasets.push(marcadorDataset);
          grafico.update();
        }
      },
      scales: {
        x: { title: { display: true, text: 'Data' } },
        y: { title: { display: true, text: 'Preço (US$)' } }
      }
    }
  });

  return grafico;
}



// ------------------ INICIALIZAÇÃO ------------------

async function renderizarDetalhe() {
  const nome = getSkinNome()?.trim();
  const skin = await buscarSkin(nome);
  const historico = await buscarHistorico(nome);
  const noticias = await buscarNoticiasRelacionadas(nome);
  const discussoes = await buscarDiscussoesRelacionadas(nome);

  // Render do detalhe
  document.getElementById("skin-nome").textContent = skin.nome;
  document.getElementById("skin-img").src = link_inicio + skin.img;
  document.getElementById("skin-info").innerHTML = `
      <strong>Arma:</strong> ${skin.arma}<br>
      <strong>Preço atual:</strong> ${skin.preco}<br>
      <strong>Menor preço:</strong> ${skin.menor_preco}
  `;

  if (historico.length > 0) renderizarGrafico(historico);

  // Render inicial de notícias/discussões
  if (DateGraph === null) {
    renderizarNoticias(noticias);
    renderizarDiscussoes(discussoes);
  } else {
    const noticiasDia = await buscarNoticiasRelacionadasDia(nome);
    const discussoesDia = await buscarDiscussoesRelacionadasDia(nome);

    renderizarNoticias(noticiasDia);
    renderizarDiscussoes(discussoesDia);
  }

  // Configura abas
  configurarAbas();

  // Botão limpar data
  btnLimparData?.addEventListener("click", async () => {
    DateGraph = null;
    marcadorDataset = null;
    console.log("Data limpa!");

    // Re-renderiza todas as notícias e discussões
    const noticias = await buscarNoticiasRelacionadas(nome);
    const discussoes = await buscarDiscussoesRelacionadas(nome);

    renderizarNoticias(noticias);
    renderizarDiscussoes(discussoes);
  });
}

// ------------------ EXECUÇÃO ------------------

renderizarDetalhe();
