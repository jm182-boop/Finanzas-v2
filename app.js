// ==========================================
// app.js - FASE 2: MOTOR FINANCIERO Y EXPORTACIONES
// ==========================================

// 1. ESTADO CENTRAL (Zero Data)
let EstadoApp = {
    movimientos: [],
    billeteras: [],
    prestamos: [],
    presupuestos: {
        necesidades: { limite: 0, gastado: 0 },
        deseos: { limite: 0, gastado: 0 }
    },
    configuracion: {
        regla: { necesidades: 50, deseos: 30, ahorro: 20 },
        moneda: 'AR',
        mediosPago: ['Efectivo'] 
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
    }
}

function generarID(prefijo) {
    return prefijo + '_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
}

// 3. MOTOR DE RENDERIZADO
function renderizarTodo() {
    renderBilleterasUI();
    renderPrestamos();
    renderHistorialGlobal(EstadoApp.movimientos);
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ==========================================
// INICIALIZACIÓN
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
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
});

// ==========================================
// UI Y NAVEGACIÓN
// ==========================================
function updateRegla() {
    const slNec = document.getElementById('sl-nec');
    const slDes = document.getElementById('sl-des');
    let n = parseInt(slNec.value);
    let d = parseInt(slDes.value);
    if (n + d > 100) { d = 100 - n; slDes.value = d; }
    let a = 100 - (n + d); 
    document.getElementById('lbl-nec').innerText = `${n}%`;
    document.getElementById('lbl-des').innerText = `${d}%`;
    document.getElementById('lbl-aho').innerText = `${a}%`;
    
    EstadoApp.configuracion.regla = { necesidades: n, deseos: d, ahorro: a };
    guardarEstado();
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
// HISTORIAL (UI)
// ==========================================
window.filtrarHistorial = function() {
    renderHistorialGlobal(EstadoApp.movimientos);
}

function renderHistorialGlobal(data) {
    const container = document.getElementById('lista-historial-global');
    if(!container) return;

    if(data.length === 0) {
        container.innerHTML = `
        <div class="card" style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:220px; border: 1px dashed var(--text3); background:transparent;">
             <i data-lucide="inbox" style="width:48px; height:48px; color:var(--text3); margin-bottom:15px; stroke-width:1.5;"></i>
             <p style="color:var(--text3); font-size:14px; font-weight:500; text-align:center;">Aún no hay movimientos registrados<br>o que coincidan con estos filtros.</p>
        </div>`;
    } else {
        container.innerHTML = ``; // Se llenará en Fase 2.1
    }
    
    if(document.getElementById('h-count')) document.getElementById('h-count').innerText = data.length;
    if(document.getElementById('h-in')) document.getElementById('h-in').innerText = `$0`;
    if(document.getElementById('h-out')) document.getElementById('h-out').innerText = `$0`;
    if(document.getElementById('h-aho')) document.getElementById('h-aho').innerText = `$0`;
}

// ==========================================
// EXPORTACIONES PROFESIONALES
// ==========================================
window.exportarResumenPDF = function() {
    showToast("Generando Informe Ejecutivo PDF...");
    setTimeout(() => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.setTextColor(124, 109, 250); 
        doc.text("fin.", 14, 20);
        
        doc.setFontSize(16);
        doc.setTextColor(40, 40, 40);
        doc.text("Informe Ejecutivo Mensual", 14, 30);
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 14, 38);

        doc.autoTable({
            startY: 45,
            head: [['Ingresos', 'Gastos', 'Ahorros', 'Balance Neto']],
            body: [['$0', '$0', '$0', '$0']],
            theme: 'grid', headStyles: { fillColor: [30, 30, 36] }
        });

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(40, 40, 40);
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
        doc.setFontSize(16);
        doc.text("Auditoría de Movimientos - fin.", 14, 20);
        
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
        link.href = URL.createObjectURL(blob);
        link.download = "Auditoria_Export.csv";
        link.click();
    }
    
    if(formato === 'excel') {
        const wb = XLSX.utils.book_new();
        
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["Resumen General", "Montos"]]), "Resumen");
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["Fecha", "Concepto", "Monto"]]), "Movimientos");
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["Origen", "Destino", "Monto"]]), "Ahorros");
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["Persona", "Tipo", "Saldo"]]), "Prestamos");
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["Persona", "Porcentaje", "Pendiente"]]), "Compartidos");
        
        const wsStatsData = [
            ["Métrica Financiera", "Valor"],
            ["Total Ingresos", 0], ["Total Gastos", 0], ["Total Ahorros", 0], ["Balance Neto", 0], [""],
            ["Distribución 50/30/20", "Porcentaje (%)"],
            ["Necesidades", 0], ["Deseos", 0], ["Ahorro", 0]
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
    
    EstadoApp.billeteras.push({ 
        id: generarID('bill'), 
        nombre: nombre, 
        color: color,
        saldo: 0
    });
    
    guardarEstado(); 
    renderizarTodo(); 
    cerrarNuevaBilletera();
    showToast("Billetera guardada correctamente");
}

