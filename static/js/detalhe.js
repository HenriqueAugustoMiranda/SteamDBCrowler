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
  console.log("[DEBUG] Buscando histórico para:", nome);

  const { data, error } = await client
    .from("price_history")
    .select("sell_price, date")
    .eq("name", nome)
    .order("date", { ascending: true });

  if (error) {
    console.error("Erro ao buscar histórico:", error);
    return [];
  }

  console.log("[DEBUG] Dados crus do histórico:", data);

  return data
    .map(h => {
      const raw = h.sell_price;

      const preco = typeof raw === "string"
        ? Number(raw.replace(",", "."))
        : Number(raw);

      const dataObj = h.date ? new Date(h.date) : null;

      return {
        preco,
        data: dataObj
      };
    })
    .filter(h => !isNaN(h.preco) && h.data !== null);
}

async function renderizarDetalhe() {
  const nome = getSkinNome();
  const skin = await buscarSkin(nome);
  const historico = await buscarHistorico(nome);

  console.log("[DEBUG] Skin carregada:", skin);
  console.log("[DEBUG] Histórico filtrado:", historico);

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

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: historico.map(h => h.data.toISOString().split('T')[0]),
        datasets: [{
          label: 'Preço (US$)',
          data: historico.map(h => h.preco),
          borderColor: '#28a745',
          backgroundColor: 'rgba(40,167,69,0.1)',
          fill: true,
          tension: 0.2
        }]
      },
      options: {
        scales: {
          x: { title: { display: true, text: 'Data' } },
          y: { title: { display: true, text: 'Preço (US$)' } }
        }
      }
    });
  }
}

renderizarDetalhe();
