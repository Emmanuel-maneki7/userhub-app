console.log("Sistema Audition World Class LATAM listo y conectado");

const API_BASE = 'https://userhub-app.onrender.com/api';
const API_URL = `${API_BASE}/users`;

let state = {
    currentUser: JSON.parse(localStorage.getItem('uh_current_user')) || null,
    tabs: [],
    tiers: [],
    tags: [
        { id: 'tag-vip', name: 'VIP', color: '#c92a52' },
        { id: 'tag-pro', name: 'PRO', color: '#800020' },
        { id: 'tag-mod', name: 'MODERADOR', color: '#2563eb' }
    ],
    clans: JSON.parse(localStorage.getItem('uh_clans')) || ['Sin Familia / Ninguno', 'TalentYouth', 'Audition Kings'],
    assignments: JSON.parse(localStorage.getItem('uh_assignments')) || {},
    users: [],
    activeEvent: JSON.parse(localStorage.getItem('uh_active_event')) || null,
    eventHistory: JSON.parse(localStorage.getItem('uh_event_history')) || []
};

let activeTabId = null;

// Solo admin/mod conservan el evento activo en localStorage; el resto siempre lo pide al servidor
if (!(state.currentUser && (state.currentUser.nickname.toLowerCase() === 'admin' || state.currentUser.role === 'MODERATOR'))) {
    state.activeEvent = null;
    localStorage.removeItem('uh_active_event');
}

// ===== HELPERS NUEVOS =====
function isPrivilegedUser() {
    return !!state.currentUser && (
        state.currentUser.nickname.toLowerCase() === 'admin' ||
        state.currentUser.role === 'MODERATOR'
    );
}

const MAX_HISTORY = 15;

// Re-render sin tocar el servidor (se usa en TODAS las acciones del admin)
function refreshTournamentViews() {
    renderTournamentAdmin();
    renderUserEventsView(true);
}

// ===== GUARDADO / CARGA DEL EVENTO ACTIVO =====
// El SERVIDOR es la fuente de verdad. Cada navegador (admin, moderador o usuario) solo
// manda cambios cuando el evento realmente cambió localmente, y en cualquier otro caso
// se sincroniza con lo que diga el servidor (incluido "ya no existe").
let saveEventTimer = null;
let eventRev = 0;          // sube con cada cambio/borrado local (descarta respuestas GET atrasadas)
let eventDirty = false;    // hay cambios locales aún no confirmados por el servidor

function eventPayloadJson(evt) {
    // El historial de "Retroceder" NO se sincroniza (es local y pesado)
    const { historyStates, ...payload } = evt;
    return JSON.stringify(payload);
}

// Lo que se cargó de localStorage se considera ya sincronizado (no se vuelve a subir tal cual)
let lastSyncedJson = state.activeEvent ? eventPayloadJson(state.activeEvent) : null;

function persistActiveEventLocal() {
    try {
        if (state.activeEvent && isPrivilegedUser()) {
            localStorage.setItem('uh_active_event', JSON.stringify(state.activeEvent));
        } else {
            localStorage.removeItem('uh_active_event');
        }
    } catch (e) {
        console.error("localStorage lleno o fallando:", e);
    }
}

function saveActiveEventToDB() {
    if (!state.activeEvent) return;

    const json = eventPayloadJson(state.activeEvent);
    if (json === lastSyncedJson) return; // nada cambió: no se sube (evita resucitar eventos viejos)

    eventRev++;
    eventDirty = true;

    clearTimeout(saveEventTimer);
    saveEventTimer = setTimeout(async () => {
        if (!state.activeEvent) return;
        const jsonToSend = eventPayloadJson(state.activeEvent);
        try {
            const { historyStates, ...payload } = state.activeEvent;
            const res = await fetch(`${API_BASE}/events/active`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                lastSyncedJson = jsonToSend;
                eventDirty = !!state.activeEvent && eventPayloadJson(state.activeEvent) !== jsonToSend;
            } else {
                console.error("El servidor rechazó el evento:", res.status);
            }
        } catch (err) {
            console.error("Error guardando evento en DB:", err);
        }
    }, 300);
}

// Se llama cuando el evento se elimina o se archiva en este navegador
function markEventRemovedLocally() {
    clearTimeout(saveEventTimer);
    eventRev++;
    eventDirty = false;
    lastSyncedJson = null;
}

// Un evento válido siempre trae título y estado
function isValidEvent(data) {
    return !!data && typeof data === 'object' && !!data.title && !!data.status;
}

async function fetchActiveEventFromDB() {
    // Si hay cambios locales sin confirmar, no se pisan con datos del servidor
    if (eventDirty) return;
    const revAtStart = eventRev;

    try {
        // cache:'no-store' + parámetro único: evita que el navegador devuelva una respuesta vieja
        const res = await fetch(`${API_BASE}/events/active?_=${Date.now()}`, { cache: 'no-store' });

        // Si mientras esperábamos hubo un cambio local, esta respuesta ya está vieja
        if (eventDirty || revAtStart !== eventRev) return;

        // 404 / 204 = "no hay evento activo"
        if (res.status === 404 || res.status === 204) {
            state.activeEvent = null;
            lastSyncedJson = null;
            persistActiveEventLocal();
            return;
        }
        if (!res.ok) return; // error del servidor: se conserva lo que había

        let data = null;
        const text = await res.text();
        if (eventDirty || revAtStart !== eventRev) return;

        if (text) {
            try { data = JSON.parse(text); } catch (e) { data = null; }
            if (typeof data === 'string') { try { data = JSON.parse(data); } catch (e) { data = null; } }
        }

        if (isValidEvent(data)) {
            if (state.activeEvent && state.activeEvent.historyStates && state.activeEvent.id === data.id) {
                data.historyStates = state.activeEvent.historyStates;
            }
            state.activeEvent = data;
            lastSyncedJson = eventPayloadJson(data);
        } else {
            // null, {} o respuesta sin evento = fue eliminado: todos (también admin/mod) lo dejan de ver
            state.activeEvent = null;
            lastSyncedJson = null;
        }
        persistActiveEventLocal();
    } catch (err) {
        console.error("Error obteniendo evento activo de DB:", err);
    }
}

