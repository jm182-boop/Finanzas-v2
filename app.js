// ==========================================
// app.js - FASE 2.1: MOTOR FINANCIERO INTEGRADO
// ==========================================

// 1. ESTADO CENTRAL (Zero Data)
let EstadoApp = {
    movimientos: [],
    billeteras: [],
    prestamos: [],
    destinos: [], 
    presupuestos: {
        necesidades: { limite: 0, gastado: 0 },
        deseos: { limite: 0, gastado: 0 }
    },
    configuracion: {
        regla: { necesidades: 50, deseos: 30, ahorro: 20 },
        moneda: 'AR',
        mediosPago: ['Efectivo', 'Naranja X', 'Mercado Pago'] 
    }
};

// 2. PERSISTENCIA Y IDs
function guardarEstado() {
    localStorage.setItem('finApp_estado', JSON.stringify(EstadoApp));
}

function cargarEstado() {
    const estadoGuardado = localStorage.getItem('finApp_estado');
    if (estadoGuardado) {
        EstadoApp = { ...EstadoApp, ...JSON.parse(estadoGuardado) };
        if (!EstadoApp.destinos) EstadoApp.destinos = [];
    }
}

function generarID(prefijo) {
    return prefijo + '_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
}

// 3. MOTOR DE RENDERIZADO GLOBAL
function renderizarTodo() {
    renderDestinosConfig();
    actualizarSelectsMovimientos();
    renderBilleterasUI();
    renderPrestamos();
    renderHistorialGlobal(EstadoApp.movimientos);
    
    // Ejecutar el motor matemático central
    recalcularMotorFinanciero();
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// ==========================================
// INICIALIZACIÓN DE LA APP
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    cargarEstado();
    
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const hoy = new Date();
    const mlabel = document.getElementById('mlabel');
    if(mlabel) mlabel.innerHTML = `<i data-lucide="layout-dashboard" class="icon-lg" style="margin-right:8px;"></i> ${meses[hoy.getMonth()]} ${hoy.getFullYear()}`;

    const fechaHoyString = hoy.toISOString().split('T')[0];
    document.querySelectorAll('input[type="date"], .input-fecha').forEach(input => {
        if (!input.value) input.value = fechaHoyString;
    });

    if(localStorage.getItem('theme') === 'light') toggleTheme(true);

    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    document.getElementById('uemail').innerText = 'usuario@finanzas.com';

    renderizarTodo();

    const slNec = document.getElementById('sl-nec');
    const slDes = document.getElementById('sl-des');
    if(slNec) slNec.addEventListener('input', updateRegla);
    if(slDes) slDes.addEventListener('input', updateRegla);
    
    if(slNec && slDes) {
        slNec.value = EstadoApp.configuracion.regla.necesidades;
        slDes.value = EstadoApp.configuracion.regla.deseos;
        updateRegla();
    }

    // CONEXIÓN DEL BOTÓN GUARDAR MOVIMIENTO
    const btnAgregarMovimiento = document.getElementById('btnagregar');
    if (btnAgregarMovimiento) {
        btnAgregarMovimiento.addEventListener('click', guardarMovimiento);
    }
});

