// =============================================
// ESTADO GLOBAL
// =============================================
let rawData = [];
let data = [];
let filtered = [];
let activeFilters = {};
let charts = {};
let chartFilters = {}; 
let currentTab = 'visao-geral'; // Rastreia a aba ativa
let chartFiltersVisaoGeral = {}; // Filtros de gráfico da aba Visão Geral
let chartFiltersInventario = {}; // Filtros de gráfico da aba Inventário 

// Mapeamento de gráficos para campos de filtro
const chartFieldMap = {
    "chartArea": "area",
    "chartBaseLegal": "baseLegal",
    "chartSistemas": "sistemas",
    "chartTerceiros": "nomeTerceiro",
    "chartPaises": "paises",
    "chartSensivel": "sensivel",
    "chartMenor": "menor",
    "chartEmpresasSubprocessos": "empresa",
    "chartTransfIntl": "transfIntl",
    "chartComTerceiros": "terceiros",
    "chartTiposDados": "dados",
    "chartAreaInv": "area",
    "chartBaseLegalInv": "baseLegal",
    "chartSistemasInv": "sistemas",
    "chartTerceirosInv": "nomeTerceiro",
    "chartPaisesInv": "paises",
    "chartSensivelInv": "sensivel",
    "chartMenorInv": "menor",
    "chartEmpresasSubprocessosInv": "empresa",
    "chartTransfIntlInv": "transfIntl",
    "chartComTerceirosInv": "terceiros",
    "chartTiposDadosInv": "dados"
};

let inventoryRiskLinks = {};
const INVENTORY_SHEET_NAMES = [
    "Mapeamento",
    "Inventário Cliente",
    "Inventario Cliente",
    "Inventário",
    "Inventario",
    "Dados do Inventário",
    "Inventario LGPD"
];
const INVENTORY_REQUIRED_FIELDS = [
    "area",
    "processo",
    "dados"
];
// =============================================
// UTILITÁRIOS
// =============================================

let nomecliente = "NOME DO CLIENTE";

document.addEventListener("DOMContentLoaded", () => {
    const el = document.getElementById('nomecliente');
    if (el) el.innerText = nomecliente;
});

// Funções de utilitários de dados movidas para src/components/dataHelpers.js

// =============================================
// NAVEGAÇÃO
// =============================================
function switchTab(tabId) {
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    if (event) event.currentTarget.classList.add('active');

    document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
    document.getElementById('tab-' + tabId).classList.add('active');

    // Atualiza a aba ativa
    currentTab = tabId;

    // Sincroniza filtros: Visão Geral e Inventário compartilham os mesmos filtros
    if (tabId === 'visao-geral') {
        chartFilters = JSON.parse(JSON.stringify(chartFiltersVisaoGeral));
    } else if (tabId === 'inventario') {
        // Copia filtros da Visão Geral para Inventário (sincronização)
        chartFilters = JSON.parse(JSON.stringify(chartFiltersVisaoGeral));
        chartFiltersInventario = JSON.parse(JSON.stringify(chartFiltersVisaoGeral));
    } else {
        chartFilters = {};
    }

    const titles = {
        'visao-geral': 'Visão Geral',
        'inventario': 'Inventário',
        'riscos': 'Riscos',
        'matriz': 'Matriz',
        'plano': 'Plano',
        'heatmap': 'Heatmap'
    };

    document.getElementById('pageTitle').innerText = titles[tabId] || 'Dashboard';
    
    // Reaplica filtros com o chartFilters correto
    updateFilterIndicator();
    applyFilters();

    if (tabId === 'matriz' || tabId === 'heatmap') {
        if (typeof renderRiskHeatmap === 'function') {
            renderRiskHeatmap();
        }
    }
}

