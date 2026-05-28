// app.js - Lógica principal con sistema de Sobres y Billeteras dinámicas

let cfg = { sueldo: 1800000, nec: 50, des: 30, aho: 20, tc: 1200, exp: 0, nombre1: 'Yo', nombre2: 'Sofi' };
let movs = [], ahorros = [], prestamos = [], pagos = [];
let sobres = [], billeteras = [], compartidos = [];

let curMes = todayStr().slice(0, 7), darkMode = true;
let tipoActual = 'gasto', filtro = 'todo', chartMode = 'total';
let modalPrestId = null;

async function initApp() {
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  if (U && U.email) document.getElementById('uemail').textContent = U.email;
  
  ['gfecha', 'gfechai', 'afecha', 'pfecha'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.value = todayStr();
  });
  
  const t = localStorage.getItem('ft') || 'dark';
  darkMode = t === 'dark';
  document.body.classList.toggle('light', !darkMode);
  document.getElementById('icon-dark').style.display = darkMode ? 'block' : 'none';
  document.getElementById('icon-light').style.display = darkMode ? 'none' : 'block';

  // Cargar todos los datos de las nuevas tablas
  await Promise.all([
    loadCfg(), loadSobres(), loadBilleteras(), loadMovs(), 
    loadAhorros(), loadPrestamos(), loadPagos(), loadCompartidos()
  ]);

  populateSelects();
  renderResumen();
  renderHistorial();
  renderAhorros();
  renderPrestamos();
  initCfgUI();
}

// ================= CARGA DE DATOS =================
async function loadCfg() {
  const r = await sb('/rest/v1/configuracion?user_id=eq.'+U.id);
  if (r.ok && r.d.length > 0) {
    const d = r.d[0];
    cfg = { sueldo: +d.sueldo, nec: +d.nec, des: +d.des, aho: +d.aho, tc: +d.tipo_cambio, exp: +d.expensas, nombre1: d.nombre1 || 'Yo', nombre2: d.nombre2 || 'Sofi' };
  }
}
async function loadSobres() { const r = await sb('/rest/v1/sobres?user_id=eq.'+U.id); if (r.ok) sobres = r.d || []; }
async function loadBilleteras() { const r = await sb('/rest/v1/billeteras?user_id=eq.'+U.id+'&activa=eq.true'); if (r.ok) billeteras = r.d || []; }
async function loadMovs() { const r = await sb('/rest/v1/gastos?user_id=eq.'+U.id+'&order=fecha.desc'); if (r.ok) movs = r.d || []; }
async function loadAhorros() { const r = await sb('/rest/v1/ahorros?user_id=eq.'+U.id+'&order=fecha.asc'); if (r.ok) ahorros = r.d || []; }
async function loadPrestamos() { const r = await sb('/rest/v1/prestamos?user_id=eq.'+U.id+'&order=created_at.desc'); if (r.ok) prestamos = r.d || []; }
async function loadPagos() { const r = await sb('/rest/v1/pagos_mensuales?user_id=eq.'+U.id+'&mes=eq.'+curMes); if (r.ok) pagos = r.d || []; }
async function loadCompartidos() { const r = await sb('/rest/v1/gastos_compartidos?user_id=eq.'+U.id+'&pagado=eq.false'); if (r.ok) compartidos = r.d || []; }

// ================= INTERFAZ Y SELECTORES =================
function populateSelects() {
  const gcat = document.getElementById('gcat');
  if (gcat) gcat.innerHTML = sobres.map(s => `<option value="${s.id}">${s.nombre} (${s.bucket})</option>`).join('') + '<option value="">Sin sobre (Extra)</option>';
  
  const abill = document.getElementById('abilletera');
  if (abill) abill.innerHTML = billeteras.map(b => `<option value="${b.id}">${b.nombre}</option>`).join('');
}

