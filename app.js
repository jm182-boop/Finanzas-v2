// ==========================================
// app.js - MOTOR UI Y LÓGICA DE ESTADOS
// ==========================================

// Base de datos temporal para la UI
let misBilleteras = []; 

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

    // Inicializar Motor UX de Ahorros
    renderBilleterasUI();

    // Regla 50/30/20
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

// LOGOUT / SALIR
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

// ==========================================
// AHORROS - LÓGICA DE ESTADOS UX/UI
// ==========================================
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
        // ESTADO 1: SIN BILLETERAS
        if(emptyState) emptyState.style.display = 'flex';
        if(dataState) dataState.style.display = 'none';
        if(selectDestino) selectDestino.innerHTML = '<option value="" disabled selected>Primero crea una billetera de ahorro</option>';
    } else {
        // ESTADO 2: CON BILLETERAS
        if(emptyState) emptyState.style.display = 'none';
        if(dataState) dataState.style.display = 'flex';

        // Llenar Selector
        if(selectDestino) {
            let opcionesHTML = '<option value="" selected>Seleccionar...</option>';
            misBilleteras.forEach(b => {
                opcionesHTML += `<option value="${b.id}">${b.nombre}</option>`;
            });
            opcionesHTML += '<option value="nueva" style="font-weight:600; color:var(--accent);">➕ Crear nueva billetera</option>';
            selectDestino.innerHTML = opcionesHTML;
        }

        // Llenar Lista de Distribución
        if(listaUI) {
            let listaHTML = '';
            misBilleteras.forEach(b => {
                listaHTML += `
                <div style="display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid var(--border); padding-bottom:8px;">
                   <div style="display:flex; align-items:center; gap:10px;">
                     <span class="dot" style="background:${b.color};"></span>
                     <span style="font-size:14px; font-weight:600;">${b.nombre}</span>
                   </div>
                   <div style="display:flex; align-items:center; gap:15px;">
                     <span style="font-weight:700; font-size:15px;">$0</span>
                     <div style="display:flex; gap:5px;">
                       <button class="ui-icon-btn"><svg viewBox="0 0 24 24"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg></button>
                       <button class="ui-icon-btn"><svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                     </div>
                   </div>
                 </div>`;
            });
            listaUI.innerHTML = listaHTML;
        }
    }
}

function abrirModalNuevaBilletera() {
    document.getElementById('modal-nueva-billetera').style.display = 'block';
}

function verificarNuevaBilletera(selectObj) {
    if(selectObj.value === 'nueva') {
        selectObj.value = ""; // Resetea la opción visual
        abrirModalNuevaBilletera();
    }
}

function cerrarNuevaBilletera() {
    document.getElementById('modal-nueva-billetera').style.display = 'none';
    document.getElementById('nueva-bill-nombre').value = '';
}

function guardarNuevaBilletera() {
    const nombre = document.getElementById('nueva-bill-nombre').value;
    const color = document.getElementById('nueva-bill-color').value;
    
    if(nombre.trim() === '') return; // Validación simple

    // Guardar en la base de datos temporal
    misBilleteras.push({
        id: 'b_' + Date.now(),
        nombre: nombre,
        color: color
    });

    cerrarNuevaBilletera();
    renderBilleterasUI(); // La app cambia a Estado 2 automáticamente

    document.getElementById('toast').innerText = "Billetera creada con éxito";
    document.getElementById('toast').classList.add('show');
    setTimeout(() => document.getElementById('toast').classList.remove('show'), 3000);
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
    limpiarInputs('panel-prestamo');

    if(tipo === 'medeben') {
        btnMedeben.classList.add('active');
        btnSubmit.style.background = 'var(--green)';
    } else {
        btnYodebo.classList.add('active');
        btnSubmit.style.background = 'var(--red)';
    }
}

// TEMA Y LOGIN
function toggleTheme(forceLight = false) {
    const body = document.body;
    const isLight = forceLight || body.getAttribute('data-theme') !== 'light';
    
    if (isLight) {
        body.setAttribute('data-theme', 'light');
        document.getElementById('icon-dark').style.display = 'none'; 
        document.getElementById('icon-light').style.display = 'inline';
        document.querySelector('.icon-dark-m').style.display = 'none'; 
        document.querySelector('.icon-light-m').style.display = 'inline';
        localStorage.setItem('theme', 'light');
    } else {
        body.removeAttribute('data-theme');
        document.getElementById('icon-dark').style.display = 'inline'; 
        document.getElementById('icon-light').style.display = 'none';
        document.querySelector('.icon-dark-m').style.display = 'inline'; 
        document.querySelector('.icon-light-m').style.display = 'none';
        localStorage.setItem('theme', 'dark');
    }
}

function togglePwd() {
    const pwd = document.getElementById('a-pwd');
    if (pwd.type === 'password') {
        pwd.type = 'text';
    } else {
        pwd.type = 'password';
    }
}
function doAuth() {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
}