// =============================================
// UPLOAD
// =============================================
const COLUMN_MAP = {
    id: ["id", "ID"],

    empresa: [
        "Empresa",
        "Nome da empresa",
        "Empresa/Unidade"
    ],

    area: [
        "Nome da área de negócio",
        "Área de negócio",
        "Área",
        "Nome da Área"
    ],

    responsavel: [
        "Nome do responsável pelo processo",
        "Nome e e-mail do responsável pelo processo"
    ],

    processo: [
        "Nome do processo",
        "Processo"
    ],

    subprocesso: [
        "Nome do sub-processo",
        "Sub-processo",
        "Subprocesso"
    ],

    descricao: [
        "Descrição do subprocesso",
        "Descrição do sub-processo"
    ],

    dados: [
        "Quais dados?",
        "Quais dados são tratados?",
        "Dados tratados"
    ],

    sensivel: [
        "Utiliza dado sensível ? (Sim ou Não)",
        "Utiliza dado sensível ?",
        "Utiliza dado sensível?"
    ],

    dadosSensiveis: [
        "Quais dados sensíveis?",
        "Quais dados sensíveis são utilizados?"
    ],

    menor: [
        "Utiliza algum tipo de dado de menores de 18 anos?",
        "Utiliza dado de menores?"
    ],

    dadosMenor: [
        "Descreva os dados de menores de 18 anos.",
        "Dados de menores"
    ],

    armazenamento: [
        "Armazenamento (Físico ou digital)",
        "Armazenamento"
    ],

    sistemas: [
        "Quais Sistemas são acessados? (Tráfego)",
        "Quais sistemas são acessados?",
        "Sistemas",
        "Como e onde são armazenado os dados físicos e digitais do processo?"
    ],

    tipoTitular: [
        "Tipo do Titular?",
        "Tipo do titular"
    ],

    baseLegal: [
        "Base legal de tratamento",
        "Base Legal de Tratamento",
        "Base legal"
    ],

    terceiros: [
        "Há compartilhamento de dados com Terceiros e/ou Prestadores de Serviços?",
        "Há compartilhamento com terceiros?"
    ],

    nomeTerceiro: [
        "Caso sim, informe o nome do Terceiro e/ou Prestador de Serviço que recebe os dados.",
        "Informe o nome do Terceiro e/ou Prestador de Serviço que recebe os dados"
    ],

    transfIntl: [
        "Há transferência internacional de dados?",
        "Transferência internacional"
    ],

    paises: [
        "Caso sim, informe quais os Países e Estados que recebem estes dados.",
        "Países",
        "Países e Estados"
    ]
};

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (e) {
        const dataArray = new Uint8Array(e.target.result);
        const workbook = XLSX.read(dataArray, { type: 'array' });

        const sheetNames = workbook.SheetNames.join(', ');
        console.log('Sheets disponíveis:', sheetNames);

        let sheet = findBestSheet(workbook, INVENTORY_SHEET_NAMES);
        if (!sheet && workbook.SheetNames.length > 0) {
            sheet = workbook.Sheets[workbook.SheetNames[0]];
            console.warn('Nenhuma aba padrão encontrada, usando a primeira aba:', workbook.SheetNames[0]);
        }

        if (!sheet) {
            alert("Nenhuma planilha encontrada no arquivo de inventário.");
            return;
        }

        const json = parseSheetWithHeaderDetection(sheet, INVENTORY_REQUIRED_FIELDS, COLUMN_MAP);

        if (!json || json.length === 0) {
            alert("A planilha de inventário foi carregada, mas não contém dados válidos.");
            return;
        }

        rawData = json;

        const missingFields = listMissingColumns(rawData[0], INVENTORY_REQUIRED_FIELDS, COLUMN_MAP);
        if (missingFields.length > 0) {
            alert(`Campos obrigatórios ausentes no inventário: ${missingFields.join(', ')}. Verifique o arquivo e tente novamente.`);
            rawData = [];
            return;
        }

        console.log("Colunas detectadas no inventário:", Object.keys(rawData[0] || {}));
        console.log("Primeira linha do inventário:", rawData[0]);

        normalizeData();
        populateFilterOptions();
        buildInventoryRiskLinks();
        applyFilters();
        updateFilterIndicator();

        const riskNote = Array.isArray(riskData) && riskData.length > 0
            ? `${getLinkedRiskSummary().totalRisks} riscos relacionados detectados.`
            : 'Importe a matriz de risco para ver conexões entre inventário e riscos.';

        alert(`Dados do inventário carregados: ${data.length}. ${riskNote}`);
    };

    reader.readAsArrayBuffer(file);
}