function setTipo(t) {
  tipoActual = t;
  document.getElementById('campos-gasto').style.display = t === 'gasto' ? 'block' : 'none';
  document.getElementById('campos-ingreso').style.display = t === 'ingreso' ? 'block' : 'none';
  document.getElementById('btg').className = 'tb' + (t === 'gasto' ? ' ag' : '');
  document.getElementById('bti').className = 'tb' + (t === 'ingreso' ? ' ai' : '');
  document.getElementById('btnagregar').textContent = t === 'gasto' ? 'Guardar gasto' : 'Guardar ingreso';
}

function changeMonth(dir) {
  const [y, m] = curMes.split('-').map(Number);
  const d = new Date(y, m - 1 + dir, 1);
  curMes = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  loadPagos().then(() => { renderResumen(); renderHistorial(); renderPrestamos(); });
}

function toggleTheme() {
  darkMode = !darkMode; 
  document.body.classList.toggle('light', !darkMode);
  document.getElementById('icon-dark').style.display = darkMode ? 'block' : 'none';
  document.getElementById('icon-light').style.display = darkMode ? 'none' : 'block';
  localStorage.setItem('ft', darkMode ? 'dark' : 'light');
  renderResumen(); renderHistorial(); renderAhorros();
}

function sp(name, btn) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nb').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  if (btn) btn.classList.add('active');
  if (name === 'resumen') renderResumen();
  if (name === 'historial') renderHistorial();
  if (name === 'ahorros') renderAhorros();
  if (name === 'prestamos') renderPrestamos();
}

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ================= GUARDADO DE DATOS (CRUD) =================
async function agregarMov() {
  const desc = document.getElementById('gdesc').value.trim();
  const montoTotal = parsM(document.getElementById('gmonto').value);
  if (!desc || !montoTotal) { toast('Completa descripción y monto'); return; }
  
  const esI = tipoActual === 'ingreso';
  const fecha = esI ? document.getElementById('gfechai').value : document.getElementById('gfecha').value;
  if (!fecha || fecha.length < 8) { toast('Ingresa una fecha válida'); return; }
  
  const btn = document.getElementById('btnagregar');
  btn.innerHTML = '<span class="sp"></span>Guardando...';
  
  const sobreId = esI ? null : document.getElementById('gcat').value;
  const nota = document.getElementById('gnota').value.trim();
  const cuotasTotal = parsM(document.getElementById('gcuotas').value) || null;
  const cuotaNum = parsM(document.getElementById('gcuota-num').value) || null;
  const persona = document.getElementById('gpersona')?.value || null;
  
  const montoPres = cuotasTotal ? Math.round(montoTotal / cuotasTotal) : montoTotal;
  const notaFinal = cuotasTotal && montoTotal > montoPres ? (nota ? nota + ' | Total: ' + fmt(montoTotal) : 'Total: ' + fmt(montoTotal)) : nota;
  
  const p = { user_id: U.id, descripcion: desc, monto: montoPres, sobre_id: sobreId ? parseInt(sobreId) : null, fecha, nota: notaFinal || null, tipo: tipoActual, cuotas_total: cuotasTotal, cuotas_numero: cuotaNum, persona };
  
  const r = await sb('/rest/v1/gastos', 'POST', p);
  if (r.ok || r.s === 201) {
    await loadMovs();
    ['gdesc', 'gmonto', 'gnota', 'gcuotas', 'gcuota-num'].forEach(id => { if(document.getElementById(id)) document.getElementById(id).value = ''; });
    toast(esI ? 'Ingreso guardado' : 'Gasto guardado');
    renderResumen(); renderHistorial();
  } else toast('Error al guardar.');
  
  btn.textContent = esI ? 'Guardar ingreso' : 'Guardar gasto';
}

async function eliminarMov(id) {
  await sb('/rest/v1/gastos?id=eq.' + id, 'DELETE');
  movs = movs.filter(m => m.id !== id);
  renderResumen(); renderHistorial(); toast('Eliminado');
}

