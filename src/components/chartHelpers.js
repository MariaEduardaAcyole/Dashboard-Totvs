// =====================================
// INSTÂNCIAS DOS GRÁFICOS
// =====================================

const charts = {};
const riskCharts = {};
// Funções de gráfico reutilizáveis para app e matriz
export function createChart(chartId, chartData, type, indexAxis = "x") {
    const labels = Object.keys(chartData);
    const values = Object.values(chartData);

    // Corrigido: legenda usa exatamente os mesmos valores do gráfico
    const labelsComValor = labels.map((label, i) => 
        `${label} (${values[i]})`
    );

    if (charts[chartId]) {
        charts[chartId].destroy();
    }

    const ctx = document.getElementById(chartId);
    if (!ctx) return;

    charts[chartId] = new Chart(ctx, {
        type: type,
        data: {
            labels: labelsComValor,
            datasets: [{
                data: values
            }]
        },
        options: {
            indexAxis
        }
    });
}

export function createRiskChart(id, dataset, type) {
    const ctx = document.getElementById(id);
    if (!ctx) return;

    const labels = Object.keys(dataset).filter(k => k);
    const data = labels.map(k => dataset[k]);
    const colors = [
        '#c026d3', '#ef4444', '#f59e0b', '#22c55e',
        '#4f8ef7', '#06b6d4', '#10b981', '#f97316'
    ];

    const config = {
        type,
        data: {
            labels: labels,
            datasets: [{
                label: id.replace('chart', ''),
                data: data,
                backgroundColor: type === 'doughnut'
                    ? labels.map((_, i) => colors[i % colors.length])
                    : '#ef4444',
                borderColor: type === 'doughnut' ? '#141720' : '#4f8ef7',
                borderWidth: type === 'doughnut' ? 2 : 1,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            indexAxis: type === 'bar' && id === 'chartRiskArea' ? 'y' : 'x',
            plugins: {
                legend: {
                    display: type === 'doughnut',
                    position: 'bottom',
                    labels: {
                        color: '#e8eaf0',
                        font: { size: 12 },
                        padding: 15
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 10,
                    borderRadius: 6,
                    titleFont: { size: 13, weight: 'bold' },
                    bodyFont: { size: 12 }
                }
            },
            scales: type === 'doughnut' ? {} : {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#7a8299', font: { size: 11 } }
                },
                x: {
                    grid: { display: false },
                    ticks: {
                        color: '#7a8299',
                        font: { size: 11 },
                        maxRotation: 45
                    }
                }
            }
        }
    };

    if (riskCharts[id]) {
        riskCharts[id].destroy();
    }

    riskCharts[id] = new Chart(ctx, config);
}
