//Mostrar quais áreas possuem maior quantidade de subprocessos cadastrados no inventário.
// ======================================
// SUBPROCESSOS POR ÁREA
// chartAreaInv.js
// ======================================

import { createChart } from "../../chartHelpers.js";

console.log("renderAreaInvChart carregado");

export function renderAreaInvChart(data = []) {

    try {

        if (!Array.isArray(data)) {
            console.error(
                "[chartAreaInv] dados inválidos"
            );
            return;
        }

        // ========================
        // CONTADOR POR ÁREA
        // ========================

        const areas = {};

        data.forEach(item => {

            const area =
                item.area ||
                "Não informado";

            areas[area] =
                (areas[area] || 0) + 1;

        });

        // ========================
        // ORDENA DO MAIOR
        // PARA MENOR
        // ========================

        const ordenado =
            Object.entries(areas)
            .sort(
                (a,b)=>
                b[1]-a[1]
            );

        const resultado =
            Object.fromEntries(
                ordenado
            );

        // ========================
        // SEM DADOS
        // ========================

        if (
            Object.keys(resultado)
            .length === 0
        ){

            console.warn(
                "[chartAreaInv] sem dados"
            );

            return;
        }

        // ========================
        // RENDERIZA
        // ========================

        createChart(
            "chartAreaInv",
            resultado,
            "bar",
            "y"
        );

    }

    catch(error){

        console.error(
            "[chartAreaInv]",
            error
        );

    }

}