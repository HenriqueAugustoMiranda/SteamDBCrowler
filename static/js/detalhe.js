const link_inicio = "https://community.fastly.steamstatic.com/economy/image/";
const SUPABASE_URL = "https://lpfawvedzxmjoaznbnkb.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwZmF3dmVkenhtam9hem5ibmtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2MDQyMTcsImV4cCI6MjA3MjE4MDIxN30.88yKkeMhvGjnKOkLQG4Y8IMxOsulKNC8QW4TYD6I7Z4";

const { createClient } = supabase;
const client = createClient(SUPABASE_URL, SUPABASE_KEY);

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
    .select("sell_price, recorded_at")
    .eq("name", nome)
    .order("recorded_at", { ascending: true });

  if (error) {
    console.error("Erro ao buscar histórico:", error);
    return [];
  }

  return data
    .map(h => {
      const preco = Number(h.sell_price.replace("$", ""));
      const dataObj = new Date(h.recorded_at);
      return { preco, data: dataObj };
    })
    .filter(h => !isNaN(h.preco) && !isNaN(h.data));
}

function getSkinNome() {
  const params = new URLSearchParams(window.location.search);
  return params.get("nome");
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
  document.getElementById("skin-info").innerHTML = `
    <strong>Arma:</strong> ${skin.arma}<br>
    <strong>Preço atual:</strong> ${skin.preco}<br>
    <strong>Menor preço recente:</strong> ${skin.menor_preco}
  `;

  if (historico.length > 0) {
    const canvas = document.getElementById("grafico");
    const ctx = canvas.getContext("2d");

    // gradient bonito
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
            borderWidth: 1,
            tension: 0.2,
            pointRadius: 0,
            pointHoverRadius: 4
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
            ticks: {
              callback: (_, index) => {
                const d = historico[index].data;
                return d.getFullYear(); // só ano
              }
            }
          },
          y: {
            title: { display: true, text: "Preço (US$)" }
          }
        },

        plugins: {
          tooltip: {
            mode: "nearest",
            intersect: false,
            callbacks: {
              title: (items) => {
                const d = items[0].parsed.x;
                return new Date(d).toLocaleDateString("pt-BR");
              }
            }
          },

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
