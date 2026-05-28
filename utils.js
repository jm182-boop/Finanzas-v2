// utils.js - Funciones de utilidad, formateo y cálculos de la app

// Formateo de moneda (Respeta los centavos automáticamente)
const fmt = v => {
  const num = Number(v) || 0;
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: Number.isInteger(num) ? 0 : 2,
    maximumFractionDigits: 2
  }).format(num);
};

// Convertir texto a número respetando decimales (ej: "1.500,50" -> 1500.5)
const parsM = s => {
  if (!s) return 0;
  const parsed = parseFloat(String(s).replace(/\./g, '').replace(',', '.'));
  return isNaN(parsed) ? 0 : parsed;
};

// Formateo de fechas
const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const mesLabel = ym => {
  if (!ym) return '';
  const [y, m] = ym.split('-');
  return meses[parseInt(m) - 1] + ' ' + y;
};

const fmtDT = iso => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('es-AR') + ' ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
};

const todayStr = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

// Cálculos de porcentajes (para las barras de progreso)
const pct = (a, b) => b > 0 ? Math.min(100, (a / b * 100)) : 0;

// Colores para las alertas de los sobres/presupuestos
const bCol = (gastado, limite) => {
  const r = pct(gastado, limite);
  if (r >= 100) return '#f87171'; // Rojo (Excedido)
  if (r >= 80) return '#f59e0b';  // Naranja (Alerta cercana al límite)
  return '#3ecf8e';               // Verde (Bajo control)
};