// =============================================
// NORMALIZAÇÃO
// =============================================
function normalizeData() {
    data = rawData.map((row, idx) => {
        // Captura os valores brutos baseando-se estritamente no mapeamento de colunas detectado
        let areaOriginal = getValue(row, "area") || row["Nome da área de negócio"] || row["Área"] || "";
        let processoBruto = getValue(row, "processo") || row["Nome do processo"] || row["Processo"] || "";
        let subprocessoBruto = getValue(row, "subprocesso") || row["Nome do sub-processo"] || row["Sub-processo"] || "";

        // Garante que o texto seja tratado sem espaços invisíveis nas pontas
        if (typeof areaOriginal === 'string') areaOriginal = areaOriginal.trim();
        if (typeof processoBruto === 'string') processoBruto = processoBruto.trim();
        if (typeof subprocessoBruto === 'string') subprocessoBruto = subprocessoBruto.trim();

        // Normalização das flags de risco
        const sensivelRaw = normalizeText(getValue(row, "sensivel") || "");
        const sensivel = sensivelRaw === "sim" || sensivelRaw === "s" || sensivelRaw.includes("sim");

        const menorRaw = normalizeText(getValue(row, "menor") || "");
        const menor = menorRaw === "sim" || menorRaw === "s" || menorRaw.includes("sim");

        let risco = "baixo";
        if (sensivel || menor) risco = "alto";
        if (sensivel && menor) risco = "crítico";

        const empresaBruto = getValue(row, "empresa");

        return {
            id: getValue(row, "id") || (idx + 1),
            origIndex: idx,
            empresa: empresaBruto ? splitMulti(empresaBruto) : [],
            area: areaOriginal ? [areaOriginal] : [],
            processo: processoBruto ? [processoBruto] : [],
            subprocesso: subprocessoBruto ? splitMulti(subprocessoBruto) : [],
            dados: splitMulti(getValue(row, "dados") || ""),
            sensivel,
            menor,
            baseLegal: splitMulti(getValue(row, "baseLegal") || ""),
            sistemas: splitMulti(getValue(row, "sistemas") || ""),
            armazenamento: getValue(row, "armazenamento") || "não informado",
            terceiros: normalizeText(getValue(row, "terceiros")) === "sim", 
            nomeTerceiro: splitMulti(getValue(row, "nomeTerceiro") || ""),
            transfIntl: normalizeText(getValue(row, "transfIntl")) === "sim", 
            paises: splitMulti(getValue(row, "paises") || ""),
            nivelRisco: risco
        };
    }).filter(r => {
        // SEGURANÇA E INDEPENDÊNCIA: Só aceita a linha se ela tiver uma Área e um Processo TEXTUAIS e REAIS preenchidos
        const temArea = r.area.length > 0 && r.area[0] !== "" && r.area[0] !== "não informado";
        const temProcesso = r.processo.length > 0 && r.processo[0] !== "" && r.processo[0] !== "não informado";
        return temArea && temProcesso;
    });
}
function getInventoryRowKey(row) {
    const rawId = normalizeText(row.id || "");
    if (rawId) return rawId;
    if (typeof row.origIndex === 'number') return `__row_${row.origIndex}`;
    return normalizeText(String(row[Object.keys(row)[0]] || ""));
}

function getRowKeyFromRaw(rawRow, index) {
    const rawId = normalizeText(getValue(rawRow, 'id') || "");
    if (rawId) return rawId;
    return normalizeText(String(rawRow[Object.keys(rawRow)[0]] || `__row_${index}`));
}

function getRiskUniqueId(risk) {
    const id = normalizeText(risk.id || "");
    if (id) return id;
    return normalizeText(`${risk.empresa}|${risk.area}|${risk.subprocesso}|${risk.nomeRisco}`);
}

