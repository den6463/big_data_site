document.addEventListener("DOMContentLoaded", function() {
    // Инициализация дат при загрузке страницы
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - 4);  // Установка начальной даты на 4 месяца назад

    document.getElementById('end-date').value = formatDate(endDate);
    document.getElementById('start-date').value = formatDate(startDate);

    // Установка обработчиков событий
    document.getElementById('ticker').addEventListener('change', function() {
        loadData();
        loadNews();
    });

    // Загрузка данных при первом открытии страницы
    loadData();
    loadNews();
});

function formatDate(date) {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
}

function loadData() {
    const ticker = document.getElementById('ticker').value;
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    const url = `/data/${ticker}?start=${startDate}&end=${endDate}`;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log("Received data:", data); // Проверьте, что данные правильно загружены и имеют ожидаемую структуру
            updateChart(data, ticker);
        })
        .catch(error => {
            console.error('Error loading financial data:', error);
        });
}

function updateChart(data, ticker) {
    const ctx = document.getElementById('myChart').getContext('2d');
    if (window.chartInstance) {
        window.chartInstance.destroy();
    }
    window.chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(item => item.Date),
            datasets: createDatasets(data, ticker)
        },
        options: getChartOptions()
    });
    displayAnalysis(data);
}

function createDatasets(data, ticker) {
    return [
        {
            label: `Цена открытия акций ${ticker}`,
            data: document.getElementById('open').checked ? data.map(item => item.Open) : [],
            borderColor: 'rgba(255, 99, 132, 1)',
            fill: false
        },
        {
            label: `Максимальная цена акций ${ticker}`,
            data: document.getElementById('high').checked ? data.map(item => item.High) : [],
            borderColor: 'rgba(54, 162, 235, 1)',
            fill: false
        },
        {
            label: `Минимальная цена акций ${ticker}`,
            data: document.getElementById('low').checked ? data.map(item => item.Low) : [],
            borderColor: 'rgba(255, 206, 86, 1)',
            fill: false
        },
        {
            label: `Цена закрытия акций ${ticker}`,
            data: document.getElementById('close').checked ? data.map(item => item.Close) : [],
            borderColor: 'rgba(75, 192, 192, 1)',
            fill: false
        },
        {
            label: `Объем торгов акций ${ticker}`,
            data: document.getElementById('volume').checked ? data.map(item => item.Volume) : [],
            borderColor: 'rgba(153, 102, 255, 1)',
            borderWidth: 2,
            fill: false
        }
    ];
}


function getChartOptions() {
    return {
        responsive: true,
        scales: {
            y: {
                beginAtZero: false
            },
            x: {
                type: 'time',
                time: {
                    unit: 'day',
                    tooltipFormat: 'yyyy-MM-dd',
                    displayFormats: {
                        day: 'yyyy-MM-dd'
                    }
                }
            }
        },
        plugins: {
            zoom: {
                pan: {
                    enabled: true,
                    mode: 'x'
                },
                zoom: {
                    wheel: {
                        enabled: true,
                        speed: 0.1
                    },
                    pinch: {
                        enabled: true
                    },
                    mode: 'x'
                }
            }
        }
    };
}

function displayAnalysis(data) {
    if (!data || !data.length) {
        document.getElementById('data-analysis').innerHTML = 'Данные для анализа отсутствуют.';
        return;
    }

    const prices = data.map(item => parseFloat(item.Close)).filter(item => !isNaN(item));
    const stats = calculateAdditionalStatistics(prices);

    document.getElementById('data-analysis').innerHTML = generateAnalysisHTML(stats);
}

function calculateAdditionalStatistics(prices) {
    prices.sort((a, b) => a - b);
    const mean = prices.reduce((acc, val) => acc + val, 0) / prices.length;
    const median = calculateMedian(prices);
    const q1 = calculatePercentile(prices, 25);
    const q3 = calculatePercentile(prices, 75);
    const iqr = q3 - q1;
    const stdDeviation = calculateStdDeviation(prices, mean);
    const cv = stdDeviation / mean;
    const skewness = calculateSkewness(prices, mean, stdDeviation);
    const kurtosis = calculateKurtosis(prices, mean, stdDeviation);

    return { mean, median, q1, q3, iqr, stdDeviation, cv, skewness, kurtosis };
}

function generateAnalysisHTML(stats) {
    return `
        <p><strong>Средняя цена закрытия:</strong> ${stats.mean.toFixed(2)} <small>(среднее значение)</small></p>
        <p><strong>Медиана:</strong> ${stats.median.toFixed(2)} <small>(делит данные на две равные части)</small></p>
        <p><strong>Первый квартиль (Q1):</strong> ${stats.q1.toFixed(2)} <small>(ниже этого значения 25% данных)</small></p>
        <p><strong>Третий квартиль (Q3):</strong> ${stats.q3.toFixed(2)} <small>(ниже этого значения 75% данных)</small></p>
        <p><strong>Межквартильный размах (IQR):</strong> ${stats.iqr.toFixed(2)} <small>(мера статистического разброса и стабильности)</small></p>
        <p><strong>Стандартное отклонение:</strong> ${stats.stdDeviation.toFixed(2)} <small>(мера разброса данных вокруг среднего значения)</small></p>
        <p><strong>Коэффициент вариации:</strong> ${(stats.cv * 100).toFixed(2)}% <small>(относительная мера разброса данных)</small></p>
        <p><strong>Скос:</strong> ${stats.skewness.toFixed(2)} <small>(показывает асимметрию данных)</small></p>
        <p><strong>Эксцесс:</strong> ${stats.kurtosis.toFixed(2)} <small>(показывает остроту пика распределения данных)</small></p>
    `;
}
function calculateMedian(values) {
    values.sort((a, b) => a - b);
    const mid = Math.floor(values.length / 2);
    return values.length % 2 !== 0 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
}

function calculatePercentile(values, percentile) {
    values.sort((a, b) => a - b);
    const index = Math.floor(percentile / 100 * values.length);
    return values[index];
}

function calculateStdDeviation(values, mean) {
    const squaredDiffs = values.map(value => {
        const diff = value - mean;
        return diff * diff;
    });
    const avgSquaredDiff = squaredDiffs.reduce((sum, value) => sum + value, 0) / values.length;
    return Math.sqrt(avgSquaredDiff);
}

function calculateSkewness(values, mean, stdDeviation) {
    const n = values.length;
    const skew = values.reduce((acc, val) => acc + Math.pow((val - mean) / stdDeviation, 3), 0) / n;
    return skew;
}

function calculateKurtosis(values, mean, stdDeviation) {
    const n = values.length;
    const kurt = values.reduce((acc, val) => acc + Math.pow((val - mean) / stdDeviation, 4), 0) / n - 3;
    return kurt;
}

function loadNews() {
    const ticker = document.getElementById('ticker').value;
    const url = `/api/news/${ticker}`;

    fetch(url)
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch news');
        }
        return response.json();
    })
    .then(newsData => {
        const newsContainer = document.getElementById('news');
        newsContainer.innerHTML = '';
        newsData.forEach(news => {
            newsContainer.innerHTML += `<div class="news-item mb-3 p-2 border rounded">
                <h5>${news.title}</h5>
                <p>${news.summary}</p>
                <a href="${news.url}" target="_blank">Читать далее</a>
            </div>`;
        });
    })
    .catch(error => {
        console.error('Error fetching news:', error);
        document.getElementById('news').innerHTML = 'Ошибка загрузки новостей.';
    });
}
