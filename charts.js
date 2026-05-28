// charts.js - Lógica visual de gráficos usando Chart.js

let chartA = null; // Gráfico de Ahorros
let chartG = null; // Gráfico de Gastos (Donut)
let chartH = null; // Gráfico de Historial (Barras)

// Configuración general de colores que se adapta al modo oscuro/claro
const getChartColors = () => {
  return {
    text: darkMode ? '#9090a8' : '#5a5a72',
    grid: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
  };
};

// Gráfico Donut de la pantalla principal (Distribución)
function renderGastoChart(donutData, donutLabels, donutColors, totalDonut) {
  const ctx = document.getElementById('pgasto');
  if (!ctx) return;
  if (chartG) chartG.destroy();
  
  // Prevención visual: si no hay gastos, muestra un círculo gris oscuro
  const safeData = totalDonut === 0 ? [1] : donutData;
  const safeColors = totalDonut === 0 ? ['#2a2a35'] : donutColors;
  const safeLabels = totalDonut === 0 ? ['Sin datos'] : donutLabels;
  
  chartG = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: safeLabels,
      datasets: [{ data: safeData, backgroundColor: safeColors, borderWidth: 0, hoverOffset: 3, cutout: '75%' }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: totalDonut > 0 }
      },
      layout: { padding: 4 }
    }
  });
}

// Gráfico de Barras de la pestaña Historial
function renderHistorialChart(mls, gastosData, ingresosData) {
  const ctx = document.getElementById('hist-chart');
  if (!ctx) return;
  if (chartH) chartH.destroy();
  
  const { text, grid } = getChartColors();
  
  chartH = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: mls.map(m => mesLabel(m).split(' ')[0]),
      datasets: [
        { label: 'Gastos', data: gastosData, backgroundColor: 'rgba(248,113,113,0.7)', borderRadius: 4 },
        { label: 'Ingresos extra', data: ingresosData, backgroundColor: 'rgba(62,207,142,0.7)', borderRadius: 4 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: text, font: { family: 'Poppins', size: 10 }, boxWidth: 8, usePointStyle: true, pointStyle: 'circle' } }
      },
      scales: {
        y: { ticks: { color: text, font: { family: 'Poppins', size: 9 }, callback: v => '$' + Math.round(v / 1000) + 'k' }, grid: { color: grid } },
        x: { ticks: { color: text, font: { family: 'Poppins', size: 9 } }, grid: { color: grid } }
      }
    }
  });
}

// Gráfico de Líneas de la pestaña Ahorros
function renderAhorrosChart(mls, chartMode, ahorrosArray, billeterasMap) {
  const ctx = document.getElementById('achrt');
  if (!ctx) return;
  if (chartA) chartA.destroy();
  
  const { text, grid } = getChartColors();
  const labels = mls.map(m => mesLabel(m).split(' ')[0]);
  
  const baseOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: text, font: { family: 'Poppins', size: 10 }, boxWidth: 8, usePointStyle: true, pointStyle: 'circle' } }
    },
    scales: {
      y: { ticks: { color: text, font: { family: 'Poppins', size: 9 }, callback: v => '$' + Math.round(v / 1000) + 'k' }, grid: { color: grid } },
      x: { ticks: { color: text, font: { family: 'Poppins', size: 9 } }, grid: { color: grid } }
    }
  };
  
  if (chartMode === 'total') {
    let ac = 0;
    const data = mls.map(m => {
      ac += ahorrosArray.filter(a => a.fecha?.startsWith(m)).reduce((s, a) => s + a.monto, 0);
      return ac;
    });
    chartA = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{ label: 'Total ahorrado', data, borderColor: '#7c6dfa', backgroundColor: 'rgba(124,109,250,0.08)', fill: true, tension: 0.4, pointBackgroundColor: '#7c6dfa', pointRadius: 3 }]
      },
      options: baseOpts
    });
  } else {
    const datasets = Object.entries(billeterasMap).map(([b, { color, items }]) => {
      let ac = 0;
      const data = mls.map(m => {
        ac += items.filter(a => a.fecha?.startsWith(m)).reduce((s, a) => s + a.monto, 0);
        return ac;
      });
      return { label: b, data, borderColor: color, backgroundColor: 'transparent', tension: 0.4, pointBackgroundColor: color, pointRadius: 3 };
    });
    chartA = new Chart(ctx, { type: 'line', data: { labels, datasets }, options: baseOpts });
  }
}
