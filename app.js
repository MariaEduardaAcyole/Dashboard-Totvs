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
    "chartTiposDados": "dados"
};
// =============================================
// UTILITÁRIOS
// =============================================

let nomecliente = "Duda";

document.addEventListener("DOMContentLoaded", () => {
    const el = document.getElementById('nomecliente');
    if (el) el.innerText = nomecliente;
});

function normalizeRowKeys(row) {
    const newRow = {};

    Object.keys(row).forEach(key => {
        const cleanKey = key.trim(); // remove espaços invisíveis
        newRow[cleanKey] = row[key];
    });

    return newRow;
}

function normalizeText(v) {
    return String(v || "")
        .toLowerCase()
        .trim();
}

function normalizeFilterValue(fieldName, value) {
    const normalizedValue = normalizeText(value);

    if (fieldName === 'sensivel' || fieldName === 'menor') {
        return normalizedValue === 'sim' || normalizedValue === 'true';
    }

    if (fieldName === 'terceiros' || fieldName === 'transfIntl') {
        if (normalizedValue.includes('com') || normalizedValue === 'sim') return 'sim';
        if (normalizedValue.includes('sem') || normalizedValue === 'nao' || normalizedValue === 'não') return 'não';
        return normalizedValue;
    }

    return normalizedValue;
}

function chartLabelToFilterValue(chartId, label) {
    const normalizedLabel = normalizeText(label);

    if (chartId === 'chartTransfIntl') {
        return normalizedLabel.includes('com') ? 'sim' : 'não';
    }

    if (chartId === 'chartComTerceiros') {
        return normalizedLabel.includes('com') ? 'sim' : 'não';
    }

    return normalizedLabel;
}

function matchesFilterValue(fieldName, rowValue, filterValue) {
    const normalizedFilter = normalizeFilterValue(fieldName, filterValue);

    if (fieldName === 'sensivel' || fieldName === 'menor') {
        return rowValue === normalizedFilter;
    }

    if (fieldName === 'terceiros' || fieldName === 'transfIntl') {
        return normalizeFilterValue(fieldName, rowValue) === normalizedFilter;
    }

    if (Array.isArray(rowValue)) {
        return rowValue
            .map(v => normalizeText(v))
            .includes(normalizedFilter);
    }

    return normalizeText(rowValue) === normalizedFilter;
}

function getField(row, possibleNames) {
    const keys = Object.keys(row);

    for (const key of keys) {
        const normalizedKey = normalizeText(key);

        for (const name of possibleNames) {
            if (normalizedKey.includes(name)) {
                return row[key];
            }
        }
    }

    return "";
}

function splitMulti(value) {
    if (!value) return ["não informado"];

    return [...new Set(
        String(value)
            .split(";")
            .map(v => normalizeText(v.trim())) // 👈 trim EXTRA aqui
            .filter(v => v && v !== "")
    )];
}

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
}

// =============================================
// UPLOAD
// =============================================

const COLUMN_MAP = {
    id: ["id"],
    empresa: ["Empresa"],
    area: ["Nome da área de negócio"],
    responsavel: [" Nome do responsável pelo processo"],
    processo: ["Nome do processo"],
    subprocesso: ["Nome do subprocesso"],
    descricao: ["Descrição do subprocesso"],

    dados: ["Quais dados?"],
    sensivel: ["Utiliza dado sensível ? (Sim ou Não)"],
    dadosSensiveis: ["Quais dados sensíveis?"],

    menor: ["Utiliza algum tipo de dado de menores de 18 anos?"],
    dadosMenor: ["Descreva os dados de menores de 18 anos."],

    armazenamento: ["Armazenamento (Físico ou digital)"],
    sistemas: ["Quais Sistemas são acessados? (Tráfego)"],
    tipoTitular: ["Tipo do Titular?"],

    baseLegal: ["Base legal de tratamento"],

    terceiros: ["Há compartilhamento de dados com Terceiros e/ou Prestadores de Serviços?"],
    nomeTerceiro: ["Caso sim, informe o nome do Terceiro e/ou Prestador de Serviço que recebe os dados."],

    transfIntl: ["Há transferência internacional de dados?"],
    paises: ["Caso sim, informe quais os Países e Estados que recebem estes dados."]
};
console.log("COLUNAS DETECTADAS:", Object.keys(json[0] || {}));

