// 1. Pega tus claves reales entre las comillas simples
const supaUrl = 'PEGAR_AQUI_TU_URL';
const supaKey = 'PEGAR_AQUI_TU_KEY';

// 2. Inicializamos la conexión y obligamos a toda la app a reconocerla
window.supabase = window.supabase.createClient(supaUrl, supaKey);
