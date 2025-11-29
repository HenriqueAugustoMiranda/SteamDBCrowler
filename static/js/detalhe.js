const link_inicio = "https://community.fastly.steamstatic.com/economy/image/";
const SUPABASE_URL = "https://lpfawvedzxmjoaznbnkb.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwZmF3dmVkenhtam9hem5ibmtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2MDQyMTcsImV4cCI6MjA3MjE4MDIxN30.88yKkeMhvGjnKOkLQG4Y8IMxOsulKNC8QW4TYD6I7Z4";

const { createClient } = supabase;
const client = createClient(SUPABASE_URL, SUPABASE_KEY);

const btnAtualizar = document.getElementById("attbutton");

btnAtualizar.addEventListener("click", async () => {
  const skinName = getSkinNome();
  atualizarSkin(skinName);
});

async function atualizarSkin(skinName) {
  const response = await fetch("http://localhost:5000/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ skin_name: skinName })
  });

  const data = await response.json();
  console.log(data);
}

function getSkinNome() {
  const params = new URLSearchParams(window.location.search);
  return params.get("nome");
}

async function buscarSkin(nome) {
  const { data, error } = await client
    .from("steam_skins")
    .select("*")
    .eq("name", nome)
    .single();

  if (error) {
    console.error("Erro ao buscar skin:", error);
    return null;
  }

  return data
    ? {
        nome: data.name,
        arma: data.weapon_type,
        preco: data.sell_price,
        menor_preco: data.sale_price_text,
        img: data.icon_url
      }
    : null;
}

async function buscarHistorico(nome) {
  const { data, error } = await client
    .from("price_history")
    .select("sell_price, sell_listings, recorded_at")
    .eq("name", nome)
    .order("recorded_at", { ascending: true });

  if (error) {
    console.error("Erro ao buscar histórico:", error);
    return [];
  }

  return data
    .map(h => {
      const preco = Number(h.sell_price.replace("$", ""));
      const volume = h.sell_listings;
      const dataObj = h.recorded_at ? new Date(h.recorded_at) : null;
      return { preco, volume, data: dataObj };
    })
    .filter(h => !isNaN(h.preco) && h.data !== null);
}

async function renderizarDetalhe() {
  const nome = getSkinNome();
  const skin = await buscarSkin(nome);
  const historico = await buscarHistorico(nome);

  if (!skin) {
    document.querySelector(".container").innerHTML =
      "<h2>Skin não encontrada!</h2>";
    return;
  }

  document.getElementById("skin-nome").textContent = skin.nome;
  document.getElementById("skin-img").src = skin.img.startsWith("http")
    ? skin.img
    : link_inicio + skin.img;
  document.getElementById("skin-img").alt = skin.nome;

  document.getElementById("skin-info").innerHTML = `
    <strong>Arma:</strong> ${skin.arma}<br>
    <strong>Preço atual:</strong> ${skin.preco}<br>
    <strong>Menor preço recente:</strong> ${skin.menor_preco}
  `;

  if (historico.length > 0) {
    const canvas = document.getElementById("grafico");
    const ctx = canvas.getContext("2d");

    // Gradient dinâmico
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "rgba(40,167,69,0.4)");
    gradient.addColorStop(1, "rgba(40,167,69,0)");

    new Chart(ctx, {
      type: "line",
      data: {
        labels: historico.map(h => h.data),
        datasets: [
          {
            label: "Preço (US$)",
            data: historico.map(h => h.preco),
            borderColor: "#28a745",
            backgroundColor: gradient,
            fill: true,
            tension: 0.2,
            borderWidth: 1,
            pointRadius: 0,
            pointHoverRadius: 0
          },
          {
            label: "Volume",
            data: historico.map(h => h.volume),
            borderColor: "#007bff",
            backgroundColor: "rgba(0, 123, 255, 0.1)",
            yAxisID: "y2",
            borderWidth: 1,
            pointRadius: 0,
            pointHoverRadius: 0
          }
        ]
      },

      options: {
        responsive: true,
        maintainAspectRatio: false,

        scales: {
          x: {
            type: "time",
            time: { unit: "year" },
            title: { display: true, text: "Ano" },
            ticks: {
              callback: (value, index) => {
                const date = historico[index].data;
                return date.getFullYear();
              }
            }
          },
          y: {
            title: { display: true, text: "Preço (US$)" }
          },
          y2: {
            title: { display: true, text: "Volume" },
            position: "right",
            grid: { drawOnChartArea: false }
          }
        },

        plugins: {
          tooltip: {
            mode: "index",
            intersect: false
          },
          legend: { display: true },

          zoom: {
            zoom: {
              wheel: { enabled: true },
              pinch: { enabled: true },
              mode: "x"
            },
            pan: {
              enabled: true,
              mode: "x"
            }
          }
        }
      }
    });
  }
}

renderizarDetalhe();
