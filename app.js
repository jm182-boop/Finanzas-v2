// ==========================================
// app.js - MOTOR UI Y NAVEGACIÓN (100% FIEL AL PDF)
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. Establecer el Mes Actual automáticamente
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const hoy = new Date();
    document.getElementById('mlabel').innerText = `${meses[hoy.getMonth()]} ${hoy.getFullYear()}`;

    // 2. Tema Oscuro/Claro
    if(localStorage.getItem('theme') === 'light') toggleTheme(true);

    // 3. Inicializar App Visual (Temporalmente sin Auth hasta conectar Supabase)
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    document.getElementById('uemail').innerText = 'gysusran@gmail.com';

    // 4. Lógica Matemática de la Regla 50/30/20 (Recálculo Automático)
    const slNec = document.getElementById('sl-nec');
    const slDes = document.getElementById('sl-des');
    const lblNec = document.getElementById('lbl-nec');
    const lblDes = document.getElementById('lbl-des');
    const lblAho = document.getElementById('lbl-aho');

    function updateRegla() {
        let n = parseInt(slNec.value);
        let d = parseInt(slDes.value);
        // Evitar que superen el 100% entre ambos
        if (n + d > 100) { d = 100 - n; slDes.value = d; }
        
        let a = 100 - (n + d); // Ahorro es siempre el remanente matemático
        
        lblNec.innerText = `${n}%`;
        lblDes.innerText = `${d}%`;
        lblAho.innerText = `${a}%`;
    }

    slNec.addEventListener('input', updateRegla);
    slDes.addEventListener('input', updateRegla);
});

// Navegación Principal
function sp(id, btn) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nb').forEach(b => b.classList.remove('active'));
    document.getElementById('page-' + id).classList.add('active');
    if(btn) btn.classList.add('active');
}

// Abrir/Cerrar Formularios Colapsables
function togglePanel(panelId) {
    const panel = document.getElementById(panelId);
    panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
}

// Interacción del Checklist (Tachar y atenuar)
function toggleCheck(checkbox, rowId) {
    const row = document.getElementById(rowId);
    if (checkbox.checked) {
        row.classList.add('item-completado');
    } else {
        row.classList.remove('item-completado');
    }
}

// Acordeones para Préstamos Agrupados (Ícono Rotativo)
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

// Pestañas Formulario Movimientos
function setTipoMov(tipo) {
    document.getElementById('btg').classList.remove('active');
    document.getElementById('bti').classList.remove('active');
    const btnAgregar = document.getElementById('btnagregar');
    
    if(tipo === 'gasto') {
        document.getElementById('btg').classList.add('active');
        document.getElementById('campos-gasto').style.display = 'block';
        document.getElementById('campos-ingreso').style.display = 'none';
        btnAgregar.style.background = 'var(--red)';
    } else {
        document.getElementById('bti').classList.add('active');
        document.getElementById('campos-gasto').style.display = 'none';
        document.getElementById('campos-ingreso').style.display = 'block';
        btnAgregar.style.background = 'var(--green)';
    }
}

// Pestañas Formulario Préstamos (Me Deben / Yo Debo)
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

// Tema Claro/Oscuro
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

function toggleCompartido() {
    const isChecked = document.querySelector('.check-rojo').checked;
    document.getElementById('caja-compartido').style.display = isChecked ? 'block' : 'none';
}
