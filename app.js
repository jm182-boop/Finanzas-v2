// ==========================================
// app.js - SPRINT FINAL UI/UX (CHECKLIST Y ALERTAS ESTABILIZADOS)
// ==========================================

let EstadoApp = {
    movimientos: [],
    billeteras: [],
    prestamos: [],
    destinos: [], 
    presupuestos: { necesidades: { limite: 0, gastado: 0 }, deseos: { limite: 0, gastado: 0 } },
    configuracion: { regla: { necesidades: 50, deseos: 30, ahorro: 20 }, moneda: 'AR', mediosPago: [], personasFrecuentes: [], checklist: [] },
    checklistEstado: { mes: '', completados: [] }
};

window.alertasGeneradas = [];

function guardarEstado() { localStorage.setItem('finApp_estado', JSON.stringify(EstadoApp)); }

function cargarEstado() {
    const estadoGuardado = localStorage.getItem('finApp_estado');
    if (estadoGuardado) {
        const parsed = JSON.parse(estadoGuardado);
        EstadoApp = { ...EstadoApp, ...parsed };
        if (!EstadoApp.destinos) EstadoApp.destinos = [];
        if (!EstadoApp.configuracion) EstadoApp.configuracion = {};
        if (!EstadoApp.configuracion.mediosPago) EstadoApp.configuracion.mediosPago = [];
        if (!EstadoApp.configuracion.personasFrecuentes) EstadoApp.configuracion.personasFrecuentes = [];
        if (!EstadoApp.configuracion.checklist) EstadoApp.configuracion.checklist = [];
        if (!EstadoApp.checklistEstado) EstadoApp.checklistEstado = { mes: '', completados: [] };
    } else {
        EstadoApp.configuracion.mediosPago = [{ id: generarID('mp'), nombre: 'Efectivo', color: '#12e091' }];
    }
}

