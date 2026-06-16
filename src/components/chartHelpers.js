// Funções de gráfico reutilizáveis para app e matriz
function createChart(id, dataset, type, indexAxis) {
    const ctx = document.getElementById(id);
    if (!ctx) return;

    const labels = Object.keys(dataset).filter(k => k && k !== "undefined");
    const data = labels.map(k => dataset[k]);
    const chartField = chartFieldMap[id];
    const activeFiltersForChart = chartFilters[chartField] || [];

    const colors = [
        '#4f8ef7', '#06b6d4', '#10b981', '#f59e0b', '#ef4444',
        '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1'
    ];

    const backgroundColors = type === 'doughnut'
        ? labels.map((label, index) => {
            const filterValue = chartLabelToFilterValue(id, label);
            return activeFiltersForChart.includes(filterValue)
                ? colors[index % colors.length]
                : 'rgba(100, 100, 100, 0.25)';
        })
        : colors[0];

    const chartConfig = {
        type,
        data: {
            labels: labels,
            datasets: [{
                label: id.replace('chart', ''),
                data: data,
                backgroundColor: backgroundColors,
                borderColor: type === 'doughnut' ? '#141720' : '#4f8ef7',
                borderWidth: type === 'doughnut' ? 2 : 1,
                borderRadius: 6,
                hoverBackgroundColor: 'rgba(79, 142, 247, 0.9)'
            }]
        },
        options: {
            indexAxis: indexAxis || 'x',
            responsive: true,
            onClick: (event, elements, chart) => {
                if (elements && elements.length > 0) {
                    const index = elements[0].index;
                    const label = chart.data.labels[index];
                    if (label) {
                        filterByChartClick(id, label);
                    }
                }
            },
            plugins: {
                legend: {
                    display: type === 'doughnut',
                    position: 'bottom',
                    labels: {
                        color: '#e8eaf0',
                        font: { size: 12 },
                        padding: 15,
                        cursor: 'pointer'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 10,
                    borderRadius: 6,
                    titleFont: { size: 13, weight: 'bold' },
                    bodyFont: { size: 12 },
                    callbacks: {
                        label: function(context) {
                            let value;
                            if (context.parsed !== undefined) {
                                if (typeof context.parsed === "object") {
                                    value = context.parsed.x ?? context.parsed.y;
                                } else {
                                    value = context.parsed;
                                }
                            }
                            return 'Aparições: ' + (value ?? 0);
                        }
                    }
                }
            },
            scales: type === 'doughnut' ? {} : {
                y: {
                    beginAtZero: true,
                    grid: {
                        display: indexAxis === 'y' ? false : true,
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: '#7a8299',
                        font: { size: 11 }
                    }
                },
                x: {
                    grid: { display: indexAxis === 'y' ? true : false, color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: {
                        color: '#7a8299',
                        font: { size: 11 },
                        maxRotation: indexAxis === 'y' ? 0 : 45,
                        minRotation: 0
                    }
                }
            }
        }
    };

    if (charts[id]) {
        charts[id].destroy();
    }

    charts[id] = new Chart(ctx, chartConfig);
}

function createRiskChart(id, dataset, type) {
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
