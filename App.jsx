import React, { useState, useEffect } from 'react'
import { 
  Calculator, 
  Truck, 
  Download, 
  Save, 
  Wifi, 
  WifiOff, 
  Database,
  AlertCircle,
  CheckCircle,
  Info,
  X
} from 'lucide-react'

import { useLocalStorage, useOnlineStatus, useToast } from './hooks/useLocalStorage'
import { validateInputs, calculateTCO, TRUCK_CONFIGS, formatCurrency, formatNumber, formatPercentage } from './utils/calculations'
import { generateTCOReport, exportDataAsJSON } from './utils/pdfGenerator'

export default function App() {
  // Estados principales
  const [formData, setFormData] = useLocalStorage('tco-form-data', {
    customerName: '',
    truckType: 'mediano',
    truckValue: 800000,
    annualKm: 100000,
    operationYears: 5,
    fuelPrice: 24,
    customFuelConsumption: '',
    hasFinancing: false,
    loanAmount: '',
    interestRate: 0.12,
    tollsPerKm: 0.5,
    licenseCost: 15000,
    otherCosts: 0
  })

  const [errors, setErrors] = useState({})
  const [results, setResults] = useState(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [savedCalculations, setSavedCalculations] = useLocalStorage('tco-saved-calculations', [])
  
  // Hooks personalizados
  const isOnline = useOnlineStatus()
  const { toasts, addToast, removeToast } = useToast()

  // Calcular TCO cuando cambian los datos
  useEffect(() => {
    const validationErrors = validateInputs(formData)
    setErrors(validationErrors)
    
    if (Object.keys(validationErrors).length === 0) {
      setIsCalculating(true)
      
      // Simular delay de cálculo para mostrar loading
      const timer = setTimeout(() => {
        const calculatedResults = calculateTCO(formData)
        setResults(calculatedResults)
        setIsCalculating(false)
      }, 300)
      
      return () => clearTimeout(timer)
    } else {
      setResults(null)
    }
  }, [formData])

  // Actualizar campo del formulario
  const updateField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Guardar cálculo actual
  const saveCalculation = () => {
    if (!results || !formData.customerName) {
      addToast('Complete los datos para guardar el cálculo', 'error')
      return
    }

    const calculation = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      customerName: formData.customerName,
      formData: { ...formData },
      results: { ...results }
    }

    setSavedCalculations(prev => [calculation, ...prev.slice(0, 9)]) // Máximo 10 guardados
    addToast('Cálculo guardado exitosamente', 'success')
  }

  // Generar PDF
  const handleGeneratePDF = async () => {
    if (!results) return

    try {
      addToast('Generando PDF...', 'info')
      await generateTCOReport(formData, results)
      addToast('PDF descargado exitosamente', 'success')
    } catch (error) {
      console.error('Error generating PDF:', error)
      addToast('Error al generar PDF', 'error')
    }
  }

  // Exportar JSON
  const handleExportJSON = () => {
    if (!results) return
    
    try {
      exportDataAsJSON(formData, results)
      addToast('Datos exportados exitosamente', 'success')
    } catch (error) {
      console.error('Error exporting JSON:', error)
      addToast('Error al exportar datos', 'error')
    }
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <h1>Zapata Camiones - Calculadora TCO</h1>
        <p>Calcula el Costo Total de Propiedad de tu flota de camiones</p>
      </header>

      {/* Status Bar */}
      <div className="status-bar">
        <div className={`status-item ${isOnline ? 'status-online' : 'status-offline'}`}>
          {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
          {isOnline ? 'En línea' : 'Sin conexión'}
        </div>
        
        <div className="status-item status-cached">
          <Database size={16} />
          {savedCalculations.length} cálculos guardados
        </div>
      </div>

      {/* Formulario */}
      <div className="form-grid">
        {/* Datos básicos */}
        <section className="form-section">
          <h3>
            <Truck size={20} />
            Datos del Cliente y Camión
          </h3>
          
          <div className="form-group">
            <label>Nombre del cliente *</label>
            <input
              type="text"
              value={formData.customerName}
              onChange={e => updateField('customerName', e.target.value)}
              className={errors.customerName ? 'input-error' : ''}
              placeholder="Ej: Transportes González"
            />
            {errors.customerName && <div className="error">{errors.customerName}</div>}
          </div>

          <div className="form-group">
            <label>Tipo de camión *</label>
            <select
              value={formData.truckType}
              onChange={e => updateField('truckType', e.target.value)}
              className={errors.truckType ? 'input-error' : ''}
            >
              {Object.entries(TRUCK_CONFIGS).map(([key, config]) => (
                <option key={key} value={key}>{config.name}</option>
              ))}
            </select>
            {errors.truckType && <div className="error">{errors.truckType}</div>}
          </div>

          <div className="form-group">
            <label>Valor del camión *</label>
            <div className="input-group">
              <span className="input-addon">$</span>
              <input
                type="number"
                value={formData.truckValue}
                onChange={e => updateField('truckValue', +e.target.value)}
                className={errors.truckValue ? 'input-error' : ''}
                min="0"
                step="1000"
              />
              <span className="input-addon">MXN</span>
            </div>
            {errors.truckValue && <div className="error">{errors.truckValue}</div>}
          </div>

          <div className="form-group">
            <label>Kilómetros anuales *</label>
            <div className="input-group">
              <input
                type="number"
                value={formData.annualKm}
                onChange={e => updateField('annualKm', +e.target.value)}
                className={errors.annualKm ? 'input-error' : ''}
                min="0"
                step="1000"
              />
              <span className="input-addon">km/año</span>
            </div>
            {errors.annualKm && <div className="error">{errors.annualKm}</div>}
          </div>

          <div className="form-group">
            <label>Años de operación *</label>
            <input
              type="number"
              value={formData.operationYears}
              onChange={e => updateField('operationYears', +e.target.value)}
              className={errors.operationYears ? 'input-error' : ''}
              min="1"
              max="20"
            />
            {errors.operationYears && <div className="error">{errors.operationYears}</div>}
          </div>
        </section>

        {/* Combustible y rendimiento */}
        <section className="form-section">
          <h3>
            <Calculator size={20} />
            Combustible y Rendimiento
          </h3>

          <div className="form-group">
            <label>Precio del diésel *</label>
            <div className="input-group">
              <span className="input-addon">$</span>
              <input
                type="number"
                value={formData.fuelPrice}
                onChange={e => updateField('fuelPrice', +e.target.value)}
                className={errors.fuelPrice ? 'input-error' : ''}
                min="0"
                step="0.1"
              />
              <span className="input-addon">MXN/L</span>
            </div>
            {errors.fuelPrice && <div className="error">{errors.fuelPrice}</div>}
          </div>

          <div className="form-group">
            <label>Rendimiento personalizado (opcional)</label>
            <div className="input-group">
              <input
                type="number"
                value={formData.customFuelConsumption}
                onChange={e => updateField('customFuelConsumption', +e.target.value)}
                className={errors.customFuelConsumption ? 'input-error' : ''}
                min="0"
                step="0.1"
                placeholder={`Por defecto: ${TRUCK_CONFIGS[formData.truckType]?.fuelConsumption} km/L`}
              />
              <span className="input-addon">km/L</span>
            </div>
            {errors.customFuelConsumption && <div className="error">{errors.customFuelConsumption}</div>}
          </div>

          <div className="form-group">
            <label>Peajes por km</label>
            <div className="input-group">
              <span className="input-addon">$</span>
              <input
                type="number"
                value={formData.tollsPerKm}
                onChange={e => updateField('tollsPerKm', +e.target.value)}
                min="0"
                step="0.1"
              />
              <span className="input-addon">MXN/km</span>
            </div>
          </div>

          <div className="form-group">
            <label>Licencias y permisos anuales</label>
            <div className="input-group">
              <span className="input-addon">$</span>
              <input
                type="number"
                value={formData.licenseCost}
                onChange={e => updateField('licenseCost', +e.target.value)}
                min="0"
                step="1000"
              />
              <span className="input-addon">MXN</span>
            </div>
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={formData.hasFinancing}
                onChange={e => updateField('hasFinancing', e.target.checked)}
              />
              {' '}¿Tiene financiamiento?
            </label>
          </div>

          {formData.hasFinancing && (
            <>
              <div className="form-group">
                <label>Monto del préstamo</label>
                <div className="input-group">
                  <span className="input-addon">$</span>
                  <input
                    type="number"
                    value={formData.loanAmount}
                    onChange={e => updateField('loanAmount', +e.target.value)}
                    min="0"
                    step="1000"
                    placeholder="80% del valor del camión"
                  />
                  <span className="input-addon">MXN</span>
                </div>
              </div>

              <div className="form-group">
                <label>Tasa de interés anual</label>
                <div className="input-group">
                  <input
                    type="number"
                    value={formData.interestRate * 100}
                    onChange={e => updateField('interestRate', +e.target.value / 100)}
                    min="0"
                    max="50"
                    step="0.1"
                  />
                  <span className="input-addon">%</span>
                </div>
              </div>
            </>
          )}

          <div className="form-group">
            <label>Otros costos anuales</label>
            <div className="input-group">
              <span className="input-addon">$</span>
              <input
                type="number"
                value={formData.otherCosts}
                onChange={e => updateField('otherCosts', +e.target.value)}
                min="0"
                step="1000"
              />
              <span className="input-addon">MXN</span>
            </div>
          </div>
        </section>
      </div>

      {/* Resultados */}
      {(results || isCalculating) && (
        <section className="results" id="results-section">
          <h2>
            <Calculator size={24} />
            Resultados del Cálculo TCO
            {isCalculating && <div className="spinner"></div>}
          </h2>

          {results && !isCalculating && (
            <>
              <div className="total-tco">
                <h3>Costo Total de Propiedad</h3>
                <div className="value">{formatCurrency(results.totalPeriod)}</div>
                <p>({formData.operationYears} años de operación)</p>
              </div>

              <div className="results-grid">
                <div className="result-card">
                  <h4>Costo Anual</h4>
                  <div className="result-value">{formatCurrency(results.totalAnnual)}</div>
                </div>
                
                <div className="result-card">
                  <h4>Costo por Kilómetro</h4>
                  <div className="result-value">{formatCurrency(results.costPerKm)}</div>
                </div>
                
                <div className="result-card">
                  <h4>Costo por Día</h4>
                  <div className="result-value">{formatCurrency(results.costPerDay)}</div>
                </div>
                
                <div className="result-card">
                  <h4>Total Kilómetros</h4>
                  <div className="result-value">{formatNumber(results.totalKm)} km</div>
                </div>
              </div>

              {/* Desglose de costos */}
              <div className="cost-breakdown">
                <h3>Desglose de Costos Anuales</h3>
                <div className="breakdown-list">
                  {results.costBreakdown.slice(0, 6).map((item, index) => (
                    <div key={item.category} className="breakdown-item">
                      <div className="breakdown-info">
                        <span className="category-name">
                          {getCategoryName(item.category)}
                        </span>
                        <span className="category-percentage">
                          {formatPercentage(item.percentage)}
                        </span>
                      </div>
                      <div className="breakdown-bar">
                        <div 
                          className="breakdown-fill"
                          style={{
                            width: `${item.percentage}%`,
                            backgroundColor: getCategoryColor(item.category)
                          }}
                        ></div>
                      </div>
                      <div className="breakdown-amount">
                        {formatCurrency(item.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Acciones */}
              <div className="actions">
                <button
                  className="btn btn-primary"
                  onClick={handleGeneratePDF}
                  disabled={isCalculating}
                >
                  <Download size={20} />
                  Descargar PDF
                </button>

                <button
                  className="btn btn-secondary"
                  onClick={saveCalculation}
                  disabled={isCalculating || !formData.customerName}
                >
                  <Save size={20} />
                  Guardar Cálculo
                </button>

                <button
                  className="btn btn-outline"
                  onClick={handleExportJSON}
                  disabled={isCalculating}
                >
                  <Download size={20} />
                  Exportar JSON
                </button>
              </div>
            </>
          )}
        </section>
      )}

      {/* Cálculos guardados */}
      {savedCalculations.length > 0 && (
        <section className="form-section">
          <h3>
            <Database size={20} />
            Cálculos Guardados
          </h3>
          
          <div className="saved-calculations">
            {savedCalculations.slice(0, 5).map(calc => (
              <div key={calc.id} className="saved-item">
                <div className="saved-info">
                  <strong>{calc.customerName}</strong>
                  <span>{new Date(calc.timestamp).toLocaleDateString('es-MX')}</span>
                </div>
                <div className="saved-result">
                  {formatCurrency(calc.results.totalPeriod)}
                </div>
                <button
                  className="btn btn-outline"
                  onClick={() => setFormData(calc.formData)}
                >
                  Cargar
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Toast notifications */}
      {toasts.map(toast => (
        <div key={toast.id} className={`toast ${toast.type}`}>
          {toast.type === 'success' && <CheckCircle size={20} />}
          {toast.type === 'error' && <AlertCircle size={20} />}
          {toast.type === 'info' && <Info size={20} />}
          <span>{toast.message}</span>
          <button onClick={() => removeToast(toast.id)}>
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  )
}

// Funciones auxiliares para el desglose de costos
function getCategoryName(category) {
  const names = {
    depreciation: 'Depreciación',
    fuel: 'Combustible',
    maintenance: 'Mantenimiento',
    tires: 'Neumáticos',
    insurance: 'Seguro',
    financing: 'Financiamiento',
    tolls: 'Peajes',
    licenses: 'Licencias y permisos',
    other: 'Otros costos'
  }
  return names[category] || category
}

function getCategoryColor(category) {
  const colors = {
    fuel: '#f57c00',
    maintenance: '#d32f2f',
    depreciation: '#1976d2',
    tires: '#388e3c',
    insurance: '#7b1fa2',
    financing: '#00796b',
    tolls: '#f44336',
    licenses: '#3f51b5',
    other: '#9e9e9e'
  }
  return colors[category] || '#9e9e9e'
}
