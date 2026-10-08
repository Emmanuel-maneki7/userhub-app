console.log("Sistema UserHub listo y conectado");

const API_URL = 'https://userhub-app.onrender.com/api/users';

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
    clans: JSON.parse(localStorage.getItem('uh_clans')) || ['Sin Clan / Ninguno', 'Clan Alpha', 'Audition Kings'],
    assignments: JSON.parse(localStorage.getItem('uh_assignments')) || {},
    users: []
};

function saveState() {
    localStorage.setItem('uh_tiers', JSON.stringify(state.tiers));
    localStorage.setItem('uh_tags', JSON.stringify(state.tags));
    localStorage.setItem('uh_clans', JSON.stringify(state.clans));
    localStorage.setItem('uh_assignments', JSON.stringify(state.assignments));
    if (state.currentUser) {
        localStorage.setItem('uh_current_user', JSON.stringify(state.currentUser));
    } else {
        localStorage.removeItem('uh_current_user');
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
    if (viewId === 'view-home') renderPublicTiers();
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

        if (ctaButtons) {
            ctaButtons.innerHTML = `
                <button onclick="navigateTo('view-profile-card')" class="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow-lg shadow-indigo-600/30 hover:scale-[1.02] flex items-center space-x-2">
                    <i class="ph-bold ph-user text-lg"></i>
                    <span>Ver Mi Perfil</span>
                </button>
            `;
        }
    } else {
        navContainer.innerHTML = `
            <button onclick="navigateTo('view-login')" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1 border border-slate-700">
                <i class="ph-bold ph-sign-in"></i> <span>Iniciar Sesión</span>
            </button>
            <button onclick="navigateTo('view-register')" class="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1">
                <i class="ph-bold ph-user-plus"></i> <span>Registrarse</span>
            </button>
        `;

        if (ctaButtons) {
            ctaButtons.innerHTML = `
                <button onclick="navigateTo('view-register')" class="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow-lg shadow-indigo-600/30 hover:scale-[1.02] flex items-center space-x-2">
                    <i class="ph-bold ph-user-plus text-lg"></i>
                    <span>Registrarse Ahora</span>
                </button>
                <button onclick="navigateTo('view-login')" class="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 transition-all hover:scale-[1.02] flex items-center space-x-2">
                    <i class="ph-bold ph-sign-in text-lg"></i>
                    <span>Iniciar Sesión</span>
                </button>
            `;
        }
    }
}