// ==========================================
// PRÉSTAMOS
// ==========================================
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

    if(montoStr && cuotasStr && parseInt(cuotasStr) > 0) {
        let monto = parseFloat(montoStr);
        let cuotas = parseInt(cuotasStr);
        let cuotaEstimada = monto / cuotas;
        infoText.innerText = `Cuota estimada: $${formatearDinero(cuotaEstimada.toFixed(0))}`;

        if(fechaInicioStr) {
            let d = new Date(fechaInicioStr + 'T12:00:00');
            d.setMonth(d.getMonth() + (cuotas - 1)); 
            fechaFinInput.value = d.toISOString().split('T')[0];
        }
    } else {
        infoText.innerText = '';
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

    EstadoApp.prestamos.push({ 
        id: generarID('prest'), 
        tipo: tipo, 
        persona: persona, 
        concepto: concepto, 
        montoTotal: monto, 
        cuotas: cuotas 
    });
    
    guardarEstado(); 
    renderizarTodo(); 
    
    limpiarInputs('panel-prestamo');
    document.getElementById('panel-prestamo').style.display = 'none';
    showToast("Préstamo guardado correctamente");
}

function renderPrestamos() {
    const container = document.getElementById('lista-prestamos-cards');
    
    if(EstadoApp.prestamos.length === 0 && container) {
        container.innerHTML = `
        <div class="card" style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:200px; border: 1px dashed var(--text3); background:transparent;">
             <i data-lucide="handshake" style="width:48px; height:48px; color:var(--text3); margin-bottom:15px; stroke-width:1.5;"></i>
             <p style="color:var(--text3); font-size:14px; font-weight:500; text-align:center;">No tienes deudas ni cuentas por cobrar registradas.</p>
        </div>`;
        return;
    }

    let agrupados = {};
    EstadoApp.prestamos.forEach(p => {
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
                    <button onclick="toggleAccordion('det-${personaId}', 'icon-${personaId}')" style="background:transparent; border:none; color:var(--text2); font-size:13px; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:8px;">Ver detalle (${prestamosPersona.length} préstamo${prestamosPersona.length > 1 ? 's' : ''}) <i data-lucide="chevron-down" class="icon-sm"></i></button>
                    <div id="det-${personaId}" class="accordion-content">${htmlDetalles}</div>
                </div>
            </div>`;
    }

    if(container) container.innerHTML = html;
}

window.toggleCuota = function(pId, cIndex) { 
    let prestamo = EstadoApp.prestamos.find(p => p.id === pId); 
    if(prestamo) { 
        prestamo.cuotas[cIndex].pagada = !prestamo.cuotas[cIndex].pagada; 
        guardarEstado(); 
        renderizarTodo(); 
    } 
}

// ==========================================
// TEMA VISUAL Y AUTENTICACIÓN
// ==========================================
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