function riskMatchesInventoryRow(inv, risk) {
    const invEmpresa = inv.empresa.map(normalizeText);
    const invArea = inv.area.map(normalizeText);
    const invProcesso = inv.processo.map(normalizeText);
    const invSubprocessos = splitMulti(inv.subprocesso || "")
        .map(normalizeText)
        .filter(v => v && v !== 'não informado' && v !== '—');

    const riskEmpresa = normalizeText(risk.empresa);
    const riskArea = normalizeText(risk.area);
    const riskSubprocessos = splitMulti(risk.subprocesso || "")
        .map(normalizeText)
        .filter(v => v && v !== 'não informado' && v !== '—');
    const riskProcesso = normalizeText(risk.nomeRisco || risk.nomeGrupo || risk.classificacao || "");

    const empresaMatch = !riskEmpresa || invEmpresa.includes(riskEmpresa);
    const areaMatch = !riskArea || invArea.includes(riskArea);

    let subprocessoMatch = true;
    if (invSubprocessos.length > 0 && riskSubprocessos.length > 0) {
        subprocessoMatch = invSubprocessos.some(invSub =>
            riskSubprocessos.some(riskSub =>
                invSub === riskSub || invSub.includes(riskSub) || riskSub.includes(invSub)
            )
        );
    }

    let processoMatch = false;
    if (riskProcesso) {
        processoMatch = invProcesso.some(p =>
            p === riskProcesso || p.includes(riskProcesso) || riskProcesso.includes(p)
        );
    }

    const relationMatch = (invSubprocessos.length > 0 && riskSubprocessos.length > 0)
        ? subprocessoMatch
        : processoMatch;

    return empresaMatch && areaMatch && relationMatch;
}

function buildInventoryRiskLinks() {
    inventoryRiskLinks = {};

    if (!Array.isArray(data) || !data.length || !Array.isArray(riskData) || !riskData.length) {
        return;
    }

    data.forEach(inv => {
        const invKey = getInventoryRowKey(inv);
        const matches = riskData.filter(risk => riskMatchesInventoryRow(inv, risk));
        const uniqueRiskIds = [...new Set(matches.map(getRiskUniqueId))];
        const seen = new Set();
        const byLevel = matches.reduce((acc, r) => {
            const riskKey = getRiskUniqueId(r);
            if (seen.has(riskKey)) return acc;
            seen.add(riskKey);
            acc[r.nivelRisco] = (acc[r.nivelRisco] || 0) + 1;
            return acc;
        }, {});

        inventoryRiskLinks[invKey] = {
            total: uniqueRiskIds.length,
            riskIds: uniqueRiskIds,
            byLevel
        };
    });
}

function getLinkedRiskSummary() {
    const linked = Object.values(inventoryRiskLinks);
    const distinctRiskIds = new Set(linked.flatMap(item => item.riskIds || []));
    return { totalRisks: distinctRiskIds.size };
}

// =============================================
// FILTROS
// =============================================
function populateFilterOptions() {
    // Empresa é array após splitMulti, precisamos flatten para opções
    const empresas = [...new Set(data.flatMap(d => d.empresa))].sort();

    // Area e processo são arrays, precisamos flatten
    const areas = [...new Set(data.flatMap(d => d.area))].sort();
    const processos = [...new Set(data.flatMap(d => d.processo))].sort();

    const fillSelect = (id, list) => {
        const select = document.getElementById(id);
        if (!select) return;

        select.innerHTML =
            '<option value="">Todas</option>' +
            list.map(v => `<option value="${v}">${v}</option>`).join('');
    };

    fillSelect('f-empresa', empresas);
    fillSelect('fi-empresa', empresas);
    fillSelect('f-area', areas);
    fillSelect('fi-area', areas);
    fillSelect('f-processo', processos);
    fillSelect('fi-processo', processos); // ADICIONADO: filtro de processo na página de inventário
}

