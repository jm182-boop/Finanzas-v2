// ==========================================
// app.js - ARQUITECTURA ZERO DATA & EXPORTACIONES PROFESIONALES
// ==========================================

// 1. Bases de Datos 100% Vacías (Zero Data)
let misBilleteras = []; 
let misPrestamos = [];
let historialGlobal = []; 

document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons(); // Inicializar iconografía premium
    
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const hoy = new Date();
    document.getElementById('mlabel').innerHTML = `<i data-lucide="layout-dashboard" class="icon-lg" style="margin-right:8px;"></i> ${meses[hoy.getMonth()]} ${hoy.getFullYear()}`;

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
    filtrarHistorial(); // Renderiza Empty States iniciales

    const slNec = document.getElementById('sl-nec');
    const slDes = document.getElementById('sl-des');
    if(slNec) slNec.addEventListener('input', updateRegla);
    if(slDes) slDes.addEventListener('input', updateRegla);
    
    lucide.createIcons();
});

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
    lucide.createIcons();
}

function togglePanel(panelId) {
    const panel = document.getElementById(panelId);
    panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
}

function toggleAccordion(contentId, iconId) {
    const content = document.getElementById(contentId);
    if (content.classList.contains('show')) {
        content.classList.remove('show');
    } else {
        content.classList.add('show');
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

function showToast(msg) {
    const t = document.getElementById('toast');
    t.innerText = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

// ==========================================
// MOTOR HISTORIAL (Empty States & Render)
// ==========================================
window.filtrarHistorial = function() {
    // Si tuvieras datos, aquí iría la lógica de filtrado `.filter()`. 
    // Como es Zero Data, enviamos el array vacío al renderizador.
    renderHistorialGlobal(historialGlobal);
}

function renderHistorialGlobal(data) {
    const container = document.getElementById('lista-historial-global');
    if(!container) return;

    if(data.length === 0) {
        // EMPTY STATE PROFESIONAL
        container.innerHTML = `
        <div class="card" style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:220px; border: 1px dashed var(--text3); background:transparent;">
             <i data-lucide="inbox" style="width:48px; height:48px; color:var(--text3); margin-bottom:15px; stroke-width:1.5;"></i>
             <p style="color:var(--text3); font-size:14px; font-weight:500; text-align:center;">Aún no hay movimientos registrados<br>o que coincidan con estos filtros.</p>
        </div>`;
    } else {
        // Aquí iría el mapeo de tarjetas HTML cuando haya datos reales.
        container.innerHTML = ``;
    }
    
    // Reseteo de métricas a 0
    if(document.getElementById('h-count')) document.getElementById('h-count').innerText = data.length;
    if(document.getElementById('h-in')) document.getElementById('h-in').innerText = `$0`;
    if(document.getElementById('h-out')) document.getElementById('h-out').innerText = `$0`;
    if(document.getElementById('h-aho')) document.getElementById('h-aho').innerText = `$0`;
    
    lucide.createIcons();
}

// ==========================================
// EXPORTACIONES PROFESIONALES (PDF, EXCEL, CSV)
// ==========================================

// 1. PDF EJECUTIVO (Desde el módulo Resumen)
window.exportarResumenPDF = function() {
    showToast("Generando Informe Ejecutivo PDF...");
    setTimeout(() => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Cabecera Vectorial
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.setTextColor(124, 109, 250); // Accent color
        doc.text("fin.", 14, 20);
        
        doc.setFontSize(16);
        doc.setTextColor(40, 40, 40);
        doc.text("Informe Ejecutivo Mensual", 14, 30);
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 14, 38);

        // Bloque Métricas (Mock 0 por Zero Data)
        doc.autoTable({
            startY: 45,
            head: [['Ingresos', 'Gastos', 'Ahorros', 'Balance Neto']],
            body: [['$0', '$0', '$0', '$0']],
            theme: 'grid',
            headStyles: { fillColor: [30, 30, 36] }
        });

        // Tabla requerida: Resumen por Destino Presupuestario
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(40, 40, 40);
        doc.text("Resumen por Destino Presupuestario", 14, doc.lastAutoTable.finalY + 15);
        
        doc.autoTable({
            startY: doc.lastAutoTable.finalY + 20,
            head: [['Destino', 'Grupo', 'Monto Gastado']],
            body: [
                ['Supermercado', 'Necesidades', '$0'],
                ['Vivienda', 'Necesidades', '$0'],
                ['Transporte', 'Necesidades', '$0'],
                ['Salidas', 'Deseos', '$0']
            ], // Ejemplo de estructura preparada para recibir el array real
            theme: 'striped',
            headStyles: { fillColor: [124, 109, 250] }
        });

        doc.save('Resumen_Ejecutivo_fin.pdf');
    }, 500);
}

// 2. EXPORTACIONES DESDE HISTORIAL (PDF, EXCEL, CSV)
window.exportarHistorial = function(formato) {
    if(historialGlobal.length === 0) {
        showToast("No hay datos para exportar.");
        return; // Protección UX
    }
    showToast(`Generando auditoría en ${formato.toUpperCase()}...`);
    
    if(formato === 'pdf') {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('landscape');
        doc.setFontSize(16);
        doc.text("Auditoría de Movimientos - fin.", 14, 20);
        
        // Tabla principal (vacía en Zero Data, pero estructurada)
        doc.autoTable({
            startY: 30,
            head: [['Fecha', 'Hora', 'Tipo', 'Concepto', 'Medio', 'Destino', 'Estado', 'Monto']],
            body: [], // Aquí iría historialGlobal.map(h => [h.fecha, h.hora, h.tipo, h.desc...])
            theme: 'striped'
        });
        doc.save('Auditoria_Historial.pdf');
    }
    
    if(formato === 'csv') {
        let csvContent = "\uFEFF"; // UTF-8 BOM
        csvContent += "ID,Fecha,Hora,Tipo,Subtipo,Concepto,MedioPago,DestinoPresupuestario,Persona,Estado,Monto,Notas\n";
        // Aquí iría el forEach de historialGlobal para llenar las filas
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "Auditoria_Export.csv";
        link.click();
    }
    
    if(formato === 'excel') {
        const wb = XLSX.utils.book_new();
        
        // Hoja 1 a 5 (Preparadas)
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["Resumen General", "Montos"]]), "Resumen");
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["Fecha", "Concepto", "Monto"]]), "Movimientos");
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["Origen", "Destino", "Monto"]]), "Ahorros");
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["Persona", "Tipo", "Saldo"]]), "Prestamos");
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["Persona", "Porcentaje", "Pendiente"]]), "Compartidos");
        
        // Hoja 6: Estadísticas e IA (50/30/20 Integrado)
        const wsStatsData = [
            ["Métrica Financiera", "Valor"],
            ["Total Ingresos", 0],
            ["Total Gastos", 0],
            ["Total Ahorros", 0],
            ["Balance Neto", 0],
            [""],
            ["Distribución 50/30/20", "Porcentaje (%)"],
            ["Necesidades", 0],
            ["Deseos", 0],
            ["Ahorro", 0]
        ];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(wsStatsData), "Estadisticas_IA");
        
        XLSX.writeFile(wb, 'Exportacion_Analitica_fin.xlsx');
    }
}

// ==========================================
// RENDERIZADO DE BILLETERAS Y PRÉSTAMOS (Zero Data)
// ==========================================
function renderBilleterasUI() {
    const emptyState = document.getElementById('ahorros-empty-billeteras');
    const dataState = document.getElementById('ahorros-con-billeteras');
    
    if (misBilleteras.length === 0) {
        if(emptyState) emptyState.style.display = 'flex';
        if(dataState) dataState.style.display = 'none';
    }
    lucide.createIcons();
}

function renderPrestamos() {
    const container = document.getElementById('lista-prestamos-cards');
    if(misPrestamos.length === 0 && container) {
        container.innerHTML = `
        <div class="card" style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:200px; border: 1px dashed var(--text3); background:transparent;">
             <i data-lucide="handshake" style="width:48px; height:48px; color:var(--text3); margin-bottom:15px; stroke-width:1.5;"></i>
             <p style="color:var(--text3); font-size:14px; font-weight:500; text-align:center;">No tienes deudas ni cuentas por cobrar registradas.</p>
        </div>`;
    }
    lucide.createIcons();
}

// Lógica de cálculo en vivo de préstamos (OnKeyUp)
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

// Tema Claro / Oscuro
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
