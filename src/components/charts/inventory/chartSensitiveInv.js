/*
Dados Sensíveis

Como funciona:

Conta subprocessos
que tratam dados
sensíveis ou não.
*/
import { createChart } from "../../chartHelpers.js";

export function renderSensitiveInvChart(filteredData) {
  const sim = filteredData.filter((x) => x.sensivel === "Sim").length;

  const nao = filteredData.length - sim;

  createChart(
    "chartSensivelInv",

    {
      labels: ["Sim", "Não"],

      datasets: [
        {
          data: [sim, nao],
        },
      ],
    },

    "doughnut",
  );
}