function applyFilters() {
    // Define qual selector usar baseado na aba ativa
    const filterPrefix = currentTab === 'inventario' ? 'fi-' : 'f-';
    
    const fEmpresa = normalizeText(document.getElementById(filterPrefix + 'empresa')?.value || "");
    const fArea = normalizeText(document.getElementById(filterPrefix + 'area')?.value || "");
    const fProcesso = normalizeText(document.getElementById(filterPrefix + 'processo')?.value || "");
    const fSensivel = document.getElementById(filterPrefix + 'sensivel')?.value || "";
    const fMenor = document.getElementById(filterPrefix + 'menor')?.value || "";

    filtered = data.filter(row => {
        // Filtros padrões (dropdowns)
        if (fEmpresa && !row.empresa.includes(fEmpresa)) return false;
        if (fArea && !row.area.includes(fArea)) return false;
        if (fProcesso && !row.processo.includes(fProcesso)) return false;

        if (fSensivel === "Sim" && !row.sensivel) return false;
        if (fSensivel === "Não" && row.sensivel) return false;

        if (fMenor === "Sim" && !row.menor) return false;
        if (fMenor === "Não" && row.menor) return false;

        // MULTI-FILTROS de gráfico (acumulam) - usa chartFilters atual
    // MULTI-FILTROS de gráfico (acumulam) - usa chartFilters atual
for (const [field, values] of Object.entries(chartFilters)) {
    if (!values || values.length === 0) continue;

    const fieldValue = row[field];
    const matches = values.some(value => matchesFilterValue(field, fieldValue, value));

    if (!matches) return false;
}
        return true;
    });

renderKPIs();
renderTable();
updateCharts(); // NOVA FUNÇÃO    
}

function updateCharts() {
    renderCharts();
    renderInventoryCharts();
}

function renderInventoryCharts() {
    createChart("chartAreaInv", sortByValue(groupSubprocessosBy("area")), "bar");
    createChart("chartBaseLegalInv", groupCount("baseLegal"), "doughnut");
    createChart("chartSistemasInv", topN(sortByValue(groupCount("sistemas")), 10), "bar", "y");
    createChart("chartTerceirosInv", topN(sortByValue(groupCount("nomeTerceiro")), 10), "bar", "y");
    createChart("chartPaisesInv", sortByValue(groupCount("paises")), "bar");
    createChart("chartSensivelInv", {
        "Sim": filtered.filter(r => r.sensivel).length,
        "Não": filtered.filter(r => !r.sensivel).length
    }, "doughnut");
    createChart("chartMenorInv", {
        "Sim": filtered.filter(r => r.menor).length,
        "Não": filtered.filter(r => !r.menor).length
    }, "doughnut");
    createChart("chartTransfIntlInv", {
        "Com Transferência Intl": filtered.filter(r => r.transfIntl).length,
        "Sem Transferência Intl": filtered.filter(r => !r.transfIntl).length
    }, "doughnut");
    createChart("chartComTerceirosInv", {
        "Com Compartilhamento": filtered.filter(r => r.terceiros).length,
        "Sem Compartilhamento": filtered.filter(r => !r.terceiros).length
    }, "doughnut");
    createChart("chartEmpresasSubprocessosInv", sortByValue(groupSubprocessosBy("empresa")), "bar");
    createChart("chartTiposDadosInv", groupCount("dados"), "doughnut");
}

function resetFilters() {
    // limpa TODOS os selects
    document.querySelectorAll('select').forEach(select => {
        select.value = "";
    });

    // limpa busca da tabela (se existir)
    const search = document.getElementById("tableSearch");
    if (search) search.value = "";

    const riskSearch = document.getElementById("riskSearch");
    if (riskSearch) riskSearch.value = "";

    // limpa filtros de gráfico de ambas as abas
    chartFiltersVisaoGeral = {};
    chartFiltersInventario = {};
    chartFilters = {};

    // Força atualizar chartFilters para a aba atual (cópia profunda)
    if (currentTab === 'visao-geral') {
        chartFilters = JSON.parse(JSON.stringify(chartFiltersVisaoGeral));
    } else if (currentTab === 'inventario') {
        chartFilters = JSON.parse(JSON.stringify(chartFiltersInventario));
    } else {
        chartFilters = {};
    }

    // reaplica filtros (sem nada selecionado)
    updateFilterIndicator();
    applyFilters();
}

