// ==========================================
// app.js - MOTOR UI, AHORROS Y PRÉSTAMOS
// ==========================================

let misBilleteras = []; 
let misPrestamos = [];

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
        icon.classList.remove('open');
    } else {
        content.classList.add('show');
        icon.classList.add('open');
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

// MOVIMIENTOS
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

function toggleCheck(checkbox, rowId) {
    const row = document.getElementById(rowId);
    if (checkbox.checked) row.classList.add('item-completado');
    else row.classList.remove('item-completado');
}

// AHORROS
function setAhorroTipo() {
    const tipo = document.getElementById('ahorro-tipo').value;
    const lblOrigen = document.getElementById('lbl-origen');
    const lblDestino = document.getElementById('lbl-destino');
    if(tipo === 'aporte') {
        lblOrigen.innerText = 'Origen (Medio de pago)';
        lblDestino.innerText = 'Destino (Billetera Ahorro)';
    } else if(tipo === 'retiro') {
        lblOrigen.innerText = 'Origen (Billetera Ahorro)';
        lblDestino.innerText = 'Destino (Medio de pago)';
    } else {
        lblOrigen.innerText = 'Origen (Billetera Ahorro)';
        lblDestino.innerText = 'Destino (Billetera Ahorro)';
    }
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
    document.getElementById('toast').innerText = "Billetera creada";
    document.getElementById('toast').classList.add('show');
    setTimeout(() => document.getElementById('toast').classList.remove('show'), 3000);
}

// ==========================================
// PRÉSTAMOS - LÓGICA AUTOMÁTICA
// ==========================================
function setTipoPrestamo(tipo) {
    const btnMedeben = document.getElementById('p-btn-medeben');
    const btnYodebo = document.getElementById('p-btn-yodebo');
    const btnSubmit = document.getElementById('btn-submit-prestamo');
    btnMedeben.classList.remove('active');
    btnYodebo.classList.remove('active');
    if(tipo === 'medeben') {
        btnMedeben.classList.add('active');
        btnSubmit.style.background = 'var(--green)';
    } else {
        btnYodebo.classList.add('active');
        btnSubmit.style.background = 'var(--red)';
    }
}

// Expuesto a Window para que onkeyup lo detecte siempre
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
            let d = new Date(fechaInicioStr + 'T12:00:00'); // T12 para evitar desfase de zona horaria
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
        let net = 0;
        let vencidos = 0;
        let proximos = 0;

        let htmlDetalles = '';
        prestamosPersona.forEach(p => {
            let saldoPrestamo = 0;
            let pagadas = 0;
            let totalC = p.cuotas.length;
            let cuotasHtml = '';

            p.cuotas.forEach((c, cIndex) => {
                if(c.pagada) { pagadas++; } else {
                    saldoPrestamo += c.monto;
                    let hoy = new Date();
                    let fv = new Date(c.vencimiento + 'T12:00:00');
                    let diffDays = Math.ceil((fv - hoy) / (1000 * 3600 * 24));
                    if(diffDays < 0) vencidos++;
                    else if(diffDays <= 7) proximos++;
                }

                let pagadaAttr = c.pagada ? 'checked' : '';
                let claseTachado = c.pagada ? 'item-completado' : '';
                cuotasHtml += `<div class="li ${claseTachado}" style="padding: 8px 0; border-bottom: 1px dashed var(--border);"><span class="li-desc" style="font-size:13px;"><input type="checkbox" ${pagadaAttr} onchange="toggleCuota('${p.id}', ${cIndex})"> Cuota ${c.numero} - ${formatearFecha(c.vencimiento)}</span><span class="li-monto" style="font-size:13px;">$${formatearDinero(c.monto.toFixed(0))}</span></div>`;
            });

            if(p.tipo === 'medeben') net += saldoPrestamo; else net -= saldoPrestamo;

            htmlDetalles += `
                <div style="background:var(--bg); padding:15px; border-radius:10px; border:1px solid var(--border); margin-bottom:10px;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                        <span style="font-weight:600; font-size:14px; color:var(--text);">${p.concepto}</span>
                        <span style="font-size:12px; color:var(--text3);">Total: $${formatearDinero(p.montoTotal)}</span>
                    </div>
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

    if(html === '') html = `<div class="card" style="display:flex; align-items:center; justify-content:center; height:120px; border-style:dashed;"><p style="color:var(--text3); font-size:14px; font-weight:500;">No tienes préstamos registrados.</p></div>`;
    document.getElementById('lista-prestamos-cards').innerHTML = html;
    actualizarAlertasGlobales();
}

window.toggleCuota = function(pId, cIndex) {
    let prestamo = misPrestamos.find(p => p.id === pId);
    if(prestamo) { prestamo.cuotas[cIndex].pagada = !prestamo.cuotas[cIndex].pagada; renderPrestamos(); }
}

function actualizarAlertasGlobales() {
    let alertasHTML = '';
    let hoy = new Date();
    misPrestamos.forEach(p => {
        p.cuotas.forEach(c => {
            if(!c.pagada) {
                let fv = new Date(c.vencimiento + 'T12:00:00');
                let diffDays = Math.ceil((fv - hoy) / (1000 * 3600 * 24));
                if(diffDays < 0) alertasHTML += `<div style="display:flex; align-items:center; gap:12px; font-size:13px;"><span class="dot dot-red"></span><span style="color:var(--text); font-weight:500;">Préstamo ${p.persona}: Cuota ${c.numero} vencida hace ${Math.abs(diffDays)} días.</span></div>`;
                else if(diffDays <= 7) alertasHTML += `<div style="display:flex; align-items:center; gap:12px; font-size:13px;"><span class="dot dot-warning"></span><span style="color:var(--text); font-weight:500;">Préstamo ${p.persona}: Cuota ${c.numero} vence en ${diffDays} días.</span></div>`;
            }
        });
    });

    const list = document.getElementById('alertas-list');
    if(list) {
        if(alertasHTML === '') list.innerHTML = `<div style="display:flex; align-items:center; gap:12px; font-size:13px; color:var(--text3);"><span class="dot dot-neutral"></span><span>Sin alertas activas en este periodo.</span></div>`;
        else list.innerHTML = alertasHTML;
    }
}

function toggleTheme(forceLight = false) {
    const body = document.body;
    const isLight = forceLight || body.getAttribute('data-theme') !== 'light';
    if (isLight) {
        body.setAttribute('data-theme', 'light');
        document.getElementById('icon-dark').style.display = 'none'; document.getElementById('icon-light').style.display = 'inline';
        document.querySelector('.icon-dark-m').style.display = 'none'; document.querySelector('.icon-light-m').style.display = 'inline';
        localStorage.setItem('theme', 'light');
    } else {
        body.removeAttribute('data-theme');
        document.getElementById('icon-dark').style.display = 'inline'; document.getElementById('icon-light').style.display = 'none';
        document.querySelector('.icon-dark-m').style.display = 'inline'; document.querySelector('.icon-light-m').style.display = 'none';
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
