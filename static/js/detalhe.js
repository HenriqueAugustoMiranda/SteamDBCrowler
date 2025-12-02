const link_inicio = "https://community.fastly.steamstatic.com/economy/image/";
const SUPABASE_URL = "https://lpfawvedzxmjoaznbnkb.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwZmF3dmVkenhtam9hem5ibmtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2MDQyMTcsImV4cCI6MjA3MjE4MDIxN30.88yKkeMhvGjnKOkLQG4Y8IMxOsulKNC8QW4TYD6I7Z4";
const { createClient } = supabase;
const client = createClient(SUPABASE_URL, SUPABASE_KEY);

const btnAtualizar = document.getElementById("attbutton")

btnAtualizar.addEventListener("click", async () => {
  const skinName = getSkinNome()
  atualizarSkin(skinName)
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
  const { data: skinData, error: skinError } = await client
    .from("steam_skins")
    .select("name, weapon_type, icon_url")
    .eq("name", nome)
    .single();

  if (skinError) {
    console.error("Erro ao buscar detalhes da skin:", skinError);
    return null;
  }

  const { data: precoData, error: precoError } = await client.rpc("ultimopreco", {
    s_name: nome
  });

  const { data: precoDataMenor, error: precoErrorMenor } = await client.rpc("menorpreco", {
    s_name: nome
  });

  console.log("preço retornado pela RPC:", precoData);
  if (precoError) {
    console.warn("Aviso: Erro ao buscar preço via RPC. Usando N/A.", precoError);
  }

  return {
    nome: skinData.name,
    arma: skinData.weapon_type,
    img: skinData.icon_url,
    preco: precoData || 'undefined',
    menor_preco: precoDataMenor || 'undefined'
  };
}

async function buscarHistorico(nome) {
  const { data, error } = await client
    .from("price_history")
    .select("sell_price, date")
    .eq("name", nome)
    .order("date", { ascending: true });

  if (error) {
    console.error("Erro ao buscar histórico:", error);
    return [];
  }

  return data
    .map(h => {
      let precoNum = 0;
      let menorPrecoNum = 0;
      
      if (typeof h.sell_price === 'string') {
          const precoLimpo = h.sell_price.replace('$', '');
          precoNum = Number(precoLimpo);
          menorPrecoNum = Number(precoLimpo);
      } else if (typeof h.sell_price === 'number') {
          precoNum = h.sell_price;
          menorPrecoNum = h.sell_price;
      }
      
      const dataObj = h.date ? new Date(h.date) : null;
      
      return { preco: precoNum, menor_preco: menorPrecoNum, dateObj: dataObj };
    })
    .filter(h => !isNaN(h.preco) && h.dateObj !== null); 
}

async function buscarNoticiasRelacionadas(nome) {
  const { data, error } = await client.rpc("relacionar_news_skins", {
    s_name: nome
  });

  if (error) {
    console.error("Erro ao buscar notícias relacionadas:", error);
    return [];
  }
  
  return data || [];
}

function renderizarNoticias(noticias) {
  const newsList = document.getElementById('news-list');
  newsList.innerHTML = '';

  if (noticias.length === 0) {
    newsList.innerHTML = '<p>Nenhuma notícia relacionada encontrada.</p>';
    return;
  }

  noticias.forEach(noticia => {
    const divNoticia = document.createElement('div');
    divNoticia.className = 'news-item';
    
    divNoticia.innerHTML = `
      <h4>${noticia.titulo || 'Sem Título'}</h4>
      <p>${noticia.descricao || 'Sem descrição.'}</p>
    `;

    if (noticia.link) { 
        divNoticia.onclick = () => window.open(noticia.link, '_blank');
    }
    
    newsList.appendChild(divNoticia);
  });
}

async function renderizarDetalhe() {
  const nome = getSkinNome();
  
  const [skin, historico, noticias] = await Promise.all([
    buscarSkin(nome),
    buscarHistorico(nome),
    buscarNoticiasRelacionadas(nome)
  ]);

  if (!skin) {
    document.querySelector('.main-content').innerHTML = "<h2>Skin não encontrada!</h2>";
    return;
  }

  document.getElementById('skin-nome').textContent = skin.nome;
  document.getElementById('skin-img').src = skin.img.startsWith("http") ? skin.img : link_inicio + skin.img;
  document.getElementById('skin-img').alt = skin.nome;
  document.getElementById('skin-info').innerHTML = `
        <strong>Arma:</strong> ${skin.arma}<br>
        <strong>Preço atual:</strong> ${skin.preco}
        <strong>Menor preço recente:</strong> ${skin.menor_preco}
      `;

  if (historico.length > 0) {
    const ctx = document.getElementById('grafico').getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: historico.map(h => h.dateObj.toISOString().split('T')[0]),
        datasets: [{
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
  
  renderizarNoticias(noticias);
}

renderizarDetalhe();