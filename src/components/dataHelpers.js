// Data helpers reutilizáveis para app e matriz
function normalizeRowKeys(row) {
    const newRow = {};
    Object.keys(row).forEach(key => {
        const cleanKey = key.trim();
        newRow[cleanKey] = row[key];
    });
    return newRow;
}

function normalizeText(v) {
    return String(v || "").toLowerCase().trim();
}

function normalizeFilterValue(fieldName, value) {
    const normalizedValue = normalizeText(value);

    if (fieldName === 'sensivel' || fieldName === 'menor') {
        return normalizedValue === 'sim' || normalizedValue === 'true';
    }

    if (fieldName === 'terceiros' || fieldName === 'transfIntl') {
        if (normalizedValue.includes('com') || normalizedValue === 'sim') return 'sim';
        if (normalizedValue.includes('sem') || normalizedValue === 'nao' || normalizedValue === 'não') return 'não';
        return normalizedValue;
    }

    return normalizedValue;
}

function chartLabelToFilterValue(chartId, label) {
    const normalizedLabel = normalizeText(label);

    if (chartId === 'chartTransfIntl' || chartId === 'chartTransfIntlInv') {
        return normalizedLabel.includes('com') ? 'sim' : 'não';
    }

    if (chartId === 'chartComTerceiros' || chartId === 'chartComTerceirosInv') {
        return normalizedLabel.includes('com') ? 'sim' : 'não';
    }

    return normalizedLabel;
}

function matchesFilterValue(fieldName, rowValue, filterValue) {
    const normalizedFilter = normalizeFilterValue(fieldName, filterValue);

    if (fieldName === 'sensivel' || fieldName === 'menor') {
        return rowValue === normalizedFilter;
    }

    if (fieldName === 'terceiros' || fieldName === 'transfIntl') {
        return normalizeFilterValue(fieldName, rowValue) === normalizedFilter;
    }

    if (Array.isArray(rowValue)) {
        return rowValue
            .map(v => normalizeText(v))
            .includes(normalizedFilter);
    }

    return normalizeText(rowValue) === normalizedFilter;
}

function splitMulti(value) {
    if (!value) return ["não informado"];
    return [...new Set(
        String(value)
            .split(/[;,\n]+/)
            .map(v => normalizeText(v.trim()))
            .filter(v => v && v !== "")
    )];
}

function normalizeHeader(str) {
    return String(str || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function getNormalizedHeaders(row) {
    return Object.keys(row).map(key => normalizeText(key));
}

function fieldExistsInHeaders(headers, possibleNames) {
    return possibleNames.some(name => {
        const normalizedName = normalizeText(name);
        return headers.some(header => header.includes(normalizedName) || normalizedName.includes(header));
    });
}

function listMissingColumns(row, requiredFields, columnMap) {
    const headers = getNormalizedHeaders(row);
    return requiredFields.filter(field => {
        const possibleNames = columnMap[field] || [];
        return !fieldExistsInHeaders(headers, possibleNames);
    });
}

function parseSheetWithHeaderDetection(sheet, requiredFields, columnMap) {
    const candidateRanges = [0, 1, 2, 3];
    for (const range of candidateRanges) {
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: "", range });
        if (!rows || rows.length === 0) continue;
        if (listMissingColumns(rows[0], requiredFields, columnMap).length === 0) {
            return rows.map(normalizeRowKeys);
        }
    }

    const fallbackRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    return fallbackRows.map(normalizeRowKeys);
}

function findBestSheet(workbook, possibleNames) {
    const normalizedNames = possibleNames.map(name => normalizeText(name));
    for (const sheetName of workbook.SheetNames) {
        const normalizedSheetName = normalizeText(sheetName);
        if (normalizedNames.some(name => normalizedSheetName.includes(name) || name.includes(normalizedSheetName))) {
            return workbook.Sheets[sheetName];
        }
    }
    return null;
}

function getValue(row, field) {
    const possibleNames = COLUMN_MAP[field];
    if (!possibleNames) return "";

    const keys = Object.keys(row);
    for (const key of keys) {
        const normalizedKey = normalizeText(key);
        for (const name of possibleNames) {
            if (normalizedKey.includes(normalizeText(name))) {
                return row[key];
            }
        }
    }

    return "";
}