// ==========================================
// FASE 2.1: LÓGICA DE MOVIMIENTOS
// ==========================================
function guardarMovimiento() {
    const esGasto = document.getElementById('btg').classList.contains('active');
    const tipo = esGasto ? 'gasto' : 'ingreso';
    
    const concepto = document.getElementById('gdesc').value.trim();
    const montoStr = document.getElementById('gmonto').value.replace(/\./g, '');
    const monto = parseFloat(montoStr);
    
    const medioPagoId = esGasto ? document.getElementById('gmedio').value : document.getElementById('imedio').value;
    const destinoSelect = document.querySelector('select[data-type="destino"]');
    const destinoId = esGasto && destinoSelect ? destinoSelect.value : null;
    
    const seccionCampos = esGasto ? 'campos-gasto' : 'campos-ingreso';
    const inputFecha = document.querySelector('#' + seccionCampos + ' .input-fecha');
    const fecha = inputFecha && inputFecha.value ? inputFecha.value : new Date().toISOString().split('T')[0];
    const hora = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

    if (!concepto || isNaN(monto) || monto <= 0 || !medioPagoId) {
        showToast("Por favor, completa los campos obligatorios.");
        return;
    }
    if (esGasto && !destinoId) {
        showToast("Por favor, selecciona un destino presupuestario.");
        return;
    }

    let subtipo = 'pago_unico';
    let cuotasObj = { esCuota: false, total: 1, actual: 1 };
    let compartidoObj = { esCompartido: false, persona: null, porcentaje: null };

    if (esGasto) {
        const cuotasTotal = parseInt(document.getElementById('gcuotas').value) || 0;
        const cuotaActual = parseInt(document.getElementById('gcuota-num').value) || 0;
        const chkCompartido = document.getElementById('chk-compartido');
        const isCompartido = chkCompartido ? chkCompartido.checked : false;

        if (cuotasTotal > 0) {
            subtipo = 'cuota';
            cuotasObj = { esCuota: true, total: cuotasTotal, actual: cuotaActual > 0 ? cuotaActual : 1 };
        } else if (isCompartido) {
            subtipo = 'compartido';
            compartidoObj = {
                esCompartido: true,
                persona: document.getElementById('comp-quien').value.trim(),
                porcentaje: parseFloat(document.getElementById('comp-pct').value) || 50
            };
        }
    }

    const nuevoMovimiento = {
        id: generarID('mov'),
        tipo: tipo,
        subtipo: subtipo,
        concepto: concepto,
        monto: monto,
        fecha: fecha,
        hora: hora,
        medioPagoId: medioPagoId,
        destinoId: destinoId,
        cuotas: cuotasObj,
        compartido: compartidoObj
    };

    EstadoApp.movimientos.unshift(nuevoMovimiento);
    guardarEstado();
    
    limpiarInputs('panel-registro');
    const checkCompartidoDOM = document.getElementById('chk-compartido');
    if (checkCompartidoDOM) {
        checkCompartidoDOM.checked = false;
        toggleCompartido();
    }
    document.getElementById('panel-registro').style.display = 'none';
    
    renderizarTodo();
    showToast("Movimiento registrado correctamente");
}

function recalcularMotorFinanciero() {
    let ingresos = 0;
    let gastos = 0;

    EstadoApp.movimientos.forEach(m => {
        if (m.tipo === 'ingreso') ingresos += m.monto;
        if (m.tipo === 'gasto' || m.tipo === 'compartido') gastos += m.monto;
    });

    let balance = ingresos - gastos;

    const elIn = document.getElementById('resumen-in');
    const elOut = document.getElementById('resumen-out');
    const elDisp = document.getElementById('resumen-disp');

    if (elIn) elIn.innerText = '$' + formatearDinero(ingresos);
    if (elOut) elOut.innerText = '$' + formatearDinero(gastos);
    if (elDisp) {
        elDisp.innerText = '$' + formatearDinero(balance);
        elDisp.className = balance >= 0 ? 'mv ok' : 'mv bad';
    }
}

// ==========================================
// FUNCIONES DE UI Y NAVEGACIÓN
// ==========================================
function updateRegla() {
    const slNec = document.getElementById('sl-nec');
    const slDes = document.getElementById('sl-des');
    if(!slNec || !slDes) return;
    
    let n = parseInt(slNec.value);
    let d = parseInt(slDes.value);
    if (n + d > 100) { d = 100 - n; slDes.value = d; }
    let a = 100 - (n + d); 
    
    document.getElementById('lbl-nec').innerText = `${n}%`;
    document.getElementById('lbl-des').innerText = `${d}%`;
    document.getElementById('lbl-aho').innerText = `${a}%`;
    if(document.getElementById('resumen-pct-nec')) {
        document.getElementById('resumen-pct-nec').innerText = n;
        document.getElementById('resumen-pct-des').innerText = d;
        document.getElementById('resumen-pct-aho').innerText = a;
    }
    
    EstadoApp.configuracion.regla = { necesidades: n, deseos: d, ahorro: a };
}

