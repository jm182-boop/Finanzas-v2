// 1. Pega tus claves reales entre las comillas simples
const supaUrl = 'https://aphycznoynnrnipbtyym.supabase.co';
const supaKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwaHljem5veW5ucm5pcGJ0eXltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MDY4MzIsImV4cCI6MjA5NTQ4MjgzMn0.aexuHjw2bvMNquv9FKN9kUsPb9pvIO1uHjM6H7e6OOs';

// 2. Inicializamos la conexión y obligamos a toda la app a reconocerla
window.supabase = window.supabase.createClient(supaUrl, supaKey);
