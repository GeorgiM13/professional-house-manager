from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import numpy as np
from prophet import Prophet
from supabase import create_client, Client
from dotenv import load_dotenv
import os
from datetime import datetime

load_dotenv()
app = Flask(__name__)
CORS(app)

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ ГРЕШКА: Липсват ключове в .env!")
    exit()

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

@app.route('/predict', methods=['GET'])
def predict():
    building_id = request.args.get('building_id')
    
    if not building_id or building_id == 'all':
        return jsonify({"error": "Моля изберете конкретна сграда за анализ."}), 400

    print(f"🤖 AI Анализ за сграда: {building_id}...")

    try:
        response = supabase.table('expenses') \
            .select("year, month, current_month, type") \
            .eq('building_id', building_id) \
            .execute()
        data = response.data
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    if not data:
        return jsonify({"error": "Няма никакви данни за тази сграда."}), 404

    df = pd.DataFrame(data)
    df['ds'] = pd.to_datetime(df['year'].astype(str) + '-' + df['month'].astype(str) + '-01')
    
    current_date = datetime.now()
    df = df[df['ds'] <= current_date]

    if df.empty:
        return jsonify({"error": "Няма исторически данни."}), 404

    df_for_training = df.copy()

    df_for_training = df_for_training[df_for_training['current_month'] < 2000] 
    df_for_training = df_for_training[df_for_training['type'] != 'repair'] 

    df_grouped_train = df_for_training.groupby('ds')['current_month'].sum().reset_index()
    df_grouped_train.columns = ['ds', 'y']

    df_real_history = df.groupby('ds')['current_month'].sum().reset_index()
    df_real_history.columns = ['ds', 'y']

    is_prophet_model = False

    if len(df_grouped_train) < 12:
        print(f"⚠️ Малко данни. Statistical Model.")
        method = "Statistical Average (Cold Start)"
        
        avg_value = df_grouped_train['y'].mean()
        last_date = df_grouped_train['ds'].max()
        future_dates = pd.date_range(start=last_date, periods=7, freq='MS')[1:]
        
        forecast_data = [{'ds': date, 'yhat': avg_value} for date in future_dates]
        result = pd.DataFrame(forecast_data)
        
    else:
        print(f"🚀 Достатъчно данни. Prophet AI (Log-Transformed).")
        method = "Facebook Prophet AI (Log-Normal)"
        is_prophet_model = True
        
        df_grouped_train['y'] = np.log1p(df_grouped_train['y'])
        
        m = Prophet(
            daily_seasonality=False, 
            weekly_seasonality=False,
            seasonality_mode='additive', 
            changepoint_prior_scale=0.01,
            seasonality_prior_scale=10.0
        )
        m.add_seasonality(name='monthly', period=30.5, fourier_order=3)
        m.fit(df_grouped_train)

        future = m.make_future_dataframe(periods=6, freq='M')
        forecast = m.predict(future)
        result = forecast.copy()
        
        result['yhat'] = np.expm1(result['yhat'])
        
        if 'trend' in result: result['trend'] = np.expm1(result['trend'])

    result['date'] = result['ds'].dt.strftime('%Y-%m')
    df_real_history['date'] = df_real_history['ds'].dt.strftime('%Y-%m')

    all_dates = sorted(list(set(df_real_history['date'].tolist() + result['date'].tolist())))
    
    combined_data = []
    
    for date in all_dates:
        real_row = df_real_history[df_real_history['date'] == date]
        actual = round(real_row['y'].values[0], 2) if not real_row.empty else None
        
        forecast_row = result[result['date'] == date]
        
        prediction = None
        trend = None
        seasonal = None

        if not forecast_row.empty:
            prediction = round(forecast_row['yhat'].values[0], 2)
            
            if is_prophet_model and 'trend' in forecast_row:
                trend = round(forecast_row['trend'].values[0], 2)
                if 'yearly' in forecast_row:
                     seasonal = round(forecast_row['yearly'].values[0], 4) 
        
        if prediction and prediction < 0: prediction = 0

        combined_data.append({
            "date": date,
            "actual": actual,
            "forecast": prediction if actual is None else None,
            "trend": trend,
            "seasonal": seasonal
        })

    return jsonify({ "method": method, "data": combined_data })

if __name__ == '__main__':
    print("🚀 AI Сървърът е готов!")
    app.run(port=5000, debug=True)