function logout() {
    document.getElementById('app').style.display = 'none';
    document.getElementById('auth-screen').style.display = 'flex';
}

function sp(id, btn) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nb').forEach(b => b.classList.remove('active'));
    document.getElementById('page-' + id).classList.add('active');
    if(btn) btn.classList.add('active');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function togglePanel(panelId) {
    const panel = document.getElementById(panelId);
    panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
}

function toggleAccordion(contentId, iconId) {
    const content = document.getElementById(contentId);
    if (content.classList.contains('show')) content.classList.remove('show');
    else content.classList.add('show');
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
    if (contenedor) contenedor.querySelectorAll('input[type="text"], input[type="number"]').forEach(el => el.value = '');
}

function showToast(msg) {
    const t = document.getElementById('toast');
    t.innerText = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

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

function toggleTheme(forceLight = false) {
    const body = document.body;
    const isLight = forceLight || body.getAttribute('data-theme') !== 'light';
    if (isLight) { 
        body.setAttribute('data-theme', 'light'); 
        document.getElementById('icon-dark').style.display = 'none'; 
        document.getElementById('icon-light').style.display = 'inline-block'; 
        document.getElementById('icon-dark-m').style.display = 'none'; 
        document.getElementById('icon-light-m').style.display = 'inline-block'; 
        localStorage.setItem('theme', 'light'); 
    } else { 
        body.removeAttribute('data-theme'); 
        document.getElementById('icon-dark').style.display = 'inline-block'; 
        document.getElementById('icon-light').style.display = 'none'; 
        document.getElementById('icon-dark-m').style.display = 'inline-block'; 
        document.getElementById('icon-light-m').style.display = 'none'; 
        localStorage.setItem('theme', 'dark'); 
    }
}

function togglePwd() { 
    const pwd = document.getElementById('a-pwd'); 
    pwd.type = pwd.type === 'password' ? 'text' : 'password'; 
}

function doAuth() { 
    document.getElementById('auth-screen').style.display = 'none'; 
    document.getElementById('app').style.display = 'flex'; 
}

// ==========================================
// HISTORIAL (UI)
// ==========================================
window.filtrarHistorial = function() {
    renderHistorialGlobal(EstadoApp.movimientos);
}

function renderHistorialGlobal(data) {
    const container = document.getElementById('lista-historial-global');
    if (!container) return;

    if (data.length === 0) {
        container.innerHTML = `
        <div class="card" style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:220px; border: 1px dashed var(--text3); background:transparent;">
             <i data-lucide="inbox" style="width:48px; height:48px; color:var(--text3); margin-bottom:15px; stroke-width:1.5;"></i>
             <p style="color:var(--text3); font-size:14px; font-weight:500; text-align:center;">Aún no hay movimientos registrados<br>o que coincidan con estos filtros.</p>
        </div>`;
    } else {
        let html = '';
        data.forEach(m => {
            const isGasto = m.tipo === 'gasto' || m.tipo === 'compartido';
            const colorIcono = isGasto ? 'var(--red)' : 'var(--green)';
            const colorBg = isGasto ? 'rgba(255, 87, 87, 0.1)' : 'rgba(18, 224, 145, 0.1)';
            const colorMonto = isGasto ? 'var(--text)' : 'var(--green)';
            const signo = isGasto ? '-' : '+';
            const iconoLucide = isGasto ? 'arrow-down-right' : 'arrow-up-right';
            
            let subTexto = `${formatearFecha(m.fecha)} • ${m.hora}`;
            if (m.subtipo === 'cuota') subTexto += ` • Cuota ${m.cuotas.actual}/${m.cuotas.total}`;
            if (m.subtipo === 'compartido') subTexto += ` • Con ${m.compartido.persona}`;

            html += `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:15px; background:var(--bg2); border-radius:12px; border:1px solid var(--border); margin-bottom:10px;">
                <div style="display:flex; align-items:center; gap:15px;">
                    <div style="width:42px; height:42px; border-radius:10px; background:${colorBg}; color:${colorIcono}; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                        <i data-lucide="${iconoLucide}" class="icon-md"></i>
                    </div>
                    <div>
                        <div style="font-weight:600; font-size:14px; color:var(--text); margin-bottom:2px;">${m.concepto}</div>
                        <div style="font-size:12px; color:var(--text3);">${subTexto}</div>
                    </div>
                </div>
                <div style="font-weight:700; font-size:15px; color:${colorMonto};">
                    ${signo}$${formatearDinero(m.monto)}
                </div>
            </div>`;
        });
        container.innerHTML = html;
    }
    
    let totalIn = 0, totalOut = 0;
    data.forEach(m => {
        if(m.tipo === 'ingreso') totalIn += m.monto;
        if(m.tipo === 'gasto' || m.tipo === 'compartido') totalOut += m.monto;
    });

    if(document.getElementById('h-count')) document.getElementById('h-count').innerText = data.length;
    if(document.getElementById('h-in')) document.getElementById('h-in').innerText = '$' + formatearDinero(totalIn);
    if(document.getElementById('h-out')) document.getElementById('h-out').innerText = '$' + formatearDinero(totalOut);
}

// ==========================================
// ADMINISTRADOR DE DESTINOS (CRUD)
// ==========================================
function abrirModalDestino(grupo, id = null) {
    const modal = document.getElementById('modal-destino');
    document.getElementById('dest-grupo').value = grupo;
    document.getElementById('modal-dest-titulo').innerText = id ? `Editar ${grupo}` : `Nuevo: ${grupo}`;
    
    if (id) {
        const dest = EstadoApp.destinos.find(d => d.id === id);
        document.getElementById('dest-id').value = dest.id;
        document.getElementById('dest-nombre').value = dest.nombre;
        document.getElementById('dest-presupuesto').value = formatearDinero(dest.presupuesto);
        document.getElementById('dest-activo').checked = dest.activo;
    } else {
        document.getElementById('dest-id').value = '';
        document.getElementById('dest-nombre').value = '';
        document.getElementById('dest-presupuesto').value = '';
        document.getElementById('dest-activo').checked = true;
    }
    modal.style.display = 'block';
}

function cerrarModalDestino() {
    document.getElementById('modal-destino').style.display = 'none';
}

function guardarDestino() {
    const id = document.getElementById('dest-id').value;
    const grupo = document.getElementById('dest-grupo').value;
    const nombre = document.getElementById('dest-nombre').value.trim();
    const presupuesto = parseFloat(document.getElementById('dest-presupuesto').value.replace(/\D/g, '')) || 0;
    const activo = document.getElementById('dest-activo').checked;

    if (!nombre) return;

    if (id) {
        let dest = EstadoApp.destinos.find(d => d.id === id);
        dest.nombre = nombre; dest.presupuesto = presupuesto; dest.activo = activo;
    } else {
        EstadoApp.destinos.push({
            id: generarID('dest'),
            nombre: nombre,
            grupo: grupo,
            presupuesto: presupuesto,
            activo: activo
        });
    }

    guardarEstado();
    renderizarTodo();
    cerrarModalDestino();
    showToast("Destino presupuestario guardado");
}

function renderDestinosConfig() {
    const listNec = document.getElementById('lista-destinos-nec');
    const listDes = document.getElementById('lista-destinos-des');
    const lblNec = document.getElementById('total-nec-presupuesto');
    const lblDes = document.getElementById('total-des-presupuesto');
    if(!listNec || !listDes) return;

    let htmlNec = '', htmlDes = '';
    let totalNec = 0, totalDes = 0;

    EstadoApp.destinos.forEach(d => {
        const itemHtml = `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; background:var(--bg2); border-radius:8px; border:1px solid var(--border); margin-bottom: 5px; opacity: ${d.activo ? '1' : '0.5'};">
                <div>
                    <div style="font-size:13px; font-weight:600; color:var(--text);">${d.nombre}</div>
                    <div style="font-size:11px; color:var(--text3);">$${formatearDinero(d.presupuesto)} / mes</div>
                </div>
                <button class="ui-icon-btn" onclick="abrirModalDestino('${d.grupo}', '${d.id}')"><i data-lucide="edit-2" class="icon-sm"></i></button>
            </div>
        `;
        if (d.grupo === 'Necesidades') { htmlNec += itemHtml; totalNec += d.presupuesto; } 
        else { htmlDes += itemHtml; totalDes += d.presupuesto; }
    });

    listNec.innerHTML = htmlNec || '<p style="font-size:12px; color:var(--text3); text-align:center;">Sin destinos</p>';
    listDes.innerHTML = htmlDes || '<p style="font-size:12px; color:var(--text3); text-align:center;">Sin destinos</p>';
    lblNec.innerText = `$${formatearDinero(totalNec)}`;
    lblDes.innerText = `$${formatearDinero(totalDes)}`;
}

function actualizarSelectsMovimientos() {
    const selectsDestino = document.querySelectorAll('select[data-type="destino"]'); 
    if(selectsDestino.length === 0) return;

    let opcionesHTML = '<option value="" selected>Seleccionar Destino...</option>';
    let destinosActivos = EstadoApp.destinos.filter(d => d.activo);
    
    let nec = destinosActivos.filter(d => d.grupo === 'Necesidades');
    let des = destinosActivos.filter(d => d.grupo === 'Deseos');

    if (nec.length > 0) {
        opcionesHTML += `<optgroup label="Necesidades">`;
        nec.forEach(d => opcionesHTML += `<option value="${d.id}">${d.nombre}</option>`);
        opcionesHTML += `</optgroup>`;
    }
    if (des.length > 0) {
        opcionesHTML += `<optgroup label="Deseos">`;
        des.forEach(d => opcionesHTML += `<option value="${d.id}">${d.nombre}</option>`);
        opcionesHTML += `</optgroup>`;
    }

    selectsDestino.forEach(select => {
        const val = select.value; 
        select.innerHTML = opcionesHTML;
        if(val) select.value = val; 
    });
}

// ==========================================
// EXPORTACIONES ESTRUCTURADAS
// ==========================================
window.exportarResumenPDF = function() {
    showToast("Generando Informe (Lógica preparada para Fase Final)");
    setTimeout(() => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.setFont("helvetica", "bold"); doc.setFontSize(22); doc.setTextColor(124, 109, 250); 
        doc.text("fin.", 14, 20);
        
        doc.setFontSize(16); doc.setTextColor(40, 40, 40); doc.text("Informe Ejecutivo Mensual", 14, 30);
        
        doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.setTextColor(100, 100, 100);
        doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 14, 38);

        doc.autoTable({
            startY: 45,
            head: [['Ingresos', 'Gastos', 'Ahorros', 'Balance Neto']],
            body: [['$0', '$0', '$0', '$0']],
            theme: 'grid', headStyles: { fillColor: [30, 30, 36] }
        });

        doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.setTextColor(40, 40, 40);
        doc.text("Resumen por Destino Presupuestario", 14, doc.lastAutoTable.finalY + 15);
        
        doc.autoTable({
            startY: doc.lastAutoTable.finalY + 20,
            head: [['Destino', 'Grupo', 'Monto Gastado']],
            body: [['Sin datos', '-', '$0']], 
            theme: 'striped', headStyles: { fillColor: [124, 109, 250] }
        });

        doc.save('Resumen_Ejecutivo_fin.pdf');
    }, 500);
}

