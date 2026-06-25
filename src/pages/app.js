// app.js
// ===================================
// IMPORTS CONFIG
// ===================================
console.log("[APP] carregado");
import {
  COLUMN_MAP,
  INVENTORY_REQUIRED_FIELDS,
  findInventorySheet,
  validateInventoryColumns,
  normalize,
} from "../components/imports/inventoryConfig.js";

import {
    handleFileUploadMatriz,
    normalizeRiskData,
    riskData
} from "./matriz.js";
// ===================================
// IMPORTS GRÁFICOS INVENTÁRIO
// ===================================

import { renderAreaInvChart } from "../components/charts/inventory/chartAreaInv.js";

import { renderSensitiveInvChart } from "../components/charts/inventory/chartSensitiveInv.js";

import { renderMinorsInvChart } from "../components/charts/inventory/chartMinorsInv.js";

import { renderStorageInvChart } from "../components/charts/inventory/chartStorageInv.js";

import { renderThirdPartyInvChart } from "../components/charts/inventory/chartThirdPartyInv.js";

import { renderTransferInvChart } from "../components/charts/inventory/chartTransferInv.js";

// ===================================
// IMPORTS GRÁFICOS VISÃO GERAL
// ===================================

import { renderAreaExposureChart } from "../components/charts/overview/chartAreaExposure.js";

import { renderCriticalSystemsChart } from "../components/charts/overview/chartCriticalSystems.js";

import { renderLegalBasisRiskChart } from "../components/charts/overview/chartLegalBasisRisk.js";

import { renderMaturityChart } from "../components/charts/overview/chartMaturity.js";

// ===================================
// IMPORTS GRÁFICOS RISCO
// ===================================

import { renderRiskAreaChart } from "../components/charts/risk/chartRiskArea.js";

import { renderRiskLevelChart } from "../components/charts/risk/chartRiskLevel.js";

import { renderRiskProbabilityChart } from "../components/charts/risk/chartRiskProbability.js";

import { renderResponseStrategyChart } from "../components/charts/risk/chartResponseStrategy.js";

import { renderActionStatusChart } from "../components/charts/risk/chartActionStatus.js";

// ===================================
// ESTADO GLOBAL
// ===================================

let rawData = [];

let filtered = [];


let inventoryRiskLinks = {};

// ===================================
// EXPORTA GLOBALMENTE
// ===================================

window.rawData = rawData;

window.filtered = filtered;

window.riskData = riskData;

window.inventoryRiskLinks = inventoryRiskLinks;


// ===================================
// EVENTOS
// ===================================


// ===================================
// IMPORTAÇÃO INVENTÁRIO
// ===================================

