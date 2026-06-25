let chartRiskLevel = null;

export function renderRiskLevelChart(data = []) {

    const canvas =
        document.getElementById(
            "chartRiskLevelResumo"
        );

    if (!canvas) return;

    // evita erro de canvas duplicado
    const existingChart =
        Chart.getChart(canvas);

    if (existingChart) {
        existingChart.destroy();
    }

    console.log(
        "[RISK LEVEL] Dados recebidos:",
        data
    );

    const resultado = {
        "Baixo":0,
        "Médio":0,
        "Alto":0,
        "Crítico":0
    };

    // MATRIZ FIXA
    const matrizRisco = {

        // BAIXA
        "baixa_baixo":"Baixo",
        "baixa_moderado":"Baixo",
        "baixa_alto":"Médio",
        "baixa_muito alto":"Médio",

        // MÉDIA
        "média_baixo":"Baixo",
        "media_baixo":"Baixo",

        "média_moderado":"Médio",
        "media_moderado":"Médio",

        "média_alto":"Alto",
        "media_alto":"Alto",

        "média_muito alto":"Crítico",
        "media_muito alto":"Crítico",

        // ALTA
        "alta_baixo":"Médio",
        "alta_moderado":"Alto",
        "alta_alto":"Alto",
        "alta_muito alto":"Crítico"
    };

   data.forEach(item => {

    let prob = String(
        item.probabilidade || ""
    )
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"");

    let sev = String(
        item.severidade || ""
    )
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"");


    // normalização PROBABILIDADE

    if (
        prob.includes("improv")
    ){
        prob="baixa";
    }
    else if(
        prob.includes("poss")
    ){
        prob="media";
    }
    else if(
        prob.includes("prov")
    ){
        prob="alta";
    }
    else if(
        prob.includes("quase")
    ){
        prob="alta";
    }


    // normalização SEVERIDADE

    if(
        sev.includes("baixo")
    ){
        sev="baixo";
    }
    else if(
        sev.includes("moder")
    ){
        sev="moderado";
    }
    else if(
        sev.includes("severo")
    ){
        sev="alto";
    }
    else if(
        sev.includes("catastro")
    ){
        sev="muito alto";
    }


    const chave =
        `${prob}_${sev}`;

    console.log(
        "[RISK]",
        item,
        "→",
        chave
    );

    const nivel =
        matrizRisco[chave]
        || "Baixo";

    resultado[nivel]++;
});
    console.log(
        "[RISK LEVEL] Resultado:",
        resultado
    );

    chartRiskLevel =
        new Chart(
            canvas,
            {
                type:"doughnut",

                data:{
                    labels:
                    Object.keys(
                        resultado
                    ),

                    datasets:[
                        {
                            data:
                            Object.values(
                                resultado
                            ),

                            backgroundColor:[
                                "#22c55e",
                                "#f59e0b",
                                "#ef4444",
                                "#c026d3"
                            ],

                            borderWidth:2
                        }
                    ]
                },

                options:{
                    responsive:true,

                    plugins:{
                        legend:{
                            position:"bottom"
                        },

                        tooltip:{
                            callbacks:{
                                label:function(context){

                                    return `${context.label}: ${context.raw} riscos`;

                                }
                            }
                        }
                    }
                }
            }
        );
}