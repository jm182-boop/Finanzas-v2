// ==========================================
// app.js - MOTOR PRINCIPAL DE INTERFAZ V2
// ==========================================

let currentUser = null;
let isLogin = true;

// 1. CARGA INICIAL Y PERSISTENCIA DE SESIÓN (Solución al F5)
document.addEventListener('DOMContentLoaded', async () => {
    // Reemplazar emojis por íconos lineales SVG para el botón de tema
    document.getElementById('icon-dark').innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
    document.getElementById('icon-light').innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';

    // Aplicar tema guardado en la memoria del navegador
    if(localStorage.getItem('theme') === 'light') toggleTheme(true);

    // Revisar si ya hay una sesión activa en Supabase
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        iniciarApp(session.user);
    } else {
        document.getElementById('auth-screen').style.display = 'flex';
        document.getElementById('app').style.display = 'none';
    }

    // Escuchar automáticamente si el usuario entra o sale
    supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) iniciarApp(session.user);
        if (event === 'SIGNED_OUT') {
            document.getElementById('auth-screen').style.display = 'flex';
            document.getElementById('app').style.display = 'none';
            currentUser = null;
        }
    });
});

// 2. LÓGICA DE INICIO DE SESIÓN
function toggleAuth() {
    isLogin = !isLogin;
    document.getElementById('auth-title').innerText = isLogin ? 'Iniciar Sesión' : 'Registrarse';
    document.getElementById('auth-btn').innerText = isLogin ? 'Entrar' : 'Crear Cuenta';
    document.getElementById('auth-toggle').innerHTML = isLogin ? '¿No tienes cuenta? <span>Regístrate</span>' : '¿Ya tienes cuenta? <span>Inicia Sesión</span>';
}

async function doAuth() {
    const email = document.getElementById('a-email').value;
    const pwd = document.getElementById('a-pwd').value;
    if(!email || !pwd) return showToast('Completa ambos campos', 'bad');

    const btn = document.getElementById('auth-btn');
    btn.innerText = 'Cargando...'; 
    btn.disabled = true;

    let res;
    if (isLogin) {
        res = await supabase.auth.signInWithPassword({ email, password: pwd });
    } else {
        res = await supabase.auth.signUp({ email, password: pwd });
        if(!res.error) showToast('Cuenta creada exitosamente. Revisa tu correo.', 'ok');
    }

    if (res.error) {
        showToast(res.error.message, 'bad');
        btn.innerText = isLogin ? 'Entrar' : 'Crear Cuenta';
        btn.disabled = false;
    }
}

async function logout() {
    await supabase.auth.signOut();
}

async function recuperarPwd() {
    const email = document.getElementById('a-email').value;
    if(!email) return showToast('Escribe tu correo en el campo primero', 'bad');
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if(error) showToast(error.message, 'bad');
    else showToast('Correo de recuperación enviado', 'ok');
}

// 3. UI EXTRAS (Ojo de Contraseña y Tema Claro/Oscuro)
function togglePwd() {
    const pwd = document.getElementById('a-pwd');
    const svg = document.getElementById('eye-icon');
    
    if (pwd.type === 'password') {
        pwd.type = 'text';
        // Ícono: Ojo cerrado (con una línea cruzada)
        svg.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle><line x1="1" y1="1" x2="23" y2="23"></line>';
    } else {
        pwd.type = 'password';
        // Ícono: Ojo abierto
        svg.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>';
    }
}

function toggleTheme(forceLight = false) {
    const body = document.body;
    const isLight = forceLight || body.getAttribute('data-theme') !== 'light';
    
    if (isLight) {
        body.setAttribute('data-theme', 'light');
        document.getElementById('icon-dark').style.display = 'none';
        document.getElementById('icon-light').style.display = 'inline';
        localStorage.setItem('theme', 'light');
    } else {
        body.removeAttribute('data-theme');
        document.getElementById('icon-dark').style.display = 'inline';
        document.getElementById('icon-light').style.display = 'none';
        localStorage.setItem('theme', 'dark');
    }
}

// 4. ARRANQUE DE LA APP INTERNA
function iniciarApp(user) {
    currentUser = user;
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    document.getElementById('uemail').innerText = user.email;
    
    // Aquí conectaremos la lectura de la base de datos en el próximo paso
    console.log("Sesión validada. Carrocería lista.");
}

// 5. NAVEGACIÓN DE PESTAÑAS
function sp(id, btn) {
    // Ocultar todas las páginas y desmarcar botones
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nb').forEach(b => b.classList.remove('active'));
    
    // Mostrar la página solicitada
    document.getElementById('page-' + id).classList.add('active');
    if(btn) btn.classList.add('active');
}

// 6. FORMULARIOS: Gasto/Ingreso y Compartidos
function setTipo(tipo) {
    document.getElementById('btg').classList.remove('active');
    document.getElementById('bti').classList.remove('active');
    
    if(tipo === 'gasto') {
        document.getElementById('btg').classList.add('active');
        document.getElementById('campos-gasto').style.display = 'block';
        document.getElementById('campos-ingreso').style.display = 'none';
        document.getElementById('btnagregar').style.background = 'var(--red)';
        document.getElementById('btnagregar').innerText = 'Guardar gasto';
    } else {
        document.getElementById('bti').classList.add('active');
        document.getElementById('campos-gasto').style.display = 'none';
        document.getElementById('campos-ingreso').style.display = 'block';
        document.getElementById('btnagregar').style.background = 'var(--green)';
        document.getElementById('btnagregar').innerText = 'Guardar ingreso';
    }
}

function toggleCompartido() {
    const isChecked = document.getElementById('chk-compartido').checked;
    document.getElementById('caja-compartido').style.display = isChecked ? 'block' : 'none';
}

// 7. UTILIDADES: Alertas y Formateo de Dinero
function showToast(msg, tipo = 'ok') {
    const t = document.getElementById('toast');
    t.innerText = msg;
    t.style.background = tipo === 'bad' ? 'var(--red)' : 'var(--green)';
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

function fmtI(input) {
    // Elimina cualquier caracter que no sea número y agrega el formato de puntos
    let val = input.value.replace(/\D/g, '');
    if(val === '') return;
    input.value = new Intl.NumberFormat('es-AR').format(val);
}
