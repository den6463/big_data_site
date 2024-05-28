document.addEventListener('DOMContentLoaded', function() {
    const uploadForm = document.getElementById('uploadForm');
    uploadForm.addEventListener('submit', uploadAndAnalyze);


});

function uploadAndAnalyze(event) {
    event.preventDefault();  // Предотвращаем стандартную отправку формы

    const fileInput = document.getElementById('file');
    if (!fileInput.files.length) {
        alert('Пожалуйста, выберите файл для загрузки.');
        return;
    }

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    fetch('/upload-xlsx', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        displayResults(data);
        if (data.genderData) {
            document.getElementById('genderChartContainer');
            drawChart('genderChart', 'pie', Object.keys(data.genderData), Object.values(data.genderData), ['rgba(54, 162, 235, 0.5)', 'rgba(255, 99, 132, 0.5)']);
        }
        if (data.ageData) {
            document.getElementById('ageChartContainer');
            drawChart('ageChart', 'bar', Object.keys(data.ageData), Object.values(data.ageData), ['rgba(75, 192, 192, 0.2)']);
        }
        if (data.countryData) {
            document.getElementById('countryChartContainer');
            drawChart('countryChart', 'pie', Object.keys(data.countryData), Object.values(data.countryData), ['rgba(255, 206, 86, 0.5)', 'rgba(75, 192, 192, 0.5)', 'rgba(153, 102, 255, 0.5)', 'rgba(255, 159, 64, 0.5)']);
        }
    })
    .catch(error => {
        console.error('Ошибка при загрузке и анализе файла:', error);
    });
}

function displayResults(data) {
    const previewContainer = document.getElementById('dataPreview'); // Обновите ID если нужно
    if (previewContainer && data.html) {
        previewContainer.innerHTML = data.html;
    }
}

function drawChart(chartId, type, labels, data, backgroundColor) {
    const canvas = document.getElementById(chartId);
    const ctx = canvas.getContext('2d');
    if (window[chartId]) window[chartId].destroy();  // Уничтожаем предыдущий график, если он существует

    window[chartId] = new Chart(ctx, {
        type: type,
        data: {
            labels: labels,
            datasets: [{
                label: `${chartId.replace(/Chart/, '')} Distribution`,
                data: data,
                backgroundColor: backgroundColor,
                borderColor: backgroundColor.map(color => color.replace('0.5', '1')),  // Увеличиваем непрозрачность для границ
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                }
            }
        }
    });
}
