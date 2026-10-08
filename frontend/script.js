console.log("Sistema UserHub listo y conectado");

// Configuración de la URL de la API de Render
const API_URL = 'https://userhub-app.onrender.com/api/users';

// Estado de la aplicación en memoria (sincronizado con localStorage)
let state = {
    currentUser: JSON.parse(localStorage.getItem('uh_current_user')) || null,
    tiers: JSON.parse(localStorage.getItem('uh_tiers')) || [
        { id: 'tier-s', name: 'Tier S', color: '#6366f1' },
        { id: 'tier-a', name: 'Tier A', color: '#10b981' },
        { id: 'tier-b', name: 'Tier B', color: '#f59e0b' }
    ],
    tags: JSON.parse(localStorage.getItem('uh_tags')) || [
        { id: 'tag-vip', name: 'VIP', color: '#eab308' },
        { id: 'tag-pro', name: 'PRO', color: '#ef4444' }
    ],
    assignments: JSON.parse(localStorage.getItem('uh_assignments')) || {}, // { nickname: { tierId, tagIds: [] } }
    users: []
};

// Guardar estado en localStorage
function saveState() {
    localStorage.setItem('uh_tiers', JSON.stringify(state.tiers));
    localStorage.setItem('uh_tags', JSON.stringify(state.tags));
    localStorage.setItem('uh_assignments', JSON.stringify(state.assignments));
    if (state.currentUser) {
        localStorage.setItem('uh_current_user', JSON.stringify(state.currentUser));
    } else {
        localStorage.removeItem('uh_current_user');
    }
}

// Navegación entre vistas (SPA)
function navigateTo(viewId) {
    const sections = document.querySelectorAll('.view-section');
    sections.forEach(section => section.classList.add('hidden'));

    const targetSection = document.getElementById(viewId);
    if (targetSection) {
        targetSection.classList.remove('hidden');
        window.scrollTo(0, 0);
    } else {
        console.warn(`La vista con id "${viewId}" no existe.`);
    }

    // Actualizar barra de navegación y vistas según pantalla
    renderNavActions();
    if (viewId === 'view-home') renderPublicTiers();
    if (viewId === 'view-admin') renderAdminPanel();
    if (viewId === 'view-profile-card') renderProfileCard();
    if (viewId === 'view-profile-edit') fillProfileEditForm();
}

// Renderizar botones dinámicos en la barra superior (Header)
function renderNavActions() {
    const navContainer = document.getElementById('nav-actions');
    if (!navContainer) return;

    if (state.currentUser) {
        const isAdmin = state.currentUser.nickname.toLowerCase() === 'admin';
        navContainer.innerHTML = `
            <span class="text-xs text-slate-400 hidden sm:inline">Hola, <b class="text-indigo-400">${escapeHtml(state.currentUser.nickname)}</b></span>
            ${isAdmin ? `
                <button onclick="navigateTo('view-admin')" class="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1">
                    <i class="ph-bold ph-shield-check"></i> <span>Panel Admin</span>
                </button>
            ` : ''}
            <button onclick="navigateTo('view-profile-card')" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1 border border-slate-700">
                <i class="ph-bold ph-user"></i> <span>Mi Perfil</span>
            </button>
            <button onclick="handleLogout()" class="px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs font-semibold flex items-center space-x-1 border border-red-500/30">
                <i class="ph-bold ph-sign-out"></i> <span>Salir</span>
            </button>
        `;
    } else {
        navContainer.innerHTML = `
            <button onclick="navigateTo('view-login')" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1 border border-slate-700">
                <i class="ph-bold ph-sign-in"></i> <span>Iniciar Sesión</span>
            </button>
            <button onclick="navigateTo('view-register')" class="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1">
                <i class="ph-bold ph-user-plus"></i> <span>Registrarse</span>
            </button>
        `;
    }
}

// Obtener usuarios del backend PostgreSQL
async function fetchUsers() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`Estado HTTP: ${response.status}`);
        const users = await response.json();
        state.users = users;
        console.log('Usuarios registrados en PostgreSQL:', users);
        renderPublicTiers();
        return users;
    } catch (error) {
        console.error('Error al conectar con el servidor:', error);
    }
}

// Manejador del Registro
async function handleRegister(e) {
    e.preventDefault();

    const nickname = document.getElementById('reg-nickname')?.value.trim();
    const password = document.getElementById('reg-password')?.value;

    if (!nickname || !password) {
        alert("Por favor completa los campos.");
        return;
    }

    const email = `${nickname.toLowerCase().replace(/\s+/g, '')}@userhub.com`;
    const name = nickname;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        if (response.ok) {
            alert("¡Usuario registrado exitosamente!");
            // Auto-login
            state.currentUser = { nickname, nombres: name, modo: 'Individual / Solo', familia: '-' };
            saveState();
            await fetchUsers();
            navigateTo('view-profile-edit');
        } else {
            const errData = await response.json().catch(() => ({}));
            alert("Error al registrar: " + (errData.error || `Código ${response.status}`));
        }
    } catch (error) {
        console.error("Error al conectar con la API:", error);
        alert("No se pudo conectar con el backend de Render. Espera unos segundos e intenta nuevamente.");
    }
}

