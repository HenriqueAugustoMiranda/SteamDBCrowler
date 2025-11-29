import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://lpfawvedzxmjoaznbnkb.supabase.co/";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwZmF3dmVkenhtam9hem5ibmtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2MDQyMTcsImV4cCI6MjA3MjE4MDIxN30.88yKkeMhvGjnKOkLQG4Y8IMxOsulKNC8QW4TYD6I7Z4";

// 🔹 Cria o cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const params = new URLSearchParams(window.location.search);
const nomeSkin = decodeURIComponent(params.get("nome"));
document.getElementById("skin-nome").innerText = nomeSkin;

async function buscarHistorico() {
  try {
    const { data, error } = await supabase
      .from("price_history")
      .select("*")
      .eq("name", nomeSkin)
      .order("date", { ascending: true });

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
          borderWidth: 1.4,
          pointRadius: 0,
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
          time: { unit: "year" },
          ticks: { maxRotation: 0, autoSkip: true }
        },
        y: { beginAtZero: false }
      },
      interaction: { mode: "nearest", intersect: false },
      plugins: {
        tooltip: {
          enabled: true,
          callbacks: { label: (ctx) => `R$ ${ctx.raw}` }
        },
        zoom: {
          zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: "x" },
          pan: { enabled: true, mode: "x" }
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
