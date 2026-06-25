import { createChart } from "../../chartHelpers.js";

export function renderMinorsInvChart(data){

    const dataset={
        "Sim":0,
        "Não":0
    };

    data.forEach(item=>{

        const valor=(item.menor||"")
        .toLowerCase();

        if(valor.includes("sim"))
            dataset["Sim"]++;

        else
            dataset["Não"]++;

    });

    createChart(
        "chartMenorInv",
        dataset,
        "doughnut"
    );

}