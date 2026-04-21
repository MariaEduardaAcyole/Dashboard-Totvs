// =============================================
// ESTADO GLOBAL
// =============================================
let rawData = [];
let data = [];
let filtered = [];
let activeFilters = {};
let charts = {};
let chartFilters = {}; 


// =============================================
// UTILITÁRIOS
// =============================================

let nomecliente = "Nome do Cliente";
    document.getElementById('nomecliente').innerText = nomecliente;


function normalizeText(v) {
    return String(v || "")
        .toLowerCase()
        .trim();
}

function splitMulti(value) {
    if (!value) return ["não informado"];

    return [...new Set(
        String(value)
            .split(";")
            .map(v => normalizeText(v))
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

    const titles = {
        'visao-geral': 'Visão Geral',
        'inventario': 'Inventário',
        'riscos': 'Riscos',
        'matriz': 'Matriz',
        'plano': 'Plano',
        'heatmap': 'Heatmap'
    };

    document.getElementById('pageTitle').innerText = titles[tabId] || 'Dashboard';
}

// =============================================
// UPLOAD
// =============================================
function handleFileUpload(event) {
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

        const headers = [
            "id","empresa","area","responsavel_processo","processo","subprocesso",
            "descricao_subprocesso","utiliza_dados_pessoais","quais_dados",
            "utiliza_sensivel","quais_sensiveis","utiliza_menores","desc_dados_menores",
            "dados_responsaveis","armazenamento","sistemas","tipo_titular",
            "finalidade","origem_dados","tem_regulamentacao","dispositivo_legal",
            "orgaos_compartilhados","como_onde_armazenado","tem_retencao",
            "periodo_retencao","metodo_destruicao","meios_consulta",
            "tem_compartilhamento","areas_recebem_dados","forma_compartilhamento",
            "tem_compartilhamento_terceiros","dados_compartilhados_terceiros",
            "nome_terceiro","tem_contrato_terceiro","observancia_terceiro",
            "finalidade_compartilhamento_terceiro","tem_transferencia_intl",
            "paises_transferencia","pais_regulacao_compativel","tem_contrato_intl",
            "finalidade_transferencia_intl","org_internacionais_recebem",
            "tem_consentimento_intl","tem_controle_acesso","colaboradores_entendem",
            "tem_documento_consentimento","base_legal","pendente_validacao"
        ];

        const json = XLSX.utils.sheet_to_json(sheet, {
            range: 3,
            header: headers,
            defval: ""
        });

        rawData = json;
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
        if (!row.id || !row.empresa) return null;

        const sensivel = normalizeText(row.utiliza_sensivel).includes("sim");
        const menor = normalizeText(row.utiliza_menores).includes("sim");

        let risco = "baixo";
        if (sensivel || menor) risco = "alto";
        if (sensivel && menor) risco = "crítico";

        return {
            id: row.id,
            empresa: splitMulti(row.empresa),
            area: splitMulti(row.area),
            processo: splitMulti(row.processo),
            subprocesso: row.subprocesso || "não informado",
            dados: splitMulti(row.quais_dados),
            sensivel,
            menor,
            baseLegal: splitMulti(row.base_legal),
            sistemas: splitMulti(row.sistemas),
            armazenamento: row.armazenamento || "não informado",
            terceiros: normalizeText(row.tem_compartilhamento_terceiros),
            nomeTerceiro: splitMulti(row.nome_terceiro),
            transfIntl: normalizeText(row.tem_transferencia_intl),
            paises: splitMulti(row.paises_transferencia),
            nivelRisco: risco
        };
    }).filter(Boolean);
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
    const fEmpresa = normalizeText(document.getElementById('f-empresa').value || document.getElementById('fi-empresa')?.value || "");
    const fArea = normalizeText(document.getElementById('f-area').value || document.getElementById('fi-area')?.value || "");
    const fProcesso = normalizeText(document.getElementById('f-processo').value || document.getElementById('fi-processo')?.value || "");
    const fSensivel = document.getElementById('f-sensivel').value || document.getElementById('fi-sensivel')?.value || "";
    const fMenor = document.getElementById('f-menor').value || document.getElementById('fi-menor')?.value || "";

    filtered = data.filter(row => {
        // Filtros padrões (dropdowns)
        if (fEmpresa && !row.empresa.includes(fEmpresa)) return false;
        if (fArea && !row.area.includes(fArea)) return false;
        if (fProcesso && !row.processo.includes(fProcesso)) return false;

        if (fSensivel === "Sim" && !row.sensivel) return false;
        if (fSensivel === "Não" && row.sensivel) return false;

        if (fMenor === "Sim" && !row.menor) return false;
        if (fMenor === "Não" && row.menor) return false;

        // MULTI-FILTROS de gráfico (acumulam)
        for (const [field, values] of Object.entries(chartFilters)) {
            if (values.length === 0) continue;

            const fieldValue = row[field];
            let matches = false;

            if (Array.isArray(fieldValue)) {
                // Para arrays, verifica se algum valor está na lista de filtros
                matches = fieldValue.some(v => values.includes(normalizeText(v)));
            } else {
                // Para campos simples
                if (field === "sensivel" || field === "menor") {
                    const boolValue = fieldValue ? "sim" : "não";
                    matches = values.includes(boolValue);
                } else {
                    matches = values.includes(normalizeText(fieldValue));
                }
            }

            if (!matches) return false;
        }

        return true;
    });

    renderAll();
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

    // limpa filtros de gráfico
    clearChartFilter();

    // reaplica filtros (sem nada selecionado)
    applyFilters();
}

