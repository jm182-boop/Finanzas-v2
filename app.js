// ==========================================
// app.js - MOTOR UI, AHORROS, PRÉSTAMOS E HISTORIAL (100% LIMPIO - SIN DATOS FALSOS)
// ==========================================

let misBilleteras = []; 
let misPrestamos = [];
let historialGlobal = []; // Array de Base de Datos inicializado VACÍO

// Conjunto de Iconos Lineales en SVG para inyectar en las plantillas JS
const svgIcon = {
    tipo: '<svg class="icon-svg" viewBox="0 0 24 24"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>',
    estado: '<svg class="icon-svg" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
    grupo: '<svg class="icon-svg" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>',
    destino: '<svg class="icon-svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>',
    medio: '<svg class="icon-svg" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>',
    persona: '<svg class="icon-svg" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
    porcentaje: '<svg class="icon-svg" viewBox="0 0 24 24"><line x1="19" y1="5" x2="5" y2="19"></line><circle cx="6.5" cy="6.5" r="2.5"></circle><circle cx="17.5" cy="17.5" r="2.5"></circle></svg>',
    billetera: '<svg class="icon-svg" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>',
    cuotas: '<svg class="icon-svg" viewBox="0 0 24 24"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>'
};

document.addEventListener('DOMContentLoaded', () => {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const hoy = new Date();
    document.getElementById('mlabel').innerText = `${meses[hoy.getMonth()]} ${hoy.getFullYear()}`;

    const fechaHoyString = hoy.toISOString().split('T')[0];
    document.querySelectorAll('input[type="date"], .input-fecha').forEach(input => {
        if (!input.value) input.value = fechaHoyString;
    });

    if(localStorage.getItem('theme') === 'light') toggleTheme(true);

    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    document.getElementById('uemail').innerText = 'gysusran@gmail.com';

    renderBilleterasUI();
    renderPrestamos();
    filtrarHistorial(); // Inicia el renderizado del historial vacío

    const slNec = document.getElementById('sl-nec');
    const slDes = document.getElementById('sl-des');
    const lblNec = document.getElementById('lbl-nec');
    const lblDes = document.getElementById('lbl-des');
    const lblAho = document.getElementById('lbl-aho');

    function updateRegla() {
        let n = parseInt(slNec.value);
        let d = parseInt(slDes.value);
        if (n + d > 100) { d = 100 - n; slDes.value = d; }
        let a = 100 - (n + d); 
        lblNec.innerText = `${n}%`;
        lblDes.innerText = `${d}%`;
        lblAho.innerText = `${a}%`;
    }
    if(slNec) slNec.addEventListener('input', updateRegla);
    if(slDes) slDes.addEventListener('input', updateRegla);
});

function logout() {
    document.getElementById('app').style.display = 'none';
    document.getElementById('auth-screen').style.display = 'flex';
}

function sp(id, btn) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nb').forEach(b => b.classList.remove('active'));
    document.getElementById('page-' + id).classList.add('active');
    if(btn) btn.classList.add('active');
}

function togglePanel(panelId) {
    const panel = document.getElementById(panelId);
    panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
}

function toggleAccordion(contentId, iconId) {
    const content = document.getElementById(contentId);
    const icon = document.getElementById(iconId);
    if (content.classList.contains('show')) {
        content.classList.remove('show');
        if(icon) icon.classList.remove('open');
    } else {
        content.classList.add('show');
        if(icon) icon.classList.add('open');
    }
}

function fmtI(input) {
    let val = input.value.replace(/\D/g, '');
    if(val === '') { input.value = ''; return; }
    input.value = new Intl.NumberFormat('es-AR').format(val);
}

function formatearDinero(val) {
    return new Intl.NumberFormat('es-AR').format(val);
}