window.exportarHistorial = function(formato) {
    if(EstadoApp.movimientos.length === 0) {
        showToast("No hay datos para exportar.");
        return; 
    }
    showToast(`Generando ${formato.toUpperCase()}...`);
    
    if(formato === 'pdf') {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('landscape');
        doc.setFontSize(16); doc.text("Auditoría de Movimientos - fin.", 14, 20);
        
        doc.autoTable({
            startY: 30,
            head: [['Fecha', 'Hora', 'Tipo', 'Concepto', 'Medio', 'Destino', 'Estado', 'Monto']],
            body: [], 
            theme: 'striped'
        });
        doc.save('Auditoria_Historial.pdf');
    }
    
    if(formato === 'csv') {
        let csvContent = "\uFEFF"; 
        csvContent += "ID,Fecha,Hora,Tipo,Subtipo,Concepto,MedioPago,DestinoPresupuestario,Persona,Estado,Monto,Notas\n";
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob); link.download = "Auditoria_Export.csv"; link.click();
    }
    
    if(formato === 'excel') {
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["Resumen General", "Montos"]]), "Resumen");
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["Fecha", "Concepto", "Monto"]]), "Movimientos");
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["Origen", "Destino", "Monto"]]), "Ahorros");
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["Persona", "Tipo", "Saldo"]]), "Prestamos");
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["Persona", "Porcentaje", "Pendiente"]]), "Compartidos");
        
        const wsStatsData = [
            ["Métrica Financiera", "Valor"], ["Total Ingresos", 0], ["Total Gastos", 0], ["Total Ahorros", 0], ["Balance Neto", 0], [""],
            ["Distribución 50/30/20", "Porcentaje (%)"], ["Necesidades", 0], ["Deseos", 0], ["Ahorro", 0]
        ];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(wsStatsData), "Estadisticas_IA");
        XLSX.writeFile(wb, 'Analisis_Financiero_fin.xlsx');
    }
}

