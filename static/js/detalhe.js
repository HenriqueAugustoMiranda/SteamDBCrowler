import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://lpfawvedzxmjoaznbnkb.supabase.co",
  "YOUR_PUBLIC_ANON_KEY"
);

const params = new URLSearchParams(window.location.search);
const nomeSkin = decodeURIComponent(params.get("nome"));

document.getElementById("skin-nome").innerText = nomeSkin;

async function buscarHistorico() {
  try {
    const { data, error } = await supabase
      .from("history_skins")
      .select("*")
      .eq("skin_name", nomeSkin)
      .order("date", { ascending: true });   // <–– CORRIGIDO !!!

    if (error) {
      console.error("Erro ao buscar histórico:", error);
      return [];
    }

    return data;

  } catch (e) {
    console.error("Erro inesperado:", e);
    return [];
  }
}

function desenharGrafico(dados) {
  const ctx = document.getElementById("grafico").getContext("2d");

  const labels = dados.map(d => d.date);
  const prices = dados.map(d => d.median_sale_price_text || d.sale_price_text);

  if (window.graficoSkin) window.graficoSkin.destroy();

  window.graficoSkin = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Preço",
          data: prices,
          tension: 0.2,
          borderWidth: 1.4,       // linha fina
          pointRadius: 0,         // sem bolinhas
          borderColor: "rgb(0, 140, 255)"
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: "time",
          time: {
            unit: "year"          // <–– eixo só mostra ANO
          },
          ticks: {
            maxRotation: 0,
            autoSkip: true
          }
        },
        y: {
          beginAtZero: false
        }
      },
      interaction: {
        mode: "nearest",
        intersect: false
      },
      plugins: {
        tooltip: {
          enabled: true,
          callbacks: {
            label: (ctx) => `R$ ${ctx.raw}`
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

async function main() {
  const historico = await buscarHistorico();
  if (historico.length === 0) {
    console.log("Nenhum dado para exibir");
    return;
  }

  desenharGrafico(historico);
}

main();