function generarID(prefijo) { return prefijo + '_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7); }

// ==========================================
// SEMÁFORO UNIVERSAL DE ALERTAS Y RECORDATORIOS
// ==========================================
function getAlertColor(pct, defaultColor) {
    if (pct >= 100) return 'var(--red)';
    if (pct >= 90) return '#f97316'; // Naranja
    if (pct >= 80) return '#eab308'; // Amarillo
    return defaultColor;
}

function generarAlertaObj(nombre, pct) {
    let nivel = pct >= 100 ? 'Crítico' : (pct >= 90 ? 'Precaución' : 'Advertencia');
    let color = pct >= 100 ? 'var(--red)' : (pct >= 90 ? '#f97316' : '#eab308');
    let icon = pct >= 100 ? 'alert-octagon' : 'alert-triangle';
    return { msg: `${nombre} al ${pct.toFixed(0)}%`, color, icon, nivel };
}

function renderAlertas() {
    const contenedor = document.getElementById('alertas-list');
    if (!contenedor) return;
    if (window.alertasGeneradas.length === 0) {
        contenedor.innerHTML = `<div style="display:flex; align-items:center; gap:12px; font-size:13px; color:var(--text3);"><i data-lucide="check-circle" class="icon-sm" style="color:var(--green);"></i><span>Todo en orden. Sin alertas activas.</span></div>`;
        return;
    }
    window.alertasGeneradas.sort((a,b) => {
        let valA = a.nivel === 'Crítico' ? 3 : (a.nivel === 'Precaución' ? 2 : 1);
        let valB = b.nivel === 'Crítico' ? 3 : (b.nivel === 'Precaución' ? 2 : 1);
        return valB - valA;
    });
    let html = '';
    window.alertasGeneradas.forEach(a => {
        html += `<div style="display:flex; align-items:center; gap:10px; margin-bottom:8px; font-size:13px; font-weight:600; color:${a.color};"><i data-lucide="${a.icon}" class="icon-sm"></i><span>${a.msg}</span></div>`;
    });
    contenedor.innerHTML = html;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ==========================================
// MOTOR MATEMÁTICO UNIVERSAL
// ==========================================
function getImpactoNeto(m) {
    if (m.tipo !== 'gasto') return m.monto;
    let base = (m.cuotas && m.cuotas.esCuota && m.cuotas.total > 0) ? (m.monto / m.cuotas.total) : m.monto;
    if (m.compartido && m.compartido.esCompartido && m.compartido.porcentaje) {
        return base * (m.compartido.porcentaje / 100);
    }
    return base;
}

// ==========================================
// RENDERIZADO GLOBAL
// ==========================================
function renderizarTodo() {
    window.alertasGeneradas = []; 
    
    renderDestinosConfig();
    actualizarSelectsMovimientos();
    renderMediosPago();
    actualizarSelectsMediosPago();
    renderPersonasFrecuentes(); 
    renderPersonasAdmin();
    renderChecklistConfig();
    actualizarSelectsAhorro(); 
    
    renderBilleterasUI();
    renderPrestamos();
    
    recalcularMotorFinanciero();
    calcularRegla503020(); 
    renderSobresResumen();
    renderPorMedioPago();
    renderChecklistResumen();
    renderAlertas(); 
    
    poblarFiltrosHistorial();
    filtrarHistorial();
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

document.addEventListener('DOMContentLoaded', () => {
    cargarEstado();
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const hoy = new Date(); const mlabel = document.getElementById('mlabel');
    if(mlabel) mlabel.innerHTML = `<i data-lucide="layout-dashboard" class="icon-lg" style="margin-right:8px;"></i> ${meses[hoy.getMonth()]} ${hoy.getFullYear()}`;

    const fechaHoyString = hoy.toISOString().split('T')[0];
    document.querySelectorAll('input[type="date"], .input-fecha').forEach(input => { if (!input.value) input.value = fechaHoyString; });

    if(localStorage.getItem('theme') === 'light') toggleTheme(true);
    document.getElementById('auth-screen').style.display = 'none'; document.getElementById('app').style.display = 'flex';
    document.getElementById('uemail').innerText = 'usuario@finanzas.com';

    renderizarTodo();

    const slNec = document.getElementById('sl-nec'); const slDes = document.getElementById('sl-des');
    if(slNec) slNec.addEventListener('input', updateRegla); if(slDes) slDes.addEventListener('input', updateRegla);
    if(slNec && slDes && EstadoApp.configuracion.regla) { slNec.value = EstadoApp.configuracion.regla.necesidades || 50; slDes.value = EstadoApp.configuracion.regla.deseos || 30; updateRegla(); }
    const btnAgregarMovimiento = document.getElementById('btnagregar'); if (btnAgregarMovimiento) btnAgregarMovimiento.addEventListener('click', guardarMovimiento);
});

// ==========================================
// REGISTRO Y PREVISUALIZACIÓN (GASTOS E INGRESOS CON USD Y NOTAS)
// ==========================================
window.calcularCuotaInfoGasto = function() {
    const esGasto = document.getElementById('btg').classList.contains('active');
    const infoText = document.getElementById('g-info-cuota');
    if (!infoText) return;
    if (!esGasto) { infoText.innerHTML = ''; return; }
    
    const montoStr = document.getElementById('gmonto').value.replace(/\./g, '');
    const cuotasStr = document.getElementById('gcuotas').value;
    const pctCompartidoStr = document.getElementById('comp-pct').value;
    const chkCompartidoEl = document.getElementById('chk-compartido');
    const isCompartido = chkCompartidoEl ? chkCompartidoEl.checked : false;

    if (montoStr && parseFloat(montoStr) > 0) {
        let monto = parseFloat(montoStr); let cuotas = parseInt(cuotasStr) > 0 ? parseInt(cuotasStr) : 1; let valorCuota = monto / cuotas;
        let msg = `Total: $${formatearDinero(monto)}`;
        if (cuotas > 1) msg += `<br>Cuotas: ${cuotas} | Valor cuota: $${formatearDinero(valorCuota.toFixed(0))}`;
        if (isCompartido && pctCompartidoStr) {
            let pct = parseFloat(pctCompartidoStr); let tuParte = valorCuota * (pct / 100);
            msg += `<br>Tu parte (${pct}%): $${formatearDinero(tuParte.toFixed(0))}`;
        }
        infoText.innerHTML = msg;
    } else { infoText.innerHTML = ''; }
}

window.toggleUsdFields = function() {
    const chkUsd = document.getElementById('chk-usd');
    document.getElementById('caja-usd').style.display = (chkUsd && chkUsd.checked) ? 'grid' : 'none';
}

function guardarMovimiento() {
    const esGasto = document.getElementById('btg').classList.contains('active'); const tipo = esGasto ? 'gasto' : 'ingreso';
    const concepto = document.getElementById('gdesc').value.trim(); const montoStr = document.getElementById('gmonto').value.replace(/\./g, ''); const monto = parseFloat(montoStr);
    const medioPagoId = esGasto ? document.getElementById('gmedio').value : document.getElementById('imedio').value;
    const destinoSelect = document.querySelector('select[data-type="destino"]'); const destinoId = esGasto && destinoSelect ? destinoSelect.value : null;
    const inputFecha = document.querySelector('.input-fecha'); const fecha = inputFecha && inputFecha.value ? inputFecha.value : new Date().toISOString().split('T')[0];
    const hora = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    const nota = document.getElementById('gnota').value.trim();

    const isUsd = document.getElementById('chk-usd').checked;
    const montoUsd = isUsd ? parseFloat(document.getElementById('gusd-monto').value.replace(/\D/g, '')) || 0 : null;
    const cotizacionUsd = isUsd ? parseFloat(document.getElementById('gusd-cotizacion').value.replace(/\D/g, '')) || 0 : null;

    if (!concepto || isNaN(monto) || monto <= 0 || !medioPagoId) { showToast("Completa los campos obligatorios."); return; }
    if (esGasto && !destinoId) { showToast("Selecciona un destino presupuestario."); return; }

    let cuotasObj = { esCuota: false, total: 1, actual: 1 }; let compartidoObj = { esCompartido: false, persona: null, porcentaje: null };

    if (esGasto) {
        const cuotasTotal = parseInt(document.getElementById('gcuotas').value) || 0; const cuotaActual = parseInt(document.getElementById('gcuota-num').value) || 0;
        const chkCompartido = document.getElementById('chk-compartido').checked;
        if (cuotasTotal > 0) cuotasObj = { esCuota: true, total: cuotasTotal, actual: cuotaActual > 0 ? cuotaActual : 1 };
        if (chkCompartido) {
            const nombrePers = document.getElementById('comp-quien').value.trim();
            compartidoObj = { esCompartido: true, persona: nombrePers, porcentaje: parseFloat(document.getElementById('comp-pct').value) || 50 };
            if (document.getElementById('comp-guardar').checked && nombrePers) {
                if (!EstadoApp.configuracion.personasFrecuentes) EstadoApp.configuracion.personasFrecuentes = [];
                if (!EstadoApp.configuracion.personasFrecuentes.includes(nombrePers)) EstadoApp.configuracion.personasFrecuentes.push(nombrePers);
            }
        }
    }

    EstadoApp.movimientos.unshift({ id: generarID('mov'), tipo: tipo, concepto: concepto, monto: monto, fecha: fecha, hora: hora, medioPagoId: medioPagoId, destinoId: destinoId, cuotas: cuotasObj, compartido: compartidoObj, nota: nota, isUsd: isUsd, montoUsd: montoUsd, cotizacionUsd: cotizacionUsd });
    guardarEstado(); limpiarInputs('panel-registro'); toggleCompartido(); toggleUsdFields(); document.getElementById('panel-registro').style.display = 'none'; renderizarTodo(); showToast("Movimiento registrado");
}

window.eliminarMovimiento = function(id) { if (confirm("¿Estás seguro de eliminar este movimiento?")) { EstadoApp.movimientos = EstadoApp.movimientos.filter(m => m.id !== id); guardarEstado(); renderizarTodo(); showToast("Movimiento eliminado"); } }

// ==========================================
// CALCULOS Y REGLA 70/20/10 EXCLUSIVA DE INGRESOS CON ALERTAS
// ==========================================
function recalcularMotorFinanciero() {
    let ingresos = 0, gastos = 0;
    EstadoApp.movimientos.forEach(m => { if (m.tipo === 'ingreso') ingresos += m.monto; if (m.tipo === 'gasto') gastos += getImpactoNeto(m); });
    let balance = ingresos - gastos;
    const elIn = document.getElementById('resumen-in'); const elOut = document.getElementById('resumen-out'); const elDisp = document.getElementById('resumen-disp');
    if (elIn) elIn.innerText = '$' + formatearDinero(ingresos); if (elOut) elOut.innerText = '$' + formatearDinero(gastos.toFixed(0));
    if (elDisp) { elDisp.innerText = '$' + formatearDinero(balance.toFixed(0)); elDisp.className = balance >= 0 ? 'mv ok' : 'mv bad'; }
}

function calcularRegla503020() {
    let gastadoNec = 0, gastadoDes = 0, ingresosMes = 0;
    const hoy = new Date(); const mesActual = hoy.getMonth() + 1; const anioActual = hoy.getFullYear();

    EstadoApp.movimientos.forEach(mov => {
        if (!mov.fecha) return; const partes = mov.fecha.split('-'); if (parseInt(partes[1]) !== mesActual || parseInt(partes[0]) !== anioActual) return;
        if (mov.tipo === 'ingreso') { ingresosMes += mov.monto; return; }
        if (mov.tipo === 'gasto') {
            const dest = EstadoApp.destinos.find(d => d.id === mov.destinoId); if (!dest) return;
            let impactoReal = getImpactoNeto(mov);
            if (dest.grupo === 'Necesidades') gastadoNec += impactoReal; if (dest.grupo === 'Deseos') gastadoDes += impactoReal;
        }
    });

    let regla = EstadoApp.configuracion.regla || { necesidades: 50, deseos: 30, ahorro: 20 };
    let limiteNec = ingresosMes * (regla.necesidades / 100); let limiteDes = ingresosMes * (regla.deseos / 100); let limiteAho = ingresosMes * (regla.ahorro / 100);

    const txtNec = document.getElementById('resumen-nec-txt'); const fillNec = document.getElementById('resumen-nec-fill');
    if (txtNec && fillNec) {
        let pctNec = limiteNec > 0 ? (gastadoNec / limiteNec) * 100 : (gastadoNec > 0 ? 100 : 0);
        let colorNec = getAlertColor(pctNec, 'var(--green)');
        if(pctNec >= 80) window.alertasGeneradas.push(generarAlertaObj("Regla Necesidades", pctNec));
        txtNec.innerText = '$' + formatearDinero(gastadoNec.toFixed(0)) + ' / $' + formatearDinero(limiteNec.toFixed(0));
        fillNec.style.background = colorNec; fillNec.style.width = (pctNec > 100 ? 100 : pctNec) + '%'; txtNec.style.color = pctNec >= 100 ? 'var(--red)' : '';
    }

    const txtDes = document.getElementById('resumen-des-txt'); const fillDes = document.getElementById('resumen-des-fill');
    if (txtDes && fillDes) {
        let pctDes = limiteDes > 0 ? (gastadoDes / limiteDes) * 100 : (gastadoDes > 0 ? 100 : 0);
        let colorDes = getAlertColor(pctDes, 'var(--accent)');
        if(pctDes >= 80) window.alertasGeneradas.push(generarAlertaObj("Regla Deseos", pctDes));
        txtDes.innerText = '$' + formatearDinero(gastadoDes.toFixed(0)) + ' / $' + formatearDinero(limiteDes.toFixed(0));
        fillDes.style.background = colorDes; fillDes.style.width = (pctDes > 100 ? 100 : pctDes) + '%'; txtDes.style.color = pctDes >= 100 ? 'var(--red)' : '';
    }

    const txtAho = document.getElementById('resumen-aho-txt'); const fillAho = document.getElementById('resumen-aho-fill');
    if (txtAho && fillAho) {
        let ahorradoReal = 0; let pctAho = limiteAho > 0 ? (ahorradoReal / limiteAho) * 100 : 0;
        txtAho.innerText = '$' + formatearDinero(ahorradoReal) + ' / $' + formatearDinero(limiteAho.toFixed(0));
        fillAho.style.background = 'var(--green)'; fillAho.style.width = (pctAho > 100 ? 100 : pctAho) + '%';
    }
}

// ==========================================
// MÓDULO VISUAL DE SOBRES INDEPENDIENTES CON ALERTAS
// ==========================================
function renderSobresResumen() {
    const contenedor = document.getElementById('resumen-sobres-lista'); if (!contenedor) return;
    const hoy = new Date(); const mesActual = hoy.getMonth() + 1; const anioActual = hoy.getFullYear();
    let activos = EstadoApp.destinos.filter(d => d.activo);
    if(activos.length === 0) { contenedor.innerHTML = '<p style="color:var(--text3); font-size:13px; text-align:center;">No hay sobres activos.</p>'; return; }

    let html = '';
    activos.forEach(dest => {
        let gastado = 0;
        EstadoApp.movimientos.forEach(m => {
            if (m.tipo === 'gasto' && m.destinoId === dest.id && m.fecha) {
                const partes = m.fecha.split('-');
                if (parseInt(partes[1]) === mesActual && parseInt(partes[0]) === anioActual) gastado += getImpactoNeto(m);
            }
        });

        let disponible = dest.presupuesto - gastado;
        let excedido = gastado > dest.presupuesto ? gastado - dest.presupuesto : 0;
        let pctConsumido = dest.presupuesto > 0 ? (gastado / dest.presupuesto) * 100 : (gastado > 0 ? 100 : 0);
        let pctBarra = pctConsumido > 100 ? 100 : pctConsumido;
        
        let baseColor = dest.grupo === 'Necesidades' ? 'var(--green)' : 'var(--accent)';
        let colorBarra = getAlertColor(pctConsumido, baseColor);
        if(pctConsumido >= 80) window.alertasGeneradas.push(generarAlertaObj(`Sobre ${dest.nombre}`, pctConsumido));

        let statusText = excedido > 0 ? `<span style="color:var(--red); font-weight:700;">Excedido: $${formatearDinero(excedido.toFixed(0))}</span>` : `<span style="color:var(--text3);">Disponible: $${formatearDinero(disponible.toFixed(0))}</span>`;

        html += `<div style="background:var(--bg); padding:15px; border-radius:10px; border:1px solid var(--border);"><div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:10px;"><div><div style="font-weight:700; font-size:14px; color:var(--text); margin-bottom:2px;">${dest.nombre} <span style="font-size:10px; font-weight:500; color:var(--text3); padding:2px 6px; background:var(--bg3); border-radius:4px; margin-left:5px;">${dest.grupo}</span></div><div style="font-size:12px; color:var(--text2);">Gastado: $${formatearDinero(gastado.toFixed(0))} / Presupuesto: $${formatearDinero(dest.presupuesto)}</div></div><div style="text-align:right;"><div style="font-size:16px; font-weight:800; color:${colorBarra};">${pctConsumido.toFixed(0)}%</div></div></div><div style="width:100%; height:6px; background:var(--bg3); border-radius:3px; overflow:hidden; margin-bottom:8px;"><div style="height:100%; width:${pctBarra}%; background:${colorBarra}; border-radius:3px; transition:width 0.3s ease;"></div></div><div style="text-align:right; font-size:12px;">${statusText}</div></div>`;
    });
    contenedor.innerHTML = html;
}

// ==========================================
// MÓDULO OBLIGACIONES MENSUALES (CHECKLIST)
// ==========================================
window.agregarChecklist = function() {
    const nombre = document.getElementById('chk-nuevo-nombre').value.trim();
    if (!nombre) return;
    EstadoApp.configuracion.checklist.push({ id: generarID('chk'), nombre: nombre });
    guardarEstado(); renderizarTodo(); document.getElementById('chk-nuevo-nombre').value = ''; showToast("Obligación agregada");
}

window.eliminarChecklist = function(id) {
    EstadoApp.configuracion.checklist = EstadoApp.configuracion.checklist.filter(c => c.id !== id);
    guardarEstado(); renderizarTodo(); showToast("Obligación eliminada");
}

function renderChecklistConfig() {
    const contenedor = document.getElementById('lista-checklist-admin'); if(!contenedor) return;
    let html = '';
    EstadoApp.configuracion.checklist.forEach(c => {
        html += `<div style="display:flex; justify-content:space-between; align-items:center; padding:10px; background:var(--bg); border-radius:8px; border:1px solid var(--border);"><span style="font-size:13px; font-weight:600; color:var(--text);">${c.nombre}</span><button class="ui-icon-btn" onclick="eliminarChecklist('${c.id}')"><i data-lucide="trash-2" class="icon-sm" style="color:var(--red);"></i></button></div>`;
    });
    contenedor.innerHTML = html || '<p style="color:var(--text3); font-size:13px; text-align:center;">Sin obligaciones.</p>';
}

function getSaldosPrestamosPuros() {
    let agrupados = {};
    EstadoApp.prestamos.forEach(p => {
        if (p.archivado) return; 
        let key = p.persona.trim().toLowerCase();
        if (!agrupados[key]) agrupados[key] = { nombre: p.persona, neto: 0 };
        let saldo = 0; p.cuotas.forEach(c => { if (!c.pagada) saldo += c.monto; });
        if (p.tipo === 'medeben') agrupados[key].neto += saldo; else agrupados[key].neto -= saldo;
    });
    return Object.values(agrupados);
}

function renderChecklistResumen() {
    const contenedor = document.getElementById('resumen-checklist-lista'); if (!contenedor) return;
    const hoy = new Date(); const mesActualStr = `${hoy.getFullYear()}-${hoy.getMonth() + 1}`;
    if (!EstadoApp.checklistEstado || EstadoApp.checklistEstado.mes !== mesActualStr) {
        EstadoApp.checklistEstado = { mes: mesActualStr, completados: [] }; guardarEstado();
    }

    let items = [];
    if (EstadoApp.configuracion.checklist) EstadoApp.configuracion.checklist.forEach(c => items.push({ id: c.id, nombre: c.nombre, tipo: 'manual' }));
    
    let saldos = getSaldosPrestamosPuros();
    saldos.forEach(s => {
        if (s.neto > 0) items.push({ id: 'prest_me_' + s.nombre.toLowerCase().replace(/\s+/g, ''), nombre: 'Me debe ' + s.nombre, tipo: 'auto' });
        if (s.neto < 0) items.push({ id: 'prest_yo_' + s.nombre.toLowerCase().replace(/\s+/g, ''), nombre: 'Yo debo a ' + s.nombre, tipo: 'auto' });
    });

    if (items.length === 0) { contenedor.innerHTML = '<p style="color:var(--text3); font-size:13px; text-align:center; margin:15px 0;">Sin obligaciones registradas.</p>'; return; }

    let html = '';
    items.forEach(item => {
        let isChecked = EstadoApp.checklistEstado.completados.includes(item.id);
        let checkAttr = isChecked ? 'checked' : '';
        let labelStyle = isChecked ? 'opacity: 0.5; text-decoration: line-through; color: var(--text3);' : 'color: var(--text);';
        let autoBadge = item.tipo === 'auto' ? '<span style="font-size:10px; background:var(--bg3); padding:2px 6px; border-radius:4px; margin-left:8px; color:var(--text3);">Auto</span>' : '';

        html += `<div style="display:flex; align-items:center; padding:10px 0; border-bottom:1px dashed var(--border); transition: all 0.2s;"><input type="checkbox" ${checkAttr} onchange="toggleChecklistItem('${item.id}')" style="margin:0 12px 0 0; cursor:pointer;"><span style="font-size:13px; font-weight:600; ${labelStyle}">${item.nombre} ${autoBadge}</span></div>`;
    });
    contenedor.innerHTML = html;
}

window.toggleChecklistItem = function(id) {
    let idx = EstadoApp.checklistEstado.completados.indexOf(id);
    if (idx > -1) EstadoApp.checklistEstado.completados.splice(idx, 1); else EstadoApp.checklistEstado.completados.push(id);
    guardarEstado(); renderChecklistResumen();
}

function renderPorMedioPago() {
    const contenedor = document.getElementById('resumen-medios-pago-lista'); if (!contenedor) return;
    const hoy = new Date(); const mesActual = hoy.getMonth() + 1; const anioActual = hoy.getFullYear(); let agrupados = {};
    EstadoApp.movimientos.forEach(m => {
        if (!m.fecha) return; const partes = m.fecha.split('-'); if (parseInt(partes[1]) !== mesActual || parseInt(partes[0]) !== anioActual) return;
        let targetId = m.tipo === 'gasto' ? m.medioPagoId : (m.tipo === 'ahorro' && m.subtipo === 'aporte' ? m.origenId : null);
        if(!targetId) return; if(!agrupados[targetId]) agrupados[targetId] = 0; agrupados[targetId] += getImpactoNeto(m);
    });
    let html = '';
    for(const [id, monto] of Object.entries(agrupados)) {
        let mp = EstadoApp.configuracion.mediosPago.find(m => m.id === id); if(!mp) continue;
        html += `<div style="display:flex; justify-content:space-between; align-items:center; padding:10px; background:var(--bg); border-radius:8px; border:1px solid var(--border);"><div style="display:flex; align-items:center; gap:10px;"><span class="dot" style="background:${mp.color};"></span><span style="font-size:13px; font-weight:600; color:var(--text);">${mp.nombre}</span></div><span style="font-size:14px; font-weight:700; color:var(--text);">$${formatearDinero(monto.toFixed(0))}</span></div>`;
    }
    contenedor.innerHTML = html || '<p style="color:var(--text3); font-size:13px; text-align:center;">Sin movimientos este mes.</p>';
}

// ==========================================
// FILTROS E HISTORIAL CON NOTAS Y USD
// ==========================================
window.poblarFiltrosHistorial = function() {
    const sMes = document.getElementById('h-mes'); const sAnio = document.getElementById('h-anio'); if(!sMes || !sAnio) return;
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    let hMes = '<option value="">Mes: Todos</option>'; meses.forEach((m, i) => hMes += `<option value="${i+1}">${m}</option>`); sMes.innerHTML = hMes;
    let hAnio = '<option value="">Año: Todos</option>';
    let anios = new Set(EstadoApp.movimientos.map(m => m.fecha ? m.fecha.split('-')[0] : new Date().getFullYear()));
    [...anios].sort((a,b) => b-a).forEach(a => hAnio += `<option value="${a}">${a}</option>`); sAnio.innerHTML = hAnio;
}

window.filtrarHistorial = function() {
    let texto = document.getElementById('h-busqueda').value.toLowerCase(); let mes = document.getElementById('h-mes').value; let anio = document.getElementById('h-anio').value; let tipo = document.getElementById('h-tipo').value;
    let filtrados = EstadoApp.movimientos.filter(m => {
        let coincTexto = m.concepto.toLowerCase().includes(texto) || (m.compartido && m.compartido.persona && m.compartido.persona.toLowerCase().includes(texto)) || (m.nota && m.nota.toLowerCase().includes(texto));
        let coincMes = true; let coincAnio = true;
        if(m.fecha) { let p = m.fecha.split('-'); if(mes) coincMes = parseInt(p[1]) === parseInt(mes); if(anio) coincAnio = parseInt(p[0]) === parseInt(anio); }
        let coincTipo = true;
        if(tipo === 'ingreso') coincTipo = m.tipo === 'ingreso';
        if(tipo === 'gasto') coincTipo = m.tipo === 'gasto' && (!m.compartido || !m.compartido.esCompartido);
        if(tipo === 'ahorro') coincTipo = m.tipo === 'ahorro';
        if(tipo === 'compartido') coincTipo = m.tipo === 'gasto' && m.compartido && m.compartido.esCompartido;
        return coincTexto && coincMes && coincAnio && coincTipo;
    });
    renderHistorialGlobal(filtrados);
}

function renderHistorialGlobal(data) {
    const container = document.getElementById('lista-historial-global'); if (!container) return;
    if (data.length === 0) {
        container.innerHTML = `<div class="card" style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:220px; border: 1px dashed var(--text3); background:transparent;"><i data-lucide="inbox" style="width:48px; height:48px; color:var(--text3); margin-bottom:15px; stroke-width:1.5;"></i><p style="color:var(--text3); font-size:14px; font-weight:500; text-align:center;">Aún no hay movimientos registrados<br>o que coincidan con estos filtros.</p></div>`;
    } else {
        let html = '';
        data.forEach(m => {
            const isGasto = m.tipo === 'gasto'; const isAhorro = m.tipo === 'ahorro';
            let colorIcono = 'var(--green)'; let colorBg = 'rgba(18, 224, 145, 0.1)'; let colorMonto = 'var(--green)'; let signo = '+'; let iconoLucide = 'arrow-up-right';
            if (isGasto) { colorIcono = 'var(--red)'; colorBg = 'rgba(255, 87, 87, 0.1)'; colorMonto = 'var(--text)'; signo = '-'; iconoLucide = 'arrow-down-right'; }
            else if (isAhorro) { colorIcono = 'var(--accent)'; colorBg = 'rgba(124, 109, 250, 0.1)'; colorMonto = 'var(--accent)'; signo = ''; iconoLucide = 'piggy-bank'; }
            
            let impactoReal = getImpactoNeto(m); let detallesHtml = `${formatearFecha(m.fecha)} • ${m.hora}`;
            if (m.nota) detallesHtml += `<br><span style="font-size:11px; font-style:italic; color:var(--text2); display:inline-block; margin-top:2px;">"${m.nota}"</span>`;
            if (m.isUsd && m.montoUsd && m.cotizacionUsd) detallesHtml += `<br><span style="font-size:11px; color:var(--accent); font-weight:600; display:inline-block; margin-top:2px;">Equivalente: $${m.montoUsd} USD (Cotización: $${m.cotizacionUsd})</span>`;

            if (isGasto && (m.cuotas?.esCuota || m.compartido?.esCompartido)) {
                detallesHtml += `<br><div style="margin-top:6px; padding:8px 10px; background:var(--bg3); border-radius:6px; font-size:11px; line-height:1.6; color:var(--text2);"><b>Total compra:</b> $${formatearDinero(m.monto)}<br>`;
                let baseCuota = m.monto;
                if (m.cuotas?.esCuota) { baseCuota = m.monto / m.cuotas.total; detallesHtml += `<b>Cuota ${m.cuotas.actual}/${m.cuotas.total}:</b> $${formatearDinero(baseCuota.toFixed(0))}<br>`; }
                if (m.compartido?.esCompartido) { detallesHtml += `<b>Compartido con:</b> ${m.compartido.persona} (${m.compartido.porcentaje}%)<br><b>Tu parte:</b> $${formatearDinero(impactoReal.toFixed(0))}`; }
                detallesHtml += `</div>`;
            }
            if (isAhorro && m.cotizacionUsd) detallesHtml += `<br><div style="margin-top:6px; padding:8px 10px; background:var(--bg3); border-radius:6px; font-size:11px; line-height:1.6; color:var(--text2);"><b>Destino:</b> $${formatearDinero(m.montoUsd)} USD<br><b>Cotización:</b> $${formatearDinero(m.cotizacionUsd)} ARS</div>`;

            html += `<div style="display:flex; justify-content:space-between; align-items:center; padding:15px; background:var(--bg2); border-radius:12px; border:1px solid var(--border); margin-bottom:10px;"><div style="display:flex; align-items:flex-start; gap:15px; flex:1;"><div style="width:42px; height:42px; border-radius:10px; background:${colorBg}; color:${colorIcono}; display:flex; align-items:center; justify-content:center; flex-shrink:0;"><i data-lucide="${iconoLucide}" class="icon-md"></i></div><div style="flex:1;"><div style="font-weight:600; font-size:14px; color:var(--text); margin-bottom:4px;">${m.concepto}</div><div style="font-size:12px; color:var(--text3); line-height:1.4;">${detallesHtml}</div></div></div><div style="display:flex; align-items:center; gap:15px; flex-shrink:0; padding-left:10px;"><div style="font-weight:700; font-size:16px; color:${colorMonto}; text-align:right;">${signo}$${formatearDinero(impactoReal.toFixed(0))}</div><button class="ui-icon-btn" onclick="eliminarMovimiento('${m.id}')" title="Eliminar Movimiento"><i data-lucide="trash-2" class="icon-sm" style="color:var(--text3); opacity: 0.6;"></i></button></div></div>`;
        });
        container.innerHTML = html; if (typeof lucide !== 'undefined') lucide.createIcons();
    }
    let totalIn = 0, totalOut = 0, totalAho = 0;
    data.forEach(m => { if(m.tipo === 'ingreso') totalIn += m.monto; if(m.tipo === 'gasto') totalOut += getImpactoNeto(m); if(m.tipo === 'ahorro') totalAho += m.monto; });
    if(document.getElementById('h-count')) document.getElementById('h-count').innerText = data.length;
    if(document.getElementById('h-in')) document.getElementById('h-in').innerText = '$' + formatearDinero(totalIn);
    if(document.getElementById('h-out')) document.getElementById('h-out').innerText = '$' + formatearDinero(totalOut.toFixed(0));
    if(document.getElementById('h-aho')) document.getElementById('h-aho').innerText = '$' + formatearDinero(totalAho);
}

// ==========================================
// AHORROS (CON COTIZACIÓN ARS/USD Y NOTAS)
// ==========================================
window.actualizarSelectsAhorro = function() {
    const tipo = document.getElementById('ahorro-tipo'); const origen = document.getElementById('ahorro-origen'); const destino = document.getElementById('ahorro-destino');
    if(!tipo || !origen || !destino) return;
    const valO = origen.value; const valD = destino.value;
    let optsMedios = '<option value="">Seleccionar...</option>'; EstadoApp.configuracion.mediosPago.forEach(mp => { optsMedios += `<option value="${mp.id}">${mp.nombre}</option>`; });
    let optsBilleteras = '<option value="">Seleccionar...</option>'; EstadoApp.billeteras.forEach(b => { optsBilleteras += `<option value="${b.id}">${b.nombre}</option>`; });
    if(tipo.value === 'aporte') { origen.innerHTML = optsMedios; destino.innerHTML = optsBilleteras + '<option value="nueva" style="font-weight:600; color:var(--accent);">➕ Crear nueva billetera</option>'; } 
    else if(tipo.value === 'retiro') { origen.innerHTML = optsBilleteras; destino.innerHTML = optsMedios; } 
    else { origen.innerHTML = optsBilleteras; destino.innerHTML = optsBilleteras + '<option value="nueva" style="font-weight:600; color:var(--accent);">➕ Crear nueva billetera</option>'; }
    if (origen.querySelector(`option[value="${valO}"]`)) origen.value = valO; if (destino.querySelector(`option[value="${valD}"]`)) destino.value = valD;
}

window.setAhorroTipo = function() {
    const tipo = document.getElementById('ahorro-tipo').value; const lblOrigen = document.getElementById('lbl-origen'); const lblDestino = document.getElementById('lbl-destino');
    if(tipo === 'aporte') { lblOrigen.innerText = 'Origen (Medio de pago)'; lblDestino.innerText = 'Destino (Billetera Ahorro)'; }
    else if(tipo === 'retiro') { lblOrigen.innerText = 'Origen (Billetera Ahorro)'; lblDestino.innerText = 'Destino (Medio de pago)'; }
    else { lblOrigen.innerText = 'Origen (Billetera Ahorro)'; lblDestino.innerText = 'Destino (Billetera Ahorro)'; }
    actualizarSelectsAhorro();
}

window.toggleUsdAhorroFields = function() {
    const chkUsd = document.getElementById('chk-usd-ahorro');
    document.getElementById('caja-usd-ahorro').style.display = (chkUsd && chkUsd.checked) ? 'grid' : 'none';
}

window.guardarAhorro = function() {
    const tipo = document.getElementById('ahorro-tipo').value; const origenId = document.getElementById('ahorro-origen').value; const destinoId = document.getElementById('ahorro-destino').value;
    const monto = parseFloat(document.getElementById('ahorro-monto').value.replace(/\D/g, ''));
    
    const isUsd = document.getElementById('chk-usd-ahorro').checked;
    const montoUsd = isUsd ? parseFloat(document.getElementById('ahorro-monto-usd').value.replace(/\D/g, '')) || 0 : null;
    const cotizacionUsd = isUsd ? parseFloat(document.getElementById('ahorro-cotizacion').value.replace(/\D/g, '')) || 0 : null;
    
    const nota = document.getElementById('ahorro-nota').value.trim(); const fecha = document.getElementById('ahorro-fecha').value || new Date().toISOString().split('T')[0];
    
    if(!origenId || !destinoId || isNaN(monto) || monto <= 0) { showToast("Completa origen, destino y monto válido."); return; }
    if(origenId === destinoId) { showToast("Origen y destino idénticos."); return; }
    
    let montoAAplicar = isUsd && montoUsd ? montoUsd : monto; // Si es USD guarda la cantidad de USD en la billetera
    
    if(tipo === 'aporte') { let b = EstadoApp.billeteras.find(b => b.id === destinoId); if(b) b.saldo = (b.saldo || 0) + montoAAplicar; } 
    else if(tipo === 'retiro') { let b = EstadoApp.billeteras.find(b => b.id === origenId); if(b) { if((b.saldo || 0) < montoAAplicar) { showToast("Saldo insuficiente."); return; } b.saldo -= montoAAplicar; } } 
    else if(tipo === 'transferencia') { let bO = EstadoApp.billeteras.find(b => b.id === origenId); let bD = EstadoApp.billeteras.find(b => b.id === destinoId); if(bO && bD) { if((bO.saldo || 0) < montoAAplicar) { showToast("Saldo insuficiente."); return; } bO.saldo -= montoAAplicar; bD.saldo = (bD.saldo || 0) + montoAAplicar; } }

    EstadoApp.movimientos.unshift({ id: generarID('mov'), tipo: 'ahorro', subtipo: tipo, concepto: nota || `Ahorro (${tipo})`, monto: monto, isUsd: isUsd, montoUsd: montoUsd, cotizacionUsd: cotizacionUsd, nota: nota, fecha: fecha, hora: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }), origenId: origenId, destinoId: destinoId });
    guardarEstado(); renderizarTodo(); document.getElementById('ahorro-monto').value = ''; document.getElementById('ahorro-monto-usd').value = ''; document.getElementById('ahorro-cotizacion').value = ''; document.getElementById('ahorro-nota').value = ''; document.getElementById('chk-usd-ahorro').checked = false; toggleUsdAhorroFields(); showToast("Ahorro guardado.");
}

function renderBilleterasUI() {
    const emptyState = document.getElementById('ahorros-empty-billeteras'); const dataState = document.getElementById('ahorros-con-billeteras');
    const countBilleteras = document.getElementById('ahorro-billeteras-count'); const listaUI = document.getElementById('lista-billeteras-ui');
    if(countBilleteras) countBilleteras.innerText = EstadoApp.billeteras.length; let totalGlobalAhorro = 0;
    if (EstadoApp.billeteras.length === 0) { if(emptyState) emptyState.style.display = 'flex'; if(dataState) dataState.style.display = 'none'; } 
    else {
        if(emptyState) emptyState.style.display = 'none'; if(dataState) dataState.style.display = 'flex';
        if(listaUI) {
            let listaHTML = '';
            EstadoApp.billeteras.forEach(b => { totalGlobalAhorro += (b.saldo || 0); listaHTML += `<div style="display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid var(--border); padding-bottom:8px;"><div style="display:flex; align-items:center; gap:10px;"><span class="dot" style="background:${b.color};"></span><span style="font-size:14px; font-weight:600;">${b.nombre}</span></div><span style="font-weight:700; font-size:15px;">$${formatearDinero(b.saldo || 0)}</span></div>`; });
            listaUI.innerHTML = listaHTML;
        }
    }
    if(document.getElementById('ahorro-total')) document.getElementById('ahorro-total').innerText = '$' + formatearDinero(totalGlobalAhorro);
}
window.abrirModalNuevaBilletera = function() { document.getElementById('modal-nueva-billetera').style.display = 'block'; }
window.verificarNuevaBilletera = function(s) { if(s.value === 'nueva') { s.value = ""; abrirModalNuevaBilletera(); } }
window.cerrarNuevaBilletera = function() { document.getElementById('modal-nueva-billetera').style.display = 'none'; document.getElementById('nueva-bill-nombre').value = ''; }
window.guardarNuevaBilletera = function() { const nombre = document.getElementById('nueva-bill-nombre').value; const color = document.getElementById('nueva-bill-color').value; if(nombre.trim() === '') return; EstadoApp.billeteras.push({ id: generarID('bill'), nombre: nombre, color: color, saldo: 0 }); guardarEstado(); renderizarTodo(); cerrarNuevaBilletera(); showToast("Billetera guardada"); }

// ==========================================
// PRÉSTAMOS - TARJETAS UNIFICADAS, MEMORIA DE ACORDEÓN Y ARCHIVO
// ==========================================
window.filtroPrestamo = 'todos'; let prestamoAccordionAbierto = null; 

window.filtrarPrestamosUI = function(tipo, btn) { window.filtroPrestamo = tipo; document.querySelectorAll('#p-filtros .pill').forEach(b => b.classList.remove('active')); if(btn) btn.classList.add('active'); renderPrestamos(); }
window.toggleAccordion = function(contentId) { const content = document.getElementById(contentId); if (content.classList.contains('show')) { content.classList.remove('show'); prestamoAccordionAbierto = null; } else { document.querySelectorAll('.accordion-content').forEach(c => c.classList.remove('show')); content.classList.add('show'); prestamoAccordionAbierto = contentId; } }
window.setTipoPrestamo = function(tipo) { document.getElementById('p-btn-medeben').classList.remove('active'); document.getElementById('p-btn-yodebo').classList.remove('active'); if(tipo === 'medeben') { document.getElementById('p-btn-medeben').classList.add('active'); document.getElementById('btn-submit-prestamo').style.background = 'var(--green)'; } else { document.getElementById('p-btn-yodebo').classList.add('active'); document.getElementById('btn-submit-prestamo').style.background = 'var(--red)'; } }
window.calcularPrestamoInfo = function() { const monto = parseFloat(document.getElementById('pmonto').value.replace(/\D/g, '')); const cuotas = parseInt(document.getElementById('pcuotas').value); const infoText = document.getElementById('p-info-cuota'); if(monto && cuotas > 0) infoText.innerText = `Cuota estimada: $${formatearDinero((monto / cuotas).toFixed(0))}`; else infoText.innerText = ''; }

window.guardarPrestamo = function() {
    const tipo = document.getElementById('p-btn-medeben').classList.contains('active') ? 'medeben' : 'yodebo';
    const persona = document.getElementById('ppersona').value.trim(); const concepto = document.getElementById('pdesc').value.trim(); const monto = parseFloat(document.getElementById('pmonto').value.replace(/\D/g, ''));
    if(!persona || !concepto || isNaN(monto)) return;
    let cuotasCount = parseInt(document.getElementById('pcuotas').value) || 1; let cuotas = []; let cuotaMonto = monto / cuotasCount; let fechaInicio = document.getElementById('pfecha').value;
    if (document.getElementById('pcuotas').value && cuotasCount > 0) { let dInicio = new Date(fechaInicio + 'T12:00:00'); for(let i=1; i<=cuotasCount; i++) { let fVenc = new Date(dInicio); fVenc.setMonth(fVenc.getMonth() + (i-1)); cuotas.push({ numero: i, monto: cuotaMonto, vencimiento: fVenc.toISOString().split('T')[0], pagada: false }); } } 
    else { cuotas.push({ numero: 1, monto: monto, vencimiento: fechaInicio, pagada: false }); }
    EstadoApp.prestamos.push({ id: generarID('prest'), tipo: tipo, persona: persona, concepto: concepto, montoTotal: monto, cuotas: cuotas, archivado: false });
    guardarEstado(); renderizarTodo(); limpiarInputs('panel-prestamo'); document.getElementById('panel-prestamo').style.display = 'none'; showToast("Préstamo guardado");
}
window.eliminarPrestamo = function(id) { if(confirm("¿Seguro que deseas eliminar permanentemente este registro?")) { EstadoApp.prestamos = EstadoApp.prestamos.filter(p => p.id !== id); guardarEstado(); renderizarTodo(); showToast("Préstamo eliminado"); } }
window.archivarPrestamo = function(id) { let p = EstadoApp.prestamos.find(p => p.id === id); if(p) { p.archivado = !p.archivado; guardarEstado(); renderizarTodo(); showToast(p.archivado ? "Préstamo archivado" : "Préstamo restaurado"); } }

function renderPrestamos() {
    const container = document.getElementById('lista-prestamos-cards'); if(!container) return;
    if(EstadoApp.prestamos.length === 0) { container.innerHTML = `<div class="card" style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:200px; border: 1px dashed var(--text3); background:transparent;"><i data-lucide="handshake" style="width:48px; height:48px; color:var(--text3); margin-bottom:15px; stroke-width:1.5;"></i><p style="color:var(--text3); font-size:14px; font-weight:500; text-align:center;">No tienes deudas registradas.</p></div>`; return; }
    let agrupados = {}; EstadoApp.prestamos.forEach(p => { let key = p.persona.trim().toLowerCase(); if(!agrupados[key]) agrupados[key] = { nombreDisplay: p.persona, prestamos: [] }; agrupados[key].prestamos.push(p); });
    let html = '';
    for(const key in agrupados) {
        let personaDisplay = agrupados[key].nombreDisplay; let prestamosPersona = agrupados[key].prestamos; let net = 0; let htmlDetalles = ''; let countValidos = 0;
        prestamosPersona.forEach(p => {
            if (window.filtroPrestamo === 'archivados' && !p.archivado) return; if (window.filtroPrestamo !== 'archivados' && p.archivado) return; countValidos++;
            let saldoPrestamo = 0; let pagadas = 0; let cuotasHtml = ''; let isMeDeben = p.tipo === 'medeben'; let colorTextoCuota = isMeDeben ? 'var(--green)' : 'var(--text)';
            p.cuotas.forEach((c, cIndex) => { if(c.pagada) { pagadas++; } else { saldoPrestamo += c.monto; } let chk = c.pagada ? 'checked' : ''; let line = c.pagada ? 'item-completado' : ''; cuotasHtml += `<div class="li ${line}" style="padding:8px 0; border-bottom:1px dashed var(--border);"><span class="li-desc" style="font-size:13px;"><input type="checkbox" ${chk} onchange="toggleCuota('${p.id}', ${cIndex})"> Cuota ${c.numero}</span><span class="li-monto" style="font-size:13px; color:${colorTextoCuota};">$${formatearDinero(c.monto.toFixed(0))}</span></div>`; });
            if(isMeDeben) net += saldoPrestamo; else net -= saldoPrestamo;
            let badge = isMeDeben ? '<span style="background:var(--green); color:#fff; padding:2px 6px; border-radius:4px; font-size:10px;">Me debe</span>' : '<span style="background:var(--red); color:#fff; padding:2px 6px; border-radius:4px; font-size:10px;">Le debo</span>'; let archiveIcon = p.archivado ? 'refresh-cw' : 'archive';
            htmlDetalles += `<div style="background:var(--bg); padding:15px; border-radius:10px; border:1px solid var(--border); margin-bottom:10px;"><div style="display:flex; justify-content:space-between; margin-bottom:5px;"><span style="font-weight:600; font-size:14px; color:var(--text);">${p.concepto} ${badge}</span><div style="display:flex; gap:5px;"><button class="ui-icon-btn" onclick="archivarPrestamo('${p.id}')" title="Archivar/Restaurar"><i data-lucide="${archiveIcon}" class="icon-sm"></i></button><button class="ui-icon-btn" onclick="eliminarPrestamo('${p.id}')" title="Eliminar"><i data-lucide="trash-2" class="icon-sm" style="color:var(--red);"></i></button></div></div><div style="font-size:12px; color:var(--text3); margin-bottom:15px;">Total prestado: $${formatearDinero(p.montoTotal)} • Cuotas pagadas: ${pagadas}/${p.cuotas.length}</div>${cuotasHtml}</div>`;
        });
        if (countValidos === 0) continue; if (window.filtroPrestamo === 'medeben' && net <= 0) continue; if (window.filtroPrestamo === 'yodebo' && net >= 0) continue;
        let badgeTipo = net > 0 ? '<span class="badge badge-green">Me debe a mí</span>' : (net < 0 ? '<span class="badge badge-red">Yo le debo</span>' : '<span class="badge" style="border:1px solid var(--text3); color:var(--text3);">Saldado</span>'); let personaId = key.replace(/\s+/g, ''); let divClass = "accordion-content"; if (prestamoAccordionAbierto === 'det-' + personaId) divClass += " show"; 
        html += `<div class="card"><div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:15px;"><div><h3 style="font-size:18px; font-weight:700;">${personaDisplay}</h3><div style="display:flex; gap:8px; margin-top:8px;">${badgeTipo}</div></div><div style="text-align:right;"><p style="font-size:11px; color:var(--text3); font-weight:700; text-transform:uppercase;">Saldo Neto</p><p style="font-size:22px; font-weight:800; color:${net > 0 ? 'var(--green)' : (net < 0 ? 'var(--red)' : 'var(--text3)')}; letter-spacing:-1px;">$${formatearDinero(Math.abs(net))}</p></div></div><div style="border-top:1px solid var(--border); padding-top:15px;"><button onclick="toggleAccordion('det-${personaId}')" style="background:transparent; border:none; color:var(--text2); font-size:13px; font-weight:600; cursor:pointer;">Ver detalles de los registros <i data-lucide="chevron-down" class="icon-sm" style="vertical-align:middle;"></i></button><div id="det-${personaId}" class="${divClass}">${htmlDetalles}</div></div></div>`;
    }
    container.innerHTML = html || `<p style="color:var(--text3); font-size:13px; text-align:center;">No hay registros para este filtro.</p>`;
}
window.toggleCuota = function(pId, cIndex) { let prestamo = EstadoApp.prestamos.find(p => p.id === pId); if(prestamo) { prestamo.cuotas[cIndex].pagada = !prestamo.cuotas[cIndex].pagada; guardarEstado(); renderizarTodo(); } }

// ==========================================
// FUNCIONES UI COMPLEMENTARIAS
// ==========================================
function logout() { document.getElementById('app').style.display = 'none'; document.getElementById('auth-screen').style.display = 'flex'; }
function sp(id, btn) { document.querySelectorAll('.page').forEach(p => p.classList.remove('active')); document.querySelectorAll('.nb').forEach(b => b.classList.remove('active')); document.getElementById('page-' + id).classList.add('active'); if(btn) btn.classList.add('active'); if (typeof lucide !== 'undefined') lucide.createIcons(); }
function togglePanel(panelId) { const panel = document.getElementById(panelId); panel.style.display = panel.style.display === 'block' ? 'none' : 'block'; }
function fmtI(input) { let val = input.value.replace(/\D/g, ''); if(val === '') { input.value = ''; return; } input.value = new Intl.NumberFormat('es-AR').format(val); }
function formatearDinero(val) { return new Intl.NumberFormat('es-AR').format(val); }
function formatearFecha(dateStr) { if(!dateStr) return ''; const partes = dateStr.split('-'); return `${partes[2]}/${partes[1]}/${partes[0]}`; }

function limpiarInputs(contenedorId) {
    const contenedor = document.getElementById(contenedorId); if (!contenedor) return;
    contenedor.querySelectorAll('input[type="text"], input[type="number"]').forEach(el => el.value = ''); contenedor.querySelectorAll('select').forEach(el => el.value = ''); contenedor.querySelectorAll('input[type="checkbox"]').forEach(el => el.checked = false);
    const fechaHoyString = new Date().toISOString().split('T')[0]; contenedor.querySelectorAll('input[type="date"], .input-fecha').forEach(el => el.value = fechaHoyString);
    if(document.getElementById('g-info-cuota')) document.getElementById('g-info-cuota').innerHTML = '';
    const usdCaja = document.getElementById('caja-usd'); if(usdCaja) usdCaja.style.display = 'none';
}

function showToast(msg) { const t = document.getElementById('toast'); t.innerText = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 3000); }

