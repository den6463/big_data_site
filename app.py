from flask import Flask, render_template, request, jsonify
from werkzeug.utils import secure_filename
import pandas as pd
import os
import requests
import yfinance as yf
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

API_KEY_NEWS = "59e36c6e6ee04189bc7308d1abcbf513"
API_KEY_WEATHER = "7bfc35660a5d7e5b4f5bb67c2a2fa36f"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/finance')
def finance():
    return render_template('finance.html')

@app.route('/data/<ticker>')
def data(ticker):
    start_date = request.args.get('start', '2022-01-01')
    end_date = request.args.get('end', '2022-12-31')
    stock_data = yf.download(ticker, start=start_date, end=end_date)
    stock_data.reset_index(inplace=True)
    stock_data['Date'] = stock_data['Date'].dt.strftime('%Y-%m-%d')
    return jsonify(stock_data.to_dict(orient='records'))

@app.route('/api/news/<ticker>')
def news(ticker):
    url = f"https://newsapi.org/v2/everything?q={ticker}&sortBy=publishedAt&apiKey={API_KEY_NEWS}"
    response = requests.get(url)
    return jsonify(response.json()['articles']) if response.status_code == 200 else jsonify({"error": "Failed to fetch news"}), response.status_code

@app.route('/geo-data')
def geo_data_page():
    return render_template('geo_data.html')

@app.route('/pollution/<float:lat>/<float:lon>')
def get_air_pollution(lat, lon):
    url = f'https://api.openweathermap.org/data/2.5/air_pollution?lat={lat}&lon={lon}&appid={API_KEY_WEATHER}'
    response = requests.get(url)
    return jsonify(response.json()) if response.status_code == 200 else jsonify({"error": "Failed to fetch air pollution data"}), response.status_code

@app.route('/weather/current/<float:lat>/<float:lon>')
def get_current_weather(lat, lon):
    url = f'https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={API_KEY_WEATHER}&units=metric'
    response = requests.get(url)
    return jsonify(response.json()) if response.status_code == 200 else jsonify({"error": "Failed to fetch weather data"}), response.status_code

@app.route('/weather/forecast/<float:lat>/<float:lon>')
def get_forecast(lat, lon):
    url = f"https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={API_KEY_WEATHER}&units=metric"
    response = requests.get(url)
    return jsonify(response.json()) if response.status_code == 200 else jsonify({"error": "Failed to fetch forecast data"}), response.status_code

@app.route('/xlsx-analys', methods=['GET', 'POST'])
def xlsx_analys():
    if request.method == 'POST':
        # Получаем файл из формы
        file = request.files['file']
        if file and file.filename.endswith('.xlsx'):
            filename = secure_filename(file.filename)
            filepath = os.path.join('uploads', filename)
            # Убедитесь, что директория существует, если нет, создаем ее
            os.makedirs(os.path.dirname(filepath), exist_ok=True)
            file.save(filepath)
            
            # Читаем файл
            data = pd.read_excel(filepath)
            # Выбор первых 10 строк для отображения
            preview = data.head(10).to_html(classes='table table-striped', index=False)
            # Подсчет общего количества строк в файле
            total_rows = len(data)
            
            # Анализ данных для возвращения результатов
            gender_counts = data['GENDER'].value_counts(normalize=True) * 100
            gender_counts = gender_counts.to_dict()
            
            return jsonify({
                'preview': preview,
                'total_rows': f"Всего строк в файле: {total_rows}",
                'gender_counts': gender_counts
            })
    # Возвращаем страницу для загрузки и анализа файла, если метод GET
    return render_template('xlsx_analys.html')

@app.route('/upload-xlsx', methods=['POST'])
def upload_xlsx():
    file = request.files['file']
    if file and file.filename.endswith('.xlsx'):
        filename = secure_filename(file.filename)
        filepath = os.path.join('uploads', filename)
        file.save(filepath)
        data = pd.read_excel(filepath)
        gender_counts = data['GENDER'].value_counts().to_dict()
        age_distribution = data['AGE'].value_counts().sort_index().to_dict()
        country_distribution = data['COUNTRY'].value_counts().to_dict()
        total_rows = len(data)
        return jsonify({
            'preview': data.head(10).to_html(classes='table table-striped'),
            'total_rows': total_rows,
            'genderCounts': gender_counts,
            'ageDistribution': age_distribution,
            'countryCounts': country_distribution
        })
    return 'Ошибка загрузки файла'

if __name__ == '__main__':
    app.run(debug=True)
