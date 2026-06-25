/*
Ranking de Áreas por Exposição LGPD

Como funciona:

Peso 1:
Subprocessos

Peso 2:
Dados sensíveis

Peso 3:
Dados de menores

Peso 4:
Riscos relacionados

Quanto maior a pontuação,
maior a exposição.
*/
import { createChart }
from "../../chartHelpers.js";

import { getInventoryRowKey }
from "../../helpers/inventoryHelpers.js";
export function renderAreaExposureChart(data = []) {
  const ctx = document.getElementById("chartAreaRisk");

  if (!ctx) return;

  const areas = {};

  data.forEach(item => {
    const area = item.area || item["Nome da área de negócio"] || "Sem área";

    if (!areas[area]) areas[area] = 0;

    areas[area]++;
  });

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: Object.keys(areas),
      datasets: [{
        label: "Exposição LGPD",
        data: Object.values(areas)
      }]
    }
  });
}