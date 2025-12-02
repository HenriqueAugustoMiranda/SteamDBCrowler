document.addEventListener("DOMContentLoaded", () => {

  const link_inicio = "https://community.fastly.steamstatic.com/economy/image/";
  let skinsPorPagina = 30; // valor inicial
  let paginaAtual = 1;
  let skins = [];
  let is_logged = 0;
  let userMail = null;
  let filtroInteresseAtivo = false;

  const SUPABASE_URL = "https://lpfawvedzxmjoaznbnkb.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwZmF3dmVkenhtam9hem5ibmtiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjYwNDIxNywiZXhwIjoyMDcyMTgwMjE3fQ.GdhC4Q0g9IttUki13_aCd0assoMUi3Us8p7LJxQIMTk";
  const { createClient } = supabase;
  const client = createClient(SUPABASE_URL, SUPABASE_KEY);

  const saveFilter = document.getElementById("save-filter");
  const saveFilterIcon = document.querySelector("#save-filter img");

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

saveFilter.addEventListener("click", async () => {
      if (is_logged === 0) {
          loginOverlay.style.display = "flex";
          return;
      }
      
      // Alterna o estado do filtro
      filtroInteresseAtivo = !filtroInteresseAtivo;
      
      // Atualiza o visual do botão/imagem
      if (filtroInteresseAtivo) {
          // Destaca o botão quando ativo
          saveFilterIcon.style.border = "2px solid #2a8aed"; 
          saveFilterIcon.style.borderRadius = "5px";
      } else {
          // Remove o destaque quando inativo
          saveFilterIcon.style.border = "none";
      }

      renderizarSkins(1); // Renderiza na primeira página com o novo filtro aplicado
  });

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

  function parsePreco(precoString) {
    if (typeof precoString === 'number') return precoString;
    if (!precoString) return 0;
    
    const precoLimpo = String(precoString).replace(/[^0-9.]/g, '');
    
    const preco = parseFloat(precoLimpo);
    
    return isNaN(preco) ? 0 : preco;
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

async function getSkinsInteressadas(email) {
      try {
          const { data, error } = await client
              .from("interest")
              .select("skin")
              .eq("email", email);
          
          if (error) {
              console.error("Erro ao buscar interesses do usuário:", error);
              return [];
          }
          
          // Retorna apenas um array com os nomes das skins
          return data.map(item => item.skin);
          
      } catch (err) {
          console.error("Erro na requisição para obter interesses:", err);
          return [];
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

      const { data, error } = await client.rpc("skins_com_preco", {
        s_offset: offset,
        s_limit: batchSize
      });

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
      img: skin.icon_url,
      raridade: skin.type
    }));
  }

  function parsePreco(precoStr) {
    if (!precoStr) return 0;
    return Number(precoStr.replace(/[^0-9.]/g, ""));
  }

async function deletarInteresse(email, skin_name){
    try {
      const { error } = await client
        .from("interest")
        .delete()
        .eq("email", email)
        .eq("skin", skin_name);
      
      if (error) {
        console.error("Erro ao deletar interesse:", error);
        return false;
      }
      
      alert("Skin removida dos seus interesses!");
      return true;
    } catch (err) {
      console.error("Erro geral ao deletar interesse:", err);
      return false;
    }
  }

let skinsInteressadas = [];

async function filtrarESortearSkins() {

  const busca = document.getElementById("filtro-busca").value.toLowerCase();
  const arma = document.getElementById("filtro-arma").value;
  const qualidade = document.getElementById("filtro-qualidade").value;
  const stattrak = document.getElementById("filtro-stattrak").value;
  const ordenar = document.getElementById("filtro-ordenar").value;

  let skinsParaFiltrar = skins;

  if (filtroInteresseAtivo) {
      if (skinsInteressadas.length === 0) {
         skinsInteressadas = await getSkinsInteressadas(userMail);
      }
      
      skinsParaFiltrar = skinsParaFiltrar.filter(skin => 
          skinsInteressadas.includes(skin.nome)
      );
  } else {
      skinsInteressadas = [];
  }

  return skinsParaFiltrar
    .filter(skin => {
      const nomeLimpo = skin.nome.trim();
      
      const isStatTrakSkin = nomeLimpo.startsWith("StatTrak") || nomeLimpo.startsWith("★ StatTrak");
      
      const stattrakFilterCondition = 
        stattrak === "" ||
        (stattrak === "true" && isStatTrakSkin) ||
        (stattrak === "false" && !isStatTrakSkin);
        
      let qualidadeMatch = true; 
      
      if (qualidade !== "") {
          const raridadeDaSkin = skin.raridade ? skin.raridade.toLowerCase() : "";
          const filtroNormalizado = qualidade.toLowerCase();

          if (filtroNormalizado === "covert") {
              qualidadeMatch = raridadeDaSkin.includes("covert") || raridadeDaSkin.includes("extraordinary");
          } else {
              qualidadeMatch = raridadeDaSkin.includes(filtroNormalizado);
          }
      }
        
      return (
        (arma === "" || skin.arma === arma) &&
        qualidadeMatch &&
        stattrakFilterCondition && 
        (skin.nome.toLowerCase().includes(busca))
      );
    })
    .sort((a, b) => {
      if (ordenar === "preco-crescente") return parsePreco(a.preco) - parsePreco(b.preco);
      if (ordenar === "preco-decrescente") return parsePreco(b.preco) - parsePreco(a.preco);
      return 0;
    });
}

  async function renderizarSkins(pagina = 1) {
    const container = document.getElementById("container-skins");
    container.innerHTML = "";

    const filtradas = await filtrarESortearSkins();
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
      <button class="save-btn"><img src="/static/assets/heart.png" class="heart-icon" alt="Salvar"></button>
    `;
      div.querySelector('.visualizar-btn').onclick = () => {
          window.location.href = `/detalhes?nome=${encodeURIComponent(skin.nome)}`;
      };

      div.querySelector('.save-btn').onclick = async () => {
        if(is_logged !== 1){
          // Se não estiver logado, abre a modal de login
          loginOverlay.style.display = "flex";
          return;
        }

        const skinName = skin.nome;
        
        // Verifica se a skin já está salva
        const isSaved = await filtrarInteresse(userMail, skinName);

        if (isSaved) {
            // Se já está salva, remove
            await deletarInteresse(userMail, skinName);
        } else {
            // Se não está salva, adiciona
            await interesse_em(userMail, skinName);
        }
        
        // Se o filtro de "Skins Salvas" estiver ativo, 
        // é crucial limpar o cache e re-renderizar para que a lista seja atualizada.
        if (filtroInteresseAtivo) {
            // Limpa o array cache para que a próxima chamada de filtrarESortearSkins atualize
            skinsInteressadas = []; 
            renderizarSkins(paginaAtual); 
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
      
      const MAX_VISIBLE_BUTTONS = 3; 
      const halfWindow = Math.floor(MAX_VISIBLE_BUTTONS / 2);

      let startPage = Math.max(2, paginaAtual - halfWindow); 
      let endPage = Math.min(totalPaginas - 1, paginaAtual + halfWindow);
      
      if (endPage - startPage + 1 < MAX_VISIBLE_BUTTONS) {
          if (paginaAtual <= halfWindow + 1) {
              endPage = Math.min(totalPaginas - 1, MAX_VISIBLE_BUTTONS + 1);
          } else if (paginaAtual >= totalPaginas - halfWindow) {
              startPage = Math.max(2, totalPaginas - MAX_VISIBLE_BUTTONS);
          }
      }

      const createButton = (text, pageNumber) => {
          const btn = document.createElement("button");
          btn.innerText = text;
          btn.onclick = () => renderizarSkins(pageNumber);
          if (pageNumber === paginaAtual) {
              btn.className = "active-page"; 
              btn.disabled = true; 
          }
          pagContainer.appendChild(btn);
      };
      
      const addDots = () => {
          const dots = document.createElement("span");
          dots.innerText = "...";
          dots.className = "pagination-separator";
          pagContainer.appendChild(dots);
      };
      
      if (paginaAtual > 1) {
          createButton("<", paginaAtual - 1);
      }

      createButton("1", 1);

      if (startPage > 2) { 
          addDots();
      }

      for (let i = startPage; i <= endPage; i++) {
          createButton(i.toString(), i);
      }
      
      if (endPage < totalPaginas - 1) { 
          addDots();
      }

      if (totalPaginas > 1) { 
          createButton(totalPaginas.toString(), totalPaginas); 
      }
      
      if (paginaAtual < totalPaginas) {
          createButton(">", paginaAtual + 1);
      }
      
      const inputDiv = document.createElement("div");
      inputDiv.className = "manual-page-input";
      inputDiv.innerHTML = `
          <input type="number" id="page-input" min="1" max="${totalPaginas}" placeholder="${paginaAtual}">
          <button id="go-to-page-btn">Ir</button>
      `;

      pagContainer.appendChild(inputDiv);
      
      const pageInput = document.getElementById("page-input");
      const goToPageBtn = document.getElementById("go-to-page-btn");

      const navigateToPage = () => {
          let pageToGo = Number(pageInput.value);
          
          if (pageToGo >= 1 && pageToGo <= totalPaginas) {
              renderizarSkins(pageToGo);
              pageInput.value = '';
          } else {
              alert(`Por favor, insira um número entre 1 e ${totalPaginas}.`);
              pageInput.value = ''; 
          }
      };
      
      goToPageBtn.addEventListener("click", navigateToPage);
      
      pageInput.addEventListener("keypress", (event) => {
          if (event.key === 'Enter' || event.keyCode === 13) {
              event.preventDefault();
              navigateToPage();
          }
      });    
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