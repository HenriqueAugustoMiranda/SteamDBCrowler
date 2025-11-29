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
  return params.get('nome');
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
    .select("sell_price, date, sell_listings")
    .eq("name", nome)
    .order("date", { ascending: true });

  if (error) {
    console.error("Erro ao buscar histórico:", error);
    return [];
  }

  return data
    .map(h => {
      const preco = Number(h.sell_price.toString().replace(",", "."));
      const volume = Number(h.sell_listings);
      const dataObj = h.date ? new Date(h.date) : null;

      return { preco, volume, data: dataObj };
    })
    .filter(h => !isNaN(h.preco) && h.data !== null);
}

async function renderizarDetalhe() {
  const nome = getSkinNome();
  const skin = await buscarSkin(nome);
  const historico = await buscarHistorico(nome);

  if (!skin) {
    document.querySelector('.container').innerHTML = "<h2>Skin não encontrada!</h2>";
    return;
  }

  document.getElementById('skin-nome').textContent = skin.nome;
  document.getElementById('skin-img').src = skin.img.startsWith("http") ? skin.img : link_inicio + skin.img;
  document.getElementById('skin-img').alt = skin.nome;

  document.getElementById('skin-info').innerHTML = `
    <strong>Arma:</strong> ${skin.arma}<br>
    <strong>Preço atual:</strong> ${skin.preco}<br>
    <strong>Menor preço recente:</strong> ${skin.menor_preco}<br>
  `;

  if (historico.length > 0) {
    const ctx = document.getElementById('grafico').getContext('2d');

    // ---- GRADIENT DINÂMICO (verde quando sobe / vermelho quando cai) ----
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, "rgba(0, 200, 0, 0.8)");
    gradient.addColorStop(1, "rgba(200, 0, 0, 0.8)");

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: historico.map(h => h.data.toISOString().split('T')[0]),
        datasets: [
          {
            label: 'Preço (US$)',
            data: historico.map(h => h.preco),
            borderColor: gradient,
            backgroundColor: 'rgba(40,167,69,0.05)',
            fill: true,
            tension: 0.3,
            pointRadius: 0,
            pointHoverRadius: 6,
            yAxisID: 'y'
          },
          {
            label: 'Volume',
            data: historico.map(h => h.volume),
            borderColor: "#007bff",
            backgroundColor: "rgba(0,123,255,0.15)",
            fill: true,
            tension: 0.2,
            pointRadius: 0,
            pointHoverRadius: 5,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        scales: {
          x: {
            ticks: {
              autoSkip: true,
              maxTicksLimit: 10
            }
          },
          y: {
            type: 'linear',
            position: 'left',
            title: { text: 'Preço (US$)', display: true }
          },
          y1: {
            type: 'linear',
            position: 'right',
            title: { text: 'Volume', display: true },
            grid: { drawOnChartArea: false }
          }
        },
        plugins: {
          legend: { labels: { boxWidth: 12 } },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              title: (items) => {
                const d = historico[items[0].dataIndex].data;
                return d.toLocaleDateString("pt-BR");
              },
              label: (item) => {
                if (item.datasetIndex === 0)
                  return `Preço: US$ ${item.raw.toFixed(2)}`;
                else
                  return `Volume: ${item.raw}`;
              }
            }
          },
          zoom: {
            zoom: {
              wheel: { enabled: true },
              pinch: { enabled: true },
              mode: 'x'
            },
            pan: {
              enabled: true,
              mode: 'x'
            }
          }
        }
      }
    });
  }
}

renderizarDetalhe();