// =============================================
// KPIs
// =============================================
function renderKPIs() {
    const kpiGrid = document.getElementById("kpiGrid");
    if (!kpiGrid) return; 
    
const total = filtered.reduce((sum, r) => sum + getSubprocessoCount(r), 0);    const sensiveis = filtered.filter(d => d.sensivel).length;
    const menores = filtered.filter(d => d.menor).length;

    // CORREÇÃO: Filtra para não contar "não informado" ou valores vazios como uma empresa válida
    const uniqueEmpresas = new Set(
        filtered.flatMap(d => d.empresa)
                .map(e => normalizeText(e))
                .filter(e => e && e !== "" && e !== "nao informado")
    ).size;

    // CORREÇÃO: Filtra para não contar processos inválidos ou vazios
    const processos = new Set(
        filtered.flatMap(d => d.processo)
                .map(p => normalizeText(p))
                .filter(p => p && p !== "" && p !== "nao informado")
    ).size;

    const riskIds = new Set(
        filtered.flatMap(r => {
            const key = getInventoryRowKey(r);
            return (inventoryRiskLinks[key]?.riskIds || []);
        })
    );
    const relatedRiskCount = riskIds.size;

    kpiGrid.innerHTML = `
        <div class="kpi-card good"><div class="kpi-label">Empresas</div><div class="kpi-value">${uniqueEmpresas}</div></div>
        <div class="kpi-card"><div class="kpi-label">Subprocessos</div><div class="kpi-value">${total}</div></div>
        <div class="kpi-card danger"><div class="kpi-label">Sensíveis</div><div class="kpi-value">${sensiveis}</div></div>
        <div class="kpi-card purple"><div class="kpi-label">Menores</div><div class="kpi-value">${menores}</div></div>
        <div class="kpi-card yellow"><div class="kpi-label">Processos</div><div class="kpi-value">${processos}</div></div>
        <div class="kpi-card danger"><div class="kpi-label">Riscos Relacionados</div><div class="kpi-value">${relatedRiskCount}</div></div>
    `;
}
// =============================================
// AGRUPAMENTO
// =============================================
function groupCount(field){

    return filtered.reduce((acc,r)=>{

        const values = Array.isArray(r[field])
            ? r[field]
            : [r[field]];

        values.forEach(v=>{

            if(!v) return;

            acc[v]=(acc[v]||0)+1;

        });

        return acc;

    },{});

}

function groupSubprocessosBy(field) {
    return filtered.reduce((acc, row) => {
        const groups = Array.isArray(row[field]) ? row[field] : [row[field]];
        const count = getSubprocessoCount(row);

        groups.forEach(group => {
            const value = typeof group === 'string' ? group.trim() : group;
            if (!value) return;

            const normalized = normalizeText(value);
            if (normalized === 'não informado' || normalized === 'nao informado') return;

            acc[value] = (acc[value] || 0) + count;
        });

        return acc;
    }, {});
}
// Ordena dados em ordem decrescente (mais mencionados primeiro)
function sortByValue(obj) {
    return Object.fromEntries(
        Object.entries(obj).sort(([, a], [, b]) => b - a)
    );
}

// Limita aos top N itens
function topN(obj, n) {
    return Object.fromEntries(
        Object.entries(obj).slice(0, n)
    );
}



function filterByChartClick(chartId, label) {
    const fieldName = chartFieldMap[chartId];
    if (!fieldName) return;

    const cleanLabel = label.replace(/\s*\(\d+\)$/, '');
    const value = chartLabelToFilterValue(chartId, cleanLabel);

    if (!chartFilters[fieldName]) {
        chartFilters[fieldName] = [];
    }

    const index = chartFilters[fieldName].indexOf(value);

    if (index > -1) {
        chartFilters[fieldName].splice(index, 1);
        if (chartFilters[fieldName].length === 0) {
            delete chartFilters[fieldName];
        }
    } else {
        chartFilters[fieldName].push(value);
    }

    chartFiltersVisaoGeral = JSON.parse(JSON.stringify(chartFilters));
    chartFiltersInventario = JSON.parse(JSON.stringify(chartFilters));

    updateFilterIndicator();
    applyFilters();
}