// ==========================================
// AHORROS
// ==========================================
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
    const countBilleteras = document.getElementById('ahorro-billeteras-count');
    const selectDestino = document.getElementById('ahorro-destino');
    const listaUI = document.getElementById('lista-billeteras-ui');
    
    if(countBilleteras) countBilleteras.innerText = EstadoApp.billeteras.length;

    if (EstadoApp.billeteras.length === 0) {
        if(emptyState) emptyState.style.display = 'flex';
        if(dataState) dataState.style.display = 'none';
        if(selectDestino) selectDestino.innerHTML = '<option value="" disabled selected>Primero crea una billetera</option>';
    } else {
        if(emptyState) emptyState.style.display = 'none';
        if(dataState) dataState.style.display = 'flex';
        
        if(selectDestino) {
            let opcionesHTML = '<option value="" selected>Seleccionar...</option>';
            EstadoApp.billeteras.forEach(b => { opcionesHTML += `<option value="${b.id}">${b.nombre}</option>`; });
            opcionesHTML += '<option value="nueva" style="font-weight:600; color:var(--accent);">➕ Crear nueva billetera</option>';
            selectDestino.innerHTML = opcionesHTML;
        }

        if(listaUI) {
            let listaHTML = '';
            EstadoApp.billeteras.forEach(b => {
                listaHTML += `<div style="display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid var(--border); padding-bottom:8px;"><div style="display:flex; align-items:center; gap:10px;"><span class="dot" style="background:${b.color};"></span><span style="font-size:14px; font-weight:600;">${b.nombre}</span></div><div style="display:flex; align-items:center; gap:15px;"><span style="font-weight:700; font-size:15px;">$0</span></div></div>`;
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
    
    EstadoApp.billeteras.push({ id: generarID('bill'), nombre: nombre, color: color, saldo: 0 });
    guardarEstado(); renderizarTodo(); cerrarNuevaBilletera();
    showToast("Billetera guardada correctamente");
}

// ==========================================
// PRÉSTAMOS
// ==========================================
function setTipoPrestamo(tipo) {
    const btnMedeben = document.getElementById('p-btn-medeben');
    const btnYodebo = document.getElementById('p-btn-yodebo');
    const btnSubmit = document.getElementById('btn-submit-prestamo');
    btnMedeben.classList.remove('active'); btnYodebo.classList.remove('active');
    if(tipo === 'medeben') { btnMedeben.classList.add('active'); btnSubmit.style.background = 'var(--green)'; }
    else { btnYodebo.classList.add('active'); btnSubmit.style.background = 'var(--red)'; }
}

window.calcularPrestamoInfo = function() {
    const montoStr = document.getElementById('pmonto').value.replace(/\D/g, '');
    const cuotasStr = document.getElementById('pcuotas').value;
    const fechaInicioStr = document.getElementById('pfecha').value;
    const infoText = document.getElementById('p-info-cuota');
    const fechaFinInput = document.getElementById('pfechacompromiso');

    if(montoStr && cuotasStr && parseInt(cuotasStr) > 0) {
        let monto = parseFloat(montoStr); let cuotas = parseInt(cuotasStr); let cuotaEstimada = monto / cuotas;
        infoText.innerText = `Cuota estimada: $${formatearDinero(cuotaEstimada.toFixed(0))}`;
        if(fechaInicioStr) {
            let d = new Date(fechaInicioStr + 'T12:00:00'); d.setMonth(d.getMonth() + (cuotas - 1)); 
            fechaFinInput.value = d.toISOString().split('T')[0];
        }
    } else { infoText.innerText = ''; }
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

    let cuotas = []; let cuotaMonto = monto / cuotasCount;
    let cuotasInputStr = document.getElementById('pcuotas').value;

    if (cuotasInputStr && cuotasCount > 0) {
        let dInicio = new Date(fechaInicio + 'T12:00:00');
        for(let i=1; i<=cuotasCount; i++) {
            let fVenc = new Date(dInicio); fVenc.setMonth(fVenc.getMonth() + (i-1));
            cuotas.push({ numero: i, monto: cuotaMonto, vencimiento: fVenc.toISOString().split('T')[0], pagada: i <= cuotaActual });
        }
    } else {
        cuotas.push({ numero: 1, monto: monto, vencimiento: fechaFin || fechaInicio, pagada: cuotaActual > 0 });
    }

    EstadoApp.prestamos.push({ id: generarID('prest'), tipo: tipo, persona: persona, concepto: concepto, montoTotal: monto, cuotas: cuotas });
    guardarEstado(); renderizarTodo(); 
    limpiarInputs('panel-prestamo'); document.getElementById('panel-prestamo').style.display = 'none';
    showToast("Préstamo guardado correctamente");
}

function renderPrestamos() {
    const container = document.getElementById('lista-prestamos-cards');
    if(!container) return;
    
    if(EstadoApp.prestamos.length === 0) {
        container.innerHTML = `
        <div class="card" style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:200px; border: 1px dashed var(--text3); background:transparent;">
             <i data-lucide="handshake" style="width:48px; height:48px; color:var(--text3); margin-bottom:15px; stroke-width:1.5;"></i>
             <p style="color:var(--text3); font-size:14px; font-weight:500; text-align:center;">No tienes deudas ni cuentas por cobrar registradas.</p>
        </div>`;
        return;
    }

    let agrupados = {};
    EstadoApp.prestamos.forEach(p => { if(!agrupados[p.persona]) agrupados[p.persona] = []; agrupados[p.persona].push(p); });

    let html = '';
    for(const persona in agrupados) {
        let prestamosPersona = agrupados[persona];
        let net = 0; let vencidos = 0; let proximos = 0; let htmlDetalles = '';

        prestamosPersona.forEach(p => {
            let saldoPrestamo = 0; let pagadas = 0; let totalC = p.cuotas.length; let cuotasHtml = '';

            p.cuotas.forEach((c, cIndex) => {
                if(c.pagada) { pagadas++; } else {
                    saldoPrestamo += c.monto;
                    let hoy = new Date(); let fv = new Date(c.vencimiento + 'T12:00:00');
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
                    <button onclick="toggleAccordion('det-${personaId}', 'icon-${personaId}')" style="background:transparent; border:none; color:var(--text2); font-size:13px; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:8px;">Ver detalle (${prestamosPersona.length} préstamo${prestamosPersona.length > 1 ? 's' : ''}) <i data-lucide="chevron-down" class="icon-sm"></i></button>
                    <div id="det-${personaId}" class="accordion-content">${htmlDetalles}</div>
                </div>
            </div>`;
    }
    container.innerHTML = html;
}

window.toggleCuota = function(pId, cIndex) { 
    let prestamo = EstadoApp.prestamos.find(p => p.id === pId); 
    if(prestamo) { prestamo.cuotas[cIndex].pagada = !prestamo.cuotas[cIndex].pagada; guardarEstado(); renderizarTodo(); } 
}