async function agregarAhorro() {
  const monto = parsM(document.getElementById('amonto').value);
  if (!monto) { toast('Ingresa un monto'); return; }
  const billId = document.getElementById('abilletera').value;
  if (!billId) { toast('Selecciona una billetera (créala en configuración)'); return; }
  const fecha = document.getElementById('afecha').value;
  const nota = document.getElementById('anota').value.trim();
  
  const btn = document.getElementById('btnahorro');
  btn.innerHTML = '<span class="sp"></span>Guardando...';
  
  const r = await sb('/rest/v1/ahorros', 'POST', { user_id: U.id, monto, billetera_id: parseInt(billId), fecha, nota: nota || null });
  if (r.ok || r.s === 201) {
    await loadAhorros();
    document.getElementById('amonto').value = ''; document.getElementById('anota').value = '';
    toast('Depósito guardado'); renderAhorros();
  } else toast('Error al guardar.');
  btn.textContent = 'Guardar depósito';
}

async function eliminarAhorro(id) {
  await sb('/rest/v1/ahorros?id=eq.' + id, 'DELETE');
  ahorros = ahorros.filter(a => a.id !== id);
  renderAhorros(); toast('Eliminado');
}

// ================= RENDERIZADO VISUAL =================
const movDelMes = mes => movs.filter(m => m.fecha && m.fecha.startsWith(mes || curMes));

function renderResumen() {
  const lbl = document.getElementById('mlabel');
  if (lbl) lbl.textContent = mesLabel(curMes);
  
  const gm = movDelMes();
  const gastosM = gm.filter(m => m.tipo !== 'ingreso');
  const ingresosM = gm.filter(m => m.tipo === 'ingreso');
  const ingrExtra = ingresosM.reduce((a, b) => a + b.monto, 0);
  const ingrTotal = cfg.sueldo + ingrExtra;

  // Calculamos el gasto acumulado por cada sobre
  const gastoPorSobre = {};
  gastosM.forEach(g => {
    if (g.sobre_id) { gastoPorSobre[g.sobre_id] = (gastoPorSobre[g.sobre_id] || 0) + g.monto; }
  });

  const presNec = ingrTotal * (cfg.nec / 100);
  const presDes = ingrTotal * (cfg.des / 100);
  
  // Función constructora de los nuevos bloques de Sobres
  const buildBucketHTML = (titulo, bucketKey, presTotal) => {
    const sobresFiltrados = sobres.filter(s => s.bucket === bucketKey);
    let html = `<div class="card"><div class="ct">${titulo} (${fmt(presTotal)})</div>`;
    let gastoTotalBucket = 0;
    
    sobresFiltrados.forEach(s => {
      const gastado = gastoPorSobre[s.id] || 0;
      gastoTotalBucket += gastado;
      const pc = pct(gastado, s.monto_limite);
      const col = bCol(gastado, s.monto_limite);
      
      html += `
      <div class="pw">
        <div class="ph"><span class="pl">${s.nombre}</span><span class="pn">${fmt(gastado)} / ${fmt(s.monto_limite)}</span></div>
        <div class="pb"><div class="pf" style="width:${pc}%;background:${col}"></div></div>
        ${pc >= 100 ? `<div class="pa" style="color:var(--red);font-weight:600">Excedido en ${fmt(gastado - s.monto_limite)}</div>` : ''}
      </div>`;
    });
    
    const sobrante = presTotal - gastoTotalBucket;
    html += `<div style="margin-top:10px; font-size:12px; color: var(--text3)">Total gastado: ${fmt(gastoTotalBucket)} | Restante general: ${fmt(sobrante)}</div></div>`;
    return { html, gastoTotalBucket };
  };

  const necData = buildBucketHTML('Necesidades', 'necesidades', presNec);
  const desData = buildBucketHTML('Deseos', 'deseos', presDes);
  
  const gastAho = ahorros.filter(a => a.fecha?.startsWith(curMes)).reduce((a, b) => a + b.monto, 0);
  const totalGast = necData.gastoTotalBucket + desData.gastoTotalBucket + gastAho;
  const sobOk = (ingrTotal - totalGast) >= 0;

  // Renderizar la información en el panel
  const resContent = document.getElementById('resumen-content');
  if (!resContent) return;
  
  resContent.innerHTML = `
    <div class="mg">
      <div class="met"><div class="ml">Ingresos</div><div class="mv">${fmt(ingrTotal)}</div></div>
      <div class="met"><div class="ml">Gastado</div><div class="mv ${sobOk ? 'ok' : 'bad'}">${fmt(totalGast)}</div></div>
      <div class="met"><div class="ml">Disponible</div><div class="mv ${sobOk ? 'ok' : 'bad'}">${fmt(Math.max(0, ingrTotal - totalGast))}</div></div>
    </div>
    ${necData.html}
    ${desData.html}
    <div class="card">
      <div class="ct">Ahorro e Inversión (${fmt(ingrTotal * (cfg.aho / 100))})</div>
      <div class="pw">
        <div class="ph"><span class="pl">Guardado este mes</span><span class="pn">${fmt(gastAho)}</span></div>
        <div class="pb"><div class="pf" style="width:${pct(gastAho, ingrTotal * (cfg.aho / 100))}%;background:#3ecf8e"></div></div>
      </div>
    </div>
    <div class="card">
      <div class="ct">Distribución General</div>
      <div class="donut-wrap">
        <div class="donut-chart"><canvas id="pgasto"></canvas></div>
        <div class="donut-legend" id="donut-leyenda" style="padding-left: 20px;"></div>
      </div>
    </div>`;

  // Preparar datos para el gráfico de dona
  setTimeout(() => {
    const donutData = [necData.gastoTotalBucket, desData.gastoTotalBucket, gastAho];
    const donutColors = ['#f87171', '#f59e0b', '#3ecf8e'];
    const donutLabels = ['Necesidades', 'Deseos', 'Ahorro'];
    const totalDonut = donutData.reduce((a, b) => a + b, 0);
    
    document.getElementById('donut-leyenda').innerHTML = donutLabels.map((l, i) => {
      const pctStr = totalDonut > 0 ? Math.round((donutData[i] / totalDonut) * 100) + '%' : '0%';
      return `<div class="dl-item"><div class="dl-dot" style="background:${donutColors[i]}"></div><span>${l}</span><span class="dl-val">${pctStr}</span></div>`;
    }).join('');
    
    if(typeof renderGastoChart === 'function') renderGastoChart(donutData, donutLabels, donutColors, totalDonut);
  }, 100);
}

