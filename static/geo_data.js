document.addEventListener('DOMContentLoaded', function() {
    updateCoordinates();
});

function updateCoordinates() {
    const coords = document.getElementById('city').value.split(',');
    document.getElementById('latitude').value = coords[0];
    document.getElementById('longitude').value = coords[1];
}

function fetchWeatherAndPollution() {
    const lat = document.getElementById('latitude').value;
    const lon = document.getElementById('longitude').value;

    // Запрашиваем данные о погоде
    fetch(`/weather/current/${lat}/${lon}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch weather data');
            }
            return response.json();
        })
        .then(weatherData => {
            displayWeatherData(weatherData);
            return fetch(`/pollution/${lat}/${lon}`); // Запрашиваем данные о загрязнении
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch pollution data');
            }
            return response.json();
        })
        .then(pollutionData => {
            displayPollutionData(pollutionData);
            generateRecommendations(weatherData, pollutionData); // Вызываем рекомендации
        })
        .catch(error => {
            console.error('Ошибка при запросе данных:', error);
            document.getElementById('weatherResults').innerHTML = '<p>Ошибка при запросе данных.</p>';
            document.getElementById('pollutionResults').innerHTML = '<p>Ошибка при запросе данных.</p>';
        });
}

function displayWeatherData(weatherData) {
    let results = '<p>Ошибка при получении данных о погоде.</p>';
    if (weatherData.main) {
        results = `
            <h3>Погодные условия:</h3>
            <p>Температура: ${weatherData.main.temp} °C</p>
            <p>Ощущается как: ${weatherData.main.feels_like} °C</p>
            <p>Давление: ${weatherData.main.pressure} hPa</p>
            <p>Влажность: ${weatherData.main.humidity}%</p>
            <p>Скорость ветра: ${weatherData.wind.speed} м/с</p>
            <p>Облачность: ${weatherData.clouds.all}%</p>
            <p>Описание: ${weatherData.weather[0].description}</p>
        `;
        document.getElementById('weatherResults').innerHTML = results;
    } else {
        document.getElementById('weatherResults').innerHTML = results;
    }
}

function displayPollutionData(pollutionData) {
    let results = '<p>Нет данных о загрязнении воздуха.</p>';
    if (pollutionData.list && pollutionData.list.length) {
        const pollution = pollutionData.list[0].components;
        results = `
            <h3>Загрязнение воздуха:</h3>
            <p>CO: ${pollution.co} µg/m³</p>
            <p>NO: ${pollution.no} µg/m³</p>
            <p>NO2: ${pollution.no2} µg/m³</p>
            <p>O3: ${pollution.o3} µg/m³</p>
            <p>SO2: ${pollution.so2} µg/m³</p>
            <p>PM2.5: ${pollution.pm2_5} µg/m³</p>
            <p>PM10: ${pollution.pm10} µg/m³</p>
            <p>NH3: ${pollution.nh3} µg/m³</p>
        `;
        document.getElementById('pollutionResults').innerHTML = results;
    } else {
        document.getElementById('pollutionResults').innerHTML = results;
    }
}

function generateRecommendations(weatherData, pollutionData) {
    let recommendations = '<h4>Рекомендации:</h4>';
    // Добавьте логику рекомендаций здесь, используя `weatherData` и `pollutionData`
    document.getElementById('recommendations').innerHTML = recommendations;
}
function drawWeatherChart(weatherData) {
    const ctx = document.getElementById('weatherChart').getContext('2d');
    const labels = weatherData.map(data => new Date(data.time).toLocaleTimeString());  // Временные метки
    const tempData = weatherData.map(data => data.main.temp);
    const windData = weatherData.map(data => data.wind.speed);
    const humidityData = weatherData.map(data => data.main.humidity);

    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Температура (°C)',
                data: tempData,
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                yAxisID: 'y',
            }, {
                label: 'Скорость ветра (м/с)',
                data: windData,
                borderColor: 'rgb(54, 162, 235)',
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                yAxisID: 'y1',
            }, {
                label: 'Влажность (%)',
                data: humidityData,
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                yAxisID: 'y',
            }]
        },
        options: {
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: {
                        drawOnChartArea: false, // only want the grid lines for one axis to show up
                    },
                },
            }
        }
    });
}

function fetchForecast() {
    const lat = document.getElementById('latitude').value;
    const lon = document.getElementById('longitude').value;
    const url = `/weather/forecast/${lat}/${lon}`;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch forecast data');
            }
            return response.json();
        })
        .then(forecastData => {
            drawForecastChart(forecastData);
        })
        .catch(error => {
            console.error('Ошибка при запросе прогноза погоды:', error);
            document.getElementById('forecastResults').innerHTML = '<p>Ошибка при запросе прогноза погоды.</p>';
        });
}

function drawForecastChart(forecastData) {
    const ctx = document.getElementById('forecastChart').getContext('2d');
    if (window.forecastChartInstance) {
        window.forecastChartInstance.destroy(); // Удаляем предыдущий график, если он существует
    }
    const labels = forecastData.list.map(item => new Date(item.dt * 1000).toLocaleString());
    const tempData = forecastData.list.map(item => item.main.temp);

    window.forecastChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Температура (°C)',
                data: tempData,
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });
}
