// matriz.js
// =============================================
// ESTADO GLOBAL - RISCOS
// =============================================
import { renderRiskLevelChart } from "../components/charts/risk/chartRiskLevel.js";

let rawRiskData = [];

let riskData = [];

let filteredRisk = [];
let riskCharts = {};
let riskChartFilters = {};

const riskChartFieldMap = {
  chartRiskLevel: "nivelRisco",
  chartRiskProb: "probabilidade",
  chartRiskArea: "empresaArea",
  chartMatrizNivel: "nivelRisco",
  chartMatrizProb: "probabilidade",
  chartMatrizEmpresaArea: "empresaArea",
};

// Mapeamento de colunas para o arquivo de riscos
const RISK_COLUMN_MAP = {
  id: ["Código (ID)"],

  idSubprocesso: [
    "ID Subprocesso",
    "ID_Subprocesso",
    "ID do Subprocesso",
    "idsubprocesso",
  ],

  grupoRiscos: ["Grupo de Riscos"],

  nomeGrupo: ["Nome do Grupo de Riscos"],

  empresa: ["Empresa"],

  area: ["Área"],

  responsavel: ["Responsável"],

  referencia: ["Referência"],

  subprocesso: ["Sub-processo indicado", "Subprocesso indicado", "Subprocesso"],

  classificacao: ["Classificação"],

  nomeRisco: ["Nome Risco"],

  descricao: ["Descrição do risco"],

  probabilidade: [
    "Probabilidade",
    "Probabilidade do risco",
    "Probabilidade Risco",
  ],

  severidade: [
    "Severidade/Impacto",
    "Severidade",
    "Impacto",
    "Impacto do risco",
  ],

nivelRisco: [
  "Nível de Risco (NR)",
  "Nível de Risco",
  "Nivel de Risco",
  "Nível Risco",
  "NR"
],
  estrategiaResposta: ["Estratégia de Resposta ao risco"],

  controlePreventivo: [
    "Estratégia de tratamento do risco \n(Controles Preventivo)",
  ],

  controleDetectivo: [
    "Estratégia de tratamento do risco \n(Controles Detectivo)",
  ],

  planoAcao: ["Plano de Ação"],

  custo: ["Custo Adicional?"],

  status: ["Status Plano de Ação"],

  comentariosArea: ["Comentários da Área"],

  comentariosConsultoria: ["Comentários Consultoria"],

  evidencia: ["Evidência esperada"],

  atividade: ["Atividade relacionada do plano de adequação"],
};

const RISK_SHEET_NAMES = [
  "Riscos",
  "Matriz",
  "Matriz de Risco",
  "Matriz de Riscos",
  "Registro de Riscos",
  "Planilha de Riscos",
];

const RISK_REQUIRED_FIELDS = [
  "idSubprocesso",
  "empresa",
  "area",
  "nomeRisco",
  "probabilidade",
  "severidade",
  "nivelRisco",
];
import {
  findBestSheet,
  parseSheetWithHeaderDetection,
  listMissingColumns
} from "../components/dataHelpers.js";


// =============================================
// UPLOAD DE RISCOS
// =============================================
function handleFileUploadMatriz(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function (e) {
    const dataArray = new Uint8Array(e.target.result);
    const workbook = XLSX.read(dataArray, { type: "array" });

    const sheetNames = workbook.SheetNames.join(", ");
    console.log("Sheets disponíveis:", sheetNames);

    let sheet = findBestSheet(workbook, RISK_SHEET_NAMES);
    if (!sheet && workbook.SheetNames.length > 0) {
      sheet = workbook.Sheets[workbook.SheetNames[0]];
      console.warn(
        "Nenhuma aba padrão encontrada, usando a primeira aba:",
        workbook.SheetNames[0],
      );
    }

    if (!sheet) {
      alert("Nenhuma planilha encontrada no arquivo de matriz.");
      return;
    }

    const json = parseSheetWithHeaderDetection(
      sheet,
      RISK_REQUIRED_FIELDS,
      RISK_COLUMN_MAP,
    );

    if (!json || json.length === 0) {
      alert(
        "A planilha de matriz foi carregada, mas não contém dados válidos.",
      );
      return;
    }

rawRiskData = json;

normalizeRiskData();

filteredRisk = [...riskData];

populateRiskFilterOptions();

applyRiskFilters();

console.log("[RISCO FINAL]", riskData);
    console.log("[MATRIZ NORMALIZADA]", riskData);
    const missingFields = listMissingColumns(
      rawRiskData[0],
      RISK_REQUIRED_FIELDS,
      RISK_COLUMN_MAP,
    );
    if (missingFields.length > 0) {
      alert(
        `Campos obrigatórios ausentes na matriz de risco: ${missingFields.join(", ")}. Verifique o arquivo e tente novamente.`,
      );
      rawRiskData = [];
      return;
    }

    populateRiskFilterOptions();
    if (typeof buildInventoryRiskLinks === "function") {
      buildInventoryRiskLinks();
    }
    applyRiskFilters();

    const connectionNote =
      Array.isArray(rawRiskData) && rawRiskData.length > 0
        ? "Inventário carregado: conexões de risco serão exibidas no painel de inventário."
        : "Importe o inventário para habilitar o vínculo entre risco e processo.";

    alert(`Dados de riscos carregados: ${riskData.length}. ${connectionNote}`);
  };

  reader.readAsArrayBuffer(file);
}

