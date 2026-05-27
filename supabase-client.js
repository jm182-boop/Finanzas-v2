// ⚠️ IMPORTANTE: REEMPLAZA ESTAS DOS LÍNEAS CON TUS NUEVAS CLAVES DE SUPABASE
const SB_URL = 'https://aphycznoynnrnipbtyym.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwaHljem5veW5ucm5pcGJ0eXltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MDY4MzIsImV4cCI6MjA5NTQ4MjgzMn0.aexuHjw2bvMNquv9FKN9kUsPb9pvIO1uHjM6H7e6OOs';

let U = null;
let authMode = 'login';

// JWT REFRESH — Renovación automática cada 45 min
async function refreshToken() {
    const saved = sessionStorage.getItem('fu');
    if (!saved) return false;
    const data = JSON.parse(saved);
    if (!data.refresh_token) return false;
    try {
        const r = await fetch(SB_URL + '/auth/v1/token?grant_type=refresh_token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': SB_KEY },
            body: JSON.stringify({ refresh_token: data.refresh_token })
        });
        const res = await r.json();
        if (res.access_token) {
            U.token = res.access_token;
            data.token = res.access_token;
            if (res.refresh_token) data.refresh_token = res.refresh_token;
            sessionStorage.setItem('fu', JSON.stringify(data));
            return true;
        }
    } catch (e) {}
    return false;
}

// Renovar cada 45 minutos
setInterval(() => { if (U) refreshToken(); }, 45 * 60 * 1000);

// SUPABASE Peticiones Base
const sbAuth = async (ep, email, pass) => {
    const r = await fetch(SB_URL + '/auth/v1/' + ep, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SB_KEY },
        body: JSON.stringify({ email, password: pass })
    });
    return r.json();
};

const sb = async (path, method = 'GET', body = null, retry = true) => {
    const h = { 'Content-Type': 'application/json', 'apikey': SB_KEY, 'Authorization': 'Bearer ' + (U?.token || SB_KEY) };
    if (method === 'POST' || method === 'PATCH') h['Prefer'] = 'return=representation';
    const o = { method, headers: h };
    if (body) o.body = JSON.stringify(body);
    const r = await fetch(SB_URL + path, o);
    const t = await r.text();
    let d;
    try { d = JSON.parse(t); } catch (e) { d = t; }
    
    // Si la sesión expiró, intentar refrescar el token
    if (r.status === 401 && retry) {
        const ok = await refreshToken();
        if (ok) return sb(path, method, body, false);
        else { 
            if(typeof toast === 'function') toast('Sesión expirada, cerrando...'); 
            setTimeout(logout, 1500); 
        }
    }
    return { ok: r.ok, s: r.status, d };
};

// AUTENTICACIÓN UI
function switchTab(m) {
    authMode = m;
    document.querySelectorAll('.auth-tab').forEach((t, i) => t.classList.toggle('active', (m === 'login' ? i === 0 : i === 1)));
    document.getElementById('auth-btn').textContent = m === 'login' ? 'Iniciar sesion' : 'Crear cuenta';
    document.getElementById('auth-msg').textContent = '';
}

async function doAuth() {
    const email = document.getElementById('ae').value.trim();
    const pass = document.getElementById('ap').value;
    const msg = document.getElementById('auth-msg');
    
    if (!email || !pass) { 
        msg.textContent = 'Completa los campos'; 
        msg.className = 'auth-msg err'; 
        return; 
    }
    
    document.getElementById('auth-btn').innerHTML = '<span class="sp"></span>Cargando...';
    const res = await sbAuth(authMode === 'login' ? 'token?grant_type=password' : 'signup', email, pass);
    document.getElementById('auth-btn').textContent = authMode === 'login' ? 'Iniciar sesion' : 'Crear cuenta';
    
    if (res.access_token) {
        U = { token: res.access_token, email: res.user.email, id: res.user.id, refresh_token: res.refresh_token };
        sessionStorage.setItem('fu', JSON.stringify(U));
        if (typeof initApp === 'function') initApp();
    } else if (authMode === 'register' && res.id) {
        msg.textContent = 'Cuenta creada! Ya podes iniciar sesion.'; 
        msg.className = 'auth-msg suc'; 
        switchTab('login');
    } else { 
        msg.textContent = res.error_description || 'Error al autenticar'; 
        msg.className = 'auth-msg err'; 
    }
}

async function logout() {
    sessionStorage.removeItem('fu');
    U = null;
    document.getElementById('app').style.display = 'none';
    document.getElementById('auth-screen').style.display = 'flex';
    if (typeof resetAppData === 'function') resetAppData();
}