// =============================================
// KPIs
// =============================================
function renderKPIs() {
    const total = filtered.length;
    const sensiveis = filtered.filter(d => d.sensivel).length;
    const menores = filtered.filter(d => d.menor).length;

    // Contagem de empresas únicas após split e deduplicação
    const uniqueEmpresas = new Set(
        filtered.flatMap(d => d.empresa)
    ).size;

    const processos = new Set(
        filtered.flatMap(d => d.processo)
    ).size;

    document.getElementById("kpiGrid").innerHTML = `
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

// Mapeamento de gráficos para campos de filtro
const chartFieldMap = {
    "chartArea": "area",
    "chartBaseLegal": "baseLegal",
    "chartSistemas": "sistemas",
    "chartTerceiros": "nomeTerceiro",
    "chartPaises": "paises",
    "chartSensivel": "sensivel",
    "chartMenor": "menor",
    "chartEmpresasSubprocessos": "empresa"
};

function filterByChartClick(chartId, label) {
    const fieldName = chartFieldMap[chartId];
    if (!fieldName) return;

    const cleanLabel = label.replace(/\s*\(\d+\)$/, '');
    const value = normalizeText(cleanLabel);

    // inicializa lista do campo
    if (!chartFilters[fieldName]) {
        chartFilters[fieldName] = [];
    }

    const index = chartFilters[fieldName].indexOf(value);

    // TOGGLE
    if (index > -1) {
        chartFilters[fieldName].splice(index, 1);
        if (chartFilters[fieldName].length === 0) {
            delete chartFilters[fieldName];
        }
    } else {
        chartFilters[fieldName].push(value);
    }

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
    updateFilterIndicator();
    applyFilters();
}

function clearChartFilter() {
    chartFilters = {};
    updateFilterIndicator();
}

// =============================================
// TABELA
// =============================================
function renderTable() {
    const tbody = document.getElementById("tableBody");
    const search = normalizeText(document.getElementById("tableSearch").value);

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

    document.getElementById("tableCount").innerText = displayData.length;
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

    if (charts[id]) charts[id].destroy();

    let labels = Object.keys(dataset).filter(k => k && k !== "undefined");
    let data = labels.map(k => dataset[k]);
    

    
    // Cores para os gráficos
    const colors = [
        '#4f8ef7', '#06b6d4', '#10b981', '#f59e0b', '#ef4444',
        '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1'
    ];

    const chartConfig = {
        type,
        data: {
            labels: labels,
            datasets: [{
                label: id.replace('chart', ''),
                data: data,
                backgroundColor: type === 'doughnut'
                    ? colors.slice(0, labels.length)
                    : colors[0],
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
                    
                    // Para doughnut/pie, a label pode estar sem a contagem
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
                            return 'Aparições: ' + context.parsed.x;
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

    charts[id] = new Chart(ctx, chartConfig);
}

// =============================================
// RENDER GERAL
// =============================================
function renderAll() {
    renderKPIs();
    renderCharts();
    renderTable();
}