// Manejador de Login
function handleLogin(e) {
    e.preventDefault();
    const nickname = document.getElementById('login-nickname')?.value.trim();
    const password = document.getElementById('login-password')?.value;

    if (nickname.toLowerCase() === 'admin' && password === 'rushero123') {
        state.currentUser = { nickname: 'Admin', nombres: 'Administrador Principal', modo: 'Competitivo', familia: 'UserHub HQ' };
        saveState();
        alert("Sesión iniciada como Administrador.");
        navigateTo('view-admin');
        return;
    }

    if (nickname) {
        state.currentUser = { nickname, nombres: nickname, modo: 'Individual / Solo', familia: '-' };
        saveState();
        alert(`¡Bienvenido de nuevo, ${nickname}!`);
        navigateTo('view-home');
    }
}

// Cerrar Sesión
function handleLogout() {
    state.currentUser = null;
    saveState();
    alert("Has cerrado sesión.");
    navigateTo('view-home');
}

// Formulario Guardar Perfil
function handleSaveProfile(e) {
    e.preventDefault();
    if (!state.currentUser) return;

    state.currentUser.nombres = document.getElementById('prof-nombres').value;
    state.currentUser.modo = document.getElementById('prof-modo').value;
    state.currentUser.familia = document.getElementById('prof-familia').value || '-';

    saveState();
    alert("Perfil actualizado correctamente.");
    navigateTo('view-profile-card');
}

// Cargar campos en Formulario de Edición de Perfil
function fillProfileEditForm() {
    if (!state.currentUser) return;
    document.getElementById('prof-nickname').value = state.currentUser.nickname || '';
    document.getElementById('prof-nombres').value = state.currentUser.nombres || '';
    document.getElementById('prof-modo').value = state.currentUser.modo || 'Individual / Solo';
    document.getElementById('prof-familia').value = state.currentUser.familia !== '-' ? state.currentUser.familia : '';
}

// Mostrar Tarjeta del Perfil
function renderProfileCard() {
    const container = document.getElementById('profile-card-container');
    if (!container || !state.currentUser) return;

    const assign = state.assignments[state.currentUser.nickname] || {};
    const tier = state.tiers.find(t => t.id === assign.tierId);
    const userTagIds = assign.tagIds || [];
    const userTags = state.tags.filter(t => userTagIds.includes(t.id));

    container.innerHTML = `
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
            <div class="flex items-start justify-between">
                <div class="flex items-center space-x-4">
                    <div class="w-16 h-16 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-3xl font-bold border border-indigo-500/30">
                        ${escapeHtml(state.currentUser.nickname.charAt(0).toUpperCase())}
                    </div>
                    <div>
                        <h2 class="text-2xl font-bold text-white">${escapeHtml(state.currentUser.nickname)}</h2>
                        <p class="text-slate-400 text-sm">${escapeHtml(state.currentUser.nombres || 'Sin nombre asignado')}</p>
                    </div>
                </div>
                ${tier ? `
                    <span class="px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg" style="background-color: ${tier.color}">
                        ${escapeHtml(tier.name)}
                    </span>
                ` : `<span class="px-3 py-1 rounded-full text-xs font-medium text-slate-500 bg-slate-800">Sin Tier</span>`}
            </div>

            <div class="grid grid-cols-2 gap-4 my-6 py-4 border-y border-slate-800/80">
                <div>
                    <span class="block text-xs text-slate-500 uppercase font-semibold">Modo / Estilo</span>
                    <span class="text-slate-200 text-sm font-medium">${escapeHtml(state.currentUser.modo || 'No especificado')}</span>
                </div>
                <div>
                    <span class="block text-xs text-slate-500 uppercase font-semibold">Clan / Familia</span>
                    <span class="text-slate-200 text-sm font-medium">${escapeHtml(state.currentUser.familia || '-')}</span>
                </div>
            </div>

            <div class="mb-6">
                <span class="block text-xs text-slate-500 uppercase font-semibold mb-2">Etiquetas Asignadas</span>
                <div class="flex flex-wrap gap-2">
                    ${userTags.length > 0 ? userTags.map(tag => `
                        <span class="px-2.5 py-1 rounded-md text-xs font-semibold text-white" style="background-color: ${tag.color}">
                            ${escapeHtml(tag.name)}
                        </span>
                    `).join('') : '<span class="text-xs text-slate-600 italic">Sin etiquetas asignadas por el Administrador.</span>'}
                </div>
            </div>

            <div class="flex justify-end">
                <button onclick="navigateTo('view-profile-edit')" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all flex items-center space-x-2">
                    <i class="ph-bold ph-pencil"></i>
                    <span>Editar Perfil</span>
                </button>
            </div>
        </div>
    `;
}