console.log("VALORES MENOR (bruto):");
json.slice(0, 10).forEach((r, i) => {
    const key = Object.keys(r).find(k =>
        k.toLowerCase().includes("menor")
    );
    console.log(i, key, key ? r[key] : "SEM COLUNA");
});

function normalizeHeader(str) {
    return String(str || "")
        .toLowerCase()
        .normalize("NFD") // remove acentos
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function getValue(row, field) {
    const possibleNames = COLUMN_MAP[field];
    if (!possibleNames) return "";

    const keys = Object.keys(row);

    for (const key of keys) {
        for (const name of possibleNames) {
            if (key.includes(name)) {
                return row[key];
            }
        }
    }

    return "";
}

function handleFileUpload(event) {
    console.log("UPLOAD DISPARADO");

    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (e) {
        const dataArray = new Uint8Array(e.target.result);
        const workbook = XLSX.read(dataArray, { type: 'array' });

        const sheet = workbook.Sheets["Inventário SONEPAR"];
        if (!sheet) {
            alert("Aba 'Inventário SONEPAR' não encontrada.");
            return;
        }

        const json = XLSX.utils.sheet_to_json(sheet, {
            range: 2,
            defval: ""
        });

        console.log("JSON:", json);

        // ✅ AQUI DENTRO (correto)
        rawData = json.map(normalizeRowKeys);

        console.log("Colunas:", Object.keys(rawData[0] || {}));
        console.log("Primeira linha:", rawData[0]);

        normalizeData();
        populateFilterOptions();
        applyFilters();
        updateFilterIndicator();

        alert("Dados carregados: " + data.length);
    };

    reader.readAsArrayBuffer(file);
}

// =============================================
// NORMALIZAÇÃO
// =============================================
function normalizeData() {
    data = rawData.map(row => {

        const sensivelRaw = normalizeText(getValue(row, "sensivel"));
const sensivel = 
    sensivelRaw === "sim" ||
    sensivelRaw === "s" ||
    sensivelRaw.includes("sim");


const menorRaw = normalizeText(getValue(row, "menor"));

const menor =
    menorRaw === "sim" ||
    menorRaw === "s" ||
    menorRaw.includes("sim");

        let risco = "baixo";
        if (sensivel || menor) risco = "alto";
        if (sensivel && menor) risco = "crítico";

        return {
            id: getValue(row, "id"),

            empresa: splitMulti(getValue(row, "empresa")),
            area: splitMulti(getValue(row, "area")),
            processo: splitMulti(getValue(row, "processo")),
            subprocesso: getValue(row, "subprocesso") || "não informado",

            dados: splitMulti(getValue(row, "dados")),

            sensivel,
            menor,

            baseLegal: splitMulti(getValue(row, "baseLegal")),

            sistemas: splitMulti(getValue(row, "sistemas")),

            armazenamento: getValue(row, "armazenamento") || "não informado",

            terceiros: normalizeText(getValue(row, "terceiros")),

            nomeTerceiro: splitMulti(getValue(row, "nomeTerceiro")),

            transfIntl: normalizeText(getValue(row, "transfIntl")),

            paises: splitMulti(getValue(row, "paises")),

            nivelRisco: risco
        };

    }).filter(r => r.id || r.processo.length > 0);
console.log("MENOR RAW TEST:", getValue(rawData[0], "menor"));

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
    if (!kpiGrid) return; // Se não está na aba de visão geral, não renderiza
    
    const total = filtered.length;
    const sensiveis = filtered.filter(d => d.sensivel).length;
    const menores = filtered.filter(d => d.menor).length;

    // Contagem de empresas únicas após split e deduplicação
   const uniqueEmpresas = new Set(
    filtered.flatMap(d => d.empresa.map(e => normalizeHeader(e)))
).size;

    const processos = new Set(
        filtered.flatMap(d => d.processo)
    ).size;

    kpiGrid.innerHTML = `
         <div class="kpi-card good"><div class="kpi-label">Empresas</div><div class="kpi-value">${uniqueEmpresas}</div></div>
        <div class="kpi-card"><div class="kpi-label">Subprocessos</div><div class="kpi-value">${total}</div></div>
        <div class="kpi-card danger"><div class="kpi-label">Sensíveis</div><div class="kpi-value">${sensiveis}</div></div>
        <div class="kpi-card purple"><div class="kpi-label">Menores</div><div class="kpi-value">${menores}</div></div>
        <div class="kpi-card yellow"><div class="kpi-label">Processos</div><div class="kpi-value">${processos}</div></div>

    `;
}

// =============================================
// AGRUPAMENTO
// =============================================
function groupCount(field) {
    const result = filtered.reduce((acc, r) => {
        const values = Array.isArray(r[field]) ? r[field] : [r[field]];

        values.forEach(v => {
            const val = normalizeText(v);
            if (!val || val === "" || val === "não informado" || val === "n/a" || val === "na") return;
            acc[val] = (acc[val] || 0) + 1;
        });

        return acc;
    }, {});
    
    // Remove chaves vazias
    return Object.fromEntries(
        Object.entries(result).filter(([key]) => key && key !== "" && key !== "undefined" && key !== "n/a" && key !== "na")
    );
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
    const indicator = document.getElementById('chartFilterIndicator');
    if (!indicator) return;

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
        indicator.innerHTML = "<strong>Filtros de gráfico ativos:</strong>" + filterHTML;
        indicator.style.display = 'block';
    } else {
        indicator.style.display = 'none';
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

    const displayData = filtered.filter(r =>
        r.subprocesso.toLowerCase().includes(search)
    );

    tbody.innerHTML = displayData.map(r => `
        <tr>
            <td>${r.id}</td>
            <td>${r.empresa.join(", ")}</td>
            <td>${r.area.join(", ")}</td>
            <td>${r.processo.join(", ")}</td>
            <td>${r.subprocesso}</td>
            <td>${r.sensivel ? "Sim" : "Não"}</td>
            <td>${r.menor ? "Sim" : "Não"}</td>
            <td>${r.armazenamento}</td>
            <td>${r.terceiros}</td>
            <td>${r.transfIntl}</td>
            <td>${r.nivelRisco}</td>
            <td>${r.baseLegal.join(", ")}</td>
        </tr>
    `).join("");

    const tableCount = document.getElementById("tableCount");
    if (tableCount) tableCount.innerText = displayData.length;
}

// =============================================
// CHARTS
// =============================================
function renderCharts() {
    createChart("chartArea", groupCount("area"), "bar");
    createChart("chartBaseLegal", groupCount("baseLegal"), "doughnut");
    
    // Gráficos horizontais ordenados por frequência (mais mencionados primeiro)
    createChart("chartSistemas", topN(sortByValue(groupCount("sistemas")), 10), "bar", "y");
    createChart("chartTerceiros", topN(sortByValue(groupCount("nomeTerceiro")), 10), "bar", "y");
    createChart("chartPaises", sortByValue(groupCount("paises")), "bar");

    createChart("chartSensivel", {
        "Sim": filtered.filter(r => r.sensivel).length,
        "Não": filtered.filter(r => !r.sensivel).length
    }, "doughnut");

    createChart("chartMenor", {
        "Sim": filtered.filter(r => r.menor).length,
        "Não": filtered.filter(r => !r.menor).length
    }, "doughnut");

    // Transferência Internacional
    const processosTransfIntl = new Set(
        filtered.filter(r => r.transfIntl === "sim").flatMap(r => r.processo)
    ).size;
    const totalProcessosIntl = new Set(filtered.flatMap(r => r.processo)).size;

    createChart("chartTransfIntl", {
        "Com Transferência Intl": processosTransfIntl,
        "Sem Transferência Intl": totalProcessosIntl - processosTransfIntl
    }, "doughnut");

    // Compartilhamento com Terceiros
    const processosComTerceiros = new Set(
        filtered.filter(r => r.terceiros === "sim").flatMap(r => r.processo)
    ).size;
    const totalProcessosTerceiros = new Set(filtered.flatMap(r => r.processo)).size;

    createChart("chartComTerceiros", {
        "Com Compartilhamento": processosComTerceiros,
        "Sem Compartilhamento": totalProcessosTerceiros - processosComTerceiros
    }, "doughnut");

    // Empresas x Subprocessos
    const empresasSubprocessos = filtered.reduce((acc, r) => {
        r.empresa.forEach(emp => {
            acc[emp] = (acc[emp] || 0) + 1;
        });
        return acc;
    }, {});
    createChart("chartEmpresasSubprocessos", sortByValue(empresasSubprocessos), "bar");

    // Tipos de Dados
    createChart("chartTiposDados", groupCount("dados"), "doughnut");
}

function createChart(id, dataset, type, indexAxis) {
    const ctx = document.getElementById(id);
    if (!ctx) return;

    const labels = Object.keys(dataset).filter(k => k && k !== "undefined");
    const data = labels.map(k => dataset[k]);
    const chartField = chartFieldMap[id];
    const activeFiltersForChart = chartFilters[chartField] || [];

    const colors = [
        '#4f8ef7', '#06b6d4', '#10b981', '#f59e0b', '#ef4444',
        '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1'
    ];

    const backgroundColors = type === 'doughnut'
        ? labels.map((label, index) => {
            const filterValue = chartLabelToFilterValue(id, label);
            return activeFiltersForChart.includes(filterValue)
                ? colors[index % colors.length]
                : 'rgba(100, 100, 100, 0.25)';
        })
        : colors[0];

    const chartConfig = {
        type,
        data: {
            labels: labels,
            datasets: [{
                label: id.replace('chart', ''),
                data: data,
                backgroundColor: backgroundColors,
                borderColor: type === 'doughnut'
                    ? '#141720'
                    : '#4f8ef7',
                borderWidth: type === 'doughnut' ? 2 : 1,
                borderRadius: 6,
                hoverBackgroundColor: 'rgba(79, 142, 247, 0.9)'
            }]
        },
        options: {
            indexAxis: indexAxis || 'x',
            responsive: true,
            onClick: (event, elements, chart) => {
                if (elements && elements.length > 0) {
                    const index = elements[0].index;
                    let label = labels[index];
                    
                    if (!label && chart.data.labels && chart.data.labels[index]) {
                        label = chart.data.labels[index];
                    }
                    
                    if (label) {
                        filterByChartClick(id, label);
                    }
                }
            },
            plugins: {
                legend: {
                    display: type === 'doughnut',
                    position: 'bottom',
                    labels: {
                        color: '#e8eaf0',
                        font: { size: 12 },
                        padding: 15,
                        cursor: 'pointer'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 10,
                    borderRadius: 6,
                    titleFont: { size: 13, weight: 'bold' },
                    bodyFont: { size: 12 },
                    callbacks: {
                        label: function(context) {
                            let value;
                            if (context.parsed !== undefined) {
                                if (typeof context.parsed === "object") {
                                    value = context.parsed.x ?? context.parsed.y;
                                } else {
                                    value = context.parsed;
                                }
                            }
                            return 'Aparições: ' + (value ?? 0);
                        }
                    }
                }
            },
            scales: type === 'doughnut' ? {} : {
                y: {
                    beginAtZero: true,
                    grid: {
                        display: indexAxis === 'y' ? false : true,
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: '#7a8299',
                        font: { size: 11 }
                    }
                },
                x: {
                    grid: { display: indexAxis === 'y' ? true : false, color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: {
                        color: '#7a8299',
                        font: { size: 11 },
                        maxRotation: indexAxis === 'y' ? 0 : 45,
                        minRotation: 0
                    }
                }
            }
        }
    };

    if (charts[id]) {
        charts[id].destroy();
    }

    charts[id] = new Chart(ctx, chartConfig);
}

// =============================================
// RENDER GERAL
// =============================================
function renderAll() {
    renderKPIs();
    renderCharts();
    renderTable();
    renderRiskKpis();
    renderRiskCharts();
    renderRiskTable();
    renderMatrix();
    renderActionPlan();
    renderRiskHeatmap();
}