function saveState() {
    try {
        localStorage.setItem('uh_clans', JSON.stringify(state.clans));
        localStorage.setItem('uh_assignments', JSON.stringify(state.assignments));
        localStorage.setItem('uh_event_history', JSON.stringify(state.eventHistory));

        if (state.currentUser) {
            localStorage.setItem('uh_current_user', JSON.stringify(state.currentUser));
        } else {
            localStorage.removeItem('uh_current_user');
        }
    } catch (e) {
        console.error("localStorage lleno o fallando:", e);
    }
    persistActiveEventLocal();

    // Solo admin/mod publican, y únicamente si el evento cambió respecto a lo sincronizado
    if (state.activeEvent && isPrivilegedUser()) saveActiveEventToDB();
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
    const isPrivileged = isPrivilegedUser();

    if ((viewId === 'view-admin' || viewId === 'view-event-history') && !isPrivileged) {
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
    if (viewId === 'view-admin') Promise.all([fetchUsers(), fetchActiveEventFromDB()]).then(() => { renderAdminPanel(); renderTournamentAdmin(); });
    if (viewId === 'view-events') renderUserEventsView();
    if (viewId === 'view-event-history') renderEventHistory();
    if (viewId === 'view-profile-card') renderProfileCard();
    if (viewId === 'view-profile-edit') fillProfileEditForm();
}

function renderNavActions() {
    const navContainer = document.getElementById('nav-actions');
    const ctaButtons = document.getElementById('home-cta-buttons');
    if (!navContainer) return;

    if (state.currentUser) {
        const isPrivileged = isPrivilegedUser();
        navContainer.innerHTML = `
            <span class="text-xs text-wine-300 hidden sm:inline">Hola, <b class="text-wine-400">${escapeHtml(state.currentUser.nickname)}</b></span>
            <button onclick="navigateTo('view-events')" class="px-3 py-1.5 rounded-lg bg-wine-950 hover:bg-wine-900 text-wine-200 text-xs font-semibold flex items-center space-x-1 border border-wine-800">
                <i class="ph-bold ph-calendar-star"></i> <span>Eventos</span>
            </button>
            <button onclick="navigateTo('view-tiers')" class="px-3 py-1.5 rounded-lg bg-wine-950 hover:bg-wine-900 text-wine-200 text-xs font-semibold flex items-center space-x-1 border border-wine-800">
                <i class="ph-bold ph-ranking"></i> <span>Tabla Tiers</span>
            </button>
            ${isPrivileged ? `
                <button onclick="navigateTo('view-event-history')" class="px-3 py-1.5 rounded-lg bg-wine-950 hover:bg-wine-900 text-wine-200 text-xs font-semibold flex items-center space-x-1 border border-wine-800">
                    <i class="ph-bold ph-clock-counter-clockwise"></i> <span>Historial</span>
                </button>
                <button onclick="navigateTo('view-admin')" class="px-3 py-1.5 rounded-lg bg-wine-700 hover:bg-wine-600 text-white text-xs font-semibold flex items-center space-x-1 shadow-md shadow-wine-900/40">
                    <i class="ph-bold ph-shield-check"></i> <span>Panel Admin</span>
                </button>
            ` : ''}
            <button onclick="navigateTo('view-profile-card')" class="px-3 py-1.5 rounded-lg bg-wine-950 hover:bg-wine-900 text-wine-200 text-xs font-semibold flex items-center space-x-1 border border-wine-800">
                <i class="ph-bold ph-user"></i> <span>Mi Perfil</span>
            </button>
            <button onclick="handleLogout()" class="px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/50 text-red-400 text-xs font-semibold flex items-center space-x-1 border border-red-900/50">
                <i class="ph-bold ph-sign-out"></i> <span>Salir</span>
            </button>
        `;

        if (ctaButtons) {
            ctaButtons.innerHTML = `
                <button onclick="navigateTo('view-events')" class="px-6 py-3 rounded-xl bg-wine-700 hover:bg-wine-600 text-white font-semibold transition-all shadow-lg shadow-wine-900/50 hover:scale-[1.02] flex items-center space-x-2">
                    <i class="ph-bold ph-calendar-star text-lg"></i>
                    <span>Ver Eventos en Vivo</span>
                </button>
                <button onclick="navigateTo('view-tiers')" class="px-6 py-3 rounded-xl bg-wine-950 hover:bg-wine-900 text-slate-200 font-semibold border border-wine-800 transition-all hover:scale-[1.02] flex items-center space-x-2">
                    <i class="ph-bold ph-ranking text-lg"></i>
                    <span>Ver Tabla Tiers</span>
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
            if (u.role === 'MODERATOR') {
                if (!state.assignments[username].tagIds.includes('tag-mod')) {
                    state.assignments[username].tagIds.push('tag-mod');
                }
            }
        });

        populateRegisteredUsersSelect();
        return users;
    } catch (error) {
        console.error('Error al conectar con el servidor:', error);
    }
}

// LÓGICA DE TORNEO SUIZO Y PLAYOFFS
let tempParticipants = [];

function populateRegisteredUsersSelect() {
    const select = document.getElementById('registered-user-select');
    if (!select) return;

    const registeredOnly = state.users.filter(u => (u.nickname || u.name || '').toLowerCase() !== 'admin');
    
    select.innerHTML = `<option value="">Seleccionar Usuario Registrado...</option>` +
        registeredOnly.map(u => `
            <option value="${u.id}">${escapeHtml(u.nickname || u.name)}</option>
        `).join('');
}

function startNewEvent() {
    const title = document.getElementById('event-title-input').value.trim();
    const rounds = parseInt(document.getElementById('event-rounds-input').value, 10) || 3;
    const songInput = document.getElementById('event-song-list-input')?.value || '';

    if (!title) {
        alert("Por favor ingresa un nombre para el evento.");
        return;
    }

    const songPool = songInput
        .split(/[\n,]+/)
        .map(s => s.trim())
        .filter(s => s.length > 0);

    state.activeEvent = {
        id: 'evt-' + Date.now(),
        title,
        maxSwissRounds: rounds,
        currentRound: 0,
        status: 'SETUP',
        participants: [],
        swissRounds: [],
        leaderboard: [],
        playoffs: null,
        songPool: songPool,
        historyStates: []
    };

    tempParticipants = [];
    saveState();
    
    document.getElementById('event-registration-area').classList.remove('hidden');
    renderParticipantsBadges();
    alert(`Evento "${title}" creado. Ahora inscribe a los participantes.`);
}

function updateTournamentSongsFromAdmin() {
    if (!state.activeEvent) {
        alert("No hay ningún torneo activo.");
        return;
    }
    const songInput = document.getElementById('event-song-list-input')?.value || '';
    const songPool = songInput
        .split(/[\n,]+/)
        .map(s => s.trim())
        .filter(s => s.length > 0);

    state.activeEvent.songPool = songPool;
    saveState();
    alert("¡Lista de canciones actualizada con éxito!");
}

function addRegisteredPlayerToEvent() {
    const select = document.getElementById('registered-user-select');
    const userId = select.value;
    if (!userId) return;

    const user = state.users.find(u => String(u.id) === String(userId));
    if (!user) return;

    const uname = user.nickname || user.name;
    if (tempParticipants.some(p => p.name === uname)) {
        alert("El usuario ya está inscrito.");
        return;
    }

    tempParticipants.push({
        id: `usr-${user.id}`,
        name: uname,
        avatar: user.avatar || 'https://i.imgur.com/6VBx3io.png',
        isBot: false,
        points: 0,
        playedAgainst: []
    });

    renderParticipantsBadges();
}

function addBotToEvent() {
    const botInput = document.getElementById('bot-name-input');
    const name = botInput.value.trim() || `Bot_${tempParticipants.length + 1}`;

    if (tempParticipants.some(p => p.name === name)) {
        alert("Ya existe un participante o bot con ese nombre.");
        return;
    }

    tempParticipants.push({
        id: `bot-${Date.now()}-${Math.floor(Math.random()*10000)}`,
        name: name,
        avatar: '🤖',
        isBot: true,
        points: 0,
        playedAgainst: []
    });

    botInput.value = '';
    renderParticipantsBadges();
}

function removeParticipantFromSetup(id) {
    tempParticipants = tempParticipants.filter(p => String(p.id) !== String(id));
    renderParticipantsBadges();
}

function renderParticipantsBadges() {
    const container = document.getElementById('event-participants-badges');
    if (!container) return;

    if (tempParticipants.length === 0) {
        container.innerHTML = `<span class="text-xs text-slate-500 italic">No hay inscritos aún.</span>`;
        return;
    }

    container.innerHTML = tempParticipants.map(p => `
        <span class="inline-flex items-center space-x-2 px-3 py-1 rounded-xl bg-wine-900 border border-wine-700 text-xs text-white">
            ${p.isBot ? '🤖' : `<img src="${escapeHtml(p.avatar)}" class="w-4 h-4 rounded-full object-cover">`}
            <span class="font-bold">${escapeHtml(p.name)}</span>
            <button onclick="removeParticipantFromSetup('${p.id}')" class="text-slate-400 hover:text-red-400 ml-1">
                <i class="ph-bold ph-x"></i>
            </button>
        </span>
    `).join('');
}

function saveHistoryState() {
    if (!state.activeEvent) return;
    if (!state.activeEvent.historyStates) state.activeEvent.historyStates = [];
    state.activeEvent.historyStates.push(JSON.parse(JSON.stringify({
        currentRound: state.activeEvent.currentRound,
        maxSwissRounds: state.activeEvent.maxSwissRounds,
        status: state.activeEvent.status,
        participants: state.activeEvent.participants,
        swissRounds: state.activeEvent.swissRounds,
        leaderboard: state.activeEvent.leaderboard,
        playoffs: state.activeEvent.playoffs
    })));
    if (state.activeEvent.historyStates.length > MAX_HISTORY) {
        state.activeEvent.historyStates.shift();
    }
}

function undoTournamentStep() {
    const evt = state.activeEvent;
    if (!evt || !evt.historyStates || evt.historyStates.length === 0) {
        alert("No hay pasos anteriores para retroceder.");
        return;
    }

    const prev = evt.historyStates.pop();
    Object.assign(evt, prev);

    saveState();
    refreshTournamentViews();
}

async function deleteActiveEvent() {
    if (!state.activeEvent) return;

    const confirmacion = confirm(`⚠️ ¿Estás seguro de que deseas eliminar permanentemente el torneo activo "${state.activeEvent.title}"? Esta acción no se puede deshacer.`);
    if (!confirmacion) return;

    markEventRemovedLocally();
    state.activeEvent = null;
    localStorage.removeItem('uh_active_event');

    let serverOk = true;
    try {
        const res = await fetch(`${API_BASE}/events/active`, {
            method: 'DELETE'
        });
        if (!res.ok) {
            serverOk = false;
            console.error("El servidor no pudo borrar el evento. Estado HTTP:", res.status);
        }
    } catch (err) {
        serverOk = false;
        console.error("Error al borrar evento activo en servidor:", err);
    }

    refreshTournamentViews();
    if (serverOk) {
        alert("El torneo activo ha sido eliminado correctamente.");
    } else {
        alert("⚠️ Se eliminó en tu panel, pero el servidor NO confirmó el borrado: los demás usuarios podrían seguir viéndolo. Revisa la ruta DELETE /api/events/active en el backend.");
    }
}

function deleteHistoryEvent(index) {
    if (index < 0 || index >= state.eventHistory.length) return;

    const evt = state.eventHistory[index];
    const confirmacion = confirm(`⚠️ ¿Estás seguro de eliminar el torneo "${evt.title}" del historial?`);
    if (!confirmacion) return;

    state.eventHistory.splice(index, 1);
    saveState();
    renderEventHistory();
    alert("Torneo eliminado del historial.");
}

function getRandomSong() {
    if (!state.activeEvent || !state.activeEvent.songPool || state.activeEvent.songPool.length === 0) {
        return "Canción Libre (Sin lista configurada)";
    }
    const pool = state.activeEvent.songPool;
    return pool[Math.floor(Math.random() * pool.length)];
}

function generateFirstSwissRound() {
    if (tempParticipants.length < 2) {
        alert("Se necesitan al menos 2 participantes para iniciar.");
        return;
    }

    saveHistoryState();
    state.activeEvent.participants = JSON.parse(JSON.stringify(tempParticipants));
    state.activeEvent.status = 'SWISS';
    state.activeEvent.currentRound = 1;
    state.activeEvent.swissRounds = [];

    generatePairingsForRound(1);
    saveState();
    refreshTournamentViews();
}

function generatePairingsForRound(roundNum) {
    const evt = state.activeEvent;
    updateLeaderboard();

    // Orden real por puntos (del leaderboard), no por p.points
    const pointsOf = {};
    evt.leaderboard.forEach(item => { pointsOf[item.participant.id] = item.points; });

    let pool = evt.participants.filter(p => p.id !== 'bot-bye');
    pool.sort((a, b) => (pointsOf[b.id] || 0) - (pointsOf[a.id] || 0));

    // Un solo BOT_LIBRE reutilizable cuando hay cantidad impar
    if (pool.length % 2 !== 0) {
        let bye = evt.participants.find(p => p.id === 'bot-bye');
        if (!bye) {
            bye = { id: 'bot-bye', name: 'BOT_LIBRE', avatar: '🤖', isBot: true, points: 0, playedAgainst: [] };
            evt.participants.push(bye);
        }
        pool.push(bye);
    }

    const matches = [];
    const paired = new Set();

    for (let i = 0; i < pool.length; i++) {
        const p1 = pool[i];
        if (paired.has(p1.id)) continue;

        let p2 = pool.find((p, j) => j > i && !paired.has(p.id) && !p1.playedAgainst.includes(p.id));
        if (!p2) p2 = pool.find((p, j) => j > i && !paired.has(p.id));
        if (!p2) continue;

        paired.add(p1.id);
        paired.add(p2.id);

        // Si le toca el bye, el jugador real gana automáticamente
        let winnerId = null;
        if (p1.id === 'bot-bye') winnerId = String(p2.id);
        if (p2.id === 'bot-bye') winnerId = String(p1.id);

        matches.push({
            matchId: `m-${roundNum}-${matches.length}`,
            playerA: p1,
            playerB: p2,
            winnerId,
            pointsAwarded: 3
        });
    }

    evt.swissRounds.push({
        roundNumber: roundNum,
        matches,
        currentSong: getRandomSong(),
        isCompleted: false
    });

    updateLeaderboard();
}

function reRollRoundSong(roundIndex) {
    const evt = state.activeEvent;
    if (!evt || !evt.swissRounds[roundIndex]) return;

    saveHistoryState();
    evt.swissRounds[roundIndex].currentSong = getRandomSong();
    saveState();
    refreshTournamentViews();
}

function setMatchWinner(roundIndex, matchIndex, winnerId, customPoints = 3) {
    const evt = state.activeEvent;
    const round = evt && evt.swissRounds[roundIndex];
    if (!round || !round.matches[matchIndex]) return;

    saveHistoryState();
    const match = round.matches[matchIndex];

    // Segundo clic sobre el mismo ganador = desmarcar
    if (String(match.winnerId) === String(winnerId)) {
        match.winnerId = null;
    } else {
        match.winnerId = String(winnerId);
        match.pointsAwarded = parseInt(customPoints, 10) || 3;
    }

    updateLeaderboard();
    saveState();
    refreshTournamentViews();
}

function updateLeaderboard() {
    const evt = state.activeEvent;
    const scores = {};

    evt.participants.forEach(p => {
        scores[p.id] = { participant: p, points: 0, wins: 0, losses: 0 };
    });

    evt.swissRounds.forEach(round => {
        round.matches.forEach(m => {
            if (!m.winnerId) return;
            const winner = scores[m.winnerId];
            const loserId = String(m.playerA.id) === String(m.winnerId) ? m.playerB.id : m.playerA.id;
            if (winner) {
                winner.points += m.pointsAwarded || 3;
                winner.wins += 1;
            }
            if (scores[loserId]) scores[loserId].losses += 1;
        });
    });

    evt.leaderboard = Object.values(scores)
        .filter(s => s.participant.id !== 'bot-bye')
        .sort((a, b) => b.points - a.points || b.wins - a.wins);
}

function registerPlayedAgainst(roundObj) {
    const evt = state.activeEvent;
    roundObj.matches.forEach(m => {
        const p1 = evt.participants.find(p => String(p.id) === String(m.playerA.id));
        const p2 = evt.participants.find(p => String(p.id) === String(m.playerB.id));
        if (p1 && p2) {
            if (!p1.playedAgainst.includes(p2.id)) p1.playedAgainst.push(p2.id);
            if (!p2.playedAgainst.includes(p1.id)) p2.playedAgainst.push(p1.id);
        }
    });
}

function nextSwissRound() {
    const evt = state.activeEvent;
    const currentRoundObj = evt.swissRounds[evt.currentRound - 1];
    if (!currentRoundObj) return;

    if (!currentRoundObj.matches.every(m => m.winnerId !== null)) {
        if (!confirm("Hay partidas sin ganador marcado. ¿Deseas continuar a la siguiente ronda de todos modos?")) return;
    }

    saveHistoryState();
    currentRoundObj.isCompleted = true;
    registerPlayedAgainst(currentRoundObj);

    if (evt.currentRound < evt.maxSwissRounds) {
        evt.currentRound += 1;
        generatePairingsForRound(evt.currentRound);
    } else {
        alert("Has alcanzado el límite de rondas suizo programadas. Puedes agregar una ronda extra o generar los PlayOffs.");
    }

    saveState();
    refreshTournamentViews();
}

function addExtraSwissRound() {
    const evt = state.activeEvent;
    if (!evt) return;

    saveHistoryState();

    const cur = evt.swissRounds[evt.currentRound - 1];
    if (cur) {
        cur.isCompleted = true;
        registerPlayedAgainst(cur);
    }

    evt.maxSwissRounds += 1;
    evt.currentRound += 1;
    generatePairingsForRound(evt.currentRound);
    saveState();
    refreshTournamentViews();
}

function createPlayoffs() {
    const evt = state.activeEvent;
    const topCount = parseInt(prompt("¿Cuántos clasificados deseas en los PlayOffs? (Ej: 4 u 8)", "4"), 10) || 4;

    saveHistoryState();
    updateLeaderboard();

    const qualified = evt.leaderboard.slice(0, topCount).map(item => item.participant);

    for (let i = qualified.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [qualified[i], qualified[j]] = [qualified[j], qualified[i]];
    }

    const roundMatches = [];
    for (let i = 0; i < qualified.length; i += 2) {
        roundMatches.push({
            matchId: `po-1-${i}`,
            playerA: qualified[i],
            playerB: qualified[i + 1] || null,
            winnerId: qualified[i + 1] ? null : String(qualified[i].id)
        });
    }

    const firstName = qualified.length <= 2 ? 'GRAN FINAL' : (qualified.length <= 4 ? 'SEMIFINAL' : 'ELIMINATORIAS');

    evt.playoffs = {
        topCount,
        rounds: [{ roundName: firstName, matches: roundMatches, currentSong: getRandomSong() }],
        champion: null
    };

    evt.status = 'PLAYOFFS';
    saveState();
    refreshTournamentViews();
}

function setPlayoffWinner(roundIdx, matchIdx, winnerId) {
    const evt = state.activeEvent;
    const po = evt && evt.playoffs;
    if (!po || !po.rounds[roundIdx] || !po.rounds[roundIdx].matches[matchIdx]) return;

    saveHistoryState();

    const match = po.rounds[roundIdx].matches[matchIdx];
    const target = String(winnerId);
    // Clic sobre el que ya era ganador lo desmarca
    match.winnerId = (match.winnerId === target) ? null : target;

    // Cualquier cambio invalida las rondas siguientes y el campeón: se regeneran
    po.rounds = po.rounds.slice(0, roundIdx + 1);
    po.champion = null;
    if (evt.status === 'FINISHED') evt.status = 'PLAYOFFS';

    const currentRound = po.rounds[roundIdx];
    const allDone = currentRound.matches.every(m => m.winnerId);

    if (allDone) {
        const winners = currentRound.matches.map(m =>
            (m.playerA && String(m.playerA.id) === String(m.winnerId)) ? m.playerA : m.playerB
        ).filter(Boolean);

        if (winners.length === 1) {
            po.champion = winners[0];
            evt.status = 'FINISHED';
            alert(`🏆 ¡TENEMOS UN GANADOR DEL TORNEO!: ${winners[0].name}`);
        } else if (winners.length > 1) {
            const nextMatches = [];
            for (let i = 0; i < winners.length; i += 2) {
                nextMatches.push({
                    matchId: `po-${roundIdx + 2}-${i}`,
                    playerA: winners[i],
                    playerB: winners[i + 1] || null,
                    winnerId: winners[i + 1] ? null : String(winners[i].id)
                });
            }
            po.rounds.push({
                roundName: winners.length === 2 ? 'GRAN FINAL' : (winners.length === 4 ? 'SEMIFINAL' : `Ronda ${roundIdx + 2}`),
                matches: nextMatches,
                currentSong: getRandomSong()
            });
        }
    }

    saveState();
    refreshTournamentViews();
}

function finishAndSaveEvent() {
    if (!state.activeEvent) return;
    if (!confirm("¿Deseas finalizar y guardar este torneo en el Historial de Eventos?")) return;

    markEventRemovedLocally();
    state.activeEvent.status = 'FINISHED';

    // Se guarda sin el historial de "Retroceder" para no llenar el localStorage
    const copy = JSON.parse(JSON.stringify(state.activeEvent));
    delete copy.historyStates;
    state.eventHistory.unshift(copy);

    fetch(`${API_BASE}/events/active`, { method: 'DELETE' })
        .then(res => { if (!res.ok) console.error("El servidor no pudo borrar el evento. Estado HTTP:", res.status); })
        .catch(err => console.error(err));

    state.activeEvent = null;

    saveState();
    alert("Torneo guardado con éxito en el Historial.");
    navigateTo('view-event-history');
}

function renderTournamentAdmin() {
    const activeBox = document.getElementById('active-tournament-admin');
    const swissBox = document.getElementById('swiss-admin-container');

    if (!state.activeEvent || state.activeEvent.status === 'SETUP') {
        if (activeBox) activeBox.classList.add('hidden');
        return;
    }

    if (!activeBox || !swissBox) return;
    activeBox.classList.remove('hidden');

    if (state.activeEvent.status === 'SWISS') {
        const roundObj = state.activeEvent.swissRounds[state.activeEvent.currentRound - 1];
        if (!roundObj) return;

        swissBox.innerHTML = `
            <div class="flex items-center justify-between bg-wine-900/40 p-4 rounded-xl border border-wine-800">
                <div>
                    <h4 class="text-lg font-bold text-white">${escapeHtml(state.activeEvent.title)} - Ronda ${state.activeEvent.currentRound} de ${state.activeEvent.maxSwissRounds}</h4>
                    <p class="text-xs text-slate-400">Selecciona con ✔️ al ganador de cada enfrentamiento.</p>
                </div>
                <div class="flex space-x-2">
                    <button onclick="undoTournamentStep()" class="px-3 py-1.5 bg-amber-950 hover:bg-amber-900 text-amber-300 rounded-lg text-xs font-bold border border-amber-800/60 flex items-center space-x-1">
                        <i class="ph-bold ph-arrow-u-up-left"></i> <span>Retroceder</span>
                    </button>
                    <button onclick="addExtraSwissRound()" class="px-3 py-1.5 bg-wine-800 hover:bg-wine-700 text-white rounded-lg text-xs font-bold border border-wine-700">
                        + Ronda Extra
                    </button>
                    <button onclick="nextSwissRound()" class="px-4 py-1.5 bg-green-700 hover:bg-green-600 text-white rounded-lg text-xs font-bold shadow-lg">
                        Siguiente Ronda ➔
                    </button>
                    <button onclick="deleteActiveEvent()" class="px-3 py-1.5 bg-red-950/80 hover:bg-red-900 text-red-400 rounded-lg text-xs font-bold border border-red-800/60 transition-all flex items-center space-x-1" title="Eliminar torneo activo">
                        <i class="ph-bold ph-trash"></i> <span>Eliminar Torneo</span>
                    </button>
                </div>
            </div>

            ${roundObj && roundObj.currentSong ? `
                <div class="bg-gradient-to-r from-wine-950 via-wine-900 to-wine-950 p-4 rounded-xl border-2 border-amber-500/80 shadow-lg flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <div class="p-2.5 bg-amber-500/20 text-amber-400 rounded-lg text-xl border border-amber-500/40">
                            🎵
                        </div>
                        <div>
                            <span class="text-xs font-extrabold uppercase text-amber-400 tracking-wider block">La canción de esta ronda es:</span>
                            <span class="text-lg font-black text-white">${escapeHtml(roundObj.currentSong)}</span>
                        </div>
                    </div>
                    <button onclick="reRollRoundSong(${state.activeEvent.currentRound - 1})" class="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold shadow-md flex items-center space-x-1">
                        <i class="ph-bold ph-shuffle"></i> <span>Re-sortear Canción</span>
                    </button>
                </div>
            ` : ''}

            <div class="bg-[#090507] border border-wine-900 rounded-xl p-4">
                <div class="grid grid-cols-2 text-center font-bold text-wine-300 text-xs border-b border-wine-900 pb-2 mb-4">
                    <span>A</span>
                    <span>B</span>
                </div>

                <div class="space-y-3">
                    ${roundObj.matches.map((m, idx) => {
                        const isWinA = String(m.winnerId) === String(m.playerA.id);
                        const isWinB = m.playerB && String(m.winnerId) === String(m.playerB.id);

                        return `
                            <div class="flex items-center justify-between p-3 rounded-xl bg-wine-950/80 border border-wine-900">
                                <div class="flex items-center space-x-3 w-5/12 ${isWinA ? 'text-green-400 font-extrabold' : (m.winnerId ? 'text-red-500 opacity-60' : 'text-slate-200')}">
                                    ${m.playerA.isBot ? '<span class="text-lg">🤖</span>' : `<img src="${escapeHtml(m.playerA.avatar)}" class="w-8 h-8 rounded-full object-cover border border-wine-800">`}
                                    <span class="text-xs truncate">${escapeHtml(m.playerA.name)}</span>
                                    <button onclick="setMatchWinner(${state.activeEvent.currentRound - 1}, ${idx}, '${m.playerA.id}')" class="px-2 py-1 rounded ${isWinA ? 'bg-green-600 text-white' : 'bg-green-950 border border-green-800 text-green-400 hover:bg-green-900'} text-xs font-semibold">
                                        ✔️ Ganador
                                    </button>
                                </div>

                                <div class="text-xs font-black text-wine-400 px-2">VS</div>

                                <div class="flex items-center justify-end space-x-3 w-5/12 ${isWinB ? 'text-green-400 font-extrabold' : (m.winnerId ? 'text-red-500 opacity-60' : 'text-slate-200')}">
                                    ${m.playerB ? `
                                        <button onclick="setMatchWinner(${state.activeEvent.currentRound - 1}, ${idx}, '${m.playerB.id}')" class="px-2 py-1 rounded ${isWinB ? 'bg-green-600 text-white' : 'bg-green-950 border border-green-800 text-green-400 hover:bg-green-900'} text-xs font-semibold">
                                            ✔️ Ganador
                                        </button>
                                        <span class="text-xs truncate">${escapeHtml(m.playerB.name)}</span>
                                        ${m.playerB.isBot ? '<span class="text-lg">🤖</span>' : `<img src="${escapeHtml(m.playerB.avatar)}" class="w-8 h-8 rounded-full object-cover border border-wine-800">`}
                                    ` : '<span class="text-xs text-slate-500 italic">LIBRE</span>'}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <div class="bg-[#090507] border border-wine-900 rounded-xl p-4">
                <div class="flex items-center justify-between border-b border-wine-900 pb-2 mb-3">
                    <h5 class="text-sm font-bold text-wine-300">Tabla de Posiciones Suizo</h5>
                    <button onclick="createPlayoffs()" class="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg shadow-lg">
                        🏆 Crear PlayOffs
                    </button>
                </div>

                <table class="w-full text-left text-xs text-slate-300">
                    <thead class="text-wine-400 uppercase border-b border-wine-900/60">
                        <tr>
                            <th class="py-2">Puesto</th>
                            <th class="py-2">Jugador</th>
                            <th class="py-2 text-center">Puntos</th>
                            <th class="py-2 text-center">G / P</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-wine-900/40">
                        ${state.activeEvent.leaderboard.map((item, idx) => `
                            <tr>
                                <td class="py-2 font-bold text-wine-400">#${idx + 1}</td>
                                <td class="py-2 flex items-center space-x-2">
                                    ${item.participant.isBot ? '🤖' : `<img src="${escapeHtml(item.participant.avatar)}" class="w-5 h-5 rounded-full object-cover">`}
                                    <span class="font-bold text-white">${escapeHtml(item.participant.name)}</span>
                                </td>
                                <td class="py-2 text-center font-extrabold text-amber-400">${item.points} pts</td>
                                <td class="py-2 text-center text-slate-400">${item.wins}V / ${item.losses}D</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    if (state.activeEvent.status === 'PLAYOFFS' || state.activeEvent.status === 'FINISHED') {
        const po = state.activeEvent.playoffs;

        swissBox.innerHTML = `
            <div class="flex items-center justify-between bg-wine-900/40 p-4 rounded-xl border border-wine-800">
                <div>
                    <h4 class="text-lg font-bold text-white">${escapeHtml(state.activeEvent.title)} - Fase de PlayOffs</h4>
                    <p class="text-xs text-slate-400">Selecciona al ganador de cada llave del bracket.</p>
                </div>
                <div class="flex space-x-2">
                    <button onclick="undoTournamentStep()" class="px-3 py-1.5 bg-amber-950 hover:bg-amber-900 text-amber-300 rounded-lg text-xs font-bold border border-amber-800/60 flex items-center space-x-1">
                        <i class="ph-bold ph-arrow-u-up-left"></i> <span>Retroceder</span>
                    </button>
                    <button onclick="finishAndSaveEvent()" class="px-4 py-1.5 bg-green-700 hover:bg-green-600 text-white rounded-lg text-xs font-bold shadow-lg">
                        💾 Finalizar y Guardar en Historial
                    </button>
                    <button onclick="deleteActiveEvent()" class="px-3 py-1.5 bg-red-950/80 hover:bg-red-900 text-red-400 rounded-lg text-xs font-bold border border-red-800/60 transition-all flex items-center space-x-1" title="Eliminar torneo activo">
                        <i class="ph-bold ph-trash"></i> <span>Eliminar Torneo</span>
                    </button>
                </div>
            </div>

            ${renderPlayoffsBracketHTML(po, true)}
        `;
    }
}

async function renderUserEventsView(skipFetch = false) {
    if (!skipFetch) await fetchActiveEventFromDB();
    const container = document.getElementById('user-events-view-container');
    if (!container) return;

    if (!state.activeEvent || state.activeEvent.status === 'SETUP') {
        container.innerHTML = `
            <div class="bg-wine-950/60 border border-wine-900 rounded-2xl p-12 text-center space-y-4">
                <div class="w-16 h-16 rounded-2xl bg-wine-900/50 border border-wine-700/50 text-wine-400 flex items-center justify-center mx-auto">
                    <i class="ph-bold ph-calendar-x text-3xl"></i>
                </div>
                <h3 class="text-2xl font-bold text-white">Próximamente</h3>
                <p class="text-slate-400 text-sm max-w-md mx-auto">
                    No hay ningún evento o torneo en vivo en este momento. Estaremos informando en nuestras redes sociales oficiales.
                </p>
            </div>
        `;
        return;
    }

    const evt = state.activeEvent;
    const currentSwissRound = (evt.status === 'SWISS' && evt.swissRounds.length > 0) ? evt.swissRounds[evt.currentRound - 1] : null;

    container.innerHTML = `
        <div class="bg-wine-950/80 border border-wine-900 rounded-2xl p-6 shadow-2xl space-y-6">
            <div class="flex items-center justify-between border-b border-wine-900 pb-4">
                <div>
                    <span class="px-3 py-1 rounded-full bg-red-950 border border-red-800 text-red-400 text-xs font-bold uppercase tracking-wider animate-pulse">
                        🔴 En Vivo
                    </span>
                    <h3 class="text-2xl font-black text-white mt-2">${escapeHtml(evt.title)}</h3>
                </div>
            </div>

            ${currentSwissRound && currentSwissRound.currentSong ? `
                <div class="bg-gradient-to-r from-wine-950 via-wine-900 to-wine-950 p-5 rounded-2xl border-2 border-amber-500/80 shadow-2xl flex items-center space-x-4 animate-bounce-short">
                    <div class="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-400 flex items-center justify-center text-2xl flex-shrink-0">
                        <i class="ph-bold ph-music-notes flex-shrink-0"></i>
                    </div>
                    <div>
                        <span class="text-xs font-black uppercase text-amber-400 tracking-widest block">La canción de esta ronda es:</span>
                        <h2 class="text-xl sm:text-2xl font-black text-white drop-shadow">${escapeHtml(currentSwissRound.currentSong)}</h2>
                    </div>
                </div>
            ` : ''}

            ${(evt.status === 'SWISS' && currentSwissRound) ? `
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div class="lg:col-span-2 space-y-4">
                        <h4 class="text-sm font-bold text-wine-300 uppercase tracking-wider">Enfrentamientos - Ronda ${evt.currentRound}</h4>
                        <div class="space-y-3">
                            ${currentSwissRound.matches.map(m => {
                                const isWinA = String(m.winnerId) === String(m.playerA.id);
                                const isWinB = m.playerB && String(m.winnerId) === String(m.playerB.id);

                                return `
                                    <div class="flex items-center justify-between p-4 rounded-xl bg-[#090507] border border-wine-900 shadow-lg">
                                        <div class="flex items-center space-x-3 ${isWinA ? 'text-green-400 font-black' : (m.winnerId ? 'text-red-500/70' : 'text-slate-200')}">
                                            ${m.playerA.isBot ? '<span class="text-xl">🤖</span>' : `<img src="${escapeHtml(m.playerA.avatar)}" class="w-8 h-8 rounded-full object-cover border border-wine-800">`}
                                            <span class="text-sm font-bold">${escapeHtml(m.playerA.name)}</span>
                                        </div>

                                        <div class="text-xs font-black text-wine-500 bg-wine-950 px-3 py-1 rounded-full border border-wine-900">VS</div>

                                        <div class="flex items-center space-x-3 ${isWinB ? 'text-green-400 font-black' : (m.winnerId ? 'text-red-500/70' : 'text-slate-200')}">
                                            <span class="text-sm font-bold">${escapeHtml(m.playerB ? m.playerB.name : 'BYE')}</span>
                                            ${m.playerB && m.playerB.isBot ? '<span class="text-xl">🤖</span>' : `<img src="${escapeHtml(m.playerB ? m.playerB.avatar : '')}" class="w-8 h-8 rounded-full object-cover border border-wine-800">`}
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>

                    <div>
                        <h4 class="text-sm font-bold text-wine-300 uppercase tracking-wider mb-4">Tabla de Posiciones</h4>
                        <div class="bg-[#090507] border border-wine-900 rounded-xl p-4">
                            <table class="w-full text-left text-xs">
                                <thead class="text-wine-400 border-b border-wine-900">
                                    <tr>
                                        <th class="py-2">Puesto</th>
                                        <th class="py-2">Jugador</th>
                                        <th class="py-2 text-right">Pts</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-wine-900/40">
                                    ${evt.leaderboard.map((item, idx) => `
                                        <tr>
                                            <td class="py-2 font-bold text-wine-400">#${idx + 1}</td>
                                            <td class="py-2 flex items-center space-x-2">
                                                ${item.participant.isBot ? '🤖' : `<img src="${escapeHtml(item.participant.avatar)}" class="w-5 h-5 rounded-full object-cover">`}
                                                <span class="font-bold text-slate-200">${escapeHtml(item.participant.name)}</span>
                                            </td>
                                            <td class="py-2 text-right font-black text-amber-400">${item.points}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ` : ''}

            ${(evt.status === 'PLAYOFFS' || evt.status === 'FINISHED') ? `
                <div class="space-y-4">
                    <h4 class="text-sm font-bold text-wine-300 uppercase tracking-wider text-center">Fase Final - LLaves de PlayOffs</h4>
                    ${renderPlayoffsBracketHTML(evt.playoffs, false)}
                </div>
            ` : ''}
        </div>
    `;
}

function renderPlayoffsBracketHTML(playoffs, isAdminControl = false) {
    if (!playoffs) return '';

    return `
        <div class="relative overflow-x-auto py-8 bg-[#090507] rounded-2xl border border-wine-900 p-6">
            ${playoffs.champion ? `
                <div class="text-center py-6 mb-8 rounded-2xl bg-amber-500/10 border-2 border-amber-500 neon-gold max-w-md mx-auto">
                    <h2 class="text-3xl font-black text-amber-400 tracking-wider">🏆 GANADOR 🏆</h2>
                    <div class="flex items-center justify-center space-x-3 mt-3">
                        ${playoffs.champion.isBot ? '<span class="text-3xl">🤖</span>' : `<img src="${escapeHtml(playoffs.champion.avatar)}" class="w-12 h-12 rounded-full object-cover border-2 border-amber-400">`}
                        <span class="text-2xl font-bold text-white">${escapeHtml(playoffs.champion.name)}</span>
                    </div>
                </div>
            ` : ''}

            <div class="flex justify-around items-center min-w-[700px]">
                ${playoffs.rounds.map((round, rIdx) => `
                    <div class="flex flex-col space-y-8 relative z-10">
                        <div class="text-center mb-2">
                            <h5 class="text-xs font-extrabold text-wine-400 uppercase">${escapeHtml(round.roundName)}</h5>${round.currentSong ? `
                                <span class="text-[10px] text-amber-400 font-bold block mt-1 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60">
                                    🎵 ${escapeHtml(round.currentSong)}
                                </span>
                            ` : ''}
                        </div>
                        ${round.matches.map((m, mIdx) => {
                            const isWinA = m.winnerId && m.playerA && String(m.winnerId) === String(m.playerA.id);
                            const isWinB = m.winnerId && m.playerB && String(m.winnerId) === String(m.playerB.id);

                            return `
                                <div class="w-64 bg-wine-950/90 border border-wine-800 rounded-xl p-3 shadow-xl relative group">
                                    <div class="flex items-center justify-between p-2 rounded-lg ${isWinA ? 'bg-green-950/90 text-green-300 font-bold border border-green-600' : 'text-slate-300'} mb-2">
                                        <div class="flex items-center space-x-2 truncate">
                                            ${m.playerA ? (m.playerA.isBot ? '🤖' : `<img src="${escapeHtml(m.playerA.avatar)}" class="w-6 h-6 rounded-full object-cover">`) : ''}
                                            <span class="text-xs font-bold truncate">${m.playerA ? escapeHtml(m.playerA.name) : 'TBD'}</span>
                                        </div>
                                        ${isAdminControl && m.playerA ? `
                                            <button onclick="setPlayoffWinner(${rIdx},${mIdx}, '${m.playerA.id}')" class="text-[10px] px-2 py-1 ${isWinA ? 'bg-green-600 text-white' : 'bg-wine-900 hover:bg-green-700 text-slate-200'} rounded font-bold shadow-md transition-all">
                                                ✔️ ${isWinA ? 'Ganador' : 'Elegir'}
                                            </button>
                                        ` : ''}
                                    </div>

                                    <div class="text-[10px] text-center font-black text-wine-500 uppercase my-1">vs</div>

                                    <div class="flex items-center justify-between p-2 rounded-lg ${isWinB ? 'bg-green-950/90 text-green-300 font-bold border border-green-600' : 'text-slate-300'}">
                                        <div class="flex items-center space-x-2 truncate">
                                            ${m.playerB ? (m.playerB.isBot ? '🤖' : `<img src="${escapeHtml(m.playerB.avatar)}" class="w-6 h-6 rounded-full object-cover">`) : ''}
                                            <span class="text-xs font-bold truncate">${m.playerB ? escapeHtml(m.playerB.name) : 'TBD'}</span>
                                        </div>
                                        ${isAdminControl && m.playerB ? `
                                            <button onclick="setPlayoffWinner(${rIdx},${mIdx}, '${m.playerB.id}')" class="text-[10px] px-2 py-1 ${isWinB ? 'bg-green-600 text-white' : 'bg-wine-900 hover:bg-green-700 text-slate-200'} rounded font-bold shadow-md transition-all">
                                                ✔️ ${isWinB ? 'Ganador' : 'Elegir'}
                                            </button>
                                        ` : ''}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderEventHistory() {
    const container = document.getElementById('history-events-container');
    if (!container) return;

    if (state.eventHistory.length === 0) {
        container.innerHTML = `<p class="text-slate-500 text-sm text-center py-8">No hay torneos registrados en el historial aún.</p>`;
        return;
    }

    container.innerHTML = state.eventHistory.map((evt, idx) => `
        <div class="bg-wine-950/60 border border-wine-900 rounded-2xl p-6 space-y-4">
            <div class="flex items-center justify-between border-b border-wine-900 pb-3">
                <div class="flex items-center space-x-3">
                    <h3 class="text-xl font-bold text-white">${escapeHtml(evt.title)}</h3>
                    <span class="text-xs px-3 py-1 rounded-full bg-green-950 text-green-400 border border-green-800">Finalizado</span>
                </div>
                <button onclick="deleteHistoryEvent(${idx})" class="px-3 py-1.5 bg-red-950/60 hover:bg-red-900/80 text-red-400 border border-red-800/60 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1">
                    <i class="ph-bold ph-trash"></i>
                    <span>Eliminar Registro</span>
                </button>
            </div>

            <div>
                <h4 class="text-xs font-bold text-wine-300 uppercase mb-2">Tabla de Posiciones Final</h4>
                <div class="bg-[#090507] p-3 rounded-xl border border-wine-900">
                    <div class="flex flex-wrap gap-4 text-xs">
                        ${evt.leaderboard.map((item, pIdx) => `
                            <span class="text-slate-300">
                                <b class="text-amber-400">#${pIdx + 1}</b> ${escapeHtml(item.participant.name)} (${item.points} pts)
                            </span>
                        `).join(' • ')}
                    </div>
                </div>
            </div>

            <div>
                <h4 class="text-xs font-bold text-wine-300 uppercase mb-2">PlayOffs Bracket</h4>
                ${renderPlayoffsBracketHTML(evt.playoffs, false)}
            </div>
        </div>
    `).join('');
}

// FUNCIONES DE USUARIOS Y PERFILES
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
                genero: newUser.genero || genero,
                role: newUser.role || 'USER'
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
        state.currentUser = { id: 0, nickname: 'Admin', nombres: 'Administrador Principal', modo: ['ALL MODES'], familia: 'Audition HQ', avatar: 'https://i.imgur.com/6VBx3io.png', genero: 'Otros', role: 'ADMIN' };
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
            genero: foundUser.genero || 'Otros',
            role: foundUser.role || 'USER'
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

async function updateUserRole(userId, newRole) {
    try {
        const response = await fetch(`${API_BASE}/users/${userId}/role`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: newRole })
        });

        if (response.ok) {
            const updated = await response.json();
            const username = updated.nickname || updated.name;

            if (!state.assignments[username]) {
                state.assignments[username] = { tagIds: [] };
            }
            let tagIds = state.assignments[username].tagIds;

            if (newRole === 'MODERATOR' && !tagIds.includes('tag-mod')) {
                tagIds.push('tag-mod');
            } else if (newRole === 'USER') {
                state.assignments[username].tagIds = tagIds.filter(id => id !== 'tag-mod');
            }

            saveState();
            await fetchUsers();
            renderAdminUserTable();
            renderPublicTiers();
            alert(`Rol actualizado a ${newRole} para ${username}`);
        } else {
            alert("No se pudo actualizar el rol.");
        }
    } catch (err) {
        console.error("Error al actualizar rol:", err);
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

    const newPassword = document.getElementById('prof-new-password')?.value;
    const confirmPassword = document.getElementById('prof-confirm-password')?.value;

    let updateData = { nombres, modo, familia, avatar, genero };

    if (newPassword || confirmPassword) {
        if (newPassword !== confirmPassword) {
            alert("⚠️ Las contraseñas ingresadas no coinciden.");
            return;
        }
        if (newPassword.length < 4) {
            alert("⚠️ La contraseña debe tener al menos 4 caracteres.");
            return;
        }
        updateData.password = newPassword;
    }

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
                body: JSON.stringify(updateData)
            });

            if (response.ok) {
                await fetchUsers();
                renderPublicTiers();
                
                if (document.getElementById('prof-new-password')) document.getElementById('prof-new-password').value = '';
                if (document.getElementById('prof-confirm-password')) document.getElementById('prof-confirm-password').value = '';
                
                alert("¡Perfil actualizado correctamente!");
                navigateTo('view-profile-card');
            } else {
                alert("Ocurrió un error al guardar los cambios.");
            }
        } catch (err) {
            console.error("Error al sincronizar perfil con backend:", err);
            alert("Error al conectar con el servidor.");
        }
    }
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
        const currentRole = user.role || 'USER';

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
                <td class="py-3 px-4 text-slate-300 align-top font-medium">
                    ${escapeHtml(user.nombres || 'Sin nombre asignado')}
                    <div class="mt-2">
                        <select onchange="updateUserRole(${user.id}, this.value)" class="bg-wine-950 border border-wine-800 rounded-lg py-1 px-2 text-xs text-wine-300 focus:outline-none focus:border-wine-500">
                            <option value="USER" ${currentRole === 'USER' ? 'selected' : ''}>Usuario</option>
                            <option value="MODERATOR" ${currentRole === 'MODERATOR' ? 'selected' : ''}>Moderador</option>
                        </select>
                    </div>
                </td>
                
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
                                                <span class="cursor-pointer hover:text-wine-400 transition-colors" 
                                                      onmouseenter="showUserCard(event, '${escapeHtml(uname)}')" 
                                                      onmouseleave="hideUserCard()">
                                                    ${escapeHtml(uname)}
                                                </span>
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

function showUserCard(event, username) {
    const card = document.getElementById('user-hover-card');
    if (!card) return;

    const user = state.users.find(u => (u.nickname || u.name) === username);
    if (!user) return;

    const assign = state.assignments[username] || { tagIds: [] };
    const userTags = state.tags.filter(t => assign.tagIds.includes(t.id));
    const avatarUrl = user.avatar || 'https://i.imgur.com/6VBx3io.png';
    const generoVal = user.genero || 'Otros';
    const familiaText = user.familia || 'Sin Familia / Ninguno';
    
    let modoArr = ['NORMAL'];
    try {
        if (user.modo) {
            modoArr = user.modo.startsWith('[') ? JSON.parse(user.modo) : [user.modo];
        }
    } catch (e) {
        modoArr = [user.modo || 'NORMAL'];
    }
    const modoText = Array.isArray(modoArr) ? modoArr.join(', ') : modoArr;

    card.innerHTML = `
        <div class="flex items-center space-x-3 mb-3">
            <div class="w-12 h-12 rounded-xl overflow-hidden bg-wine-900 border border-wine-700/60 flex-shrink-0">
                <img src="${escapeHtml(avatarUrl)}" onerror="this.src='https://i.imgur.com/6VBx3io.png'" class="w-full h-full object-cover">
            </div>
            <div class="overflow-hidden">
                <h4 class="text-white font-bold text-sm truncate">${escapeHtml(username)}</h4>
                <p class="text-slate-400 text-xs truncate">${escapeHtml(user.nombres || 'Sin nombre')}</p>
                <span class="text-[10px] px-2 py-0.5 rounded-full bg-wine-900 text-wine-300 font-mono inline-block mt-0.5">${escapeHtml(generoVal)}</span>
            </div>
        </div>
        <div class="grid grid-cols-2 gap-2 text-xs py-2 border-y border-wine-900/80 mb-2">
            <div>
                <span class="block text-[10px] text-wine-400 uppercase font-semibold">Familia</span>
                <span class="text-slate-200 truncate block">${escapeHtml(familiaText)}</span>
            </div>
            <div>
                <span class="block text-[10px] text-wine-400 uppercase font-semibold">Modo</span>
                <span class="text-slate-200 truncate block">${escapeHtml(modoText)}</span>
            </div>
        </div>
        <div>
            <span class="block text-[10px] text-wine-400 uppercase font-semibold mb-1">Etiquetas</span>
            <div class="flex flex-wrap gap-1">
                ${userTags.length > 0 ? userTags.map(tag => `
                    <span class="px-2 py-0.5 rounded text-[10px] font-semibold text-white" style="background-color: ${tag.color}">
                        ${escapeHtml(tag.name)}
                    </span>
                `).join('') : '<span class="text-[10px] text-slate-500 italic">Sin etiquetas</span>'}
            </div>
        </div>
    `;

    card.classList.remove('hidden');
}

function hideUserCard() {
    const card = document.getElementById('user-hover-card');
    if (card) card.classList.add('hidden');
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

let currentSlide = 0;
const totalSlides = 2;
let carouselInterval = null;

function updateCarousel() {
    const slidesContainer = document.getElementById('carousel-slides');
    const dots = document.querySelectorAll('.carousel-dot');
    
    if (slidesContainer) {
        slidesContainer.style.transform = `translateX(-${currentSlide * 100}%)`;
    }

    dots.forEach((dot, index) => {
        if (index === currentSlide) {
            dot.classList.remove('bg-wine-900');
            dot.classList.add('bg-wine-500', 'w-6');
        } else {
            dot.classList.remove('bg-wine-500', 'w-6');
            dot.classList.add('bg-wine-900', 'w-2.5');
        }
    });
}

function nextSlide() {
    currentSlide = (currentSlide + 1) % totalSlides;
    updateCarousel();
    resetCarouselTimer();
}

function prevSlide() {
    currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
    updateCarousel();
    resetCarouselTimer();
}

function goToSlide(index) {
    currentSlide = index;
    updateCarousel();
    resetCarouselTimer();
}

function startCarouselTimer() {
    if (carouselInterval) clearInterval(carouselInterval);
    carouselInterval = setInterval(() => {
        nextSlide();
    }, 4000);
}

function resetCarouselTimer() {
    startCarouselTimer();
}

document.addEventListener('DOMContentLoaded', () => {
    const formReg = document.getElementById('form-register');
    if (formReg) formReg.addEventListener('submit', handleRegister);

    const formLog = document.getElementById('form-login');
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
    fetchActiveEventFromDB().then(() => {
        if (state.activeEvent && document.getElementById('event-song-list-input')) {
            document.getElementById('event-song-list-input').value = (state.activeEvent.songPool || []).join('\n');
        }
    });
    navigateTo('view-home');
    startCarouselTimer();

    // Sincroniza con el servidor cada 5 s: si el admin elimina o cambia el torneo,
    // todos (usuarios, moderadores) lo ven actualizado sin recargar
    setInterval(async () => {
        const evView = document.getElementById('view-events');
        const adminView = document.getElementById('view-admin');
        const onEvents = evView && !evView.classList.contains('hidden');
        const onAdmin = adminView && !adminView.classList.contains('hidden');
        if (!onEvents && !onAdmin) return;

        const before = JSON.stringify(state.activeEvent);
        await fetchActiveEventFromDB();
        if (JSON.stringify(state.activeEvent) === before) return; // sin cambios: no se redibuja

        if (onEvents) renderUserEventsView(true);
        if (onAdmin) renderTournamentAdmin();
    }, 5000);
});
