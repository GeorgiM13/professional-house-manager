import React, { useState, useEffect } from 'react';
import { 
    AreaChart, Area, LineChart, Line, BarChart, Bar, 
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Brush 
} from 'recharts';

const ExpenseForecast = ({ buildingId }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [method, setMethod] = useState("");
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (!buildingId || buildingId === 'all') {
        setData([]); 
        return;
    }

    const fetchForecast = async () => {
      setLoading(true);
      setError(null);
      setShowDetails(false); 
      try {
        const response = await fetch(`http://localhost:5000/predict?building_id=${buildingId}`);
        const result = await response.json();

        if (response.ok) {
          setData(result.data);
          setMethod(result.method);
        } else {
          setError(result.error);
        }
      } catch (err) {
        console.error(err);
        setError("AI Сървърът не отговаря.");
      } finally {
        setLoading(false);
      }
    };

    fetchForecast();
  }, [buildingId]);

  if (!buildingId || buildingId === 'all') return null;

  const seasonalData = data.slice(-12).map(item => ({
      month: item.date.split('-')[1],
      effect: item.seasonal
  }));

  return (
    <div style={{ background: 'white', padding: '25px', borderRadius: '16px', marginBottom: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
      
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
        <div>
            <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.3rem' }}>🔮 AI Прогноза (Бюджет)</h3>
            <p style={{ margin: '5px 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                Алгоритъм: <span style={{fontWeight: 'bold', color: '#3b82f6'}}>{method}</span>
            </p>
        </div>
        
        <button 
            onClick={() => setShowDetails(!showDetails)}
            style={{
                padding: '8px 16px',
                background: showDetails ? '#e2e8f0' : '#f0f9ff',
                color: showDetails ? '#475569' : '#0284c7',
                border: '1px solid',
                borderColor: showDetails ? '#cbd5e1' : '#bae6fd',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.9rem',
                transition: 'all 0.2s'
            }}
        >
            {showDetails ? "Скрий Анализа" : "🔍 Как работи?"}
        </button>
      </div>

      {loading ? (
        <div style={{textAlign: 'center', padding: '40px', color: '#3b82f6'}}>🤖 AI тренира модел върху историята...</div>
      ) : error ? (
        <div style={{color: '#ef4444', background: '#fef2f2', padding: '15px', borderRadius: '8px'}}>⚠️ {error}</div>
      ) : (
        <>
            <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
                <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <XAxis dataKey="date" style={{fontSize: '0.75rem'}} tick={{fill: '#64748b'}} minTickGap={30} />
                <YAxis unit=" лв." style={{fontSize: '0.75rem'}} tick={{fill: '#64748b'}} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <Tooltip contentStyle={{borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                <Legend iconType="circle" verticalAlign="top" height={36}/>
                
                <Area type="monotone" dataKey="actual" name="История (Обучаващи данни)" stroke="#3b82f6" fillOpacity={1} fill="url(#colorActual)" strokeWidth={2} />
                <Area type="monotone" dataKey="forecast" name="AI Прогноза (Бъдеще)" stroke="#10b981" strokeDasharray="5 5" fillOpacity={1} fill="url(#colorForecast)" strokeWidth={2} />
                
                <Brush 
                    dataKey="date" 
                    height={30} 
                    stroke="#3b82f6" 
                    fill="#f1f5f9" 
                    tickFormatter={() => ''} 
                    startIndex={data.length - 24}
                />
                </AreaChart>
            </ResponsiveContainer>
            </div>

            {showDetails && (
                <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px dashed #cbd5e1', animation: 'fadeIn 0.5s' }}>
                    <h4 style={{textAlign: 'center', color: '#475569', marginBottom: '20px'}}>🧠 Как AI "мисли"? (Разбивка на компонентите)</h4>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        
                        <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px' }}>
                            <h5 style={{textAlign: 'center', margin: '0 0 10px 0', color: '#334155'}}>📈 Глобален Тренд</h5>
                            <div style={{ width: '100%', height: 200 }}>
                                <ResponsiveContainer>
                                    <LineChart data={data}>
                                        <XAxis dataKey="date" hide />
                                        <YAxis domain={['auto', 'auto']} style={{fontSize: '0.7rem'}} width={30} />
                                        <Tooltip labelStyle={{color: '#64748b'}} />
                                        <Line type="monotone" dataKey="trend" stroke="#f59e0b" strokeWidth={3} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                            <p style={{fontSize: '0.8rem', color: '#64748b', textAlign: 'center'}}>Показва дългосрочната посока на разходите (без сезонен шум).</p>
                        </div>

                        <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px' }}>
                            <h5 style={{textAlign: 'center', margin: '0 0 10px 0', color: '#334155'}}>❄️☀️ Сезонен Модел</h5>
                            <div style={{ width: '100%', height: 200 }}>
                                <ResponsiveContainer>
                                    <BarChart data={seasonalData}>
                                        <XAxis dataKey="month" style={{fontSize: '0.7rem'}} />
                                        <YAxis style={{fontSize: '0.7rem'}} width={30}/>
                                        <Tooltip />
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <Bar dataKey="effect" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Влияние (лв.)" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <p style={{fontSize: '0.8rem', color: '#64748b', textAlign: 'center'}}>Как всеки месец влияе на сметката спрямо средното (напр. Януари +50 лв).</p>
                        </div>

                    </div>
                </div>
            )}
        </>
      )}
    </div>
  );
};

export default ExpenseForecast;