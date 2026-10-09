console.log("Sistema Audition World Class LATAM listo y conectado");

const API_BASE = 'https://userhub-app.onrender.com/api';
const API_URL = `${API_BASE}/users`;

let state = {
    currentUser: JSON.parse(localStorage.getItem('uh_current_user')) || null,
    tabs: [],
    tiers: [],
    tags: [
        { id: 'tag-vip', name: 'VIP', color: '#c92a52' },
        { id: 'tag-pro', name: 'PRO', color: '#800020' }
    ],
    clans: JSON.parse(localStorage.getItem('uh_clans')) || ['Sin Familia / Ninguno', 'TalentYouth', 'Audition Kings'],
    assignments: JSON.parse(localStorage.getItem('uh_assignments')) || {},
    users: []
};

let activeTabId = null;

function saveState() {
    localStorage.setItem('uh_clans', JSON.stringify(state.clans));
    localStorage.setItem('uh_assignments', JSON.stringify(state.assignments));
    if (state.currentUser) {
        localStorage.setItem('uh_current_user', JSON.stringify(state.currentUser));
    } else {
        localStorage.removeItem('uh_current_user');
    }
}

async function fetchGlobalConfig() {
    try {
        const [clansRes, tiersRes, tabsRes] = await Promise.all([
            fetch(`${API_BASE}/clans`),
            fetch(`${API_BASE}/tiers`),
            fetch(`${API_BASE}/tabs`)
        ]);

        if (clansRes.ok) {
            const dbClans = await clansRes.json();
            if (dbClans.length > 0) {
                state.clans = ['Sin Familia / Ninguno', ...dbClans.map(c => c.name).filter(n => n !== 'Sin Familia / Ninguno')];
            }
        }

        if (tabsRes.ok) {
            const dbTabs = await tabsRes.json();
            state.tabs = dbTabs;
            if (dbTabs.length > 0 && !activeTabId) {
                activeTabId = dbTabs[0].id;
            }
        }

        if (tiersRes.ok) {
            const dbTiers = await tiersRes.json();
            state.tiers = dbTiers.map(t => ({
                id: `tier-${t.id}`,
                dbId: t.id,
                name: t.name,
                color: t.color,
                tabId: t.tabId || (state.tabs.length > 0 ? state.tabs[0].id : null)
            }));
        }
    } catch (err) {
        console.error("Error al cargar configuración global:", err);
    }
}

function navigateTo(viewId) {
    if (viewId === 'view-admin' && (!state.currentUser || state.currentUser.nickname.toLowerCase() !== 'admin')) {
        viewId = 'view-home';
    }

    const sections = document.querySelectorAll('.view-section');
    sections.forEach(section => section.classList.add('hidden'));

    const targetSection = document.getElementById(viewId);
    if (targetSection) {
        targetSection.classList.remove('hidden');
        window.scrollTo(0, 0);
    }

    renderNavActions();
    if (viewId === 'view-home' || viewId === 'view-tiers') fetchUsers().then(() => renderPublicTiers());
    if (viewId === 'view-admin') renderAdminPanel();
    if (viewId === 'view-profile-card') renderProfileCard();
    if (viewId === 'view-profile-edit') fillProfileEditForm();
}