// --- FUNCIONES DEL PANEL DE ADMINISTRACIÓN ---

function renderAdminPanel() {
    renderAdminTiersList();
    renderAdminTagsList();
    renderAdminUserTable();
}

// Crear Nuevo Tier
function handleCreateTier(e) {
    e.preventDefault();
    const nameInput = document.getElementById('tier-name');
    const colorInput = document.getElementById('tier-color');

    const name = nameInput.value.trim();
    const color = colorInput.value;

    if (!name) return;

    const newTier = {
        id: 'tier-' + Date.now(),
        name,
        color
    };

    state.tiers.push(newTier);
    saveState();

    nameInput.value = '';
    renderAdminPanel();
    alert(`Tier "${name}" creado con éxito.`);
}

// Eliminar Tier
function deleteTier(tierId) {
    state.tiers = state.tiers.filter(t => t.id !== tierId);
    saveState();
    renderAdminPanel();
}

// Listar Tiers en el Panel Admin
function renderAdminTiersList() {
    const container = document.getElementById('admin-tiers-list');
    if (!container) return;

    if (state.tiers.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-500 italic">No hay Tiers creados.</p>`;
        return;
    }

    container.innerHTML = state.tiers.map(tier => `
        <div class="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <div class="flex items-center space-x-2">
                <span class="w-3 h-3 rounded-full" style="background-color: ${tier.color}"></span>
                <span class="font-bold text-slate-200">${escapeHtml(tier.name)}</span>
            </div>
            <button onclick="deleteTier('${tier.id}')" class="text-slate-500 hover:text-red-400 transition-colors">
                <i class="ph-bold ph-trash"></i>
            </button>
        </div>
    `).join('');
}

// Crear Nueva Etiqueta
function handleCreateTag(e) {
    e.preventDefault();
    const nameInput = document.getElementById('tag-name');
    const colorInput = document.getElementById('tag-color');

    const name = nameInput.value.trim();
    const color = colorInput.value;

    if (!name) return;

    const newTag = {
        id: 'tag-' + Date.now(),
        name,
        color
    };

    state.tags.push(newTag);
    saveState();

    nameInput.value = '';
    renderAdminPanel();
    alert(`Etiqueta "${name}" creada.`);
}

// Eliminar Etiqueta
function deleteTag(tagId) {
    state.tags = state.tags.filter(t => t.id !== tagId);
    saveState();
    renderAdminPanel();
}

// Listar Etiquetas en el Panel Admin
function renderAdminTagsList() {
    const container = document.getElementById('admin-tags-list');
    if (!container) return;

    if (state.tags.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-500 italic">No hay etiquetas creadas.</p>`;
        return;
    }

    container.innerHTML = state.tags.map(tag => `
        <span class="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-white shadow-sm" style="background-color: ${tag.color}">
            <span>${escapeHtml(tag.name)}</span>
            <button onclick="deleteTag('${tag.id}')" class="hover:text-slate-200 ml-1">
                <i class="ph-bold ph-x"></i>
            </button>
        </span>
    `).join('');
}

