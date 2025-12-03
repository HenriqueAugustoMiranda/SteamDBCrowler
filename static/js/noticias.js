const SUPABASE_URL = "https://lpfawvedzxmjoaznbnkb.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwZmF3dmVkenhtam9hem5ibmtiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjYwNDIxNywiZXhwIjoyMDcyMTgwMjE3fQ.GdhC4Q0g9IttUki13_aCd0assoMUi3Us8p7LJxQIMTk";
// Garante que o objeto supabase é acessível globalmente
const { createClient } = supabase;
const client = createClient(SUPABASE_URL, SUPABASE_KEY);

const ITEMS_PER_PAGE = 15;
let currentPage = 1;
let currentThemes = [];

// Elementos DOM
const newsFeed = document.getElementById("news-feed");
const searchInput = document.getElementById("news-search");
const themeSelect = document.getElementById("news-theme-filter");
const dateInput = document.getElementById("news-date-filter");
const btnLimpar = document.getElementById("btn-limpar-filtros");
const prevBtn = document.getElementById("prev-page");
const nextBtn = document.getElementById("next-page");
const pageInfo = document.getElementById("page-info");
const loadingMsg = document.getElementById("loading-msg");

// Elementos Stats
const statsPanel = document.getElementById("day-stats-panel");
const statsDate = document.getElementById("stats-date");
const statsResumo = document.getElementById("stats-resumo");
const statsSentimento = document.getElementById("stats-sentimento");
const statsKeywords = document.getElementById("stats-keywords");

// --- INICIALIZAÇÃO ---
document.addEventListener("DOMContentLoaded", async () => {
    // Estas chamadas podem estar falhando se 'client' não estiver pronto ou se houver erro no código
    await carregarTemas();
    await carregarNoticias();

    // Event Listeners
    searchInput.addEventListener("change", () => { currentPage = 1; carregarNoticias(); });
    themeSelect.addEventListener("change", () => { currentPage = 1; carregarNoticias(); });
    dateInput.addEventListener("change", handleDateChange);
    btnLimpar.addEventListener("click", limparFiltros);
    prevBtn.addEventListener("click", () => mudarPagina(-1));
    nextBtn.addEventListener("click", () => mudarPagina(1));
});

async function carregarTemas() {
    try {
        // Busca temas únicos na tabela news_themes
        const { data, error } = await client
            .from("news_themes")
            .select("theme");
        
        if (error) {
            console.error("Erro ao carregar temas:", error);
            return;
        }

        // Filtra duplicados e ordena
        const temasUnicos = [...new Set(data.map(item => item.theme))].sort();

        temasUnicos.forEach(tema => {
            const option = document.createElement("option");
            option.value = tema;
            option.textContent = tema;
            themeSelect.appendChild(option);
        });
    } catch (e) {
        console.error("Erro fatal ao carregar temas:", e);
    }
}

async function handleDateChange() {
    const dataSelecionada = dateInput.value;
    currentPage = 1;
    
    if (dataSelecionada) {
        await carregarStatsDia(dataSelecionada);
    } else {
        statsPanel.style.display = "none";
    }
    await carregarNoticias();
}

async function carregarStatsDia(dataIso) {
    try {
        // A data vem como YYYY-MM-DD do input date.
        // ADICIONE ESTE LOG PARA DEPURAR:
        console.log(`[Stats Debug] Tentando buscar estatísticas para o dia: ${dataIso}`);

        const { data, error } = await client
            .from("days_resumed")
            .select("*")
            .eq("dia", dataIso) // Garante que a coluna no Supabase se chama 'dia'
            .maybeSingle();

        if (error) {
            console.error("Erro ao buscar resumo do dia (Supabase):", error);
            // Se houver erro de Supabase, ainda podemos mostrar a mensagem de "não encontrado"
            // mas o log acima vai nos avisar de um problema de permissão/tabela.
        }

        // Formata a data visualmente (evita problemas de timezone do Date object)
        const [ano, mes, dia] = dataIso.split('-');
        const dataFormatada = `${dia}/${mes}/${ano}`;

        // Mostra o painel sempre que uma data é selecionada
        statsPanel.style.display = "block";
        statsDate.textContent = dataFormatada;

        if (data) {
            console.log("[Stats Debug] Dados encontrados:", data);
            // Se houver dados no banco para este dia
            statsResumo.textContent = data.resumo;
            statsSentimento.textContent = data.sentimento || "Neutro";
            
            // Limpar e preencher keywords
            statsKeywords.innerHTML = "";
            const keys = [data.pchave1, data.pchave2, data.pchave3, data.pchave4, data.pchave5];
            let hasKeys = false;
            
            keys.forEach(k => {
                if (k) {
                    hasKeys = true;
                    // Renderiza a palavra-chave em um formato visualmente agradável
                    const li = document.createElement("li");
                    li.className = "p-1 bg-gray-100 rounded-md shadow-sm text-sm"; // Adicionado classes básicas para visualização
                    li.textContent = k;
                    statsKeywords.appendChild(li);
                }
            });

            if (!hasKeys) {
                statsKeywords.innerHTML = "<li>Sem palavras-chave</li>";
            }
        } else {
            console.log("[Stats Debug] Nenhum dado encontrado para esta data.");
            // Se não houver resumo para o dia no banco, mostra aviso no painel
            statsResumo.textContent = "Nenhum resumo estatístico disponível para esta data.";
            statsSentimento.textContent = "-";
            // Adicionado estilo de lista simples para mostrar que não há dados
            statsKeywords.innerHTML = "<ul class='list-none space-y-1 p-0 m-0'><li>-</li></ul>";
        }
    } catch (e) {
        console.error("Erro fatal em carregarStatsDia:", e);
        // Oculta ou mostra um erro no painel em caso de falha de conexão ou outro erro
        statsPanel.style.display = "none";
    }
}