function renderNavActions() {
    const navContainer = document.getElementById('nav-actions');
    const ctaButtons = document.getElementById('home-cta-buttons');
    if (!navContainer) return;

    if (state.currentUser) {
        const isAdmin = state.currentUser.nickname.toLowerCase() === 'admin';
        navContainer.innerHTML = `
            <span class="text-xs text-wine-300 hidden sm:inline">Hola, <b class="text-wine-400">${escapeHtml(state.currentUser.nickname)}</b></span>
            ${isAdmin ? `
                <button onclick="navigateTo('view-admin')" class="px-3 py-1.5 rounded-lg bg-wine-700 hover:bg-wine-600 text-white text-xs font-semibold flex items-center space-x-1 shadow-md shadow-wine-900/40">
                    <i class="ph-bold ph-shield-check"></i> <span>Panel Admin</span>
                </button>
            ` : ''}
            <button onclick="navigateTo('view-tiers')" class="px-3 py-1.5 rounded-lg bg-wine-950 hover:bg-wine-900 text-wine-200 text-xs font-semibold flex items-center space-x-1 border border-wine-800">
                <i class="ph-bold ph-ranking"></i> <span>Tabla Tiers</span>
            </button>
            <button onclick="navigateTo('view-profile-card')" class="px-3 py-1.5 rounded-lg bg-wine-950 hover:bg-wine-900 text-wine-200 text-xs font-semibold flex items-center space-x-1 border border-wine-800">
                <i class="ph-bold ph-user"></i> <span>Mi Perfil</span>
            </button>
            <button onclick="handleLogout()" class="px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/50 text-red-400 text-xs font-semibold flex items-center space-x-1 border border-red-900/50">
                <i class="ph-bold ph-sign-out"></i> <span>Salir</span>
            </button>
        `;

        if (ctaButtons) {
            ctaButtons.innerHTML = `
                <button onclick="navigateTo('view-tiers')" class="px-6 py-3 rounded-xl bg-wine-700 hover:bg-wine-600 text-white font-semibold transition-all shadow-lg shadow-wine-900/50 hover:scale-[1.02] flex items-center space-x-2">
                    <i class="ph-bold ph-ranking text-lg"></i>
                    <span>Ver Tabla de Tiers</span>
                </button>
                <button onclick="navigateTo('view-profile-card')" class="px-6 py-3 rounded-xl bg-wine-950 hover:bg-wine-900 text-slate-200 font-semibold border border-wine-800 transition-all hover:scale-[1.02] flex items-center space-x-2">
                    <i class="ph-bold ph-user text-lg"></i>
                    <span>Ver Mi Perfil</span>
                </button>
            `;
        }
    } else {
        navContainer.innerHTML = `
            <button onclick="navigateTo('view-tiers')" class="px-3 py-1.5 rounded-lg bg-wine-950 hover:bg-wine-900 text-wine-200 text-xs font-semibold flex items-center space-x-1 border border-wine-800">
                <i class="ph-bold ph-ranking"></i> <span>Tabla Tiers</span>
            </button>
            <button onclick="navigateTo('view-login')" class="px-3 py-1.5 rounded-lg bg-wine-950 hover:bg-wine-900 text-slate-200 text-xs font-semibold flex items-center space-x-1 border border-wine-800">
                <i class="ph-bold ph-sign-in"></i> <span>Iniciar Sesión</span>
            </button>
            <button onclick="navigateTo('view-register')" class="px-3 py-1.5 rounded-lg bg-wine-700 hover:bg-wine-600 text-white text-xs font-semibold">
                <i class="ph-bold ph-user-plus"></i> <span>Registrarse</span>
            </button>
        `;

        if (ctaButtons) {
            ctaButtons.innerHTML = `
                <button onclick="navigateTo('view-register')" class="px-6 py-3 rounded-xl bg-wine-700 hover:bg-wine-600 text-white font-semibold transition-all shadow-lg shadow-wine-900/50 hover:scale-[1.02] flex items-center space-x-2">
                    <i class="ph-bold ph-user-plus text-lg"></i>
                    <span>Registrarse Ahora</span>
                </button>
                <button onclick="navigateTo('view-tiers')" class="px-6 py-3 rounded-xl bg-wine-950 hover:bg-wine-900 text-slate-200 font-semibold border border-wine-800 transition-all hover:scale-[1.02] flex items-center space-x-2">
                    <i class="ph-bold ph-ranking text-lg"></i>
                    <span>Ver Tabla Tiers</span>
                </button>
            `;
        }
    }
}

async function fetchUsers() {
    try {
        await fetchGlobalConfig();
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`Estado HTTP: ${response.status}`);
        const users = await response.json();
        state.users = users;

        users.forEach(u => {
            const username = u.nickname || u.name;
            if (username && !state.assignments[username]) {
                state.assignments[username] = { tagIds: [] };
            }
        });

        return users;
    } catch (error) {
        console.error('Error al conectar con el servidor:', error);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const nickname = document.getElementById('reg-nickname')?.value.trim();
    const password = document.getElementById('reg-password')?.value;
    const genero = document.getElementById('reg-genero')?.value || 'Otros';

    if (!nickname || !password) {
        alert("Por favor completa todos los campos.");
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nickname, password, genero })
        });

        if (response.ok) {
            const newUser = await response.json();
            alert("¡Usuario registrado exitosamente!");
            state.currentUser = {
                id: newUser.id,
                nickname: newUser.nickname || nickname,
                nombres: newUser.nombres || nickname,
                modo: ['NORMAL'],
                familia: state.clans[0] || 'Sin Familia / Ninguno',
                avatar: newUser.avatar || 'https://i.imgur.com/6VBx3io.png',
                genero: newUser.genero || genero
            };
            saveState();
            await fetchUsers();
            navigateTo('view-profile-edit');
        } else {
            const errData = await response.json().catch(() => ({}));
            alert("Error al registrar: " + (errData.error || `Código ${response.status}`));
        }
    } catch (error) {
        console.error("Error al conectar con la API:", error);
        alert("No se pudo conectar con el servidor backend. Intenta nuevamente.");
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const nickname = document.getElementById('login-nickname')?.value.trim();
    const password = document.getElementById('login-password')?.value;

    if (!nickname || !password) {
        alert("Usuario / contraseña incorrecto");
        return;
    }

    if (nickname.toLowerCase() === 'admin' && password === 'rushero123') {
        state.currentUser = { nickname: 'Admin', nombres: 'Administrador Principal', modo: ['ALL MODES'], familia: 'Audition HQ', avatar: 'https://i.imgur.com/6VBx3io.png', genero: 'Otros' };
        saveState();
        alert("Sesión iniciada como Administrador.");
        navigateTo('view-admin');
        return;
    }

    await fetchUsers();

    const foundUser = state.users.find(u => 
        (u.name && u.name.toLowerCase() === nickname.toLowerCase()) || 
        (u.nickname && u.nickname.toLowerCase() === nickname.toLowerCase())
    );

    if (foundUser) {
        if (foundUser.password && foundUser.password !== password) {
            alert("Usuario / contraseña incorrecto");
            return;
        }

        let parseModo = ['NORMAL'];
        try {
            if (foundUser.modo) {
                parseModo = foundUser.modo.startsWith('[') ? JSON.parse(foundUser.modo) : [foundUser.modo];
            }
        } catch (err) {
            parseModo = [foundUser.modo || 'NORMAL'];
        }

        state.currentUser = {
            id: foundUser.id,
            nickname: foundUser.nickname || foundUser.name || nickname,
            nombres: foundUser.nombres || foundUser.name || nickname,
            modo: parseModo,
            familia: foundUser.familia || state.clans[0] || 'Sin Familia / Ninguno',
            avatar: foundUser.avatar || 'https://i.imgur.com/6VBx3io.png',
            genero: foundUser.genero || 'Otros'
        };
        saveState();
        alert(`¡Bienvenido de nuevo, ${state.currentUser.nickname}!`);
        navigateTo('view-home');
    } else {
        alert("Usuario / contraseña incorrecto");
    }
}