function updateFilterIndicator() {
    const indicators = [
        document.getElementById('chartFilterIndicator'),
        document.getElementById('chartFilterIndicatorVisao')
    ].filter(Boolean);
    if (!indicators.length) return;

    const fieldLabels = {
        "area": "Área",
        "baseLegal": "Base Legal",
        "sistemas": "Sistemas",
        "nomeTerceiro": "Terceiros",
        "paises": "Países",
        "sensivel": "Dados Sensíveis",
        "menor": "Dados de Menores",
        "empresa": "Empresa"
    };

    // Constrói string com todos os filtros ativos
    let filterHTML = "";
    for (const [field, values] of Object.entries(chartFilters)) {
        if (values.length > 0) {
            const fieldLabel = fieldLabels[field] || field;
            const valuesList = values.join(", ");
            filterHTML += `<div style="margin-bottom: 8px;"><strong>${fieldLabel}:</strong> ${valuesList} <button onclick="clearChartFilterField('${field}')" style="margin-left: 8px; padding: 2px 8px; cursor: pointer; background: #4f8ef7; color: white; border: none; border-radius: 3px; font-size: 12px;">×</button></div>`;
        }
    }

    if (filterHTML) {
        const content = "<strong>Filtros de gráfico ativos:</strong>" + filterHTML;
        indicators.forEach(indicator => {
            indicator.innerHTML = content;
            indicator.style.display = 'block';
        });
    } else {
        indicators.forEach(indicator => {
            indicator.style.display = 'none';
        });
    }
}

function clearChartFilterField(field) {
    delete chartFilters[field];
    
    // Atualiza o objeto correto baseado na aba ativa (cópia profunda)
    if (currentTab === 'visao-geral') {
        chartFiltersVisaoGeral = JSON.parse(JSON.stringify(chartFilters));
    } else if (currentTab === 'inventario') {
        chartFiltersInventario = JSON.parse(JSON.stringify(chartFilters));
    }
    
    updateFilterIndicator();
    applyFilters();
}

function clearChartFilter() {
    chartFilters = {};
    
    // Atualiza o objeto correto baseado na aba ativa
    if (currentTab === 'visao-geral') {
        chartFiltersVisaoGeral = {};
    } else if (currentTab === 'inventario') {
        chartFiltersInventario = {};
    }
    
    updateFilterIndicator();
}