function handleFileUpload(event) {
  console.clear();

  console.log("[IMPORTAÇÃO] Iniciando...");
  console.log("Primeiro registro:");
  console.log(rawData[0]);
  try {
    const file = event.target.files?.[0];

    if (!file) {
      throw new Error("Nenhum arquivo selecionado.");
    }

    console.log("[IMPORTAÇÃO] Arquivo:", file.name);

    const reader = new FileReader();

    reader.onload = function (e) {
      try {
        console.log("[IMPORTAÇÃO] Lendo arquivo...");

        // ====================================
        // LEITURA EXCEL
        // ====================================

        const data = new Uint8Array(e.target.result);

        const workbook = XLSX.read(data, {
          type: "array",
        });

        console.log("[IMPORTAÇÃO] Abas encontradas:", workbook.SheetNames);

        // ====================================
        // PROCURA ABA
        // ====================================

        let sheetName;

        try {
          sheetName = findInventorySheet(workbook);

          console.log("[IMPORTAÇÃO] Aba encontrada:", sheetName);
        } catch (error) {
          throw new Error("Erro ao localizar aba:\n" + error.message);
        }

        // ====================================
        // LÊ ABA
        // ====================================

        const sheet = workbook.Sheets[sheetName];

        if (!sheet) {
          throw new Error(
            `A aba ${sheetName}
não foi carregada`,
          );
        }

        // ====================================
        // CONVERTE PLANILHA
        // ====================================

        const rows = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: "",
        });

        console.log("[IMPORTAÇÃO] Linhas:", rows.length);

        if (rows.length < 2) {
          throw new Error("Planilha vazia.");
        }

        // ====================================
        // CABEÇALHOS
        // ====================================

        // ====================================
        // DETECTA CABEÇALHO AUTOMATICAMENTE
        // ====================================

        let headerIndex = -1;

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];

          const rowText = row.join(" ").toLowerCase();

          if (
            rowText.includes("nome da área") ||
            rowText.includes("nome do processo") ||
            rowText.includes("quais dados")
          ) {
            headerIndex = i;

            break;
          }
        }

        if (headerIndex === -1) {
          throw new Error(`Não foi possível localizar a linha do cabeçalho`);
        }

        const headers = rows[headerIndex].map((col) =>
          String(col || "").trim(),
        );

        console.log(
          "[IMPORTAÇÃO] Cabeçalho localizado linha:",
          headerIndex + 1,
        );

        console.log(headers);

        console.log("[IMPORTAÇÃO] Cabeçalhos:", headers);

        // ====================================
        // VALIDA
        // ====================================

        try {
          validateInventoryColumns(Object.keys(COLUMN_MAP));

          console.log(
            "[IMPORTAÇÃO] Validando campos internos:",
            INVENTORY_REQUIRED_FIELDS,
          );

          validateInventoryColumns(INVENTORY_REQUIRED_FIELDS);

          console.log("[IMPORTAÇÃO] Colunas válidas");
        } catch (error) {
          throw new Error("Erro nas colunas:\n" + error.message);
        }

        // ====================================
        // LIMPA
        // ====================================

        rawData = [];

        // ====================================
        // MAPEIA
        // ====================================

        rows.slice(headerIndex + 1).forEach((row, index) => {
          try {
            const item = {};

            Object.entries(COLUMN_MAP)

              .forEach(([field, aliases]) => {
                const columnIndex = headers.findIndex((header) =>
                  aliases.some(
                    (alias) => normalize(header) === normalize(alias),
                  ),
                );

                if (columnIndex >= 0) {
                  item[field] = row[columnIndex] || "";
                }
              });

            const possuiDados = Object.values(item)

              .some((v) => String(v).trim() !== "");

            if (possuiDados) {
              rawData.push(item);
            }
          } catch (error) {
            console.error(
              `Erro linha ${index + 2}`,

              error,
            );
          }
        });

        // ====================================
        // VALIDA DADOS
        // ====================================

        if (rawData.length === 0) {
          throw new Error("Nenhum registro válido encontrado");
        }

        console.log("[IMPORTAÇÃO] Registros:", rawData.length);

        // ====================================
        // ESTADO
        // ====================================

        filtered = [...rawData];
        inventoryRiskLinks = {};
        window.inventoryRiskLinks = inventoryRiskLinks;
        window.rawData = rawData;

        window.filtered = filtered;

        // ====================================
        // RENDERIZA
        // ====================================

        try {
          renderAll();

          console.log("[IMPORTAÇÃO] Render OK");
          console.log("Primeiro registro:");
          console.log(rawData[0]);
        } catch (error) {
          console.error(error);

          throw new Error("Erro ao renderizar dashboard");
        }

        // ====================================
        // ATUALIZA DATA
        // ====================================

        updateLastUpdate();

        alert(
          `${rawData.length}
registros importados`,
        );
      } catch (error) {
        console.error(
          "[ERRO IMPORTAÇÃO]",

          error,
        );

        alert(error.message);
      }
    };

    reader.onerror = function () {
      console.error("Erro FileReader");

      alert("Erro ao ler arquivo.");
    };

    reader.readAsArrayBuffer(file);
  } catch (error) {
    console.error(error);

    alert(error.message);
  }
}

window.handleFileUpload = handleFileUpload;
window.handleFileUploadMatriz = handleFileUploadMatriz;
// ===================================
// RENDER GERAL
// ===================================

function renderAll() {
  renderInventoryCharts();

  window.renderRiskMatrix?.();

  renderOverviewCharts();

  renderRiskCharts();

  renderTable();

  renderKPIs();

  populateFilters();
}

// ===================================
// INVENTÁRIO
// ===================================