function setTipoMov(tipo) {
    document.getElementById('btg').classList.remove('active'); document.getElementById('bti').classList.remove('active');
    const btnAgregar = document.getElementById('btnagregar'); const chkCompartido = document.getElementById('chk-compartido'); limpiarInputs('panel-registro'); toggleCompartido();
    if(tipo === 'gasto') { document.getElementById('btg').classList.add('active'); document.getElementById('campos-gasto').style.display = 'block'; document.getElementById('campos-ingreso').style.display = 'none'; btnAgregar.style.background = 'var(--red)'; if (chkCompartido) chkCompartido.classList.add('check-rojo'); } 
    else { document.getElementById('bti').classList.add('active'); document.getElementById('campos-gasto').style.display = 'none'; document.getElementById('campos-ingreso').style.display = 'block'; btnAgregar.style.background = 'var(--green)'; if (chkCompartido) chkCompartido.classList.remove('check-rojo'); }
}

function toggleCompartido() { const checkEl = document.getElementById('chk-compartido'); document.getElementById('caja-compartido').style.display = (checkEl && checkEl.checked) ? 'block' : 'none'; window.calcularCuotaInfoGasto(); }

function toggleTheme(forceLight = false) {
    const body = document.body; const isLight = forceLight || body.getAttribute('data-theme') !== 'light';
    if (isLight) { body.setAttribute('data-theme', 'light'); document.getElementById('icon-dark').style.display = 'none'; document.getElementById('icon-light').style.display = 'inline-block'; document.getElementById('icon-dark-m').style.display = 'none'; document.getElementById('icon-light-m').style.display = 'inline-block'; localStorage.setItem('theme', 'light'); } 
    else { body.removeAttribute('data-theme'); document.getElementById('icon-dark').style.display = 'inline-block'; document.getElementById('icon-light').style.display = 'none'; document.getElementById('icon-dark-m').style.display = 'inline-block'; document.getElementById('icon-light-m').style.display = 'none'; localStorage.setItem('theme', 'dark'); }
}
function togglePwd() { const pwd = document.getElementById('a-pwd'); pwd.type = pwd.type === 'password' ? 'text' : 'password'; }
function doAuth() { document.getElementById('auth-screen').style.display = 'none'; document.getElementById('app').style.display = 'flex'; }
window.exportarResumenPDF = function() { showToast("Generando Informe..."); }
window.exportarHistorial = function(formato) { showToast(`Generando ${formato.toUpperCase()}...`); }