async function carregarNoticias() {
    newsFeed.innerHTML = "";
    loadingMsg.style.display = "block";

    const termoBusca = searchInput.value;
    const temaSelecionado = themeSelect.value;
    const dataSelecionada = dateInput.value;

    let query = client
        .from("news")
        .select(`
            *,
            news_themes!inner(theme)
        `, { count: 'exact' });

    // Filtros
    if (termoBusca) {
        query = query.ilike('titulo', `%${termoBusca}%`);
    }

    if (dataSelecionada) {
        // Assume que a coluna 'date' é timestamp. 
        // Filtramos para pegar todo o dia (gte 00:00 e lt 23:59 do dia)
        query = query.gte('date', `${dataSelecionada}T00:00:00`)
                     .lte('date', `${dataSelecionada}T23:59:59`);
    }

    if (temaSelecionado) {
        // O !inner no select acima já força o join, aqui filtramos a tabela relacionada
        query = query.eq('news_themes.theme', temaSelecionado);
    }

    // Paginação
    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    query = query.order('date', { ascending: false }).range(from, to);

    const { data, count, error } = await query;

    loadingMsg.style.display = "none";

    if (error) {
        console.error("Erro ao buscar notícias:", error);
        newsFeed.innerHTML = "<p>Erro ao carregar notícias. Verifique a conexão com o banco de dados ou os filtros.</p>";
        return;
    }

    if (!data || data.length === 0) {
        newsFeed.innerHTML = "<p>Nenhuma notícia encontrada com esses filtros.</p>";
        pageInfo.textContent = `Página ${currentPage}`;
        return;
    }

    renderizarFeed(data);
    atualizarControlesPaginacao(count);
}

function renderizarFeed(listaNoticias) {
    listaNoticias.forEach(news => {
        // CORREÇÃO: Verifica se a data existe antes de formatar
        let dataPub = "Sem data";
        if (news.date) {
            dataPub = new Date(news.date).toLocaleDateString('pt-BR');
        }
        
        // Coletar temas desta notícia (caso venha array do join)
        // O Supabase retorna news_themes como array de objetos [{theme: 'x'}, {theme: 'y'}]
        let temasTags = "";
        if (news.news_themes && news.news_themes.length > 0) {
            temasTags = news.news_themes.map(t => `<span class="badge-theme">${t.theme}</span>`).join(" ");
        }

        const div = document.createElement("div");
        div.className = "news-card";
        div.innerHTML = `
            <div class="news-header">
                <h3><a href="${news.link}" target="_blank">${news.titulo}</a></h3>
                <span class="news-date">${dataPub}</span>
            </div>
            <div class="news-meta">
                <span>Fonte: ${news.fonte}</span> | <span>Autor: ${news.autor}</span>
            </div>
            <p class="news-desc">${news.descricao}</p>
            <div class="news-footer">
                <div class="themes-list">${temasTags}</div>
                <a href="${news.link}" target="_blank" class="read-more-btn">Ler completa</a>
            </div>
        `;
        newsFeed.appendChild(div);
    });
}

function atualizarControlesPaginacao(totalItems) {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    pageInfo.textContent = `Página ${currentPage} de ${totalPages || 1}`;
    
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage >= totalPages;
}

function mudarPagina(delta) {
    currentPage += delta;
    carregarNoticias();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function limparFiltros() {
    searchInput.value = "";
    themeSelect.value = "";
    dateInput.value = "";
    currentPage = 1;
    statsPanel.style.display = "none";
    carregarNoticias();
}