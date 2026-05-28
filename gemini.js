// gemini.js - Lógica de inteligencia artificial y comunicación con la API

// IMPORTANTE: Dejamos esto preparado. Más adelante te diré cómo generar tu nueva clave gratuita para quitar el error 429.
const GEM_KEY = 'TU_NUEVA_API_KEY_AQUI';

// Construye el contexto de texto que se enviará a la IA
function buildCtx() {
  // Por ahora dejamos una base sólida que conectaremos a la nueva base de datos más adelante
  return `Eres un asistente financiero personal amigable. IMPORTANTE: responde SIEMPRE en español, máximo 5 oraciones claras. Interpreta preguntas de forma natural.
MES ACTUAL: ${mesLabel(curMes)} | Sueldo base configurado: ${fmt(cfg.sueldo)}.
El usuario principal se llama ${cfg.nombre1} y su pareja ${cfg.nombre2}.`;
}

async function sendChat() {
  const inp = document.getElementById('cinput');
  const msg = inp.value.trim();
  if (!msg) return;

  inp.value = '';
  addMsg(msg, 'u');
  const th = addMsg('Analizando tus datos...', 'a th');

  if (GEM_KEY === 'TU_NUEVA_API_KEY_AQUI') {
    th.className = 'cm a';
    th.textContent = 'Falta configurar la API Key de Gemini. Lo haremos al finalizar la estructura.';
    return;
  }

  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEM_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildCtx() + '\n\nPregunta: ' + msg }] }],
        generationConfig: { maxOutputTokens: 400, temperature: 0.7 }
      })
    });

    if (!r.ok) {
      th.className = 'cm a';
      th.textContent = 'Error de conexión (' + r.status + '). Es posible que tu API Key haya superado el límite gratuito (Error 429).';
      return;
    }

    const d = await r.json();
    const t = d.candidates?.[0]?.content?.parts?.[0]?.text;
    th.className = 'cm a';
    th.textContent = t || 'No pude generar una respuesta. Intenta reformular la pregunta.';
  } catch (e) {
    th.className = 'cm a';
    th.textContent = 'Error de conexión. Verifica tu internet e intenta de nuevo.';
  }
  
  document.getElementById('chat-msgs').scrollTop = 9999;
}

function qa(q) {
  document.getElementById('cinput').value = q;
  sendChat();
}

function addMsg(t, c) {
  const el = document.createElement('div');
  el.className = 'cm ' + c;
  el.textContent = t;
  const w = document.getElementById('chat-msgs');
  w.appendChild(el);
  w.scrollTop = 9999;
  return el;
}
