let maturityChart = null;

export function renderMaturityChart(data = []) {

    const canvas =
        document.getElementById("chartMaturity");

    if (!canvas) return;

    if (maturityChart){
        maturityChart.destroy();
    }

    const maturidade = {
        "Alta":0,
        "Média":0,
        "Baixa":0,
        "Crítica":0
    };

    data.forEach(item=>{

        let score = 0;

        if(
            item.sensivel?.toLowerCase()
            === "sim"
        ){
            score += 30;
        }

        if(
            item.menor?.toLowerCase()
            === "sim"
        ){
            score += 25;
        }

        if(
            item.terceiros?.toLowerCase()
            === "sim"
        ){
            score += 20;
        }

        if(
            item.transferencia?.toLowerCase()
            === "sim"
        ){
            score += 25;
        }

        let nivel;

        if(score <=25){

            nivel="Alta";

        }else if(score<=50){

            nivel="Média";

        }else if(score<=75){

            nivel="Baixa";

        }else{

            nivel="Crítica";
        }

        maturidade[nivel]++;
    });

    maturityChart =
    new Chart(canvas,{

        type:"doughnut",

        data:{
            labels:Object.keys(
                maturidade
            ),

            datasets:[{
                data:Object.values(
                    maturidade
                ),

                backgroundColor:[
                    "#22c55e",
                    "#f59e0b",
                    "#ef4444",
                    "#c026d3"
                ]
            }]
        },

        options:{

            responsive:true,

            plugins:{

                legend:{
                    position:"bottom"
                },

                tooltip:{
                    callbacks:{
                        label(ctx){

                            return `${ctx.label}: ${ctx.raw} processos`;

                        }
                    }
                }
            }
        }
    });

}