function handleLogout() {
    state.currentUser = null;
    saveState();
    alert("Has cerrado sesión.");
    navigateTo('view-home');
}

async function deleteMyAccount() {
    if (!state.currentUser || !state.currentUser.id) return;

    const confirmacion = confirm("⚠️ ¿Estás seguro de que deseas eliminar tu cuenta? Esta acción borra permanentemente todos tus datos y puntos.");
    if (!confirmacion) return;

    try {
        const response = await fetch(`${API_URL}/${state.currentUser.id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert("Tu cuenta ha sido eliminada correctamente.");
            handleLogout();
        } else {
            alert("No se pudo eliminar la cuenta.");
        }
    } catch (error) {
        console.error("Error al eliminar cuenta:", error);
        alert("Ocurrió un error al conectar con el servidor.");
    }
}

async function deleteUserByAdmin(userId, username) {
    if (!confirm(`¿Estás seguro de que deseas eliminar permanentemente a "${username}"?`)) return;

    try {
        const response = await fetch(`${API_URL}/${userId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert(`Usuario ${username} eliminado con éxito.`);
            await fetchUsers();
            renderAdminUserTable();
            renderPublicTiers();
        } else {
            alert("No se pudo eliminar el usuario.");
        }
    } catch (err) {
        console.error("Error al eliminar usuario por Admin:", err);
    }
}

function toggleModeDropdown() {
    const menu = document.getElementById('mode-dropdown-menu');
    if (menu) menu.classList.toggle('hidden');
}

function handleModeCheckboxChange(cb) {
    const allCb = document.getElementById('cb-all-modes');
    if (allCb) allCb.checked = false;
    updateModeBtnText();
}

function handleAllModesToggle(allCb) {
    const checkboxes = document.querySelectorAll('.mode-cb');
    checkboxes.forEach(cb => {
        cb.checked = allCb.checked;
    });
    updateModeBtnText();
}

function updateModeBtnText() {
    const btnText = document.getElementById('mode-btn-text');
    const allCb = document.getElementById('cb-all-modes');
    const selected = Array.from(document.querySelectorAll('.mode-cb:checked')).map(cb => cb.value);

    if (!btnText) return;
    if (allCb && allCb.checked) {
        btnText.textContent = "ALL MODES";
    } else if (selected.length === 0) {
        btnText.textContent = "Seleccionar modos...";
    } else {
        btnText.textContent = selected.join(', ');
    }
}

function getSelectedModes() {
    const allCb = document.getElementById('cb-all-modes');
    if (allCb && allCb.checked) return ['ALL MODES'];
    const selected = Array.from(document.querySelectorAll('.mode-cb:checked')).map(cb => cb.value);
    return selected.length > 0 ? selected : ['NORMAL'];
}

async function handleSaveProfile(e) {
    e.preventDefault();
    if (!state.currentUser) return;

    const nombres = document.getElementById('prof-nombres').value;
    const modo = getSelectedModes();
    const familia = document.getElementById('prof-familia').value;
    const avatar = document.getElementById('prof-avatar').value.trim() || 'https://i.imgur.com/6VBx3io.png';
    const genero = document.getElementById('prof-genero').value;

    state.currentUser.nombres = nombres;
    state.currentUser.modo = modo;
    state.currentUser.familia = familia;
    state.currentUser.avatar = avatar;
    state.currentUser.genero = genero;

    saveState();

    if (state.currentUser.id) {
        try {
            const response = await fetch(`${API_URL}/${state.currentUser.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombres, modo, familia, avatar, genero })
            });

            if (response.ok) {
                await fetchUsers();
                renderPublicTiers();
            }
        } catch (err) {
            console.error("Error al sincronizar perfil con backend:", err);
        }
    }

    alert("Perfil actualizado correctamente.");
    navigateTo('view-profile-card');
}

function fillProfileEditForm() {
    if (!state.currentUser) return;
    document.getElementById('prof-nickname').value = state.currentUser.nickname || '';
    document.getElementById('prof-nombres').value = state.currentUser.nombres || '';
    
    const avatarVal = state.currentUser.avatar || 'https://i.imgur.com/6VBx3io.png';
    document.getElementById('prof-avatar').value = avatarVal;
    document.getElementById('avatar-preview').src = avatarVal;

    const generoSelect = document.getElementById('prof-genero');
    if (generoSelect) generoSelect.value = state.currentUser.genero || 'Otros';

    const clanSelect = document.getElementById('prof-familia');
    if (clanSelect) {
        const currentFamilia = state.currentUser.familia || 'Sin Familia / Ninguno';
        clanSelect.innerHTML = state.clans.map(clan => `
            <option value="${escapeHtml(clan)}" ${currentFamilia === clan ? 'selected' : ''}>
                ${escapeHtml(clan)}
            </option>
        `).join('');
    }

    const userModos = Array.isArray(state.currentUser.modo) ? state.currentUser.modo : [state.currentUser.modo];
    const allCb = document.getElementById('cb-all-modes');
    
    if (userModos.includes('ALL MODES')) {
        if (allCb) allCb.checked = true;
        document.querySelectorAll('.mode-cb').forEach(cb => cb.checked = true);
    } else {
        if (allCb) allCb.checked = false;
        document.querySelectorAll('.mode-cb').forEach(cb => {
            cb.checked = userModos.includes(cb.value);
        });
    }
    updateModeBtnText();
}

function renderProfileCard() {
    const container = document.getElementById('profile-card-container');
    if (!container || !state.currentUser) return;

    const assign = state.assignments[state.currentUser.nickname] || {};
    const userTagIds = assign.tagIds || [];
    const userTags = state.tags.filter(t => userTagIds.includes(t.id));
    const modosText = Array.isArray(state.currentUser.modo) ? state.currentUser.modo.join(', ') : (state.currentUser.modo || 'NORMAL');
    const avatarUrl = state.currentUser.avatar || 'https://i.imgur.com/6VBx3io.png';
    const generoVal = state.currentUser.genero || 'Otros';

    container.innerHTML = `
        <div class="bg-wine-950/60 border border-wine-900 rounded-2xl p-8 shadow-2xl relative overflow-hidden backdrop-blur-sm">
            <div class="flex items-start justify-between">
                <div class="flex items-center space-x-4">
                    <div class="w-16 h-16 rounded-2xl overflow-hidden bg-wine-900/50 border border-wine-700/50 shadow-lg flex-shrink-0">
                        <img src="${escapeHtml(avatarUrl)}" onerror="this.src='https://i.imgur.com/6VBx3io.png'" alt="Avatar" class="w-full h-full object-cover">
                    </div>
                    <div>
                        <h2 class="text-2xl font-bold text-white flex items-center gap-2">
                            <span>${escapeHtml(state.currentUser.nickname)}</span>
                            <span class="text-xs px-2 py-0.5 rounded-full bg-wine-900 text-wine-300 font-mono border border-wine-800">${escapeHtml(generoVal)}</span>
                        </h2>
                        <p class="text-slate-400 text-sm">${escapeHtml(state.currentUser.nombres || 'Sin nombre asignado')}</p>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4 my-6 py-4 border-y border-wine-900/80">
                <div>
                    <span class="block text-xs text-wine-400 uppercase font-semibold">Modo Preferido</span>
                    <span class="text-slate-200 text-sm font-medium">${escapeHtml(modosText)}</span>
                </div>
                <div>
                    <span class="block text-xs text-wine-400 uppercase font-semibold">Familia</span>
                    <span class="text-slate-200 text-sm font-medium">${escapeHtml(state.currentUser.familia || 'Sin Familia / Ninguno')}</span>
                </div>
            </div>

            <div class="mb-6">
                <span class="block text-xs text-wine-400 uppercase font-semibold mb-2">Etiquetas Asignadas</span>
                <div class="flex flex-wrap gap-2">
                    ${userTags.length > 0 ? userTags.map(tag => `
                        <span class="px-2.5 py-1 rounded-md text-xs font-semibold text-white" style="background-color: ${tag.color}">
                            ${escapeHtml(tag.name)}
                        </span>
                    `).join('') : '<span class="text-xs text-slate-500 italic">Sin etiquetas asignadas por el Administrador.</span>'}
                </div>
            </div>

            <div class="flex justify-end">
                <button onclick="navigateTo('view-profile-edit')" class="px-4 py-2 bg-wine-700 hover:bg-wine-600 text-white rounded-xl text-sm font-semibold transition-all flex items-center space-x-2">
                    <i class="ph-bold ph-pencil"></i>
                    <span>Editar Perfil</span>
                </button>
            </div>
        </div>
    `;
}

function renderAdminPanel() {
    renderAdminTabsList();
    renderAdminTiersList();
    renderAdminTagsList();
    renderAdminClansList();
    renderAdminUserTable();
}

// GESTIÓN DE PESTAÑAS (TABS)
async function handleCreateTab(e) {
    e.preventDefault();
    const nameInput = document.getElementById('tab-name');
    const name = nameInput.value.trim();
    if (!name) return;

    try {
        const response = await fetch(`${API_BASE}/tabs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        if (response.ok) {
            nameInput.value = '';
            await fetchGlobalConfig();
            renderAdminPanel();
            alert(`Pestaña "${name}" creada.`);
        } else {
            const err = await response.json();
            alert("Error: " + (err.error || "No se pudo crear la pestaña"));
        }
    } catch (err) {
        console.error("Error creando pestaña:", err);
    }
}

async function deleteTab(tabId) {
    try {
        await fetch(`${API_BASE}/tabs/${tabId}`, { method: 'DELETE' });
        await fetchGlobalConfig();
        renderAdminPanel();
    } catch (err) {
        console.error("Error eliminando pestaña:", err);
    }
}

function renderAdminTabsList() {
    const container = document.getElementById('admin-tabs-list');
    const select = document.getElementById('tier-tab-select');
    if (!container) return;

    if (state.tabs.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-500 italic">No hay pestañas.</p>`;
        if (select) select.innerHTML = `<option value="">Crea una pestaña primero</option>`;
        return;
    }

    container.innerHTML = state.tabs.map(tab => `
        <div class="flex items-center justify-between p-2 rounded-xl bg-[#090507] border border-wine-900 text-xs">
            <span class="font-bold text-slate-200">${escapeHtml(tab.name)}</span>
            <button onclick="deleteTab(${tab.id})" class="text-slate-500 hover:text-red-400 transition-colors">
                <i class="ph-bold ph-trash"></i>
            </button>
        </div>
    `).join('');

    if (select) {
        select.innerHTML = state.tabs.map(tab => `
            <option value="${tab.id}">${escapeHtml(tab.name)}</option>
        `).join('');
    }
}

// GESTIÓN DE TIERS
async function handleCreateTier(e) {
    e.preventDefault();
    const nameInput = document.getElementById('tier-name');
    const colorInput = document.getElementById('tier-color');
    const tabSelect = document.getElementById('tier-tab-select');

    const name = nameInput.value.trim();
    const color = colorInput.value;
    const tabId = tabSelect ? tabSelect.value : null;

    if (!name) return;

    try {
        await fetch(`${API_BASE}/tiers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, color, tabId })
        });
        await fetchGlobalConfig();
        nameInput.value = '';
        renderAdminPanel();
        alert(`Tier "${name}" creado con éxito.`);
    } catch (err) {
        console.error("Error creando tier:", err);
    }
}

async function deleteTier(tierId) {
    const tier = state.tiers.find(t => t.id === tierId);
    if (!tier) return;
    if (!confirm(`¿Eliminar el tier "${tier.name}"? Los usuarios asignados perderán este Tier.`)) return;

    try {
        const response = await fetch(`${API_BASE}/tiers/${tier.dbId}`, { method: 'DELETE' });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            alert("Error: " + (err.error || "No se pudo eliminar el tier"));
            return;
        }
        await fetchUsers();
        renderAdminPanel();
        renderPublicTiers();
    } catch (err) {
        console.error("Error eliminando tier:", err);
        alert("No se pudo conectar con el servidor.");
    }
}

async function moveTier(tierId, direction) {
    const tier = state.tiers.find(t => t.id === tierId);
    if (!tier) return;

    const sameTab = state.tiers.filter(t => t.tabId === tier.tabId);
    const pos = sameTab.findIndex(t => t.id === tierId);
    const neighbor = sameTab[pos + direction];
    if (!neighbor) return;

    const i = state.tiers.findIndex(t => t.id === tier.id);
    const j = state.tiers.findIndex(t => t.id === neighbor.id);
    [state.tiers[i], state.tiers[j]] = [state.tiers[j], state.tiers[i]];

    renderAdminTiersList();
    renderPublicTiers();

    try {
        const response = await fetch(`${API_BASE}/tiers/reorder`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: state.tiers.map(t => t.dbId) })
        });
        if (!response.ok) throw new Error(`Estado HTTP: ${response.status}`);
    } catch (err) {
        console.error("Error guardando el orden:", err);
        alert("No se pudo guardar el orden. Se restaurará la lista.");
        await fetchGlobalConfig();
        renderAdminTiersList();
        renderPublicTiers();
    }
}

function renderAdminTiersList() {
    const container = document.getElementById('admin-tiers-list');
    if (!container) return;

    if (state.tiers.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-500 italic">No hay Tiers creados.</p>`;
        return;
    }

    container.innerHTML = state.tiers.map((tier, idx) => {
        const parentTab = state.tabs.find(t => t.id === tier.tabId);
        const tabName = parentTab ? parentTab.name : 'Sin pestaña';
        const sameTab = state.tiers.filter(t => t.tabId === tier.tabId);
        const pos = sameTab.findIndex(t => t.id === tier.id);
        const canUp = pos > 0;
        const canDown = pos < sameTab.length - 1;

        return `
            <div class="flex items-center justify-between p-2 rounded-xl bg-[#090507] border border-wine-900 text-xs">
                <div class="flex items-center space-x-2">
                    <span class="w-3 h-3 rounded-full" style="background-color: ${tier.color}"></span>
                    <div>
                        <span class="font-bold text-slate-200 block">${escapeHtml(tier.name)}</span>
                        <span class="text-[10px] text-wine-400">Modo: ${escapeHtml(tabName)}</span>
                    </div>
                </div>
                <div class="flex items-center space-x-1">
                    <button onclick="moveTier('${tier.id}', -1)" ${canUp ? '' : 'disabled'} class="text-slate-500 hover:text-wine-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                        <i class="ph-bold ph-arrow-up"></i>
                    </button>
                    <button onclick="moveTier('${tier.id}', 1)" ${canDown ? '' : 'disabled'} class="text-slate-500 hover:text-wine-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                        <i class="ph-bold ph-arrow-down"></i>
                    </button>
                    <button onclick="deleteTier('${tier.id}')" class="text-slate-500 hover:text-red-400 transition-colors ml-2">
                        <i class="ph-bold ph-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function handleCreateTag(e) {
    e.preventDefault();
    const nameInput = document.getElementById('tag-name');
    const colorInput = document.getElementById('tag-color');

    const name = nameInput.value.trim();
    const color = colorInput.value;

    if (!name) return;

    state.tags.push({ id: 'tag-' + Date.now(), name, color });
    saveState();

    nameInput.value = '';
    renderAdminPanel();
    alert(`Etiqueta "${name}" creada.`);
}

function deleteTag(tagId) {
    state.tags = state.tags.filter(t => t.id !== tagId);
    saveState();
    renderAdminPanel();
}

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

async function handleCreateClan(e) {
    e.preventDefault();
    const clanInput = document.getElementById('clan-name');
    const clanName = clanInput.value.trim();

    if (!clanName) return;

    try {
        await fetch(`${API_BASE}/clans`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: clanName })
        });
        await fetchGlobalConfig();
        clanInput.value = '';
        renderAdminPanel();
        alert(`Familia "${clanName}" creada.`);
    } catch (err) {
        console.error("Error creando familia:", err);
    }
}

async function deleteClan(clanName) {
    try {
        await fetch(`${API_BASE}/clans/${encodeURIComponent(clanName)}`, { method: 'DELETE' });
        await fetchGlobalConfig();
        renderAdminPanel();
    } catch (err) {
        console.error("Error eliminando familia:", err);
    }
}

function renderAdminClansList() {
    const container = document.getElementById('admin-clans-list');
    if (!container) return;

    if (state.clans.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-500 italic">No hay familias creadas.</p>`;
        return;
    }

    container.innerHTML = state.clans.map(clan => `
        <div class="flex items-center justify-between p-2 rounded-xl bg-[#090507] border border-wine-900 text-xs">
            <span class="font-bold text-slate-200">${escapeHtml(clan)}</span>
            <button onclick="deleteClan('${escapeHtml(clan)}')" class="text-slate-500 hover:text-red-400 transition-colors">
                <i class="ph-bold ph-trash"></i>
            </button>
        </div>
    `).join('');
}

// ASIGNACIÓN MÚLTIPLE DE TIERS Y PUNTOS EN PANEL ADMIN
async function addUserToTier(userId, tierId, puntos = 0) {
    if (!tierId) return;

    try {
        await fetch(`${API_BASE}/users/${userId}/tiers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tierId: Number(tierId), puntos: Number(puntos) })
        });
        await fetchUsers();
        renderAdminUserTable();
        renderPublicTiers();
    } catch (err) {
        console.error("Error al asignar tier/puntos al usuario:", err);
    }
}

async function updateUserTierPoints(userId, tierId, newPoints) {
    const pts = parseInt(newPoints, 10);
    if (isNaN(pts)) return;

    try {
        await fetch(`${API_BASE}/users/${userId}/tiers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tierId: Number(tierId), puntos: pts })
        });
        await fetchUsers();
        renderPublicTiers();
    } catch (err) {
        console.error("Error al actualizar puntos:", err);
    }
}

async function removeUserTier(userId, tierId) {
    try {
        await fetch(`${API_BASE}/users/${userId}/tiers/${tierId}`, {
            method: 'DELETE'
        });
        await fetchUsers();
        renderAdminUserTable();
        renderPublicTiers();
    } catch (err) {
        console.error("Error al quitar tier al usuario:", err);
    }
}

function renderAdminUserTable() {
    const tbody = document.getElementById('admin-table-body');
    if (!tbody) return;

    const allUsers = state.users.filter(u => (u.nickname || u.name || '').toLowerCase() !== 'admin');

    if (allUsers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="py-4 text-center text-slate-500 text-xs">No hay usuarios registrados.</td></tr>`;
        return;
    }

    tbody.innerHTML = allUsers.map(user => {
        const username = user.nickname || user.name || 'Usuario';
        const userAssign = state.assignments[username] || { tagIds: [] };
        const userRanks = user.tierRanks || [];

        const assignedTierIds = userRanks.map(tr => tr.tierId);
        const availableTiers = state.tiers.filter(t => !assignedTierIds.includes(t.dbId));

        return `
            <tr class="hover:bg-wine-900/20 transition-colors border-b border-wine-900/60">
                <td class="py-3 px-4 font-semibold text-wine-400 align-top flex items-center gap-2">
                    <img src="${escapeHtml(user.avatar || 'https://i.imgur.com/6VBx3io.png')}" onerror="this.src='https://i.imgur.com/6VBx3io.png'" class="w-6 h-6 rounded-full object-cover border border-wine-800 flex-shrink-0">
                    <div>
                        <span>${escapeHtml(username)}</span>
                        <span class="block text-[10px] text-slate-500 font-normal">${escapeHtml(user.genero || 'Otros')}</span>
                    </div>
                </td>
                <td class="py-3 px-4 text-slate-300 align-top">${escapeHtml(user.email || `${username.toLowerCase()}@audition.latam`)}</td>
                
                <td class="py-3 px-4 space-y-2 align-top">
                    <div class="space-y-1.5">
                        ${userRanks.length > 0 ? userRanks.map(tr => `
                            <div class="flex items-center space-x-2 bg-[#090507] border border-wine-900 p-1.5 rounded-lg">
                                <span class="px-2 py-0.5 rounded text-[10px] font-bold text-white" style="background-color: ${tr.tier.color}">
                                    ${escapeHtml(tr.tier.name)}
                                </span>
                                <input type="number" value="${tr.puntos}" 
                                       onchange="updateUserTierPoints(${user.id},${tr.tierId}, this.value)" 
                                       class="w-16 bg-wine-950 border border-wine-800 rounded py-0.5 px-1 text-xs text-amber-400 font-bold text-center focus:outline-none focus:border-amber-500">
                                <span class="text-[10px] text-slate-500">pts</span>
                                <button onclick="removeUserTier(${user.id},${tr.tierId})" class="text-slate-500 hover:text-red-400 ml-auto transition-colors">
                                    <i class="ph-bold ph-x"></i>
                                </button>
                            </div>
                        `).join('') : '<span class="text-xs text-slate-500 italic">Sin Tiers asignados</span>'}
                    </div>

                    ${availableTiers.length > 0 ? `
                        <div class="pt-1">
                            <select onchange="addUserToTier(${user.id}, this.value)" class="bg-wine-950/80 border border-wine-800 rounded-lg py-1 px-2 text-xs text-wine-300 focus:outline-none focus:border-wine-500 w-full">
                                <option value="">+ Añadir a otro Tier...</option>
                                ${availableTiers.map(tier => `
                                    <option value="${tier.dbId}">${escapeHtml(tier.name)}</option>
                                `).join('')}
                            </select>
                        </div>
                    ` : ''}
                </td>

                <td class="py-3 px-4 align-top">
                    <div class="flex flex-wrap gap-1">
                        ${state.tags.map(tag => {
                            const isChecked = userAssign.tagIds.includes(tag.id);
                            return `
                                <button onclick="toggleUserTag('${username}', '${tag.id}')" 
                                    class="px-2 py-0.5 rounded text-[11px] font-semibold border transition-all ${isChecked ? 'text-white border-transparent' : 'text-slate-500 border-wine-900 bg-[#090507]'}"
                                    style="${isChecked ? `background-color: ${tag.color}` : ''}">
                                    ${escapeHtml(tag.name)}
                                </button>
                            `;
                        }).join('')}
                    </div>
                </td>

                <td class="py-3 px-4 align-top text-center">
                    <button onclick="deleteUserByAdmin(${user.id}, '${escapeHtml(username)}')" 
                            class="p-2 bg-red-950/50 hover:bg-red-900/80 text-red-400 border border-red-800/60 rounded-lg text-xs font-bold transition-all" 
                            title="Eliminar usuario">
                        <i class="ph-bold ph-trash text-sm"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function toggleUserTag(username, tagId) {
    if (!state.assignments[username]) {
        state.assignments[username] = { tagIds: [] };
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

function renderTabsNavigation() {
    const container = document.getElementById('tabs-navigation');
    if (!container) return;

    if (state.tabs.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-500 italic">No hay pestañas de modos creadas.</p>`;
        return;
    }

    if (!activeTabId && state.tabs.length > 0) {
        activeTabId = state.tabs[0].id;
    }

    container.innerHTML = state.tabs.map(tab => `
        <button onclick="setActiveTab(${tab.id})" class="px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTabId === tab.id ? 'bg-wine-700 text-white shadow-lg shadow-wine-900/50' : 'bg-wine-950 text-slate-400 hover:bg-wine-900 border border-wine-900'}">
            ${escapeHtml(tab.name)}
        </button>
    `).join('');
}

function setActiveTab(tabId) {
    activeTabId = tabId;
    renderTabsNavigation();
    renderPublicTiers();
}

function renderPublicTiers() {
    renderTabsNavigation();
    const container = document.getElementById('public-tiers-container');
    if (!container) return;

    if (!state.currentUser) {
        container.innerHTML = `
            <div class="bg-wine-950/60 border border-wine-900 rounded-2xl p-8 text-center space-y-4">
                <div class="w-12 h-12 rounded-xl bg-wine-900/50 border border-wine-700/50 text-wine-400 flex items-center justify-center mx-auto">
                    <i class="ph-bold ph-lock-key text-2xl"></i>
                </div>
                <h3 class="text-xl font-bold text-white">Contenido Privado</h3>
                <p class="text-slate-400 text-sm max-w-md mx-auto">
                    Debes registrarte o iniciar sesión con tu cuenta para visualizar las tablas de posiciones TIER de Audition World Class LATAM.
                </p>
                <div class="pt-2 flex justify-center gap-3">
                    <button onclick="navigateTo('view-login')" class="px-5 py-2 bg-wine-700 hover:bg-wine-600 text-white rounded-xl text-sm font-semibold transition-all">
                        Iniciar Sesión
                    </button>
                    <button onclick="navigateTo('view-register')" class="px-5 py-2 bg-wine-950 hover:bg-wine-900 text-slate-200 border border-wine-800 rounded-xl text-sm font-semibold transition-all">
                        Registrarse
                    </button>
                </div>
            </div>
        `;
        return;
    }

    const filteredTiers = state.tiers.filter(t => t.tabId === activeTabId);

    if (filteredTiers.length === 0) {
        container.innerHTML = `<p class="text-slate-500 text-sm text-center py-8">No hay Tiers creados para esta pestaña actualmente.</p>`;
        return;
    }

    container.innerHTML = filteredTiers.map(tier => {
        let membersWithPoints = [];

        state.users.forEach(u => {
            const uname = u.nickname || u.name;
            if (!uname || uname.toLowerCase() === 'admin') return;

            const userRank = (u.tierRanks || []).find(tr => tr.tierId === tier.dbId);
            if (userRank) {
                membersWithPoints.push({
                    user: u,
                    puntos: userRank.puntos
                });
            }
        });

        membersWithPoints.sort((a, b) => b.puntos - a.puntos);

        return `
            <div class="bg-wine-950/60 border border-wine-900 rounded-2xl overflow-hidden shadow-xl">
                <div class="px-6 py-4 flex items-center justify-between border-b border-wine-900/80" style="border-left: 6px solid ${tier.color}">
                    <h3 class="text-lg font-bold text-white flex items-center gap-2">
                        <span>${escapeHtml(tier.name)}</span>
                        <span class="text-xs px-2 py-0.5 rounded-full bg-wine-900/80 text-wine-300 font-mono">${membersWithPoints.length} miembros</span>
                    </h3>
                </div>

                <div class="p-4 overflow-x-auto">
                    ${membersWithPoints.length > 0 ? `
                        <table class="w-full text-left border-collapse text-xs sm:text-sm">
                            <thead>
                                <tr class="border-b border-wine-900/80 text-wine-300 font-semibold uppercase text-[11px] tracking-wider">
                                    <th class="py-3 px-4 w-16 text-center">Puesto</th>
                                    <th class="py-3 px-4">Nickname</th>
                                    <th class="py-3 px-4 text-center">Puntos</th>
                                    <th class="py-3 px-4">Familia</th>
                                    <th class="py-3 px-4">Modo</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-wine-900/40">
                                ${membersWithPoints.map((item, index) => {
                                    const u = item.user;
                                    const uname = u.nickname || u.name;
                                    const familiaText = u.familia || 'Sin Familia / Ninguno';
                                    const puntos = item.puntos;
                                    const userAvatar = u.avatar || 'https://i.imgur.com/6VBx3io.png';
                                    
                                    let rankBadge = `<span class="font-bold text-slate-400">#${index + 1}</span>`;
                                    if (index === 0) rankBadge = `<span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-black border border-amber-500/40 text-xs">🥇</span>`;
                                    else if (index === 1) rankBadge = `<span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300/20 text-slate-300 font-black border border-slate-300/40 text-xs">🥈</span>`;
                                    else if (index === 2) rankBadge = `<span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700/20 text-amber-600 font-black border border-amber-700/40 text-xs">🥉</span>`;

                                    let modoArr = ['NORMAL'];
                                    try {
                                        if (u.modo) {
                                            modoArr = u.modo.startsWith('[') ? JSON.parse(u.modo) : [u.modo];
                                        }
                                    } catch (e) {
                                        modoArr = [u.modo || 'NORMAL'];
                                    }
                                    const modoText = Array.isArray(modoArr) ? modoArr.join(', ') : modoArr;

                                    return `
                                        <tr class="hover:bg-wine-900/30 transition-colors ${index === 0 ? 'bg-amber-500/5' : ''}">
                                            <td class="py-3 px-4 text-center font-bold">
                                                ${rankBadge}
                                            </td>
                                            <td class="py-3 px-4 font-bold text-slate-100 flex items-center gap-2">
                                                <div class="w-7 h-7 rounded-full overflow-hidden bg-wine-900 border border-wine-700/60 flex-shrink-0">
                                                    <img src="${escapeHtml(userAvatar)}" onerror="this.src='https://i.imgur.com/6VBx3io.png'" class="w-full h-full object-cover">
                                                </div>
                                                <span>${escapeHtml(uname)}</span>
                                            </td>
                                            <td class="py-3 px-4 text-center font-extrabold text-amber-400">
                                                ${puntos} pts
                                            </td>
                                            <td class="py-3 px-4 text-slate-300 font-medium">
                                                ${escapeHtml(familiaText)}
                                            </td>
                                            <td class="py-3 px-4 text-wine-300 font-medium">
                                                <span class="px-2.5 py-1 rounded-lg bg-wine-950/80 border border-wine-800 text-wine-300 text-xs font-semibold">
                                                    ${escapeHtml(modoText)}
                                                </span>
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    ` : `<p class="text-xs text-slate-500 italic py-2">No hay miembros asignados a este Tier actualmente.</p>`}
                </div>
            </div>
        `;
    }).join('');
}

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

document.addEventListener('DOMContentLoaded', () => {
    const formReg = document.getElementById('form-register');
    if (formReg) formReg.addEventListener('submit', handleRegister);

    const formLog = document.getElementById('form-login');
    if (formLog) formLog.ondblclick = null;
    if (formLog) formLog.addEventListener('submit', handleLogin);

    const formProfile = document.getElementById('form-profile-edit');
    if (formProfile) formProfile.addEventListener('submit', handleSaveProfile);

    document.addEventListener('click', (e) => {
        const btn = document.getElementById('mode-dropdown-btn');
        const menu = document.getElementById('mode-dropdown-menu');
        if (btn && menu && !btn.contains(e.target) && !menu.contains(e.target)) {
            menu.classList.add('hidden');
        }
    });

    fetchUsers().then(() => renderPublicTiers());
    navigateTo('view-home');
});
