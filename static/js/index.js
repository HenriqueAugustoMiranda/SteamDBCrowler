document.addEventListener("DOMContentLoaded", () => {

  const link_inicio = "https://community.fastly.steamstatic.com/economy/image/";
  let skinsPorPagina = 30; // valor inicial
  let paginaAtual = 1;
  let skins = [];
  let is_logged = 0;
  let userMail = null;

  const SUPABASE_URL = "https://lpfawvedzxmjoaznbnkb.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwZmF3dmVkenhtam9hem5ibmtiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjYwNDIxNywiZXhwIjoyMDcyMTgwMjE3fQ.GdhC4Q0g9IttUki13_aCd0assoMUi3Us8p7LJxQIMTk";
  const { createClient } = supabase;
  const client = createClient(SUPABASE_URL, SUPABASE_KEY);

  const saveFilter = document.getElementById("save-filter");

  const loginOverlay = document.getElementById("loginOverlay");
  const btnAbrirLogin = document.getElementById("btn-login");
  const btnFecharLogin = document.getElementById("btn-fechar-login");
  const bntEntrarLogin = document.getElementById("btn-entrar");
  const inputEmailLogin = document.getElementById("input-email");
  const inputSenhaLogin = document.getElementById("input-senha");

  const cadastroOverlay = document.getElementById("cadastroOverlay")
  const btnAbrirCadastro = document.getElementById("btn-cadastro");
  const btnFecharCadastro = document.getElementById("btn-fechar-cadastro");
  const bntEntrarCadastro = document.getElementById("btn-cadastrar");
  const inputEmailCadastro = document.getElementById("input-email-cadastro");
  const inputSenhaCadastro = document.getElementById("input-senha-cadastro");
  const pnome = document.getElementById("p-nome");
  const unome = document.getElementById("u-nome");

  if (btnAbrirLogin && loginOverlay) {
    btnAbrirLogin.addEventListener("click", () => {
      loginOverlay.style.display = "flex";
    });
  }

  if (btnFecharLogin && loginOverlay) {
    btnFecharLogin.addEventListener("click", () => {
      loginOverlay.style.display = "none";
    });
  }

  if (btnAbrirCadastro && cadastroOverlay) {
    btnAbrirCadastro.addEventListener("click", () => {
      cadastroOverlay.style.display = "flex";
    });
  }

  if (btnFecharCadastro && cadastroOverlay) {
    btnFecharCadastro.addEventListener("click", () => {
      cadastroOverlay.style.display = "none";
    });
  }

  bntEntrarCadastro.addEventListener("click", async () => {
    
    if (!inputEmailCadastro.value || !inputSenhaCadastro.value || !pnome.value || !unome.value) {
      alert("Preencha todos os campos antes de entrar!");
      return;
    }

    const usuarioExiste = await verificarUsuario(inputEmailCadastro.value);
    if (usuarioExiste) {
      alert("Usuário já cadastrado!");
      return;
    }

    const sucesso = await cadastrarUsuario(
      inputEmailCadastro.value,
      inputSenhaCadastro.value,
      pnome.value,
      unome.value
    );

    if (sucesso) {
      userMail = inputEmailCadastro.value;
      is_logged = 1;
      cadastroOverlay.style.display = "none";
      btnAbrirLogin.style.display = "none";
      btnAbrirCadastro.style.display = "none";
      saveFilter.style.display = "flex";
    } else {
      alert("Erro ao cadastrar usuário.");
      console.error("Erro ao cadastrar usuário:", error)
    }
  });


  bntEntrarLogin.addEventListener("click", async () => {
    
    if (!inputEmailLogin.value || !inputSenhaLogin.value) {
      alert("Preencha todos os campos antes de entrar!");
      return;
    }

    const usuarioExiste = await verificarUsuario(inputEmailLogin.value);
    if (!usuarioExiste) {
      alert("Usuário não cadastrado!");
      return;
    }

    const senhaCorreta = await verificarSenha(inputEmailLogin.value, inputSenhaLogin.value);
    if (!senhaCorreta) {
      alert("Senha incorreta!");
      return;
    }

    saveFilter.style.display = "flex";
    userMail = inputEmailLogin.value;
    is_logged = 1;
    loginOverlay.style.display = "none";
    btnAbrirLogin.style.display = "none";
    btnAbrirCadastro.style.display = "none";
  });

  async function interesse_em(email, skin_name){
    
    try {
      const { data, error } = await client
        .from("interest")
        .insert([{ 
          email: email, 
          skin: skin_name 
        }])
        .select();
      
      if (error) {
        console.error("Erro detalhado:", error);
        
        // Se for erro de coluna inexistente
        if (error.message.includes('column') && error.message.includes('does not exist')) {
          alert("Erro de configuração do banco. Contate o administrador.");
        }
        return false;
      }
      
      alert("Skin salva com sucesso!");
      return true;
    } catch (err) {
      console.error("Erro geral:", err);
      return false;
    }
  }

  // Dropdown skins por página
  const selectSkinsPorPagina = document.getElementById("filtro-skins-por-pagina");
  selectSkinsPorPagina.addEventListener("change", () => {
    skinsPorPagina = Number(selectSkinsPorPagina.value);
    renderizarSkins(1); // volta para primeira página
  });

  async function verificarSenha(email, senha) {
    const { data, error } = await client
      .from("users")
      .select("password")
      .eq("email", email)
      .single();  
    if (error) {
      console.error("Erro ao verificar login:", error);
      return false;
    } 
    return data.password === senha;
  }

  async function verificarUsuario(email) {
    const { data, error } = await client
      .from("users")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (error) {
      console.error("Erro ao verificar usuário:", error);
      return false;
    }

    return !!data;
  }

  async function filtrarInteresse(email, skin_name) {
    try {
        const { data, error } = await client
            .from("interest")
            .select("*")
            .eq("email", email)
            .eq("skin", skin_name);
        
        if (error) {
            console.error("Erro ao verificar interesse:", error);
            return false;
        }
        
        return data && data.length > 0;
        
    } catch (err) {
        console.error("Erro na requisição:", err);
        return false;
    }
}

  async function cadastrarUsuario(email, senha, pnome, unome){
    const { data, error } = await client
      .from("users")
      .insert([{ email: email, password: senha, ft_name: pnome, lt_name: unome }]); 
    if (error) {
      console.error("Erro ao cadastrar usuário:", error);
      return false;
    } 
    return true;
  }



  async function carregarTodasSkins() {
    const todasSkins = [];
    const batchSize = 1000;
    let offset = 0;
    let maisSkins = true;

    while (maisSkins) {
      const { data, error } = await client
        .from("steam_skins")
        .select("*")
        .range(offset, offset + batchSize - 1);

      if (error) {
        console.error("Erro ao buscar skins:", error);
        break;
      }

      todasSkins.push(...data);
      offset += batchSize;

      if (data.length < batchSize) maisSkins = false;
    }

    return todasSkins.map(skin => ({
      nome: skin.name,
      arma: skin.weapon_type,
      preco: skin.sell_price,
      img: skin.icon_url
    }));
  }

  function parsePreco(precoStr) {
    if (!precoStr) return 0;
    return Number(precoStr.replace(/[^0-9.]/g, ""));
  }

  function filtrarESortearSkins() {

    const busca = document.getElementById("filtro-busca").value;
    const arma = document.getElementById("filtro-arma").value;
    const qualidade = document.getElementById("filtro-qualidade").value;
    const stattrak = document.getElementById("filtro-stattrak").value;
    const ordenar = document.getElementById("filtro-ordenar").value;

    return skins
      .filter(skin => {
        const stattrakBool = skin.stattrak === true || skin.stattrak === "true";
        return (
          (arma === "" || skin.arma === arma) &&
          (qualidade === "" || (skin.qualidade && skin.qualidade === qualidade)) &&
          (stattrak === "" || stattrakBool === (stattrak === "true")) &&
          (skin.nome.toLowerCase().includes(busca))
        );
      })
      .sort((a, b) => {
        if (ordenar === "preco-crescente") return parsePreco(a.preco) - parsePreco(b.preco);
        if (ordenar === "preco-decrescente") return parsePreco(b.preco) - parsePreco(a.preco);
        return 0;
      });
  }

  function renderizarSkins(pagina = 1) {
    const container = document.getElementById("container-skins");
    container.innerHTML = "";

    const filtradas = filtrarESortearSkins();
    const totalPaginas = Math.ceil(filtradas.length / skinsPorPagina);
    paginaAtual = Math.min(Math.max(1, pagina), totalPaginas);

    const inicio = (paginaAtual - 1) * skinsPorPagina;
    const fim = inicio + skinsPorPagina;
    const skinsPagina = filtradas.slice(inicio, fim);

    skinsPagina.forEach(skin => {
      const div = document.createElement("div");
      div.className = "item";
      const img = skin.img.startsWith("http") ? skin.img : link_inicio + skin.img;
      div.innerHTML = `
      <h3>${skin.nome}</h3>
      <img src="${img}" class="ak-img" alt="${skin.nome}">
      <p>US$ ${skin.preco}</p>
      <button class="visualizar-btn">Visualizar</button>
      <button id="save-btn" class="save-btn"><img src="../asstes/diskette.png" style="width:13px; height:13px;"></button>
    `;
      div.querySelector('.visualizar-btn').onclick = () => {
          window.location.href = `/detalhes?nome=${encodeURIComponent(skin.nome)}`;
      };

      div.querySelector('.save-btn').onclick = async () => {
        if(is_logged === 1){
          interesse_em(userMail, skin.nome);
        } else {
          loginOverlay.style.display = "flex";
        }
      };

      container.appendChild(div);
    });

    renderizarPaginacao(totalPaginas);
  }

  document.querySelectorAll("#filtro-busca, #filtro-arma, #filtro-qualidade, #filtro-stattrak, #filtro-ordenar")
    .forEach(el => el.addEventListener("change", () => renderizarSkins(1)));

  function renderizarPaginacao(totalPaginas) {
    const pagContainer = document.getElementById("paginacao");
    pagContainer.innerHTML = "";

    for (let i = 1; i <= totalPaginas; i++) {
      const btn = document.createElement("button");
      btn.innerText = i;
      btn.onclick = () => renderizarSkins(i);
      if (i === paginaAtual) btn.style.fontWeight = "bold";
      pagContainer.appendChild(btn);
    }
  }

  async function iniciar() {
    loginOverlay.style.display = "none";
    cadastroOverlay.style.display = "none";
    saveFilter.style.display = "none";
    skins = await carregarTodasSkins();
    renderizarSkins();
  }

  iniciar();

});