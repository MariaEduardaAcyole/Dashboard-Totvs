// ======================================
// GERA CHAVE ÚNICA INVENTÁRIO
// ======================================

export function getInventoryRowKey(row) {

    return [
        row.id || "",
        row.empresa || "",
        row.area || "",
        row.processo || "",
        row.subprocesso || ""
    ]
    .join("_")
    .toLowerCase()
    .trim();

}   