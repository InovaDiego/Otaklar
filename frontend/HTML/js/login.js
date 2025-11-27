const API_BASE = window.BACKEND_ORIGIN;
if (!API_BASE) {
  throw new Error('BACKEND_ORIGIN environment variable is not set');
}
const form = document.querySelector('.register-card');
const lgAlert = document.getElementById('login-alert');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  try {
    const res = await fetch(`${API_BASE}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || data.success === false) {
      lgAlert.className = 'alert alert-danger mt-3';
      lgAlert.textContent = (data && data.message) || 'Credenciales inválidas.';
      lgAlert.classList.remove('d-none');
      return;
    }

    lgAlert.className = 'alert alert-success mt-3';
    lgAlert.textContent = 'Inicio de sesión exitoso. Redirigiendo...';
    lgAlert.classList.remove('d-none');

    setTimeout(() => {
      window.location.href = './cornell-dashboard.html';
    }, 500);
  } catch (err) {
    lgAlert.className = 'alert alert-danger mt-3';
    lgAlert.textContent = 'No se pudo iniciar sesión. Intenta más tarde.';
    lgAlert.classList.remove('d-none');
    console.error(err);
  }
});
