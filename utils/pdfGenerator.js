// utils/pdfGenerator.js
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { formatCurrency, formatNumber, formatPercentage } from './calculations'

// Generar PDF con cálculo TCO
export async function generateTCOReport(data, results) {
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  
  // Configuración de fuentes
  pdf.setFont('helvetica', 'normal')
  
  // Header
  pdf.setFillColor(13, 71, 161) // Color azul corporativo
  pdf.rect(0, 0, pageWidth, 30, 'F')
  
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(20)
  pdf.text('ZAPATA CAMIONES', 20, 15)
  pdf.setFontSize(14)
  pdf.text('Calculadora de Costo Total de Propiedad (TCO)', 20, 25)
  
  // Información del cliente
  pdf.setTextColor(0, 0, 0)
  pdf.setFontSize(12)
  let yPos = 45
  
  pdf.setFont('helvetica', 'bold')
  pdf.text('INFORMACIÓN DEL CLIENTE', 20, yPos)
  yPos += 8
  
  pdf.setFont('helvetica', 'normal')
  pdf.text(`Cliente: ${data.customerName}`, 20, yPos)
  yPos += 6
  pdf.text(`Fecha: ${new Date().toLocaleDateString('es-MX')}`, 20, yPos)
  yPos += 6
  pdf.text(`Tipo de camión: ${results.truckConfig.name}`, 20, yPos)
  yPos += 10
  
  // Parámetros de cálculo
  pdf.setFont('helvetica', 'bold')
  pdf.text('PARÁMETROS DE CÁLCULO', 20, yPos)
  yPos += 8
  
  pdf.setFont('helvetica', 'normal')
  pdf.text(`Valor del camión: ${formatCurrency(data.truckValue)}`, 20, yPos)
  yPos += 6
  pdf.text(`Kilómetros anuales: ${formatNumber(data.annualKm)} km`, 20, yPos)
  yPos += 6
  pdf.text(`Años de operación: ${data.operationYears} años`, 20, yPos)
  yPos += 6
  pdf.text(`Precio del combustible: ${formatCurrency(data.fuelPrice)} por litro`, 20, yPos)
  yPos += 6
  pdf.text(`Rendimiento: ${formatNumber(results.fuelConsumptionUsed, 1)} km/L`, 20, yPos)
  yPos += 15
  
  // Resultados principales
  pdf.setFillColor(245, 245, 245)
  pdf.rect(15, yPos - 5, pageWidth - 30, 25, 'F')
  
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(14)
  pdf.text('COSTO TOTAL DE PROPIEDAD', 20, yPos + 5)
  
  pdf.setFontSize(18)
  pdf.setTextColor(13, 71, 161)
  pdf.text(formatCurrency(results.totalPeriod), 20, yPos + 15)
  
  pdf.setTextColor(0, 0, 0)
  pdf.setFontSize(10)
  pdf.text(`(${data.operationYears} años de operación)`, 20, yPos + 20)
  
  yPos += 35
  
  // Métricas clave
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(12)
  pdf.text('MÉTRICAS CLAVE', 20, yPos)
  yPos += 8
  
  pdf.setFont('helvetica', 'normal')
  pdf.text(`Costo anual: ${formatCurrency(results.totalAnnual)}`, 20, yPos)
  pdf.text(`Costo por km: ${formatCurrency(results.costPerKm)}`, 110, yPos)
  yPos += 6
  pdf.text(`Costo por día: ${formatCurrency(results.costPerDay)}`, 20, yPos)
  pdf.text(`Total kilómetros: ${formatNumber(results.totalKm)} km`, 110, yPos)
  yPos += 15
  
  // Desglose de costos
  pdf.setFont('helvetica', 'bold')
  pdf.text('DESGLOSE DE COSTOS ANUALES', 20, yPos)
  yPos += 8
  
  // Tabla de costos
  const tableData = [
    ['Concepto', 'Costo Anual', 'Porcentaje'],
    ...results.costBreakdown.map(item => [
      getCategoryName(item.category),
      formatCurrency(item.amount),
      formatPercentage(item.percentage)
    ])
  ]
  
  // Dibujar tabla manualmente
  pdf.setFont('helvetica', 'bold')
  pdf.setFillColor(240, 240, 240)
  pdf.rect(20, yPos - 2, 150, 8, 'F')
  
  pdf.text('Concepto', 25, yPos + 3)
  pdf.text('Costo Anual', 85, yPos + 3)
  pdf.text('Porcentaje', 135, yPos + 3)
  yPos += 8
  
  pdf.setFont('helvetica', 'normal')
  results.costBreakdown.forEach(item => {
    pdf.text(getCategoryName(item.category), 25, yPos + 3)
    pdf.text(formatCurrency(item.amount), 85, yPos + 3)
    pdf.text(formatPercentage(item.percentage), 135, yPos + 3)
    yPos += 6
    
    if (yPos > pageHeight - 30) {
      pdf.addPage()
      yPos = 30
    }
  })
  
  yPos += 10
  
  // Total
  pdf.setFont('helvetica', 'bold')
  pdf.setFillColor(13, 71, 161)
  pdf.setTextColor(255, 255, 255)
  pdf.rect(20, yPos - 2, 150, 8, 'F')
  pdf.text('TOTAL ANUAL', 25, yPos + 3)
  pdf.text(formatCurrency(results.totalAnnual), 85, yPos + 3)
  pdf.text('100.0%', 135, yPos + 3)
  
  yPos += 20
  
  // Footer
  pdf.setTextColor(100, 100, 100)
  pdf.setFontSize(8)
  pdf.text('Zapata Camiones - Calculadora TCO', 20, pageHeight - 15)
  pdf.text(`Generado el ${new Date().toLocaleString('es-MX')}`, 20, pageHeight - 10)
  
  // Descargar PDF
  pdf.save(`TCO_${data.customerName.replace(/\s+/g, '_')}_${Date.now()}.pdf`)
}

// Traducir nombres de categorías
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

// Generar imagen del elemento DOM
export async function generateImageFromElement(elementId) {
  const element = document.getElementById(elementId)
  if (!element) {
    throw new Error('Elemento no encontrado')
  }
  
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true
  })
  
  return canvas.toDataURL('image/png')
}

// Exportar datos como JSON
export function exportDataAsJSON(data, results) {
  const exportData = {
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    customer: data,
    results: results,
    metadata: {
      generatedBy: 'Zapata TCO Calculator',
      exportType: 'JSON'
    }
  }
  
  const dataStr = JSON.stringify(exportData, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  
  const link = document.createElement('a')
  link.href = URL.createObjectURL(dataBlob)
  link.download = `TCO_${data.customerName.replace(/\s+/g, '_')}_${Date.now()}.json`
  link.click()
}