// Renderizar Tabla de Asignación a Usuarios en Admin
function renderAdminUserTable() {
    const tbody = document.getElementById('admin-table-body');
    if (!tbody) return;

    // Combinar usuarios de la API y el usuario admin local
    const allUsers = [...state.users];
    if (!allUsers.find(u => (u.name || u.nickname) === 'Admin')) {
        allUsers.unshift({ name: 'Admin', email: 'admin@userhub.com' });
    }

    if (allUsers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="py-4 text-center text-slate-500 text-xs">No hay usuarios registrados.</td></tr>`;
        return;
    }

    tbody.innerHTML = allUsers.map(user => {
        const username = user.name || user.nickname || 'Usuario';
        const userAssign = state.assignments[username] || { tierId: '', tagIds: [] };

        return `
            <tr class="hover:bg-slate-950/40 transition-colors">
                <td class="py-3 px-4 font-semibold text-indigo-400">${escapeHtml(username)}</td>
                <td class="py-3 px-4 text-slate-300">${escapeHtml(user.email || 'N/A')}</td>
                <td class="py-3 px-4 text-slate-400 text-xs">Comunidad</td>
                
                <!-- Selector de Etiquetas -->
                <td class="py-3 px-4">
                    <div class="flex flex-wrap gap-1">
                        ${state.tags.map(tag => {
                            const isChecked = userAssign.tagIds.includes(tag.id);
                            return `
                                <button onclick="toggleUserTag('${username}', '${tag.id}')" 
                                    class="px-2 py-0.5 rounded text-[11px] font-semibold border transition-all ${isChecked ? 'text-white border-transparent' : 'text-slate-500 border-slate-800 bg-slate-950'}"
                                    style="${isChecked ? `background-color: ${tag.color}` : ''}">
                                    ${escapeHtml(tag.name)}
                                </button>
                            `;
                        }).join('')}
                    </div>
                </td>

                <!-- Selector de Tier -->
                <td class="py-3 px-4">
                    <select onchange="assignUserTier('${username}', this.value)" class="bg-slate-950 border border-slate-800 rounded-lg py-1 px-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500">
                        <option value="">Sin Tier</option>
                        ${state.tiers.map(tier => `
                            <option value="${tier.id}" ${userAssign.tierId === tier.id ? 'selected' : ''}>
                                ${escapeHtml(tier.name)}
                            </option>
                        `).join('')}
                    </select>
                </td>
            </tr>
        `;
    }).join('');
}

// Asignar Tier a Usuario
function assignUserTier(username, tierId) {
    if (!state.assignments[username]) {
        state.assignments[username] = { tierId: '', tagIds: [] };
    }
    state.assignments[username].tierId = tierId;
    saveState();
    renderPublicTiers();
}

// Alternar Etiqueta de Usuario
function toggleUserTag(username, tagId) {
    if (!state.assignments[username]) {
        state.assignments[username] = { tierId: '', tagIds: [] };
    }
    const tagIds = state.assignments[username].tagIds;
    const index = tagIds.indexOf(tagId);

    if (index > -1) {
        tagIds.splice(index, 1);
    } else {
        tagIds.push(tagId);
    }

    saveState();
    renderAdminUserTable();
    renderPublicTiers();
}

// --- RENDERIZAR TABLAS PÚBLICAS EN EL HOME ---

function renderPublicTiers() {
    const container = document.getElementById('public-tiers-container');
    if (!container) return;

    if (state.tiers.length === 0) {
        container.innerHTML = `<p class="text-slate-500 text-sm text-center py-8">No se han creado Tiers aún en la administración.</p>`;
        return;
    }

    container.innerHTML = state.tiers.map(tier => {
        // Filtrar usuarios pertenecientes a este Tier
        const members = Object.keys(state.assignments).filter(uname => state.assignments[uname].tierId === tier.id);

        return `
            <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div class="px-6 py-4 flex items-center justify-between border-b border-slate-800/80" style="border-left: 6px solid ${tier.color}">
                    <h3 class="text-lg font-bold text-white flex items-center gap-2">
                        <span>${escapeHtml(tier.name)}</span>
                        <span class="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">${members.length} miembros</span>
                    </h3>
                </div>

                <div class="p-4">
                    ${members.length > 0 ? `
                        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            ${members.map(username => {
                                const userTags = (state.assignments[username].tagIds || [])
                                    .map(tid => state.tags.find(t => t.id === tid))
                                    .filter(Boolean);

                                return `
                                    <div class="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between">
                                        <div class="space-y-1">
                                            <span class="font-semibold text-slate-100 text-sm block">${escapeHtml(username)}</span>
                                            <div class="flex flex-wrap gap-1">
                                                ${userTags.map(tag => `
                                                    <span class="px-2 py-0.5 rounded text-[10px] font-bold text-white" style="background-color: ${tag.color}">
                                                        ${escapeHtml(tag.name)}
                                                    </span>
                                                `).join('')}
                                            </div>
                                        </div>
                                        <i class="ph-bold ph-user-circle text-slate-600 text-xl"></i>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    ` : `<p class="text-xs text-slate-500 italic py-2">No hay miembros asignados a este Tier actualmente.</p>`}
                </div>
            </div>
        `;
    }).join('');
}

// Utilidad anti-XSS
function escapeHtml(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[&<>"']/g, function (m) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[m];
    });
}

// Inicialización de Eventos y Carga
document.addEventListener('DOMContentLoaded', () => {
    // Vincular formulario de registro si existe
    const formReg = document.getElementById('form-register');
    if (formReg) formReg.addEventListener('submit', handleRegister);

    // Vincular formulario de login si existe
    const formLog = document.getElementById('form-login');
    if (formLog) formLog.addEventListener('submit', handleLogin);

    // Cargar usuarios de Render al iniciar
    fetchUsers();

    // Navegar a la vista inicial
    navigateTo('view-home');
});v