async function fetchUsers() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`Estado HTTP: ${response.status}`);
        const users = await response.json();
        state.users = users;
        renderPublicTiers();
        return users;
    } catch (error) {
        console.error('Error al conectar con el servidor:', error);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const nickname = document.getElementById('reg-nickname')?.value.trim();
    const password = document.getElementById('reg-password')?.value;

    if (!nickname || !password) {
        alert("Por favor completa todos los campos.");
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nickname, password })
        });

        if (response.ok) {
            alert("¡Usuario registrado exitosamente!");
            state.currentUser = { nickname, nombres: nickname, modo: ['NORMAL'], familia: state.clans[0] || 'Sin Clan' };
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
        state.currentUser = { nickname: 'Admin', nombres: 'Administrador Principal', modo: ['ALL MODES'], familia: 'UserHub HQ' };
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

        state.currentUser = {
            nickname: foundUser.name || foundUser.nickname || nickname,
            nombres: foundUser.name || nickname,
            modo: ['NORMAL'],
            familia: state.clans[0] || 'Sin Clan'
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

// MULTISELECT MODO PREFERIDO
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

function handleSaveProfile(e) {
    e.preventDefault();
    if (!state.currentUser) return;

    state.currentUser.nombres = document.getElementById('prof-nombres').value;
    state.currentUser.modo = getSelectedModes();
    state.currentUser.familia = document.getElementById('prof-familia').value;

    saveState();
    alert("Perfil actualizado correctamente.");
    navigateTo('view-profile-card');
}

function fillProfileEditForm() {
    if (!state.currentUser) return;
    document.getElementById('prof-nickname').value = state.currentUser.nickname || '';
    document.getElementById('prof-nombres').value = state.currentUser.nombres || '';

    // Llenar Clanes
    const clanSelect = document.getElementById('prof-familia');
    if (clanSelect) {
        clanSelect.innerHTML = state.clans.map(clan => `
            <option value="${escapeHtml(clan)}" ${state.currentUser.familia === clan ? 'selected' : ''}>
                ${escapeHtml(clan)}
            </option>
        `).join('');
    }

    // Marcar Modos
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
    const tier = state.tiers.find(t => t.id === assign.tierId);
    const userTagIds = assign.tagIds || [];
    const userTags = state.tags.filter(t => userTagIds.includes(t.id));
    const modosText = Array.isArray(state.currentUser.modo) ? state.currentUser.modo.join(', ') : (state.currentUser.modo || 'NORMAL');

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
                    <span class="block text-xs text-slate-500 uppercase font-semibold">Modo Preferido</span>
                    <span class="text-slate-200 text-sm font-medium">${escapeHtml(modosText)}</span>
                </div>
                <div>
                    <span class="block text-xs text-slate-500 uppercase font-semibold">Clan / Familia</span>
                    <span class="text-slate-200 text-sm font-medium">${escapeHtml(state.currentUser.familia || 'Sin Clan')}</span>
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

// ADMIN FUNCTIONS
function renderAdminPanel() {
    renderAdminTiersList();
    renderAdminTagsList();
    renderAdminClansList();
    renderAdminUserTable();
}

function handleCreateTier(e) {
    e.preventDefault();
    const nameInput = document.getElementById('tier-name');
    const colorInput = document.getElementById('tier-color');

    const name = nameInput.value.trim();
    const color = colorInput.value;

    if (!name) return;

    state.tiers.push({ id: 'tier-' + Date.now(), name, color });
    saveState();

    nameInput.value = '';
    renderAdminPanel();
    alert(`Tier "${name}" creado con éxito.`);
}

function deleteTier(tierId) {
    state.tiers = state.tiers.filter(t => t.id !== tierId);
    saveState();
    renderAdminPanel();
}

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

// GESTIÓN DE CLANES
function handleCreateClan(e) {
    e.preventDefault();
    const clanInput = document.getElementById('clan-name');
    const clanName = clanInput.value.trim();

    if (!clanName) return;
    if (state.clans.includes(clanName)) {
        alert("Este clan ya existe.");
        return;
    }

    state.clans.push(clanName);
    saveState();
    clanInput.value = '';
    renderAdminPanel();
    alert(`Clan "${clanName}" creado.`);
}

function deleteClan(clanName) {
    state.clans = state.clans.filter(c => c !== clanName);
    saveState();
    renderAdminPanel();
}

function renderAdminClansList() {
    const container = document.getElementById('admin-clans-list');
    if (!container) return;

    if (state.clans.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-500 italic">No hay clanes creados.</p>`;
        return;
    }

    container.innerHTML = state.clans.map(clan => `
        <div class="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <span class="font-bold text-slate-200">${escapeHtml(clan)}</span>
            <button onclick="deleteClan('${escapeHtml(clan)}')" class="text-slate-500 hover:text-red-400 transition-colors">
                <i class="ph-bold ph-trash"></i>
            </button>
        </div>
    `).join('');
}

function renderAdminUserTable() {
    const tbody = document.getElementById('admin-table-body');
    if (!tbody) return;

    const allUsers = [...state.users];
    if (!allUsers.find(u => (u.name || u.nickname) === 'Admin')) {
        allUsers.unshift({ name: 'Admin', email: 'admin@userhub.com' });
    }

    if (allUsers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="py-4 text-center text-slate-500 text-xs">No hay usuarios registrados.</td></tr>`;
        return;
    }

    tbody.innerHTML = allUsers.map(user => {
        const username = user.name || user.nickname || 'Usuario';
        const userAssign = state.assignments[username] || { tierId: '', tagIds: [] };

        return `
            <tr class="hover:bg-slate-950/40 transition-colors">
                <td class="py-3 px-4 font-semibold text-indigo-400">${escapeHtml(username)}</td>
                <td class="py-3 px-4 text-slate-300">${escapeHtml(user.email || 'N/A')}</td>
                
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

function assignUserTier(username, tierId) {
    if (!state.assignments[username]) {
        state.assignments[username] = { tierId: '', tagIds: [] };
    }
    state.assignments[username].tierId = tierId;
    saveState();
    renderPublicTiers();
}

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

function renderPublicTiers() {
    const container = document.getElementById('public-tiers-container');
    if (!container) return;

    if (!state.currentUser) {
        container.innerHTML = `
            <div class="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4">
                <div class="w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mx-auto">
                    <i class="ph-bold ph-lock-key text-2xl"></i>
                </div>
                <h3 class="text-xl font-bold text-white">Contenido Privado</h3>
                <p class="text-slate-400 text-sm max-w-md mx-auto">
                    Debes registrarte o iniciar sesión con tu cuenta para visualizar las tablas de posiciones TIER y los miembros de la comunidad.
                </p>
                <div class="pt-2 flex justify-center gap-3">
                    <button onclick="navigateTo('view-login')" class="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all">
                        Iniciar Sesión
                    </button>
                    <button onclick="navigateTo('view-register')" class="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-sm font-semibold transition-all">
                        Registrarse
                    </button>
                </div>
            </div>
        `;
        return;
    }

    if (state.tiers.length === 0) {
        container.innerHTML = `<p class="text-slate-500 text-sm text-center py-8">No se han creado Tiers aún en la administración.</p>`;
        return;
    }

    container.innerHTML = state.tiers.map(tier => {
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
    if (formLog) formLog.addEventListener('submit', handleLogin);

    // Cerrar el menú desplegable si se hace clic afuera
    document.addEventListener('click', (e) => {
        const btn = document.getElementById('mode-dropdown-btn');
        const menu = document.getElementById('mode-dropdown-menu');
        if (btn && menu && !btn.contains(e.target) && !menu.contains(e.target)) {
            menu.classList.add('hidden');
        }
    });

    fetchUsers();
    navigateTo('view-home');
});
