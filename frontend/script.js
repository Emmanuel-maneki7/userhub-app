console.log("Sistema UserHub listo y conectado");

// Configuración de la URL de la API de Render
const API_URL = 'https://userhub-app.onrender.com/api/users';

// Función para navegar entre vistas (Single Page Application)
function navigateTo(viewId) {
  const sections = document.querySelectorAll('.view-section');
  sections.forEach(section => {
    section.classList.add('hidden');
  });

  const targetSection = document.getElementById(viewId);
  if (targetSection) {
    targetSection.classList.remove('hidden');
    window.scrollTo(0, 0);
  } else {
    console.warn(`La vista con id "${viewId}" no existe.`);
  }
}

// Función para obtener la lista de usuarios
async function fetchUsers() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`Estado HTTP: ${response.status}`);
    }
    const users = await response.json();
    console.log('Usuarios registrados en PostgreSQL:', users);
    return users;
  } catch (error) {
    console.error('Error al conectar con el servidor:', error);
  }
}

// Cargar usuarios al iniciar la página
fetchUsers();

// Manejo del formulario de registro
const formRegister = document.getElementById('form-register');
if (formRegister) {
  formRegister.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Capturar valores ingresados o usar valores por defecto
    const nameInput = document.getElementById('reg-name')?.value.trim();
    const emailInput = document.getElementById('reg-email')?.value.trim();
    const passwordInput = document.getElementById('reg-password')?.value;

    const name = nameInput || 'Shounen';
    const email = emailInput || `${name.toLowerCase().replace(/\s+/g, '')}@userhub.com`;
    const password = passwordInput || '123456';

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ name, email, password })
      });

      if (response.ok) {
        alert("¡Usuario registrado exitosamente en PostgreSQL!");
        formRegister.reset();
        await fetchUsers();
        navigateTo('view-login');
      } else {
        const errData = await response.json().catch(() => ({}));
        alert("Error al registrar: " + (errData.error || `Servidor respondió con código ${response.status}`));
      }
    } catch (error) {
      console.error("Error al conectar con la API:", error);
      alert("No se pudo conectar con el servidor backend. Si Render recién está encendiendo, espera 30 segundos y vuelve a intentarlo.");
    }
  });
}

// Manejo del formulario de inicio de sesión
const formLogin = document.getElementById('form-login');
if (formLogin) {
  formLogin.addEventListener('submit', (e) => {
    e.preventDefault();
    alert("Inicio de sesión exitoso");
    navigateTo('view-home');
  });
}