function renderHistorial() {
  const lbl = document.getElementById('mlabel2');
  if (lbl) lbl.textContent = mesLabel(curMes);
  
  const gm = movDelMes();
  const el = document.getElementById('historial-content');
  if (!el) return;
  
  if (!gm.length) { el.innerHTML = '<div class="empty">Sin resultados</div>'; }
  else {
    el.innerHTML = gm.map(g => {
      const pLabel = g.persona ? (g.persona === 'yo' ? cfg.nombre1 : g.persona === 'novia' ? cfg.nombre2 : 'Ambos') : '';
      const sobreAsociado = sobres.find(s => s.id === g.sobre_id);
      const nombreCat = sobreAsociado ? sobreAsociado.nombre : (g.tipo === 'ingreso' ? 'Ingreso' : 'Extra');
      
      return `<div class="gi">
        <div class="gt">
          <div><div class="gd">${g.descripcion}${g.cuotas_total ? ` <span style="font-size:11px;color:var(--accent2)">${g.cuotas_numero || '?'}/${g.cuotas_total}</span>` : ''}</div>
          <div class="gm2">${nombreCat} · ${g.fecha}</div>
          ${g.created_at ? `<div class="ghr">${fmtDT(g.created_at)}</div>` : ''}</div>
        </div>
        <div class="gright">
          ${g.cuotas_total && g.nota && g.nota.includes('Total:') ? `<div class="gmonto-total">${g.nota.match(/Total: \$[\d.,]+/)?.[0] || ''}</div>` : ''}
          <div class="gmonto ${g.tipo === 'ingreso' ? 'ing' : 'gas'}">${g.tipo === 'ingreso' ? '+' : ''}${fmt(g.monto)}</div>
          <button class="bdel" onclick="eliminarMov(${g.id})">×</button>
        </div>
      </div>${pLabel ? `<div><span class="gpersona">${pLabel}</span></div>` : ''}`;
    }).join('');
  }

  // Prepara datos para el gráfico de barras y lo dibuja
  if(typeof renderHistorialChart === 'function') {
    const mls = []; 
    for(let i=5; i>=0; i--) { const d=new Date(); d.setMonth(d.getMonth()-i); mls.push(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')); }
    const gastosData = mls.map(m => movDelMes(m).filter(x => x.tipo !== 'ingreso').reduce((a, b) => a + b.monto, 0));
    const ingresosData = mls.map(m => movDelMes(m).filter(x => x.tipo === 'ingreso').reduce((a, b) => a + b.monto, 0));
    renderHistorialChart(mls, gastosData, ingresosData);
  }
}

function renderAhorros() {
  const total = ahorros.reduce((a, b) => a + b.monto, 0);
  const ahero = document.getElementById('ahero');
  if (ahero) ahero.innerHTML = `<div class="ahorro-hero"><div class="ah-label">Total ahorrado</div><div class="ah-value">${fmt(total)}</div><div style="font-size:12px;opacity:.7;margin-top:4px">${ahorros.length} movimientos</div></div>`;
  
  // Mapa dinámico con billeteras de la base de datos
  const bmap = {};
  billeteras.forEach(b => { bmap[b.id] = { nombre: b.nombre, color: b.color_hex, total: 0, items: [] }; });
  ahorros.forEach(a => {
    if (bmap[a.billetera_id]) { bmap[a.billetera_id].total += a.monto; bmap[a.billetera_id].items.push(a); }
  });
  
  const blist = document.getElementById('bill-list');
  if (blist) blist.innerHTML = Object.values(bmap).filter(b => b.total > 0).map(b => `<div class="ri"><div style="display:flex;align-items:center;gap:8px"><div style="width:10px;height:10px;border-radius:50%;background:${b.color};flex-shrink:0"></div><span class="rl">${b.nombre}</span></div><span class="rr">${fmt(b.total)}</span></div>`).join('');
  
  const ahist = document.getElementById('ahist');
  if (ahist) {
    ahist.innerHTML = ahorros.length ? [...ahorros].reverse().map(a => {
      const b = bmap[a.billetera_id] || { nombre: 'Billetera oculta/eliminada', color: '#999' };
      return `<div class="gi"><div class="gt"><div><div class="gd" style="display:flex;align-items:center;gap:6px"><div style="width:8px;height:8px;border-radius:50%;background:${b.color};flex-shrink:0"></div>${b.nombre}${a.nota ? ` · <span style="color:var(--text3);font-weight:400">${a.nota}</span>` : ''}</div><div class="gm2">${a.fecha}</div></div><div class="gright"><div class="gmonto ing">+${fmt(a.monto)}</div><button class="bdel" onclick="eliminarAhorro(${a.id})">×</button></div></div></div>`;
    }).join('') : '<div class="empty">Sin depósitos</div>';
  }

  // Enviar a graficar
  if(typeof renderAhorrosChart === 'function') {
    const mls = []; for(let i=5; i>=0; i--) { const d=new Date(); d.setMonth(d.getMonth()-i); mls.push(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')); }
    renderAhorrosChart(mls, chartMode, ahorros, bmap);
  }
}

function setChartMode(m, btn) {
  chartMode = m; 
  ['cht-tot', 'cht-des'].forEach(id => { const el = document.getElementById(id); if(el) { el.style.borderColor = ''; el.style.color = ''; }});
  if (btn) { btn.style.borderColor = 'var(--accent)'; btn.style.color = 'var(--accent2)'; }
  renderAhorros();
}

// Funciones vacías para evitar errores temporales de consola hasta que hagamos la vista de préstamos/compartidos
function renderPrestamos() {} 
function initCfgUI() {}
async function guardarCfg() {}