function formatearFecha(dateStr) {
    if(!dateStr) return '';
    const partes = dateStr.split('-');
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function limpiarInputs(contenedorId) {
    const contenedor = document.getElementById(contenedorId);
    if (contenedor) {
        contenedor.querySelectorAll('input[type="text"], input[type="number"]').forEach(el => el.value = '');
    }
}

function showToast(msg) {
    const t = document.getElementById('toast');
    t.innerText = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

// MOVIMIENTOS FORM
function setTipoMov(tipo) {
    document.getElementById('btg').classList.remove('active');
    document.getElementById('bti').classList.remove('active');
    const btnAgregar = document.getElementById('btnagregar');
    const chkCompartido = document.getElementById('chk-compartido');
    limpiarInputs('panel-registro'); 
    
    if(tipo === 'gasto') {
        document.getElementById('btg').classList.add('active');
        document.getElementById('campos-gasto').style.display = 'block';
        document.getElementById('campos-ingreso').style.display = 'none';
        btnAgregar.style.background = 'var(--red)';
        if (chkCompartido) chkCompartido.classList.add('check-rojo');
    } else {
        document.getElementById('bti').classList.add('active');
        document.getElementById('campos-gasto').style.display = 'none';
        document.getElementById('campos-ingreso').style.display = 'block';
        btnAgregar.style.background = 'var(--green)';
        if (chkCompartido) chkCompartido.classList.remove('check-rojo');
    }
}

function toggleCompartido() {
    const isChecked = document.getElementById('chk-compartido').checked;
    document.getElementById('caja-compartido').style.display = isChecked ? 'block' : 'none';
}

// ==========================================
// MOTOR HISTORIAL: PLANTILLAS, FILTROS Y ESTADOS VACÍOS
// ==========================================
window.filtrarHistorial = function() {
    const search = document.getElementById('h-busqueda').value.toLowerCase();
    const mes = document.getElementById('h-mes').value;
    const anio = document.getElementById('h-anio').value;
    const tipo = document.getElementById('h-tipo').value;
    const medio = document.getElementById('h-medio').value;
    const destino = document.getElementById('h-destino').value;
    const persona = document.getElementById('h-persona').value;
    const estado = document.getElementById('h-estado').value;

    let filtrados = historialGlobal.filter(h => {
        let txtInfo = `${h.desc} ${h.medio} ${h.destino} ${h.tipo} ${h.estado}`.toLowerCase();
        if(h.prestamo) txtInfo += ` ${h.prestamo.persona}`;
        if(h.compartido) txtInfo += ` ${h.compartido.persona}`;
        if(h.ahorro) txtInfo += ` ${h.ahorro.origen} ${h.ahorro.destino}`;
        if(search && !txtInfo.includes(search)) return false;

        if(mes && h.fecha.split('-')[1] !== mes) return false;
        if(anio && h.fecha.split('-')[0] !== anio) return false;
        if(tipo && h.tipo !== tipo) return false;
        if(medio && h.medio !== medio && (!h.ahorro || h.ahorro.origen !== medio)) return false;
        if(destino && h.destino !== destino && (!h.ahorro || h.ahorro.destino !== destino)) return false;
        if(estado && h.estado !== estado) return false;
        
        if(persona) {
            let matchesPersona = false;
            if(h.prestamo && h.prestamo.persona === persona) matchesPersona = true;
            if(h.compartido && h.compartido.persona === persona) matchesPersona = true;
            if(!matchesPersona) return false;
        }

        return true;
    });

    renderHistorialGlobal(filtrados);
}

function renderHistorialGlobal(data) {
    const container = document.getElementById('lista-historial-global');
    if(!container) return;

    let html = '';
    let tIngresos = 0; let tGastos = 0; let tAhorros = 0;

    data.forEach(h => {
        if(h.tipo === 'ingreso') tIngresos += h.monto;
        if(h.tipo === 'gasto' || h.tipo === 'compartido') tGastos += h.monto;
        if(h.tipo === 'ahorro') tAhorros += h.monto;

        let colorMonto = 'var(--text)'; let prefijo = '';
        if(h.tipo === 'gasto' || h.tipo === 'compartido') { colorMonto = 'var(--red)'; prefijo = '-'; }
        if(h.tipo === 'ingreso') { colorMonto = 'var(--green)'; prefijo = '+'; }
        if(h.tipo === 'ahorro') { colorMonto = 'var(--blue)'; prefijo = '+'; }

        let badgeEstado = '';
        if(h.estado === 'pagado') badgeEstado = `<span class="badge badge-green" style="background:transparent; border:1px solid var(--green); color:var(--green);">${svgIcon.estado} Pagado</span>`;
        else if(h.estado === 'pendiente') badgeEstado = `<span class="badge badge-warning">${svgIcon.estado} Pendiente</span>`;
        else if(h.estado === 'proximo') badgeEstado = `<span class="badge badge-warning" style="background:var(--warning); color:#141416;">${svgIcon.estado} Próximo a vencer</span>`;
        else if(h.estado === 'vencido') badgeEstado = `<span class="badge badge-darkred">${svgIcon.estado} Vencido</span>`;
        else if(h.estado === 'finalizado') badgeEstado = `<span class="badge badge-gray">${svgIcon.estado} Finalizado</span>`;

        let detallesHtml = `
            <div style="font-size:13px; color:var(--text2); display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:15px; padding-bottom:15px; border-bottom:1px solid var(--border);">
               <div style="display:flex; align-items:center; gap:5px;">${svgIcon.tipo} <span style="color:var(--text3);">Tipo:</span> <span style="text-transform:capitalize; color:var(--text);">${h.tipo}</span></div>
               <div style="display:flex; align-items:center; gap:5px;">${svgIcon.estado} <span style="color:var(--text3);">Estado:</span> <span style="text-transform:capitalize; color:var(--text);">${h.estado}</span></div>
            </div>`;

        if(h.gastoDetalle) {
            let pct = (h.gastoDetalle.gastado / h.gastoDetalle.presupuesto) * 100;
            if(pct > 100) pct = 100;
            detallesHtml += `
            <div style="background:var(--bg); padding:15px; border-radius:8px; border:1px solid var(--border); margin-bottom:10px;">
                <div style="display:flex; justify-content:space-between; font-size:13px; color:var(--text2); margin-bottom:8px;"><div style="display:flex; align-items:center; gap:5px;">${svgIcon.medio} <span>Medio de pago:</span></div> <span style="color:var(--text); font-weight:600;">${h.medio}</span></div>
                <div style="display:flex; justify-content:space-between; font-size:13px; color:var(--text2); margin-bottom:8px;"><div style="display:flex; align-items:center; gap:5px;">${svgIcon.grupo} <span>Grupo:</span></div> <span style="color:var(--text); font-weight:600;">${h.gastoDetalle.categoria}</span></div>
                <div style="display:flex; justify-content:space-between; font-size:13px; color:var(--text2); margin-bottom:15px;"><div style="display:flex; align-items:center; gap:5px;">${svgIcon.destino} <span>Destino:</span></div> <span style="color:var(--text); font-weight:600;">${h.destino}</span></div>
                
                <div class="progress-wrap" style="margin-bottom:0;">
                    <div class="progress-header"><span>Presupuesto: $${formatearDinero(h.gastoDetalle.presupuesto)}</span><span>Disponible: $${formatearDinero(h.gastoDetalle.disponible)}</span></div>
                    <div class="progress-bar" style="height:6px; background:var(--bg2);"><div class="progress-fill" style="width: ${pct}%; background: var(--accent);"></div></div>
                    <div style="font-size:11px; color:var(--text3); margin-top:6px; text-align:right;">Gastado: $${formatearDinero(h.gastoDetalle.gastado)}</div>
                </div>
            </div>`;
        }

        if(h.compartido) {
            detallesHtml += `
            <div style="background:var(--bg); padding:15px; border-radius:8px; border:1px dashed var(--border); margin-bottom:10px;">
                <div style="font-size:11px; color:var(--warning); font-weight:700; text-transform:uppercase; margin-bottom:10px;">Gasto Compartido</div>
                <div style="display:flex; justify-content:space-between; font-size:13px; color:var(--text2); margin-bottom:8px;"><div style="display:flex; align-items:center; gap:5px;">${svgIcon.persona} <span>Persona asociada:</span></div> <span style="color:var(--text); font-weight:600;">${h.compartido.persona}</span></div>
                <div style="display:flex; justify-content:space-between; font-size:13px; color:var(--text2); margin-bottom:8px;"><div style="display:flex; align-items:center; gap:5px;">${svgIcon.porcentaje} <span>Porcentaje asignado:</span></div> <span style="color:var(--text); font-weight:600;">${h.compartido.pct}%</span></div>
                <div style="display:flex; justify-content:space-between; font-size:13px; color:var(--text2); margin-bottom:8px;"><span>Monto total del gasto:</span> <span style="color:var(--text); font-weight:600;">$${formatearDinero(h.monto)}</span></div>
                <div style="display:flex; justify-content:space-between; font-size:13px; color:var(--text2); border-top:1px solid var(--border); padding-top:8px;"><span>Monto pendiente:</span> <span style="color:var(--warning); font-weight:700;">$${formatearDinero(h.compartido.montoPendiente)}</span></div>
            </div>`;
        }

        if(h.ahorro) {
            detallesHtml += `
            <div style="background:var(--bg); padding:15px; border-radius:8px; border:1px solid var(--border); margin-bottom:10px;">
                <div style="display:flex; justify-content:space-between; font-size:13px; color:var(--text2); margin-bottom:8px;"><div style="display:flex; align-items:center; gap:5px;">${svgIcon.medio} <span>Origen del dinero:</span></div> <span style="color:var(--text); font-weight:600;">${h.ahorro.origen}</span></div>
                <div style="display:flex; justify-content:space-between; font-size:13px; color:var(--text2); margin-bottom:8px;"><div style="display:flex; align-items:center; gap:5px;">${svgIcon.billetera} <span>Destino del dinero:</span></div> <div style="display:flex; align-items:center; gap:5px;"><span class="dot" style="background:${h.ahorro.color};"></span><span style="color:var(--text); font-weight:600;">${h.ahorro.destino}</span></div></div>
                <div style="display:flex; justify-content:space-between; font-size:13px; color:var(--text2); border-top:1px solid var(--border); padding-top:8px;"><span>Monto transferido:</span> <span style="color:var(--blue); font-weight:700;">$${formatearDinero(h.monto)}</span></div>
            </div>`;
        }

        if(h.prestamo) {
            detallesHtml += `
            <div style="background:var(--bg); padding:15px; border-radius:8px; border:1px solid var(--border); margin-bottom:10px;">
                <div style="display:flex; justify-content:space-between; font-size:13px; color:var(--text2); margin-bottom:8px;"><div style="display:flex; align-items:center; gap:5px;">${svgIcon.persona} <span>Persona asociada:</span></div> <span style="color:var(--text); font-weight:600;">${h.prestamo.persona}</span></div>
                <div style="display:flex; justify-content:space-between; font-size:13px; color:var(--text2); margin-bottom:8px;"><div style="display:flex; align-items:center; gap:5px;">${svgIcon.tipo} <span>Tipo de préstamo:</span></div> <span style="color:var(--text); font-weight:600;">${h.prestamo.tipo}</span></div>
                <div style="display:flex; justify-content:space-between; font-size:13px; color:var(--text2); margin-bottom:8px;"><span>Monto original:</span> <span style="color:var(--text); font-weight:600;">$${formatearDinero(h.prestamo.original)}</span></div>
                <div style="display:flex; justify-content:space-between; font-size:13px; color:var(--text2); margin-bottom:12px;"><span>Saldo pendiente:</span> <span style="color:var(--text); font-weight:600;">$${formatearDinero(h.prestamo.pendiente)}</span></div>
                <div style="display:flex; justify-content:space-between; font-size:13px; color:var(--text2); border-top:1px solid var(--border); padding-top:8px; margin-bottom:8px;"><div style="display:flex; align-items:center; gap:5px;">${svgIcon.cuotas} <span>Cantidad de cuotas:</span></div> <span style="color:var(--text); font-weight:600;">${h.prestamo.totalCuotas}</span></div>
                <div style="display:flex; justify-content:space-between; font-size:13px; color:var(--text2); margin-bottom:8px;"><span>Cuota actual:</span> <span style="color:var(--text); font-weight:600;">${h.prestamo.cuotaActual}</span></div>
                <div style="display:flex; justify-content:space-between; font-size:13px; color:var(--text2);"><span>Próximo vencimiento:</span> <span style="color:var(--text); font-weight:700;">${h.prestamo.compromiso}</span></div>
            </div>`;
        }
        
        if(h.cuotas && h.tipo === 'gasto') {
            detallesHtml += `
            <div style="background:var(--bg); padding:15px; border-radius:8px; border:1px solid var(--border); margin-bottom:10px;">
                <div style="font-size:11px; color:var(--accent); font-weight:700; text-transform:uppercase; margin-bottom:8px;"><div style="display:flex; align-items:center; gap:5px;">${svgIcon.cuotas} Financiación</div></div>
                <div style="display:flex; justify-content:space-between; font-size:13px; color:var(--text2); margin-bottom:5px;"><span>Total financiado:</span> <span style="color:var(--text); font-weight:600;">$${formatearDinero(h.cuotas.total)}</span></div>
                <div style="display:flex; justify-content:space-between; font-size:13px; color:var(--text2); margin-bottom:5px;"><span>Cantidad total de cuotas:</span> <span style="color:var(--text); font-weight:600;">${h.cuotas.cantidad}</span></div>
                <div style="display:flex; justify-content:space-between; font-size:13px; color:var(--text2); margin-bottom:5px;"><span>Cuota actual:</span> <span style="color:var(--text); font-weight:600;">${h.cuotas.actual}/${h.cuotas.cantidad}</span></div>
                <div style="display:flex; justify-content:space-between; font-size:13px; color:var(--text2);"><span>Valor de cada cuota:</span> <span style="color:var(--text); font-weight:600;">$${formatearDinero(h.cuotas.valor)}</span></div>
            </div>`;
        }

        html += `
        <div class="card" style="padding:20px 20px 15px 20px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
               <div>
                   <div style="display:flex; align-items:center; gap:10px; margin-bottom:5px;">
                      <h4 style="font-size:15px; font-weight:700; margin:0;">${h.desc}</h4>
                      ${badgeEstado}
                   </div>
                   <p style="font-size:12px; color:var(--text3); margin:0;">${formatearFecha(h.fecha)} - ${h.hora}</p>
               </div>
               <div style="text-align:right;">
                   <span style="font-size:16px; font-weight:800; color:${colorMonto}; display:block;">${prefijo}$${formatearDinero(h.monto)}</span>
               </div>
            </div>
            
            <div style="border-top: 1px solid var(--border); margin-top: 15px; padding-top: 10px;">
                <button onclick="toggleAccordion('hist-det-${h.id}', 'hist-icon-${h.id}')" style="background:transparent; border:none; color:var(--accent); font-size:12px; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:5px; padding:0;">
                    Ver detalle completo 
                    <svg id="hist-icon-${h.id}" class="icon-chevron" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </button>
                <div id="hist-det-${h.id}" class="accordion-content">
                    ${detallesHtml}
                </div>
            </div>
        </div>`;
    });

    if(html === '') {
        html = `
        <div class="card" style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:200px; border-style:dashed;">
             <svg viewBox="0 0 24 24" width="40" height="40" stroke="var(--text3)" fill="none" stroke-width="1.5" style="margin-bottom:15px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
             <p style="color:var(--text3); font-size:14px; font-weight:500; text-align:center;">Aún no hay movimientos registrados<br>con estos filtros.</p>
        </div>`;
    }
    container.innerHTML = html;

    // Actualizar Resumen Rápido
    document.getElementById('h-count').innerText = data.length;
    document.getElementById('h-in').innerText = `$${formatearDinero(tIngresos)}`;
    document.getElementById('h-out').innerText = `$${formatearDinero(tGastos)}`;
    document.getElementById('h-aho').innerText = `$${formatearDinero(tAhorros)}`;
}

window.exportarHistorial = function(formato) {
    showToast(`Generando exportación filtrada en ${formato.toUpperCase()}...`);
    if(formato === 'pdf') {
        setTimeout(() => {
            const element = document.getElementById('lista-historial-global');
            html2pdf().from(element).save('Historial_Auditoria.pdf');
        }, 800);
    }
}

// AHORROS
function setAhorroTipo() {
    const tipo = document.getElementById('ahorro-tipo').value;
    const lblOrigen = document.getElementById('lbl-origen');
    const lblDestino = document.getElementById('lbl-destino');
    if(tipo === 'aporte') { lblOrigen.innerText = 'Origen (Medio de pago)'; lblDestino.innerText = 'Destino (Billetera Ahorro)'; }
    else if(tipo === 'retiro') { lblOrigen.innerText = 'Origen (Billetera Ahorro)'; lblDestino.innerText = 'Destino (Medio de pago)'; }
    else { lblOrigen.innerText = 'Origen (Billetera Ahorro)'; lblDestino.innerText = 'Destino (Billetera Ahorro)'; }
}

function renderBilleterasUI() {
    const emptyState = document.getElementById('ahorros-empty-billeteras');
    const dataState = document.getElementById('ahorros-con-billeteras');
    const selectDestino = document.getElementById('ahorro-destino');
    const listaUI = document.getElementById('lista-billeteras-ui');
    const countBilleteras = document.getElementById('ahorro-billeteras-count');
    
    if(countBilleteras) countBilleteras.innerText = misBilleteras.length;

    if (misBilleteras.length === 0) {
        if(emptyState) emptyState.style.display = 'flex';
        if(dataState) dataState.style.display = 'none';
        if(selectDestino) selectDestino.innerHTML = '<option value="" disabled selected>Primero crea una billetera de ahorro</option>';
    } else {
        if(emptyState) emptyState.style.display = 'none';
        if(dataState) dataState.style.display = 'flex';
        if(selectDestino) {
            let opcionesHTML = '<option value="" selected>Seleccionar...</option>';
            misBilleteras.forEach(b => { opcionesHTML += `<option value="${b.id}">${b.nombre}</option>`; });
            opcionesHTML += '<option value="nueva" style="font-weight:600; color:var(--accent);">➕ Crear nueva billetera</option>';
            selectDestino.innerHTML = opcionesHTML;
        }
        if(listaUI) {
            let listaHTML = '';
            misBilleteras.forEach(b => {
                listaHTML += `<div style="display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid var(--border); padding-bottom:8px;"><div style="display:flex; align-items:center; gap:10px;"><span class="dot" style="background:${b.color};"></span><span style="font-size:14px; font-weight:600;">${b.nombre}</span></div><div style="display:flex; align-items:center; gap:15px;"><span style="font-weight:700; font-size:15px;">$0</span><div style="display:flex; gap:5px;"><button class="ui-icon-btn"><svg viewBox="0 0 24 24"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg></button><button class="ui-icon-btn"><svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button></div></div></div>`;
            });
            listaUI.innerHTML = listaHTML;
        }
    }
}

function abrirModalNuevaBilletera() { document.getElementById('modal-nueva-billetera').style.display = 'block'; }
function verificarNuevaBilletera(selectObj) { if(selectObj.value === 'nueva') { selectObj.value = ""; abrirModalNuevaBilletera(); } }
function cerrarNuevaBilletera() { document.getElementById('modal-nueva-billetera').style.display = 'none'; document.getElementById('nueva-bill-nombre').value = ''; }

function guardarNuevaBilletera() {
    const nombre = document.getElementById('nueva-bill-nombre').value;
    const color = document.getElementById('nueva-bill-color').value;
    if(nombre.trim() === '') return;
    misBilleteras.push({ id: 'b_' + Date.now(), nombre: nombre, color: color });
    cerrarNuevaBilletera();
    renderBilleterasUI(); 
    showToast("Billetera creada");
}

// PRÉSTAMOS
function setTipoPrestamo(tipo) {
    const btnMedeben = document.getElementById('p-btn-medeben');
    const btnYodebo = document.getElementById('p-btn-yodebo');
    const btnSubmit = document.getElementById('btn-submit-prestamo');
    btnMedeben.classList.remove('active');
    btnYodebo.classList.remove('active');
    if(tipo === 'medeben') { btnMedeben.classList.add('active'); btnSubmit.style.background = 'var(--green)'; }
    else { btnYodebo.classList.add('active'); btnSubmit.style.background = 'var(--red)'; }
}

window.calcularPrestamoInfo = function() {
    const montoStr = document.getElementById('pmonto').value.replace(/\D/g, '');
    const cuotasStr = document.getElementById('pcuotas').value;
    const fechaInicioStr = document.getElementById('pfecha').value;
    const infoText = document.getElementById('p-info-cuota');
    const fechaFinInput = document.getElementById('pfechacompromiso');
    const helperText = document.getElementById('p-helper-fecha');

    if(montoStr && cuotasStr && parseInt(cuotasStr) > 0) {
        let monto = parseFloat(montoStr);
        let cuotas = parseInt(cuotasStr);
        let cuotaEstimada = monto / cuotas;
        infoText.innerText = `Cuota estimada: $${formatearDinero(cuotaEstimada.toFixed(0))}`;

        if(fechaInicioStr) {
            let d = new Date(fechaInicioStr + 'T12:00:00');
            d.setMonth(d.getMonth() + (cuotas - 1)); 
            fechaFinInput.value = d.toISOString().split('T')[0];
            helperText.style.display = 'block';
        }
    } else {
        infoText.innerText = '';
        helperText.style.display = 'none';
    }
}

function guardarPrestamo() {
    const tipo = document.getElementById('p-btn-medeben').classList.contains('active') ? 'medeben' : 'yodebo';
    const persona = document.getElementById('ppersona').value.trim();
    const concepto = document.getElementById('pdesc').value.trim();
    const monto = parseFloat(document.getElementById('pmonto').value.replace(/\D/g, ''));
    const cuotasCount = parseInt(document.getElementById('pcuotas').value) || 1;
    const cuotaActual = parseInt(document.getElementById('pcuota-actual').value) || 0;
    const fechaInicio = document.getElementById('pfecha').value;
    const fechaFin = document.getElementById('pfechacompromiso').value;

    if(!persona || !concepto || isNaN(monto)) return;

    let cuotas = [];
    let cuotaMonto = monto / cuotasCount;
    let cuotasInputStr = document.getElementById('pcuotas').value;

    if (cuotasInputStr && cuotasCount > 0) {
        let dInicio = new Date(fechaInicio + 'T12:00:00');
        for(let i=1; i<=cuotasCount; i++) {
            let fVenc = new Date(dInicio);
            fVenc.setMonth(fVenc.getMonth() + (i-1));
            cuotas.push({ numero: i, monto: cuotaMonto, vencimiento: fVenc.toISOString().split('T')[0], pagada: i <= cuotaActual });
        }
    } else {
        cuotas.push({ numero: 1, monto: monto, vencimiento: fechaFin || fechaInicio, pagada: cuotaActual > 0 });
    }

    misPrestamos.push({ id: 'prest_' + Date.now(), tipo: tipo, persona: persona, concepto: concepto, montoTotal: monto, cuotas: cuotas });
    
    limpiarInputs('panel-prestamo');
    document.getElementById('panel-prestamo').style.display = 'none';
    renderPrestamos();
}

function renderPrestamos() {
    let agrupados = {};
    misPrestamos.forEach(p => {
        if(!agrupados[p.persona]) agrupados[p.persona] = [];
        agrupados[p.persona].push(p);
    });

    let html = '';
    for(const persona in agrupados) {
        let prestamosPersona = agrupados[persona];
        let net = 0; let vencidos = 0; let proximos = 0;

        let htmlDetalles = '';
        prestamosPersona.forEach(p => {
            let saldoPrestamo = 0; let pagadas = 0; let totalC = p.cuotas.length; let cuotasHtml = '';

            p.cuotas.forEach((c, cIndex) => {
                if(c.pagada) { pagadas++; } else {
                    saldoPrestamo += c.monto;
                    let hoy = new Date();
                    let fv = new Date(c.vencimiento + 'T12:00:00');
                    let diffDays = Math.ceil((fv - hoy) / (1000 * 3600 * 24));
                    if(diffDays < 0) vencidos++; else if(diffDays <= 7) proximos++;
                }

                let pagadaAttr = c.pagada ? 'checked' : '';
                let claseTachado = c.pagada ? 'item-completado' : '';
                cuotasHtml += `<div class="li ${claseTachado}" style="padding: 8px 0; border-bottom: 1px dashed var(--border);"><span class="li-desc" style="font-size:13px;"><input type="checkbox" ${pagadaAttr} onchange="toggleCuota('${p.id}', ${cIndex})"> Cuota ${c.numero} - ${formatearFecha(c.vencimiento)}</span><span class="li-monto" style="font-size:13px;">$${formatearDinero(c.monto.toFixed(0))}</span></div>`;
            });

            if(p.tipo === 'medeben') net += saldoPrestamo; else net -= saldoPrestamo;

            htmlDetalles += `
                <div style="background:var(--bg); padding:15px; border-radius:10px; border:1px solid var(--border); margin-bottom:10px;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:5px;"><span style="font-weight:600; font-size:14px; color:var(--text);">${p.concepto}</span><span style="font-size:12px; color:var(--text3);">Total: $${formatearDinero(p.montoTotal)}</span></div>
                    <div style="font-size:12px; color:var(--text2); margin-bottom:15px;">Cuotas pagadas: ${pagadas}/${totalC}</div>
                    ${cuotasHtml}
                </div>`;
        });

        let saldoMostrar = Math.abs(net);
        let badgeTipo = net >= 0 ? '<span class="badge badge-green">Me deben</span>' : '<span class="badge badge-red">Yo debo</span>';
        let estadoBadge = '<span class="badge badge-green" style="background:transparent; border:1px solid var(--green); color:var(--green);">Al día</span>';
        if(vencidos > 0) estadoBadge = `<span class="badge badge-red">${vencidos} vencida(s)</span>`;
        else if(proximos > 0) estadoBadge = `<span class="badge badge-warning">Próxima cercana</span>`;

        let personaId = persona.replace(/\s+/g, '');
        html += `
            <div class="card">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:15px;">
                    <div><h3 style="font-size: 18px; font-weight: 700;">${persona}</h3><div style="display:flex; gap:8px; margin-top:8px;">${badgeTipo} ${estadoBadge}</div></div>
                    <div style="text-align: right;"><p style="font-size: 11px; color: var(--text3); font-weight: 700; text-transform: uppercase;">Saldo Pendiente</p><p style="font-size: 22px; font-weight: 800; color: ${net >= 0 ? 'var(--green)' : 'var(--red)'}; letter-spacing:-1px;">$${formatearDinero(saldoMostrar)}</p></div>
                </div>
                <div style="border-top: 1px solid var(--border); padding-top: 15px;">
                    <button onclick="toggleAccordion('det-${personaId}', 'icon-${personaId}')" style="background:transparent; border:none; color:var(--text2); font-size:13px; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:8px;">Ver detalle (${prestamosPersona.length} préstamo${prestamosPersona.length > 1 ? 's' : ''})<svg id="icon-${personaId}" class="icon-chevron" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><polyline points="6 9 12 15 18 9"></polyline></svg></button>
                    <div id="det-${personaId}" class="accordion-content">${htmlDetalles}</div>
                </div>
            </div>`;
    }

    let acordeonesAbiertos = [];
    document.querySelectorAll('#lista-prestamos-cards .accordion-content.show').forEach(acc => { acordeonesAbiertos.push(acc.id); });

    if(html === '') html = `<div class="card" style="display:flex; align-items:center; justify-content:center; height:120px; border-style:dashed;"><p style="color:var(--text3); font-size:14px; font-weight:500;">No tienes préstamos registrados.</p></div>`;
    document.getElementById('lista-prestamos-cards').innerHTML = html;

    acordeonesAbiertos.forEach(id => {
        const content = document.getElementById(id);
        if (content) { content.classList.add('show'); const icon = document.getElementById(id.replace('det-', 'icon-')); if (icon) icon.classList.add('open'); }
    });
    actualizarAlertasGlobales();
}

window.toggleCuota = function(pId, cIndex) { let prestamo = misPrestamos.find(p => p.id === pId); if(prestamo) { prestamo.cuotas[cIndex].pagada = !prestamo.cuotas[cIndex].pagada; renderPrestamos(); } }

function actualizarAlertasGlobales() {
    let alertasHTML = ''; let hoy = new Date();
    misPrestamos.forEach(p => { p.cuotas.forEach(c => { if(!c.pagada) { let fv = new Date(c.vencimiento + 'T12:00:00'); let diffDays = Math.ceil((fv - hoy) / (1000 * 3600 * 24)); if(diffDays < 0) alertasHTML += `<div style="display:flex; align-items:center; gap:12px; font-size:13px;"><span class="dot dot-red"></span><span style="color:var(--text); font-weight:500;">Préstamo ${p.persona}: Cuota ${c.numero} vencida hace ${Math.abs(diffDays)} días.</span></div>`; else if(diffDays <= 7) alertasHTML += `<div style="display:flex; align-items:center; gap:12px; font-size:13px;"><span class="dot dot-warning"></span><span style="color:var(--text); font-weight:500;">Préstamo ${p.persona}: Cuota ${c.numero} vence en ${diffDays} días.</span></div>`; } }); });
    const list = document.getElementById('alertas-list');
    if(list) { if(alertasHTML === '') list.innerHTML = `<div style="display:flex; align-items:center; gap:12px; font-size:13px; color:var(--text3);"><svg class="icon-svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg><span>Sin alertas activas en este periodo.</span></div>`; else list.innerHTML = alertasHTML; }
}

function toggleTheme(forceLight = false) {
    const body = document.body;
    const isLight = forceLight || body.getAttribute('data-theme') !== 'light';
    if (isLight) { body.setAttribute('data-theme', 'light'); document.getElementById('icon-dark').style.display = 'none'; document.getElementById('icon-light').style.display = 'inline'; document.querySelector('.icon-dark-m').style.display = 'none'; document.querySelector('.icon-light-m').style.display = 'inline'; localStorage.setItem('theme', 'light'); }
    else { body.removeAttribute('data-theme'); document.getElementById('icon-dark').style.display = 'inline'; document.getElementById('icon-light').style.display = 'none'; document.querySelector('.icon-dark-m').style.display = 'inline'; document.querySelector('.icon-light-m').style.display = 'none'; localStorage.setItem('theme', 'dark'); }
}

function togglePwd() { const pwd = document.getElementById('a-pwd'); pwd.type = pwd.type === 'password' ? 'text' : 'password'; }
function doAuth() { document.getElementById('auth-screen').style.display = 'none'; document.getElementById('app').style.display = 'flex'; }
