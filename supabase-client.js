// supabase-client.js - Conexión y operaciones con la base de datos

const SB_URL = 'https://aphycznoynnrnipbtyym.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwaHljem5veW5ucm5pcGJ0eXltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MDY4MzIsImV4cCI6MjA5NTQ4MjgzMn0.aexuHjw2bvMNquv9FKN9kUsPb9pvIO1uHjM6H7e6OOs';

let U = null;
let authMode = 'login';

// Función principal para comunicarse con Supabase
async function sb(path, method = 'GET', body = null) {
  const headers = {
    'apikey': SB_KEY,
    'Authorization': 'Bearer ' + (U?.token || SB_KEY),
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };
  
  try {
    const r = await fetch(SB_URL + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null
    });
    
    // Si el token expiró (Error 401), intentamos renovarlo automáticamente
    if (r.status === 401 && U) {
      const refreshed = await refreshToken();
      if (refreshed) {
        headers['Authorization'] = 'Bearer ' + U.token;
        const retry = await fetch(SB_URL + path, { method, headers, body: body ? JSON.stringify(body) : null });
        const dataRetry = await retry.json().catch(() => null);
        return { ok: retry.ok, s: retry.status, d: dataRetry };
      } else {
        logout(); 
        return { ok: false, s: 401, d: null };
      }
    }
    
    const d = await r.json().catch(() => null);
    return { ok: r.ok, s: r.status, d };
  } catch (e) {
    return { ok: false, s: 500, d: null };
  }
}

// JWT REFRESH - Renovación automática del token
async function refreshToken() {
  const saved = sessionStorage.getItem('fu');
  if (!saved) return false;
  const data = JSON.parse(saved);
  
  try {
    const r = await fetch(SB_URL + '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      headers: { 'apikey': SB_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: data.refresh })
    });
    if (r.ok) {
      const d = await r.json();
      U = { id: d.user.id, email: d.user.email, token: d.access_token, refresh: d.refresh_token };
      sessionStorage.setItem('fu', JSON.stringify(U));
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}

// Funciones de Autenticación
function toggleAuth() {
  authMode = authMode === 'login' ? 'register' : 'login';
  document.getElementById('auth-title').textContent = authMode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta';
  document.getElementById('auth-btn').textContent = authMode === 'login' ? 'Entrar' : 'Registrarse';
  document.getElementById('auth-toggle').innerHTML = authMode === 'login' ? '¿No tienes cuenta? <span>Regístrate</span>' : '¿Ya tienes cuenta? <span>Inicia sesión</span>';
}

async function doAuth() {
  const email = document.getElementById('a-email').value.trim();
  const pwd = document.getElementById('a-pwd').value.trim();
  const btn = document.getElementById('auth-btn');
  
  if (!email || !pwd) { alert('Completa los campos'); return; }
  
  btn.innerHTML = '<span class="sp"></span>' + (authMode === 'login' ? 'Entrando...' : 'Registrando...');
  
  const path = authMode === 'login' ? '/auth/v1/token?grant_type=password' : '/auth/v1/signup';
  const r = await fetch(SB_URL + path, {
    method: 'POST',
    headers: { 'apikey': SB_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: pwd })
  });
  
  btn.textContent = authMode === 'login' ? 'Entrar' : 'Registrarse';
  
  if (!r.ok) {
    const err = await r.json();
    alert('Error: ' + (err.error_description || err.msg || 'Credenciales inválidas'));
    return;
  }
  
  const d = await r.json();
  U = { id: d.user.id, email: d.user.email, token: d.access_token, refresh: d.refresh_token };
  sessionStorage.setItem('fu', JSON.stringify(U));
  initApp();
}

function logout() {
  sessionStorage.removeItem('fu');
  U = null;
  document.getElementById('auth-screen').style.display = 'flex';
  document.getElementById('app').style.display = 'none';
  document.getElementById('a-email').value = '';
  document.getElementById('a-pwd').value = '';
}
