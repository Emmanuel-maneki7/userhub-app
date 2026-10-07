console.log("Sistema UserHub listo y conectado");

// Función para cambiar entre vistas (Single Page Application)
function navigateTo(viewId) {
  // 1. Ocultar todas las secciones con la clase 'view-section'
  const sections = document.querySelectorAll('.view-section');
  sections.forEach(section => {
    section.classList.add('hidden');
  });

  // 2. Mostrar la sección objetivo
  const targetSection = document.getElementById(viewId);
  if (targetSection) {
    targetSection.classList.remove('hidden');
    window.scrollTo(0, 0); // Regresar al inicio de la página
  } else {
    console.warn(`La vista con id "${viewId}" no existe.`);
  }
}

// URL base de tu API Backend
const API_URL = 'https://userhub-app.onrender.com';

// Función para obtener usuarios de PostgreSQL
async function fetchUsers() {
  try {
    const response = await fetch(API_URL);
    const users = await response.json();
    console.log('Usuarios registrados en PostgreSQL:', users);
  } catch (error) {
    console.error('Error al conectar con el servidor:', error);
  }
}

// Cargar usuarios al iniciar
fetchUsers();

// Manejo del Formulario de Registro con conexión al Backend
const formRegister = document.getElementById('form-register');
if (formRegister) {
  formRegister.addEventListener('submit', async (e) => {
    e.preventDefault(); // Evita que la página se recargue

    // Capturar datos del formulario
const name = document.getElementById('reg-name')?.value || 'Shounen';
// Si el formulario no tiene campo de correo, se genera uno con el nickname para que sea único
const email = document.getElementById('reg-email')?.value || `${name.toLowerCase().trim()}@userhub.com`;
const password = document.getElementById('reg-password')?.value || '123456';

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      if (response.ok) {
        alert("¡Usuario registrado exitosamente en PostgreSQL!");
        formRegister.reset();
        fetchUsers(); // Actualiza la lista
        navigateTo('view-login'); // Redirige al login
      } else {
        const errData = await response.json();
        alert("Error al registrar: " + (errData.error || "Datos inválidos"));
      }
    } catch (error) {
      console.error("Error al conectar con la API:", error);
      alert("No se pudo conectar con el servidor backend.");
    }
  });
}

// Manejo del Formulario de Login
const formLogin = document.getElementById('form-login');
if (formLogin) {
  formLogin.addEventListener('submit', (e) => {
    e.preventDefault();
    alert("Inicio de sesión simulado");
    navigateTo('view-home');
  });
}
