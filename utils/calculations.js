// utils/calculations.js

// Configuración por defecto para diferentes tipos de camión
export const TRUCK_CONFIGS = {
  ligero: {
    name: 'Camión Ligero (3.5-7.5 ton)',
    depreciationRate: 0.20, // 20% anual
    maintenanceCostPerKm: 0.85,
    tireCostPer100K: 15000,
    insuranceRate: 0.08, // 8% del valor del camión
    fuelConsumption: 8.5 // km/L promedio
  },
  mediano: {
    name: 'Camión Mediano (7.5-16 ton)',
    depreciationRate: 0.18,
    maintenanceCostPerKm: 1.20,
    tireCostPer100K: 25000,
    insuranceRate: 0.07,
    fuelConsumption: 6.0
  },
  pesado: {
    name: 'Camión Pesado (16-26 ton)',
    depreciationRate: 0.15,
    maintenanceCostPerKm: 1.80,
    tireCostPer100K: 45000,
    insuranceRate: 0.06,
    fuelConsumption: 3.5
  },
  extrapesado: {
    name: 'Camión Extra Pesado (+26 ton)',
    depreciationRate: 0.12,
    maintenanceCostPerKm: 2.50,
    tireCostPer100K: 65000,
    insuranceRate: 0.05,
    fuelConsumption: 2.8
  }
}

// Validaciones de entrada
export function validateInputs(data) {
  const errors = {}
  
  if (!data.customerName?.trim()) {
    errors.customerName = 'El nombre del cliente es requerido'
  }
  
  if (!data.truckType || !TRUCK_CONFIGS[data.truckType]) {
    errors.truckType = 'Debe seleccionar un tipo de camión'
  }
  
  if (!data.truckValue || data.truckValue <= 0) {
    errors.truckValue = 'El valor del camión debe ser mayor a 0'
  }
  
  if (!data.annualKm || data.annualKm <= 0) {
    errors.annualKm = 'Los kilómetros anuales deben ser mayor a 0'
  }
  
  if (!data.fuelPrice || data.fuelPrice <= 0) {
    errors.fuelPrice = 'El precio del combustible debe ser mayor a 0'
  }
  
  if (!data.operationYears || data.operationYears <= 0 || data.operationYears > 20) {
    errors.operationYears = 'Los años de operación deben estar entre 1 y 20'
  }
  
  if (data.customFuelConsumption && data.customFuelConsumption <= 0) {
    errors.customFuelConsumption = 'El rendimiento personalizado debe ser mayor a 0'
  }
  
  return errors
}

// Cálculo completo del TCO
export function calculateTCO(data) {
  const config = TRUCK_CONFIGS[data.truckType]
  if (!config) return null
  
  // Usar rendimiento personalizado si se proporciona
  const fuelConsumption = data.customFuelConsumption || config.fuelConsumption
  
  // Costos anuales
  const annualCosts = {
    // 1. Depreciación
    depreciation: data.truckValue * config.depreciationRate,
    
    // 2. Combustible
    fuel: (data.annualKm / fuelConsumption) * data.fuelPrice,
    
    // 3. Mantenimiento
    maintenance: data.annualKm * config.maintenanceCostPerKm,
    
    // 4. Neumáticos
    tires: (data.annualKm / 100000) * config.tireCostPer100K,
    
    // 5. Seguro
    insurance: data.truckValue * config.insuranceRate,
    
    // 6. Financiamiento (si aplica)
    financing: data.hasFinancing ? 
      (data.loanAmount || data.truckValue * 0.8) * (data.interestRate || 0.12) : 0,
    
    // 7. Peajes (estimado)
    tolls: data.annualKm * (data.tollsPerKm || 0.5),
    
    // 8. Licencias y permisos
    licenses: data.licenseCost || 15000,
    
    // 9. Otros costos operativos
    other: data.otherCosts || 0
  }
  
  // Total anual
  const totalAnnual = Object.values(annualCosts).reduce((sum, cost) => sum + cost, 0)
  
  // Cálculo por período de operación
  const results = {
    annualCosts,
    totalAnnual,
    totalPeriod: totalAnnual * data.operationYears,
    costPerKm: totalAnnual / data.annualKm,
    costPerDay: totalAnnual / 365,
    totalKm: data.annualKm * data.operationYears,
    
    // Métricas adicionales
    initialInvestment: data.truckValue,
    totalInvestment: data.truckValue + (totalAnnual * data.operationYears),
    roi: ((totalAnnual * data.operationYears) / data.truckValue) * 100,
    
    // Desglose porcentual
    costBreakdown: Object.entries(annualCosts).map(([key, value]) => ({
      category: key,
      amount: value,
      percentage: (value / totalAnnual) * 100
    })).sort((a, b) => b.amount - a.amount),
    
    // Información del camión
    truckConfig: config,
    fuelConsumptionUsed: fuelConsumption
  }
  
  return results
}

// Formatear moneda mexicana
export function formatCurrency(amount) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

// Formatear números
export function formatNumber(number, decimals = 0) {
  return new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(number)
}

// Formatear porcentajes
export function formatPercentage(decimal, decimals = 1) {
  return `${formatNumber(decimal, decimals)}%`
}

// Obtener color para gráficas según categoría
export function getCategoryColor(category) {
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

// Generar reporte de comparación (para múltiples camiones)
export function compareMultipleTCO(calculations) {
  if (!calculations || calculations.length === 0) return null
  
  return {
    bestOption: calculations.reduce((best, current) => 
      current.costPerKm < best.costPerKm ? current : best
    ),
    
    averageCostPerKm: calculations.reduce((sum, calc) => 
      sum + calc.costPerKm, 0
    ) / calculations.length,
    
    totalSavings: Math.max(...calculations.map(c => c.totalAnnual)) - 
                  Math.min(...calculations.map(c => c.totalAnnual)),
    
    comparison: calculations.map((calc, index) => ({
      ...calc,
      rank: index + 1,
      savingsVsBest: calc.totalAnnual - Math.min(...calculations.map(c => c.totalAnnual))
    })).sort((a, b) => a.costPerKm - b.costPerKm)
  }
}