// =============================================
// TABELA
// =============================================
function renderTable() {
    const tbody = document.getElementById("tableBody");
    if (!tbody) return; // Se não está na aba de inventário, não renderiza
    const searchInput = document.getElementById("tableSearch");
    const search = searchInput ? normalizeText(searchInput.value) : "";

    // Se não houver dados brutos, não tenta renderizar tabela dinâmica
    if (!rawData || rawData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="999">Nenhum dado do inventário carregado.</td></tr>';
        const tableCount = document.getElementById("tableCount");
        if (tableCount) tableCount.innerText = 0;
        return;
    }

    // Monta lista de colunas a partir da primeira linha do arquivo
    const rawHeaders = Object.keys(rawData[0]);
    const thead = document.querySelector('#mainTable thead');
    if (thead) {
        const tableHeaders = [...rawHeaders, 'Riscos Relacionados'];
        thead.innerHTML = '<tr>' + tableHeaders.map(h => `<th>${h}</th>`).join('') + '</tr>';
    }

    // Filtra linhas processadas, mantendo referência ao rawRow via origIndex
    const displayProcessed = filtered.filter(r => {
        const rawRow = rawData[r.origIndex] || rawData.find(row => {
            const firstKey = Object.keys(row)[0];
            return String(row[firstKey]) === String(r.id) || String(getValue(row, 'id')) === String(r.id);
        });

        const searchableText = `\n            ${r.id} ${Array.isArray(r.empresa)?r.empresa.join(' '):r.empresa} ${Array.isArray(r.area)?r.area.join(' '):r.area} ${Array.isArray(r.processo)?r.processo.join(' '):r.processo} \n            ${r.subprocesso} ${Array.isArray(r.dados)?r.dados.join(' '):r.dados} ${r.armazenamento} ${Array.isArray(r.sistemas)?r.sistemas.join(' '):r.sistemas}\n            ${r.baseLegal? r.baseLegal.join(' '):''} ${r.nomeTerceiro? r.nomeTerceiro.join(' '):''} ${r.paises? r.paises.join(' '):''}\n            ${getValue(rawRow || {}, 'responsavel')} ${getValue(rawRow || {}, 'descricao')}\n        `.toLowerCase();

        return searchableText.includes(search);
    });

    const rows = displayProcessed.map(r => rawData[r.origIndex] || rawData.find(row => {
        const firstKey = Object.keys(row)[0];
        return String(row[firstKey]) === String(r.id) || String(getValue(row, 'id')) === String(r.id);
    })).filter(Boolean);

    tbody.innerHTML = rows.map((row, index) => {
        const rawKey = getRowKeyFromRaw(row, index);
        const riskLink = inventoryRiskLinks[rawKey] || { total: 0, byLevel: {} };
        const riskDetail = riskLink.total > 0
            ? `${riskLink.total} risco(s) — ${Object.entries(riskLink.byLevel).map(([level, count]) => `${level}: ${count}`).join(', ')}`
            : 'Nenhum risco relacionado';

        return '<tr>' +
            rawHeaders.map(h => `<td>${(row[h] !== undefined && row[h] !== null) ? row[h] : ''}</td>`).join('') +
            `<td>${riskDetail}</td>` +
            '</tr>';
    }).join('');

    const tableCount = document.getElementById("tableCount");
    if (tableCount) tableCount.innerText = rows.length;
}

// =============================================
// CHARTS
// =============================================

function renderCharts() {

    createChart(
        "chartArea",
        sortByValue(groupSubprocessosBy("area")),
        "bar"
    );

    createChart(
        "chartBaseLegal",
        groupCount("baseLegal"),
        "doughnut"
    );

    createChart(
        "chartSistemas",
        topN(sortByValue(groupCount("sistemas")),10),
        "bar",
        "y"
    );

    createChart(
        "chartTerceiros",
        topN(sortByValue(groupCount("nomeTerceiro")),10),
        "bar",
        "y"
    );

    createChart(
        "chartPaises",
        sortByValue(groupCount("paises")),
        "bar"
    );

    createChart("chartSensivel",{
        "Sim": filtered.filter(r=>r.sensivel).length,
        "Não": filtered.filter(r=>!r.sensivel).length
    },"doughnut");

    createChart("chartMenor",{
        "Sim": filtered.filter(r=>r.menor).length,
        "Não": filtered.filter(r=>!r.menor).length
    },"doughnut");

    createChart("chartTransfIntl",{
        "Com Transferência Intl":
            filtered.filter(r=>r.transfIntl).length,

        "Sem Transferência Intl":
            filtered.filter(r=>!r.transfIntl).length

    },"doughnut");

    createChart("chartComTerceiros",{
        "Com Compartilhamento":
            filtered.filter(r=>r.terceiros).length,

        "Sem Compartilhamento":
            filtered.filter(r=>!r.terceiros).length

    },"doughnut");


    createChart(
        "chartEmpresasSubprocessos",
        sortByValue(groupSubprocessosBy("empresa")),
        "bar"
    );

    createChart(
        "chartTiposDados",
        groupCount("dados"),
        "doughnut"
    );
}

// =============================================
// RENDER GERAL
// =============================================
function renderAll() {
    renderKPIs();
    renderCharts();
    renderInventoryCharts();
    renderTable();
    renderRiskKpis();
    renderRiskCharts();
    renderMatrixCharts();
    renderRiskTable();
    renderMatrix();
    renderActionPlan();
    renderRiskHeatmap();
}