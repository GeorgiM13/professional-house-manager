import React from 'react';
import Select, { components } from 'react-select';

// --- 1. SVG Икона за сграда ---
const BuildingIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="20" 
    height="20" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="#3b82f6" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    style={{ marginRight: '12px' }}
  >
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
    <line x1="9" y1="22" x2="9" y2="22.01"></line>
    <line x1="15" y1="22" x2="15" y2="22.01"></line>
    <line x1="12" y1="22" x2="12" y2="22.01"></line>
    <line x1="12" y1="2" x2="12" y2="22"></line>
    <line x1="4" y1="10" x2="20" y2="10"></line>
    <line x1="4" y1="14" x2="20" y2="14"></line>
    <line x1="4" y1="18" x2="20" y2="18"></line>
    <line x1="4" y1="6" x2="20" y2="6"></line>
  </svg>
);

// --- 2. Custom SingleValue ---
const SingleValue = (props) => (
  <components.SingleValue {...props}>
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <BuildingIcon />
      <span style={{ paddingTop: '2px' }}>{props.children}</span>
    </div>
  </components.SingleValue>
);

// --- 3. СТИЛОВЕ ---
const customStyles = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: '#f1f5f9',
    border: state.isFocused ? '2px solid #3b82f6' : '2px solid transparent',
    borderRadius: '10px',
    padding: '6px 4px',
    boxShadow: 'none',
    '&:hover': {
      backgroundColor: '#e2e8f0',
    },
    minWidth: '300px',
    maxWidth: '450px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  }),
  valueContainer: (provided) => ({
    ...provided,
    padding: '2px 8px',
  }),
  singleValue: (provided) => ({
    ...provided,
    color: '#0f172a',
    fontWeight: '700',
    fontSize: '1rem',
  }),
  placeholder: (provided) => ({
    ...provided,
    color: '#64748b',
    fontWeight: '500'
  }),
  menu: (provided) => ({
    ...provided,
    borderRadius: '12px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    zIndex: 100,
    marginTop: '8px'
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#eff6ff' : 'white',
    color: state.isSelected ? 'white' : '#334155',
    cursor: 'pointer',
    padding: '12px 16px',
    fontSize: '0.95rem',
    fontWeight: state.isSelected ? '600' : '400',
    borderBottom: '1px solid #f8fafc',
    ':last-child': {
        borderBottom: 'none'
    }
  }),
  indicatorSeparator: () => ({ display: 'none' }),
  dropdownIndicator: (provided) => ({
    ...provided,
    color: '#64748b',
    '&:hover': { color: '#3b82f6' }
  })
};

const BuildingSelector = ({ buildings, value, onChange, singleLabel }) => {
  
  // --- ЛОГИКА ЗА ЕДНА СГРАДА ---
  // Ако потребителят има само една сграда (или 0), не показваме Select, а статичен Badge
  if (buildings.length === 1) {
    const b = buildings[0];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
         <span style={{ 
            fontSize: '0.75rem', 
            textTransform: 'uppercase', 
            color: '#94a3b8', 
            fontWeight: '700', 
            letterSpacing: '0.5px',
            marginBottom: '6px',
            marginRight: '4px'
        }}>
          Вашата сграда
        </span>
        
        {/* Статичен контейнер, който прилича на селектора, но не се клика */}
        <div style={{
            backgroundColor: '#f1f5f9',
            border: '2px solid transparent',
            borderRadius: '10px',
            padding: '12px 16px', // Малко по-плътно, защото няма стрелка
            minWidth: '300px',
            maxWidth: '450px',
            display: 'flex',
            alignItems: 'center',
            color: '#0f172a',
            fontWeight: '700',
            fontSize: '1rem',
            cursor: 'default' // Курсорът не е pointer
        }}>
           <BuildingIcon />
           <span>{b.name}, {b.address}</span>
        </div>
      </div>
    );
  }

  // --- ЛОГИКА ЗА ПОВЕЧЕ ОТ ЕДНА СГРАДА (Стандартен Select) ---
  
  const options = buildings.map(b => ({
    value: b.id,
    label: `${b.name}, ${b.address}`
  }));

  if (buildings.length > 1) {
    options.unshift({ value: 'all', label: 'Всички мои имоти' });
  }

  const currentOption = options.find(opt => String(opt.value) === String(value)) || options[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
      {singleLabel && (
        <span style={{ 
            fontSize: '0.75rem', 
            textTransform: 'uppercase', 
            color: '#94a3b8', 
            fontWeight: '700', 
            letterSpacing: '0.5px',
            marginBottom: '6px',
            marginRight: '4px'
        }}>
          {singleLabel}
        </span>
      )}
      
      <Select
        value={currentOption}
        onChange={(option) => onChange(option ? option.value : 'all')}
        options={options}
        styles={customStyles}
        components={{ SingleValue }}
        isSearchable={true}
        placeholder="Изберете сграда..."
        noOptionsMessage={() => "Няма намерени сгради"}
      />
    </div>
  );
};

export default BuildingSelector;