function renderInventoryCharts() {
  renderAreaInvChart(filtered);

  renderSensitiveInvChart(filtered);

  renderMinorsInvChart(filtered);

  renderStorageInvChart(filtered);

  renderThirdPartyInvChart(filtered);

  renderTransferInvChart(filtered);
}

// ===================================
// VISÃO GERAL
// ===================================

function renderOverviewCharts() {
  renderAreaExposureChart(filtered, inventoryRiskLinks);

  renderCriticalSystemsChart(filtered);

  renderLegalBasisRiskChart(filtered);

  renderMaturityChart(filtered);

  renderRiskLevelChart(riskData);
}

// ===================================
// RISCO
// ===================================

function renderRiskCharts() {
  console.log("[RISCOS] dados recebidos:", riskData);

  renderRiskLevelChart(riskData);

  renderRiskAreaChart(riskData);

  renderRiskProbabilityChart(riskData);

  renderResponseStrategyChart(riskData);

  renderActionStatusChart(riskData);
}

// ===================================
// AUXILIARES
// ===================================

function updateLastUpdate() {
  const campo = document.getElementById("lastUpdate");

  if (campo) {
    campo.textContent = new Date().toLocaleString("pt-BR");
  }
}

// ===================================
// PLACEHOLDERS
// ===================================

function renderTable() {}

function renderKPIs() {
  const container = document.getElementById("kpiGrid");

  if (!container) return;

  const data = filtered;

  // totais

  const totalSubprocessos = data.length;

  const totalAreas = new Set(data.map((i) => i.area).filter(Boolean)).size;

  const totalProcessos = new Set(data.map((i) => i.processo).filter(Boolean))
    .size;

  const dadosSensiveis = data.filter((i) =>
    String(i.sensivel).toLowerCase().includes("sim"),
  ).length;

  const dadosMenores = data.filter((i) =>
    String(i.menor).toLowerCase().includes("sim"),
  ).length;

  const terceiros = data.filter((i) =>
    String(i.terceiros).toLowerCase().includes("sim"),
  ).length;

  const transferencia = data.filter((i) =>
    String(i.transferencia).toLowerCase().includes("sim"),
  ).length;

  const sistemasCriticos = new Set(
    data
      .flatMap((i) => String(i.sistemas || "").split(";"))
      .map((v) => v.trim())
      .filter(Boolean),
  ).size;

  const kpis = [
    {
      titulo: "Subprocessos",
      valor: totalSubprocessos,
    },

    {
      titulo: "Áreas",
      valor: totalAreas,
    },

    {
      titulo: "Processos",
      valor: totalProcessos,
    },

    {
      titulo: "Dados Sensíveis",
      valor: dadosSensiveis,
    },

    {
      titulo: "Dados de Menores",
      valor: dadosMenores,
    },

    {
      titulo: "Compartilhamentos",
      valor: terceiros,
    },

    {
      titulo: "Transferência Internacional",
      valor: transferencia,
    },

    {
      titulo: "Sistemas",
      valor: sistemasCriticos,
    },
  ];

  container.innerHTML = kpis
    .map(
      (kpi) => `
        
        <div class="kpi-card">

            <div class="kpi-value">
                ${kpi.valor}
            </div>

            <div class="kpi-label">
                ${kpi.titulo}
            </div>

        </div>

        `,
    )
    .join("");
}
function populateFilters() {}

function switchTab(tabId) {
  // remove ativo de todas as abas
  document.querySelectorAll(".tab-content").forEach((el) => {
    el.classList.remove("active");
  });

  document.querySelectorAll(".tab").forEach((el) => {
    el.classList.remove("active");
  });

  // ativa conteúdo correto
  document.getElementById(tabId).classList.add("active");

  // ativa botão correspondente
  document.querySelector(`[data-tab="${tabId}"]`).classList.add("active");
}

// 🔥 IMPORTANTE: expõe globalmente (evita erro do onclick)
window.switchTab = switchTab;

// Alternativa mais moderna (recomendado)
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      switchTab(tab.dataset.tab);
    });
  });
});
window.handleFileUpload = handleFileUpload;
window.handleFileUploadMatriz = handleFileUploadMatriz;
window.switchTab = switchTab;