function normalize(text) {
  return text
    ?.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// =============================================
// OBTER VALOR DE CAMPO
// =============================================
function getRiskField(row, field) {
  const possibleNames = RISK_COLUMN_MAP[field];
  if (!possibleNames) return "";

  const keys = Object.keys(row);

  for (const key of keys) {
    const normalizedKey = normalize(key);

    for (const name of possibleNames) {
      const normalizedName = normalize(name);

      if (
        normalizedKey.includes(normalizedName) ||
        normalizedName.includes(normalizedKey)
      ) {
        console.log(
          `[MAP] ${field}:`,
          key,
          "→",
          row[key]
        );

        return row[key];
      }
    }
  }

  console.warn(`[MAP] Campo não encontrado: ${field}`);
  return "";
}
// =============================================
// NORMALIZAÇÃO DE DADOS DE RISCO
// =============================================
// =============================================
// NORMALIZAÇÃO DE DADOS DE RISCO
// =============================================
function normalizeRiskData() {
  riskData = rawRiskData
    .map((row) => {

      const nivelRaw = getRiskField(row, "nivelRisco");

      console.log("[RISCO RAW]", nivelRaw);

      const nivelRawText = normalize(nivelRaw);

      let nivelRisco = "baixo";

      if (nivelRawText.includes("critico")) {
        nivelRisco = "crítico";
      } 
      else if (nivelRawText.includes("alto")) {
        nivelRisco = "alto";
      } 
      else if (nivelRawText.includes("medio")) {
        nivelRisco = "médio";
      }

      return {
        id: getRiskField(row, "id") || "",

        grupoRiscos:
          getRiskField(row, "grupoRiscos") || "",

        nomeGrupo:
          getRiskField(row, "nomeGrupo") || "",

        empresa:
          normalize(getRiskField(row, "empresa")) || "não informado",

        area:
          normalize(getRiskField(row, "area")) || "não informado",

        responsavel:
          getRiskField(row, "responsavel") || "—",

        referencia:
          getRiskField(row, "referencia") || "—",

        subprocesso:
          getRiskField(row, "subprocesso") || "—",

        classificacao:
          getRiskField(row, "classificacao") || "—",

        nomeRisco:
          getRiskField(row, "nomeRisco") || "",

        descricao:
          getRiskField(row, "descricao") || "—",

        probabilidade:
          normalize(getRiskField(row, "probabilidade")) ||
          "não informado",

        severidade:
          normalize(getRiskField(row, "severidade")) ||
          "não informado",

        nivelRisco,

        estrategiaResposta:
          getRiskField(row, "estrategiaResposta") || "—",

        controlePreventivo:
          getRiskField(row, "controlePreventivo") || "—",

        controleDetectivo:
          getRiskField(row, "controleDetectivo") || "—",

        planoAcao:
          getRiskField(row, "planoAcao") || "—",

        statusPlano:
          normalize(getRiskField(row, "status")) ||
          "não informado",
      };
    })
    .filter((r) => r.id);

  console.log("[RISCOS NORMALIZADOS]", riskData);
}

// =============================================
// FILTROS DE RISCOS
// =============================================
function populateRiskFilterOptions() {
  const empresas = [
    ...new Set(
      riskData.map((r) => r.empresa).filter((e) => e && e !== "não informado"),
    ),
  ].sort();
  const areas = [
    ...new Set(
      riskData.map((r) => r.area).filter((a) => a && a !== "não informado"),
    ),
  ].sort();
  const niveisRisco = ["crítico", "alto", "médio", "baixo"];

  const fillRiskSelect = (id, list) => {
    const select = document.getElementById(id);
    if (!select) return;

    select.innerHTML =
      '<option value="">Todos</option>' +
      list.map((v) => `<option value="${v}">${v}</option>`).join("");
  };

  fillRiskSelect("risk-empresa", empresas);
  fillRiskSelect("risk-area", areas);
  fillRiskSelect("risk-nivel", niveisRisco);
}

function getRiskChartFieldValue(row, field) {
  if (field === "empresaArea") {
    return `${row.empresa} - ${row.area !== "não informado" ? row.area : "Geral"}`;
  }
  return row[field] || "";
}

function matchesRiskFilterValue(fieldName, rowValue, filterValue) {
  const normalizedRow = normalize(rowValue);
  const normalizedFilter = normalize(filterValue);

  if (fieldName === "empresaArea") {
    return normalizedRow === normalizedFilter;
  }

  return normalizedRow === normalizedFilter;
}

function filterRiskByChartClick(chartId, label) {
  const fieldName = riskChartFieldMap[chartId];
  if (!fieldName) return;

  const value = normalize(label);
  if (!riskChartFilters[fieldName]) {
    riskChartFilters[fieldName] = [];
  }

  const index = riskChartFilters[fieldName].indexOf(value);
  if (index > -1) {
    riskChartFilters[fieldName].splice(index, 1);
    if (riskChartFilters[fieldName].length === 0) {
      delete riskChartFilters[fieldName];
    }
  } else {
    riskChartFilters[fieldName].push(value);
  }

  applyRiskFilters();
}

function applyRiskFilters() {
  const fEmpresa = normalize(
    document.getElementById("risk-empresa")?.value || "",
  );
  const fArea = normalize(
    document.getElementById("risk-area")?.value || "",
  );
  const fNivel = normalize(
    document.getElementById("risk-nivel")?.value || "",
  );

  const searchInput = document.getElementById("riskSearch");
  const search = searchInput ? normalize(searchInput.value) : "";

  filteredRisk = riskData.filter((row) => {
    if (fEmpresa && row.empresa !== fEmpresa) return false;
    if (fArea && row.area !== fArea) return false;
    if (fNivel && row.nivelRisco !== fNivel) return false;

    for (const [field, values] of Object.entries(riskChartFilters)) {
      if (!values || values.length === 0) continue;
      const rowValue = getRiskChartFieldValue(row, field);
      const matches = values.some((value) =>
        matchesRiskFilterValue(field, rowValue, value),
      );
      if (!matches) return false;
    }

    if (search) {
      const searchableText = `
                ${row.id} ${row.nomeRisco} ${row.descricao} ${row.empresa} ${row.area}
                ${row.nomeGrupo} ${row.subprocesso}
            `.toLowerCase();
      if (!searchableText.includes(search)) return false;
    }

    return true;
  });

  renderRiskKpis();
  renderRiskCharts();

  console.log("Dados enviados:", filteredRisk);
  renderRiskLevelChart(filteredRisk); // <-- adicionar aqui

  renderRiskTable();
  renderMatrixCharts();
  renderRiskHeatmap();
  renderActionPlan();
}

function resetRiskFilters() {
  document
    .querySelectorAll("#risk-empresa, #risk-area, #risk-nivel")
    .forEach((select) => {
      select.value = "";
    });

  const riskSearch = document.getElementById("riskSearch");
  if (riskSearch) riskSearch.value = "";

  riskChartFilters = {};

  applyRiskFilters();
}

// =============================================
// KPIs DE RISCOS
// =============================================
function renderRiskKpis() {
  const grid = document.getElementById("riskKpiGrid");
  if (!grid) return;

  const total = filteredRisk.length;
  const criticos = filteredRisk.filter(
    (r) => r.nivelRisco === "crítico",
  ).length;
  const altos = filteredRisk.filter((r) => r.nivelRisco === "alto").length;
  const medios = filteredRisk.filter((r) => r.nivelRisco === "médio").length;

  const empresasUnicas = new Set(
    filteredRisk.map((r) => r.empresa).filter((e) => e !== "não informado"),
  ).size;

  grid.innerHTML = `
        <div class="kpi-card danger"><div class="kpi-label">Riscos Totais</div><div class="kpi-value">${total}</div></div>
        <div class="kpi-card" style="background:linear-gradient(135deg, rgba(192,38,211,0.15), rgba(239,68,68,0.15))"><div class="kpi-label">Críticos</div><div class="kpi-value" style="color:#c026d3">${criticos}</div></div>
        <div class="kpi-card danger"><div class="kpi-label">Altos</div><div class="kpi-value">${altos}</div></div>
        <div class="kpi-card yellow"><div class="kpi-label">Médios</div><div class="kpi-value">${medios}</div></div>
        <div class="kpi-card good"><div class="kpi-label">Empresas</div><div class="kpi-value">${empresasUnicas}</div></div>
    `;
}

// =============================================
// GRÁFICOS DE RISCOS
// =============================================
function groupRiskBy(field) {
  const result = {};

  filteredRisk.forEach((item) => {
    const value = item[field] || "não informado";

    result[value] = (result[value] || 0) + 1;
  });

  return result;
}
function renderRiskCharts() {
  // Nível de Risco
  const nivelRiscoCount = {};
  filteredRisk.forEach((r) => {
    nivelRiscoCount[r.nivelRisco] = (nivelRiscoCount[r.nivelRisco] || 0) + 1;
  });

  createRiskChart("chartRiskLevel", nivelRiscoCount, "doughnut");

  // Probabilidade
  const probabilidadeCount = {};
  filteredRisk.forEach((r) => {
    if (r.probabilidade && r.probabilidade !== "não informado") {
      probabilidadeCount[r.probabilidade] =
        (probabilidadeCount[r.probabilidade] || 0) + 1;
    }
  });

  createRiskChart("chartRiskProb", probabilidadeCount, "bar");

  // Riscos por Empresa / Área
  const empresaAreaCount = {};
  filteredRisk.forEach((r) => {
    if (r.empresa !== "não informado") {
      const label = `${r.empresa} - ${r.area !== "não informado" ? r.area : "Geral"}`;
      empresaAreaCount[label] = (empresaAreaCount[label] || 0) + 1;
    }
  });

  // Limitar aos top 15
  const topEmpresaArea = Object.fromEntries(
    Object.entries(empresaAreaCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 15),
  );

createRiskChart(
  "chartMatrizImpact",
  groupRiskBy("severidade"),
  "doughnut"
);

createRiskChart(
  "chartPlanoStatus",
  groupRiskBy("statusPlano"),
  "bar"
);

createRiskChart(
  "chartResponseStrategy",
  groupRiskBy("estrategiaResposta"),
  "doughnut"
);
}

function renderMatrixCharts() {
  const nivelRiscoCount = {};
  filteredRisk.forEach((r) => {
    nivelRiscoCount[r.nivelRisco] = (nivelRiscoCount[r.nivelRisco] || 0) + 1;
  });

  createRiskChart("chartMatrizNivel", nivelRiscoCount, "doughnut");

  const probabilidadeCount = {};
  filteredRisk.forEach((r) => {
    if (r.probabilidade && r.probabilidade !== "não informado") {
      probabilidadeCount[r.probabilidade] =
        (probabilidadeCount[r.probabilidade] || 0) + 1;
    }
  });

  createRiskChart("chartMatrizProb", probabilidadeCount, "bar");

  const empresaAreaCount = {};
  filteredRisk.forEach((r) => {
    if (r.empresa !== "não informado") {
      const label = `${r.empresa} - ${r.area !== "não informado" ? r.area : "Geral"}`;
      empresaAreaCount[label] = (empresaAreaCount[label] || 0) + 1;
    }
  });

  const topEmpresaArea = Object.fromEntries(
    Object.entries(empresaAreaCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 15),
  );

  createRiskChart("chartMatrizEmpresaArea", topEmpresaArea, "bar");
}

function createRiskChart(id, dataset, type) {
  const ctx = document.getElementById(id);
  if (!ctx) return;

  const labels = Object.keys(dataset).filter((k) => k);
  const data = labels.map((k) => dataset[k]);

  const colors = [
    "#c026d3",
    "#ef4444",
    "#f59e0b",
    "#22c55e",
    "#4f8ef7",
    "#06b6d4",
    "#10b981",
    "#f97316",
  ];

  const config = {
    type,
    data: {
      labels: labels,
      datasets: [
        {
          label: id.replace("chart", ""),
          data: data,
          backgroundColor:
            type === "doughnut"
              ? labels.map((_, i) => colors[i % colors.length])
              : "#ef4444",
          borderColor: type === "doughnut" ? "#141720" : "#4f8ef7",
          borderWidth: type === "doughnut" ? 2 : 1,
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      indexAxis: type === "bar" && id === "chartRiskArea" ? "y" : "x",
      plugins: {
        legend: {
          display: type === "doughnut",
          position: "bottom",
          labels: {
            color: "#e8eaf0",
            font: { size: 12 },
            padding: 15,
          },
        },
        tooltip: {
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          padding: 10,
          borderRadius: 6,
          titleFont: { size: 13, weight: "bold" },
          bodyFont: { size: 12 },
        },
      },
      onClick: (event, elements, chart) => {
        if (elements && elements.length > 0) {
          const index = elements[0].index;
          const label = chart.data.labels[index];
          if (label) {
            filterRiskByChartClick(id, label);
          }
        }
      },
      scales:
        type === "doughnut"
          ? {}
          : {
              y: {
                beginAtZero: true,
                grid: { color: "rgba(255, 255, 255, 0.05)" },
                ticks: { color: "#7a8299", font: { size: 11 } },
              },
              x: {
                grid: { display: false },
                ticks: {
                  color: "#7a8299",
                  font: { size: 11 },
                  maxRotation: 45,
                },
              },
            },
    },
  };

  if (riskCharts[id]) {
    riskCharts[id].destroy();
  }

  riskCharts[id] = new Chart(ctx, config);
}

// =============================================
// TABELA DE RISCOS
// =============================================
function renderRiskTable() {
  const tbody = document.getElementById("riskTableBody");
  if (!tbody) return;

  tbody.innerHTML = filteredRisk
    .map(
      (r) => `
        <tr>
            <td><strong>${r.id}</strong></td>
            <td>${r.empresa}</td>
            <td>${r.area}</td>
            <td>${r.nomeRisco}</td>
            <td>${r.probabilidade}</td>
            <td>${r.severidade}</td>
            <td><span class="badge badge-${r.nivelRisco === "crítico" ? "critico" : r.nivelRisco}">${r.nivelRisco}</span></td>
            <td>${r.estrategiaResposta.substring(0, 50)}${r.estrategiaResposta.length > 50 ? "..." : ""}</td>
            <td><span class="badge badge-${r.statusPlano.includes("concluído") || r.statusPlano.includes("ativo") ? "sim" : "warn"}">${r.statusPlano}</span></td>
        </tr>
    `,
    )
    .join("");
}
// =============================================
// MATRIZ DE RISCO REAL (Probabilidade x Severidade)
// =============================================

function renderRiskMatrix() {
  const container = document.getElementById("riskMatrixContainer");

  if (!container) return;

  const probabilidades = ["improvável", "possível", "provável", "quase certo"];

  const severidades = ["baixo", "moderado", "severo", "catastrófico"];

  // cria matriz vazia
  const matriz = {};

  severidades.forEach((sev) => {
    matriz[sev] = {};

    probabilidades.forEach((prob) => {
      matriz[sev][prob] = 0;
    });
  });

  // normaliza nomes
  const normalizeRisk = (txt) =>
    normalize(txt)
      .replace("improvavel", "improvável")
      .replace("possivel", "possível")
      .replace("catastrofico", "catastrófico");

  // preenche valores
  filteredRisk.forEach((r) => {
    const prob = normalizeRisk(r.probabilidade);

    const sev = normalizeRisk(r.severidade);

    if (matriz[sev] && matriz[sev][prob] !== undefined) {
      matriz[sev][prob]++;
    }
  });

  let html = `

    <table class="risk-matrix">

    <thead>
    <tr>
    <th></th>
    ${probabilidades.map((p) => `<th>${p}</th>`).join("")}
    </tr>
    </thead>

    <tbody>

    `;

  severidades.reverse().forEach((sev) => {
    html += `<tr>
        <th>${sev}</th>`;

    probabilidades.forEach((prob) => {
      const valor = matriz[sev][prob];

      const risco =
        (probabilidades.indexOf(prob) + 1) * (severidades.indexOf(sev) + 1);

      let cor = "#22c55e";

      if (risco >= 4) cor = "#facc15";

      if (risco >= 8) cor = "#ef4444";

      if (risco >= 12) cor = "#c026d3";

      html += `
            <td
            style="
            background:${cor}30;
            color:${cor};
            font-weight:700;
            text-align:center;
            padding:20px;
            ">
            ${valor}
            </td>
            `;
    });

    html += `</tr>`;
  });

  html += `
    </tbody>
    </table>
    `;

  container.innerHTML = html;
}
// =============================================
// MATRIZ DE RISCO (HEATMAP)
// =============================================
function renderRiskHeatmap() {
  const containers = [
    document.getElementById("riskHeatmapContainer"),
    document.getElementById("heatmapContainer"),
  ].filter(Boolean);
  if (containers.length === 0) return;

  if (!filteredRisk || filteredRisk.length === 0) {
    containers.forEach((container) => {
      container.innerHTML =
        '<div style="padding: 24px; background: var(--surface2); border-radius: 8px; color: var(--text-muted); text-align: center;">Nenhum dado de risco disponível. Importe a matriz para ver o heatmap.</div>';
    });
    return;
  }

  const probabilidades = ["baixa", "média", "alta", "muito alta"];
  const severidades = ["baixa", "média", "alta", "muito alta"];

  const normalizeRiskLabel = (value) => {
    const text = normalize(value);
    if (text.includes("muito") && text.includes("alta")) return "muito alta";
    if (text.includes("alta")) return "alta";
    if (text.includes("média") || text.includes("media")) return "média";
    return "baixa";
  };

  const matrixCounts = {};
  probabilidades.forEach((prob) => {
    severidades.forEach((sev) => {
      matrixCounts[`${prob}|${sev}`] = 0;
    });
  });

  filteredRisk.forEach((r) => {
    const prob = normalizeRiskLabel(r.probabilidade);
    const sev = normalizeRiskLabel(r.severidade);
    if (matrixCounts[`${prob}|${sev}`] !== undefined) {
      matrixCounts[`${prob}|${sev}`] += 1;
    }
  });

  let heatmapHTML = '<div class="risk-heatmap">';
  heatmapHTML +=
    '<div style="display: grid; grid-template-columns: 100px repeat(4, 1fr); gap: 8px; margin-bottom: 16px;">';
  heatmapHTML += "<div></div>";
  for (const sev of severidades) {
    heatmapHTML += `<div style="text-align:center; font-size:12px; color:#7a8299; font-weight:600;">${sev}</div>`;
  }
  heatmapHTML += "</div>";

  for (const prob of probabilidades) {
    heatmapHTML +=
      '<div style="display: grid; grid-template-columns: 100px repeat(4, 1fr); gap: 8px; margin-bottom: 8px;">';
    heatmapHTML += `<div style="text-align:right; font-size:12px; color:#7a8299; font-weight:600; padding-right:8px;">${prob}</div>`;

    for (const sev of severidades) {
      const count = matrixCounts[`${prob}|${sev}`] || 0;
      const probIdx = probabilidades.indexOf(prob);
      const sevIdx = severidades.indexOf(sev);
      const riskScore = (probIdx + 1) * (sevIdx + 1);
      let bgColor = "#22c55e";
      if (riskScore <= 4) {
        bgColor = "#22c55e";
      } else if (riskScore <= 8) {
        bgColor = "#f59e0b";
      } else if (riskScore <= 12) {
        bgColor = "#ef4444";
      } else {
        bgColor = "#c026d3";
      }

      heatmapHTML += `
                <div style="
                    background: ${bgColor}20;
                    border: 1px solid ${bgColor};
                    border-radius: 8px;
                    padding: 16px;
                    min-height: 60px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-direction: column;
                    color: ${bgColor};
                    font-size: 12px;
                    font-weight: 600;
                ">
                    <div>${count}</div>
                    <div style="font-size: 11px; color: #7a8299;">${count === 1 ? "risco" : "riscos"}</div>
                </div>
            `;
    }

    heatmapHTML += "</div>";
  }

  heatmapHTML += "</div>";
  containers.forEach((container) => {
    container.innerHTML = heatmapHTML;
  });
}

// =============================================
// MATRIZ DE RISCO - VISUALIZAÇÃO DE DADOS
// =============================================
function renderMatrix() {
  const container = document.getElementById("riskMatrixContainer");
  if (!container) return;

  const description = `
        <div style="margin-bottom: 24px; font-size: 13px; color: var(--text-muted); line-height: 1.6;">
            <p><strong>Classificação Automática de Risco:</strong></p>
            <ul style="margin-top: 8px; margin-left: 16px;">
                <li><strong style="color: #22c55e;">Baixo:</strong> Risco controlado, probabilidade e impacto reduzidos</li>
                <li><strong style="color: #f59e0b;">Médio:</strong> Risco moderado, requer monitoramento</li>
                <li><strong style="color: #ef4444;">Alto:</strong> Risco significativo, requer plano de ação</li>
                <li><strong style="color: #c026d3;">Crítico:</strong> Risco crítico, requer ação imediata</li>
            </ul>
        </div>
    `;

  // Resumo por nível
  const nivelSummary = {};
  filteredRisk.forEach((r) => {
    nivelSummary[r.nivelRisco] = (nivelSummary[r.nivelRisco] || 0) + 1;
  });

  let summary =
    '<div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px;">';

  const nivelInfo = [
    { nivel: "crítico", cor: "#c026d3", label: "Críticos" },
    { nivel: "alto", cor: "#ef4444", label: "Altos" },
    { nivel: "médio", cor: "#f59e0b", label: "Médios" },
    { nivel: "baixo", cor: "#22c55e", label: "Baixos" },
  ];

  for (const info of nivelInfo) {
    const count = nivelSummary[info.nivel] || 0;
    summary += `
            <div style="
                background: ${info.cor}15;
                border: 1px solid ${info.cor};
                border-radius: 8px;
                padding: 12px;
                text-align: center;
            ">
                <div style="font-size: 24px; font-weight: 700; color: ${info.cor}; margin-bottom: 4px;">${count}</div>
                <div style="font-size: 12px; color: ${info.cor}; font-weight: 600;">${info.label}</div>
            </div>
        `;
  }

  summary += "</div>";

  container.innerHTML = description + summary;
}

// =============================================
// PLANO DE AÇÃO
// =============================================
function renderActionPlan() {
  const container = document.getElementById("actionPlanContainer");
  if (!container) return;

  const actionItems = filteredRisk.filter((r) => {
    const hasPlan = r.planoAcao && String(r.planoAcao).trim() !== "";
    const hasStatus = r.statusPlano && String(r.statusPlano).trim() !== "";
    return hasPlan || hasStatus;
  });

  let html = `<div style="margin-bottom: 24px;">
        <h3 style="font-size: 14px; font-weight: 600; margin-bottom: 16px;">Planos de Ação (${actionItems.length})</h3>
    `;

  if (actionItems.length === 0) {
    html +=
      '<div style="padding: 16px; background: var(--surface2); border-radius: 8px; color: var(--text-muted); text-align: center;">Nenhum plano de ação encontrado</div>';
  } else {
    html += '<div style="display: grid; gap: 12px;">';
    actionItems.forEach((r) => {
      const tasks = String(r.planoAcao || "")
        .split(/\n|;/)
        .map((task) => task.trim())
        .filter((task) => task);
      html += `
                <div style="background: var(--surface2); border-left: 4px solid #4f8ef7; padding: 16px; border-radius: 8px;">
                    <div style="font-weight: 700; margin-bottom: 8px; color: var(--text);">${r.id} — ${r.nomeRisco}</div>
                    <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">Empresa: ${r.empresa} | Área: ${r.area}</div>
                    <div style="font-size: 12px; margin-bottom: 8px;"><strong>Status:</strong> ${r.statusPlano || "Não informado"}</div>
                    <div style="font-size: 12px; color: var(--text);"><strong>Plano de Ação:</strong></div>
                    <ul style="margin: 8px 0 0 16px; padding: 0; color: var(--text); font-size: 12px;">
                        ${tasks.length > 0 ? tasks.map((task) => `<li style="margin-bottom: 4px;">${task}</li>`).join("") : "<li>Sem descrição de ação disponível</li>"}
                    </ul>
                </div>
            `;
    });
    html += "</div>";
  }

  html += "</div>";
  container.innerHTML = html;
}

// =============================================
// EXPORTA GLOBALMENTE
// =============================================

window.renderRiskMatrix = renderRiskMatrix;
export {
   normalizeRiskData,
   handleFileUploadMatriz,
   riskData
};