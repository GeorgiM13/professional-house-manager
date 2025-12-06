import React, { useState, useEffect } from 'react';
import { 
    Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Brush 
} from 'recharts';
import { useTheme } from '../../../components/ThemeContext';

const getColors = (isDark) => ({
    history: isDark ? "#60a5fa" : "#3b82f6",
    forecast: isDark ? "#34d399" : "#10b981",
    trend: isDark ? "#fbbf24" : "#f59e0b",
    grid: isDark ? "#334155" : "#f1f5f9",
    text: isDark ? "#94a3b8" : "#64748b",
    darkText: isDark ? "#f1f5f9" : "#1e293b",
    brushStroke: isDark ? "#475569" : "#cbd5e1",
    brushFill: isDark ? "#1e293b" : "#f8fafc",
    cardBg: isDark ? "#1e293b" : "#ffffff",
    cardBorder: isDark ? "#334155" : "#f1f5f9",
    tooltipBg: isDark ? "rgba(30, 41, 59, 0.95)" : "rgba(255, 255, 255, 0.98)"
});

const ExpenseForecast = ({ buildingId }) => {
  const { isDarkMode } = useTheme();
  const COLORS = getColors(isDarkMode);

  const cardStyle = {
    background: COLORS.cardBg,
    borderRadius: '16px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
    border: `1px solid ${COLORS.cardBorder}`,
    padding: '24px',
    marginBottom: '24px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    transition: 'background-color 0.3s, border-color 0.3s'
  };

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [kpi, setKpi] = useState({ nextMonth: 0, trend: 'stable', avg: 0, diff: 0 });

  useEffect(() => {
    if (!buildingId || buildingId === 'all') { setData([]); return; }

   const fetchForecast = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiUrl = 'https://python-backend-site.onrender.com' || 'http://localhost:5000'; 
        const response = await fetch(`${apiUrl}/predict?building_id=${buildingId}`);
        const result = await response.json();

        if (response.ok) {
          setData(result.data);
          
          const future = result.data.filter(d => d.actual === null);
          const history = result.data.filter(d => d.actual !== null);
          
          if (future.length > 0) {
              const nextVal = future[0].forecast || 0;
              const lastVal = history.length > 0 ? history[history.length - 1].actual : nextVal;
              const diff = nextVal - lastVal;
              
              setKpi({
                  nextMonth: nextVal,
                  avg: history.length > 0 ? history.reduce((a, b) => a + b.actual, 0) / history.length : nextVal,
                  trend: diff > 50 ? 'up' : diff < -50 ? 'down' : 'stable',
                  diff: diff
              });
          }
        } else {
          setError(result.error);
        }
      } catch (err) {
        console.error(err);
        setError("Сървърът не отговаря.");
      } finally {
        setLoading(false);
      }
    };

    fetchForecast();
  }, [buildingId]);

  if (!buildingId || buildingId === 'all') return null;

  const StatCard = ({ label, value, subtext, color }) => (
      <div style={{ background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc', borderRadius: '12px', padding: '16px', flex: 1, minWidth: '140px' }}>
          <p style={{ margin: '0 0 8px', fontSize: '0.85rem', color: COLORS.text, fontWeight: 500 }}>{label}</p>
          <h4 style={{ margin: 0, fontSize: '1.5rem', color: COLORS.darkText, fontWeight: 700 }}>
              {value} <span style={{fontSize: '0.9rem', fontWeight: 400, color: COLORS.text}}>лв.</span>
          </h4>
          {subtext && (
              <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: color, fontWeight: 600 }}>
                  {subtext}
              </p>
          )}
      </div>
  );

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const actualItem = payload.find(p => p.dataKey === 'actual');
      const forecastItem = payload.find(p => p.dataKey === 'forecast');
      const trendItem = payload.find(p => p.dataKey === 'trend');

      const actual = actualItem ? actualItem.value : null;
      const forecast = forecastItem ? forecastItem.value : null;
      const trend = trendItem ? trendItem.value : null;

      const dateLabel = new Date(label).toLocaleDateString('bg-BG', { month: 'long', year: 'numeric' });

      return (
        <div style={{ 
            background: COLORS.tooltipBg, 
            backdropFilter: 'blur(8px)',
            border: `1px solid ${COLORS.grid}`, 
            borderRadius: '12px', 
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
            padding: '16px',
            minWidth: '200px'
        }}>
          <p style={{ margin: '0 0 12px', fontWeight: 600, color: COLORS.darkText, textTransform: 'capitalize' }}>{dateLabel}</p>
          
          <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
            {typeof actual === 'number' && (
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <span style={{display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: COLORS.text}}>
                        <span style={{width: 8, height: 8, borderRadius: '50%', background: COLORS.history}}></span>
                        Фактура:
                    </span>
                    <span style={{fontWeight: 700, color: COLORS.history}}>{actual.toFixed(2)} лв.</span>
                </div>
            )}
            
            {typeof forecast === 'number' && (
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <span style={{display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: COLORS.text}}>
                        <span style={{width: 8, height: 8, borderRadius: '50%', background: COLORS.forecast}}></span>
                        Прогноза:
                    </span>
                    <span style={{fontWeight: 700, color: COLORS.forecast}}>{forecast.toFixed(2)} лв.</span>
                </div>
            )}
            
            {typeof trend === 'number' && (
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: `1px dashed ${COLORS.grid}`}}>
                    <span style={{fontSize: '0.8rem', color: COLORS.text}}>Базов Тренд:</span>
                    <span style={{fontSize: '0.8rem', fontWeight: 500, color: COLORS.trend}}>{trend.toFixed(2)} лв.</span>
                </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={cardStyle}>
      
      <div style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
                <h3 style={{ margin: '0 0 6px', color: COLORS.darkText, fontSize: '1.25rem', fontWeight: 700 }}>
                    Прогноза на Бюджета
                </h3>
                <p style={{ margin: 0, color: COLORS.text, fontSize: '0.9rem' }}>
                    AI анализ на база исторически разходи и инфлация
                </p>
            </div>
            <div style={{display: 'flex', gap: '15px', fontSize: '0.8rem', fontWeight: 500}}>
                <span style={{display: 'flex', alignItems: 'center', gap: '6px', color: COLORS.history}}>
                    <span style={{width: '10px', height: '10px', borderRadius: '2px', background: COLORS.history}}></span> История
                </span>
                <span style={{display: 'flex', alignItems: 'center', gap: '6px', color: COLORS.forecast}}>
                    <span style={{width: '10px', height: '10px', borderRadius: '2px', background: COLORS.forecast}}></span> Прогноза
                </span>
            </div>
        </div>

        {!loading && !error && data.length > 0 && (
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <StatCard 
                    label="Очаквано следващия месец" 
                    value={kpi.nextMonth.toFixed(2)} 
                    color={COLORS.forecast}
                    subtext={kpi.trend === 'up' ? `↗️ +${kpi.diff.toFixed(2)} лв. спр. предходния` : kpi.trend === 'down' ? `↘️ ${kpi.diff.toFixed(2)} лв. спр. предходния` : '→ Без промяна'}
                />
                <StatCard 
                    label="Средномесечен разход (1г)" 
                    value={kpi.avg.toFixed(2)} 
                    color={COLORS.trend}
                />
            </div>
        )}
      </div>

      <div style={{ width: '100%', height: 400, position: 'relative' }}>
        {loading && (
            <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDarkMode ? 'rgba(30,41,59,0.8)' : 'rgba(255,255,255,0.8)', zIndex: 10, borderRadius: '12px'}}>
                <span style={{color: COLORS.history, fontWeight: 500}}>Зареждане на данни...</span>
            </div>
        )}
        
        {error ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', background: isDarkMode ? 'rgba(239,68,68,0.1)' : '#fef2f2', borderRadius: '12px' }}>
                ⚠️ {error}
            </div>
        ) : (
            <ResponsiveContainer>
                <ComposedChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="gradientHistory" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS.history} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={COLORS.history} stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="gradientForecast" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS.forecast} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={COLORS.forecast} stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
                    
                    <XAxis 
                        dataKey="date" 
                        style={{fontSize: '0.75rem', fontWeight: 500}} 
                        tick={{fill: COLORS.text}} 
                        axisLine={false}
                        tickLine={false}
                        minTickGap={40}
                        tickMargin={10}
                        tickFormatter={(str) => {
                            const date = new Date(str);
                            return date.toLocaleDateString('bg-BG', { month: 'short', year: '2-digit' });
                        }}
                    />
                    <YAxis 
                        style={{fontSize: '0.75rem', fontWeight: 500}} 
                        tick={{fill: COLORS.text}} 
                        axisLine={false}
                        tickLine={false}
                    />
                    
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: COLORS.brushStroke, strokeWidth: 1 }} />
                    
                    <Line 
                        type="monotone" 
                        dataKey="trend" 
                        stroke={COLORS.trend} 
                        strokeWidth={2} 
                        strokeDasharray="4 4"
                        dot={false} 
                        strokeOpacity={0.6}
                    />

                    <Area 
                        type="monotone" 
                        dataKey="actual" 
                        stroke={COLORS.history} 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#gradientHistory)" 
                    />

                    <Line 
                        type="monotone" 
                        dataKey="forecast" 
                        stroke={COLORS.forecast} 
                        strokeWidth={3} 
                        strokeDasharray="5 5"
                        dot={false}
                    />
                    
                    <Brush 
                        dataKey="date" 
                        height={30} 
                        stroke={COLORS.brushStroke} 
                        fill={COLORS.brushFill} 
                        tickFormatter={() => ''} 
                        startIndex={data.length > 24 ? data.length - 24 : 0}
                    />
                    
                </ComposedChart>
            </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default ExpenseForecast;
