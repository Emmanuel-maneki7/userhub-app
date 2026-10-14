console.log("Sistema Audition World Class LATAM listo y conectado (Versión Esports Pro Max con Gestión de Roles)");

// ===== SISTEMA DE NOTIFICACIONES TOAST =====
(function injectToastStyles() {
    if (document.getElementById('toast-styles')) return;
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
        #toast-container { position: fixed; top: 1.25rem; right: 1.25rem; z-index: 99999; display: flex; flex-direction: column; gap: 0.6rem; pointer-events: none; max-width: calc(100vw - 2.5rem); }
        .toast-item { pointer-events: auto; display: flex; align-items: center; gap: 0.75rem; min-width: 260px; max-width: 380px; padding: 0.85rem 1.1rem; border-radius: 0.85rem; background: linear-gradient(135deg, #1a0a10 0%, #2a0d18 100%); border: 1px solid #800020; border-left: 5px solid #c92a52; color: #f1e4e8; font-size: 0.85rem; font-weight: 600; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.55), 0 0 18px rgba(128, 0, 32, 0.35); animation: toast-in 0.35s cubic-bezier(0.22, 1, 0.36, 1); word-break: break-word; }
        .toast-item.toast-success { border-left-color: #34d399; }
        .toast-item.toast-error   { border-left-color: #f43f5e; }
        .toast-item.toast-warning { border-left-color: #fbbf24; }
        .toast-item.toast-info    { border-left-color: #c92a52; }
        @keyframes toast-in { from { opacity: 0; transform: translateX(60px); } to { opacity: 1; transform: translateX(0); } }
    `;
    document.head.appendChild(style);
})();

function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type}`;
    let icon = 'ph-info text-wine-300';
    if (type === 'success') icon = 'ph-check-circle text-emerald-400';
    if (type === 'error') icon = 'ph-warning-circle text-rose-500';
    if (type === 'warning') icon = 'ph-bell text-amber-400';

    const iconEl = document.createElement('i');
    iconEl.className = `ph-bold ${icon} text-xl`;
    const textEl = document.createElement('span');
    textEl.textContent = String(message);
    toast.appendChild(iconEl);
    toast.appendChild(textEl);
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(50px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

function inferToastType(msg) {
    const m = String(msg).toLowerCase();
    if (msg.includes('⚠️') || m.includes('error') || m.includes('no se pudo') || m.includes('incorrecto') || m.includes('rechaz')) return 'error';
    if (m.includes('por favor') || m.includes('no hay ') || m.includes('ya existe') || m.includes('se necesitan')) return 'warning';
    if (m.includes('éxito') || m.includes('exitosamente') || m.includes('correctamente') || m.includes('creado') || m.includes('bienvenido') || m.includes('actualizado')) return 'success';
    return 'info';
}

window.alert = function (msg) { showToast(msg, inferToastType(String(msg))); };

// ===== MANEJADOR SEGURO DE AVATARES =====
function getUserAvatar(u) {
    if (!u) return 'https://i.imgur.com/6VBx3io.png';
    const raw = u.avatar || u.foto || u.image || u.img;
    if (!raw || typeof raw !== 'string' || raw.trim() === '') return 'https://i.imgur.com/6VBx3io.png';
    return raw.trim();
}

// ===== MODAL PROPIO =====
function showCustomModal(title, message, isConfirm = false, callback = null) {
    let container = document.getElementById('custom-modal-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'custom-modal-container';
        document.body.appendChild(container);
    }

    container.innerHTML = `
        <div class="custom-modal-backdrop">
            <div class="custom-modal-box space-y-4">
                <h3 class="text-lg font-bold text-white flex items-center gap-2 font-display">
                    <i class="ph-bold ph-warning-circle text-amber-400"></i> ${escapeHtml(title)}
                </h3>
                <p class="text-slate-300 text-sm leading-relaxed">${escapeHtml(message)}</p>
                <div class="flex justify-end space-x-3 pt-2">
                    ${isConfirm ? `<button id="modal-btn-cancel" class="px-4 py-2 bg-wine-950 border border-wine-800 text-slate-300 rounded-xl text-xs font-bold hover:bg-wine-900">Cancelar</button>` : ''}
                    <button id="modal-btn-ok" class="px-5 py-2 bg-wine-700 hover:bg-wine-600 text-white rounded-xl text-xs font-bold shadow-lg">Aceptar</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('modal-btn-ok').onclick = () => {
        container.innerHTML = '';
        if (callback) callback(true);
    };
    if (isConfirm) {
        document.getElementById('modal-btn-cancel').onclick = () => {
            container.innerHTML = '';
            if (callback) callback(false);
        };
    }
}

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

function isPrivilegedUser() {
    return !!state.currentUser && (
        state.currentUser.nickname?.toLowerCase() === 'admin' ||
        state.currentUser.role === 'MODERATOR' ||
        state.currentUser.role === 'ADMIN'
    );
}

const MAX_HISTORY = 15;

function refreshTournamentViews() {
    renderTournamentAdmin();
    renderUserEventsView(true);
}

let saveEventTimer = null;
let eventRev = 0;
let eventDirty = false;

function eventPayloadJson(evt) {
    const { historyStates, ...payload } = evt;
    return JSON.stringify(payload);
}

let lastSyncedJson = state.activeEvent ? eventPayloadJson(state.activeEvent) : null;

function persistActiveEventLocal() {
    try {
        if (state.activeEvent && isPrivilegedUser()) {
            localStorage.setItem('uh_active_event', JSON.stringify(state.activeEvent));
        } else {
            localStorage.removeItem('uh_active_event');
        }
    } catch (e) { console.error(e); }
}

function saveActiveEventToDB() {
    if (!state.activeEvent) return;
    const json = eventPayloadJson(state.activeEvent);
    if (json === lastSyncedJson) return;

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
            }
        } catch (err) { console.error(err); }
    }, 300);
}

function markEventRemovedLocally() {
    clearTimeout(saveEventTimer);
    eventRev++;
    eventDirty = false;
    lastSyncedJson = null;
}

function isValidEvent(data) {
    return !!data && typeof data === 'object' && !!data.title && !!data.status;
}

async function fetchActiveEventFromDB() {
    if (eventDirty) return;
    const revAtStart = eventRev;
    try {
        const res = await fetch(`${API_BASE}/events/active?_=${Date.now()}`, { cache: 'no-store' });
        if (eventDirty || revAtStart !== eventRev) return;
        if (res.status === 404 || res.status === 204) {
            state.activeEvent = null;
            lastSyncedJson = null;
            persistActiveEventLocal();
            return;
        }
        if (!res.ok) return;
        let data = null;
        const text = await res.text();
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
            state.activeEvent = null;
            lastSyncedJson = null;
        }
        persistActiveEventLocal();
    } catch (err) { console.error(err); }
}

function saveState() {
    try {
        localStorage.setItem('uh_clans', JSON.stringify(state.clans));
        localStorage.setItem('uh_assignments', JSON.stringify(state.assignments));
        localStorage.setItem('uh_event_history', JSON.stringify(state.eventHistory));
        if (state.currentUser) localStorage.setItem('uh_current_user', JSON.stringify(state.currentUser));
        else localStorage.removeItem('uh_current_user');
    } catch (e) { console.error(e); }
    persistActiveEventLocal();
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
            if (dbTabs.length > 0 && (activeTabId === null || !dbTabs.some(t => String(t.id) === String(activeTabId)))) {
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
    } catch (err) { console.error(err); }
}

function navigateTo(viewId) {
    const isPrivileged = isPrivilegedUser();
    if ((viewId === 'view-admin' || viewId === 'view-event-history') && !isPrivileged) viewId = 'view-home';

    document.querySelectorAll('.view-section').forEach(s => s.classList.add('hidden'));
    const target = document.getElementById(viewId);
    if (target) {
        target.classList.remove('hidden');
        window.scrollTo(0, 0);
    }
    renderNavActions();
    if (viewId === 'view-home') {
        fetchUsers().then(() => {
            renderHomeStats();
            renderHomeLiveBanner();
            renderHallOfFame();
        });
    }
    if (viewId === 'view-tiers') fetchUsers().then(() => { populateClanFilter(); renderPublicTiers(); });
    if (viewId === 'view-admin') Promise.all([fetchUsers(), fetchActiveEventFromDB()]).then(() => { renderAdminPanel(); renderTournamentAdmin(); });
    if (viewId === 'view-events') renderUserEventsView();
    if (viewId === 'view-event-history') renderEventHistory();
    if (viewId === 'view-profile-card') renderProfileCard();
    if (viewId === 'view-profile-edit') fillProfileEditForm();
}

// ===== HERO & STATS =====
function countUp(el, to, ms = 1200) {
    if (!el) return;
    const t0 = performance.now();
    (function tick(t) {
        const p = Math.min((t - t0) / ms, 1);
        el.textContent = Math.floor(to * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
    })(t0);
}

function renderHomeStats() {
    countUp(document.getElementById('stat-users'), state.users.length);
    countUp(document.getElementById('stat-tournaments'), state.eventHistory.length);
    countUp(document.getElementById('stat-clans'), Math.max(0, state.clans.length - 1));
}

function renderHomeLiveBanner() {
    const banner = document.getElementById('home-live-banner');
    if (!banner) return;
    if (state.activeEvent && state.activeEvent.status !== 'SETUP') {
        banner.className = "mb-6 p-4 rounded-2xl bg-gradient-to-r from-wine-950 via-wine-900 to-wine-950 border-2 border-red-500/80 shadow-2xl flex items-center justify-between cursor-pointer hover:scale-[1.01] transition-all glass-panel-glow";
        banner.innerHTML = `
            <div class="flex items-center space-x-3" onclick="navigateTo('view-events')">
                <span class="px-3 py-1 rounded-full bg-red-600 text-white text-xs font-black uppercase animate-pulse shadow-lg shadow-red-600/50">🔴 EN VIVO</span>
                <div>
                    <h4 class="text-white font-black text-base">${escapeHtml(state.activeEvent.title)}</h4>
                    <p class="text-xs text-slate-300">Torneo en curso. Haz clic para seguir las partidas y rondas.</p>
                </div>
            </div>
            <button onclick="navigateTo('view-events')" class="px-4 py-2 bg-wine-700 hover:bg-wine-600 text-white text-xs font-bold rounded-xl shadow-lg hover-glow">Ver Torneo ➔</button>
        `;
        banner.classList.remove('hidden');
    } else {
        banner.classList.add('hidden');
    }
}

function renderHallOfFame() {
    const hof = document.getElementById('home-hall-of-fame');
    if (!hof) return;
    if (state.eventHistory.length === 0) {
        hof.innerHTML = `<span class="text-slate-500 italic text-xs">Aún no hay campeones registrados. ¡Participa en los próximos torneos!</span>`;
        return;
    }
    hof.innerHTML = state.eventHistory.slice(0, 3).map(evt => {
        const champ = evt.playoffs && evt.playoffs.champion ? evt.playoffs.champion.name : (evt.leaderboard[0] ? evt.leaderboard[0].participant.name : 'N/D');
        return `
            <div class="flex items-center justify-between p-3 rounded-xl bg-[#090507] border border-wine-900/80 shadow-md hover:border-amber-500/50 transition-all">
                <span class="font-bold text-white text-sm">${escapeHtml(evt.title)}</span>
                <span class="text-amber-400 font-extrabold text-xs flex items-center gap-1.5 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">🏆 ${escapeHtml(champ)}</span>
            </div>
        `;
    }).join('');
}

function renderNavActions() {
    const navContainer = document.getElementById('nav-actions');
    const ctaButtons = document.getElementById('home-cta-buttons');
    if (!navContainer) return;

    if (state.currentUser) {
        const isPriv = isPrivilegedUser();
        navContainer.innerHTML = `
            <span class="text-xs text-wine-300 hidden sm:inline">Hola, <b class="text-wine-400">${escapeHtml(state.currentUser.nickname)}</b></span>
            <button onclick="navigateTo('view-events')" class="px-3 py-1.5 rounded-lg bg-wine-950 hover:bg-wine-900 text-wine-200 text-xs font-semibold flex items-center space-x-1 border border-wine-800"><i class="ph-bold ph-calendar-star"></i><span>Eventos</span></button>
            <button onclick="navigateTo('view-tiers')" class="px-3 py-1.5 rounded-lg bg-wine-950 hover:bg-wine-900 text-wine-200 text-xs font-semibold flex items-center space-x-1 border border-wine-800"><i class="ph-bold ph-ranking"></i><span>Tiers</span></button>
            ${isPriv ? `
                <button onclick="navigateTo('view-event-history')" class="px-3 py-1.5 rounded-lg bg-wine-950 hover:bg-wine-900 text-wine-200 text-xs font-semibold border border-wine-800" title="Historial"><i class="ph-bold ph-clock-counter-clockwise"></i></button>
                <button onclick="navigateTo('view-admin')" class="px-3 py-1.5 rounded-lg bg-wine-700 hover:bg-wine-600 text-white text-xs font-semibold shadow-md flex items-center space-x-1"><i class="ph-bold ph-shield-check"></i><span>Admin</span></button>
            ` : ''}
            <button onclick="navigateTo('view-profile-card')" class="px-3 py-1.5 rounded-lg bg-wine-950 hover:bg-wine-900 text-wine-200 text-xs font-semibold border border-wine-800" title="Mi Carta"><i class="ph-bold ph-user"></i></button>
            <button onclick="handleLogout()" class="px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/50 text-red-400 text-xs font-semibold border border-red-900/50" title="Cerrar Sesión"><i class="ph-bold ph-sign-out"></i></button>
        `;
        if (ctaButtons) {
            ctaButtons.innerHTML = `
                <button onclick="navigateTo('view-events')" class="px-6 py-3 rounded-xl bg-wine-700 hover:bg-wine-600 text-white font-semibold transition-all shadow-lg shadow-wine-900/50 hover:scale-[1.02] flex items-center space-x-2 hover-glow"><i class="ph-bold ph-calendar-star text-lg"></i><span>Ver Eventos en Vivo</span></button>
                <button onclick="navigateTo('view-tiers')" class="px-6 py-3 rounded-xl bg-wine-950 hover:bg-wine-900 text-slate-200 font-semibold border border-wine-800 transition-all hover:scale-[1.02] flex items-center space-x-2"><i class="ph-bold ph-ranking text-lg"></i><span>Ver Tabla Tiers</span></button>
            `;
        }
    } else {
        navContainer.innerHTML = `
            <button onclick="navigateTo('view-tiers')" class="px-3 py-1.5 rounded-lg bg-wine-950 hover:bg-wine-900 text-wine-200 text-xs font-semibold border border-wine-800 flex items-center space-x-1"><i class="ph-bold ph-ranking"></i><span>Tiers</span></button>
            <button onclick="navigateTo('view-login')" class="px-3 py-1.5 rounded-lg bg-wine-950 hover:bg-wine-900 text-slate-200 text-xs font-semibold border border-wine-800 flex items-center space-x-1"><i class="ph-bold ph-sign-in"></i><span>Ingresar</span></button>
            <button onclick="navigateTo('view-register')" class="px-3 py-1.5 rounded-lg bg-wine-700 hover:bg-wine-600 text-white text-xs font-semibold flex items-center space-x-1"><i class="ph-bold ph-user-plus"></i><span>Registrarse</span></button>
        `;
        if (ctaButtons) {
            ctaButtons.innerHTML = `
                <button onclick="navigateTo('view-register')" class="px-6 py-3 rounded-xl bg-wine-700 hover:bg-wine-600 text-white font-semibold transition-all shadow-lg shadow-wine-900/50 hover:scale-[1.02] flex items-center space-x-2 hover-glow"><i class="ph-bold ph-user-plus text-lg"></i><span>Registrarse Ahora</span></button>
                <button onclick="navigateTo('view-tiers')" class="px-6 py-3 rounded-xl bg-wine-950 hover:bg-wine-900 text-slate-200 font-semibold border border-wine-800 transition-all hover:scale-[1.02] flex items-center space-x-2"><i class="ph-bold ph-ranking text-lg"></i><span>Ver Tabla Tiers</span></button>
            `;
        }
    }
}

async function fetchUsers() {
    try {
        await fetchGlobalConfig();
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error();
        const users = await res.json();
        state.users = users;
        users.forEach(u => {
            const username = u.nickname || u.name;
            if (username && !state.assignments[username]) state.assignments[username] = { tagIds: [] };
            if (u.role === 'MODERATOR' || u.role === 'ADMIN') {
                if (!state.assignments[username].tagIds.includes('tag-mod')) state.assignments[username].tagIds.push('tag-mod');
            }
        });
        populateRegisteredUsersSelect();
        return users;
    } catch (err) { console.error(err); }
}

// ===== RULETA DE CANCIONES CON EFECTO SLOT =====
let rouletteInterval = null;

function spinSongRoulette(roundIndex) {
    const evt = state.activeEvent;
    if (!evt || !evt.songPool || evt.songPool.length === 0) {
        alert("No hay canciones configuradas en la lista del torneo.");
        return;
    }
    const pool = evt.songPool;
    const songDisplay = document.getElementById(`roulette-song-display-${roundIndex}`) || document.getElementById('global-roulette-song');
    if (!songDisplay) {
        reRollRoundSong(roundIndex);
        return;
    }

    songDisplay.classList.add('slot-spin-anim');
    let counter = 0;
    clearInterval(rouletteInterval);
    rouletteInterval = setInterval(() => {
        const randomSong = pool[Math.floor(Math.random() * pool.length)];
        songDisplay.textContent = randomSong;
        counter++;
        if (counter > 20) {
            clearInterval(rouletteInterval);
            songDisplay.classList.remove('slot-spin-anim');
            const finalSong = pool[Math.floor(Math.random() * pool.length)];
            songDisplay.textContent = finalSong;
            saveHistoryState();
            if (evt.status === 'SWISS' && evt.swissRounds[roundIndex]) evt.swissRounds[roundIndex].currentSong = finalSong;
            else if (evt.status === 'PLAYOFFS' && evt.playoffs && evt.playoffs.rounds[roundIndex]) evt.playoffs.rounds[roundIndex].currentSong = finalSong;
            saveState();
            refreshTournamentViews();
            showToast(`🎵 ¡Canción sorteada: ${finalSong}!`, 'success');
        }
    }, 60);
}

// TORNEO SUIZO & PLAYOFFS
let tempParticipants = [];

function populateRegisteredUsersSelect() {
    const select = document.getElementById('registered-user-select');
    if (!select) return;
    select.innerHTML = `<option value="">Seleccionar Usuario Registrado...</option>` +
        state.users.map(u => `<option value="${u.id}">${escapeHtml(u.nickname || u.name)}</option>`).join('');
}

function populateClanFilter() {
    const select = document.getElementById('tier-clan-filter');
    if (!select) return;
    select.innerHTML = `<option value="">Todas las Familias</option>` +
        state.clans.filter(c => c !== 'Sin Familia / Ninguno').map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
}

function startNewEvent() {
    const titleInput = document.getElementById('event-title-input');
    const title = titleInput ? titleInput.value.trim() : '';
    const rounds = parseInt(document.getElementById('event-rounds-input')?.value, 10) || 3;
    const songInput = document.getElementById('event-song-list-input')?.value || '';
    if (!title) { alert("Por favor ingresa un nombre para el evento."); return; }

    const songPool = songInput.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
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
        songPool,
        historyStates: []
    };
    tempParticipants = [];
    saveState();
    const regArea = document.getElementById('event-registration-area');
    if (regArea) regArea.classList.remove('hidden');
    renderParticipantsBadges();
    refreshTournamentViews();
    alert(`Torneo "${title}" creado. Inscribe a los participantes.`);
}

function updateTournamentSongsFromAdmin() {
    if (!state.activeEvent) { alert("No hay torneo activo."); return; }
    const songInput = document.getElementById('event-song-list-input')?.value || '';
    state.activeEvent.songPool = songInput.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    saveState();
    alert("¡Lista de canciones actualizada!");
}

function addRegisteredPlayerToEvent() {
    const select = document.getElementById('registered-user-select');
    if (!select) return;
    const userId = select.value;
    if (!userId) return;
    const user = state.users.find(u => String(u.id) === String(userId));
    if (!user) return;
    const uname = user.nickname || user.name;
    if (tempParticipants.some(p => p.name === uname)) { alert("El usuario ya está inscrito."); return; }

    tempParticipants.push({
        id: `usr-${user.id}`,
        name: uname,
        avatar: getUserAvatar(user),
        isBot: false,
        points: 0,
        playedAgainst: []
    });
    renderParticipantsBadges();
}

function addBotToEvent() {
    const botInput = document.getElementById('bot-name-input');
    const name = botInput ? botInput.value.trim() || `Bot_${tempParticipants.length + 1}` : `Bot_${tempParticipants.length + 1}`;
    if (tempParticipants.some(p => p.name === name)) { alert("Ya existe un participante con ese nombre."); return; }
    tempParticipants.push({
        id: `bot-${Date.now()}-${Math.floor(Math.random()*10000)}`,
        name,
        avatar: '🤖',
        isBot: true,
        points: 0,
        playedAgainst: []
    });
    if (botInput) botInput.value = '';
    renderParticipantsBadges();
}

function removeParticipantFromSetup(id) {
    tempParticipants = tempParticipants.filter(p => String(p.id) !== String(id));
    renderParticipantsBadges();
}

function renderParticipantsBadges() {
    const container = document.getElementById('event-participants-badges');
    if (!container) return;
    if (tempParticipants.length === 0) { container.innerHTML = `<span class="text-xs text-slate-500 italic">No hay inscritos aún.</span>`; return; }
    container.innerHTML = tempParticipants.map(p => `
        <span class="inline-flex items-center space-x-2 px-3 py-1 rounded-xl bg-wine-900 border border-wine-700 text-xs text-white shadow-md">
            ${p.isBot ? '🤖' : `<img src="${escapeHtml(p.avatar)}" onerror="this.src='https://i.imgur.com/6VBx3io.png'" class="w-4 h-4 rounded-full object-cover">`}
            <span class="font-bold">${escapeHtml(p.name)}</span>
            <button onclick="removeParticipantFromSetup('${p.id}')" class="text-slate-400 hover:text-red-400 ml-1"><i class="ph-bold ph-x"></i></button>
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
    if (state.activeEvent.historyStates.length > MAX_HISTORY) state.activeEvent.historyStates.shift();
}

function undoTournamentStep() {
    const evt = state.activeEvent;
    if (!evt || !evt.historyStates || evt.historyStates.length === 0) { alert("No hay pasos anteriores."); return; }
    const prev = evt.historyStates.pop();
    Object.assign(evt, prev);
    saveState();
    refreshTournamentViews();
}

async function deleteActiveEvent() {
    showCustomModal("Eliminar Torneo", "¿Estás seguro de eliminar completamente el torneo activo? Esta acción borrará todo el progreso y no lo guardará en el historial.", true, async (ok) => {
        if (!ok) return;
        markEventRemovedLocally();
        state.activeEvent = null;
        localStorage.removeItem('uh_active_event');
        try { await fetch(`${API_BASE}/events/active`, { method: 'DELETE' }); } catch (err) { console.error(err); }
        refreshTournamentViews();
        alert("Torneo eliminado correctamente.");
    });
}

function archiveActiveEvent() {
    if (!state.activeEvent) return;
    showCustomModal("Archivar Torneo", "¿Deseas archivar el torneo activo en el Historial tal como está?", true, (ok) => {
        if (!ok) return;
        markEventRemovedLocally();
        const copy = JSON.parse(JSON.stringify(state.activeEvent));
        delete copy.historyStates;
        state.eventHistory.unshift(copy);
        fetch(`${API_BASE}/events/active`, { method: 'DELETE' }).catch(() => {});
        state.activeEvent = null;
        saveState();
        alert("Torneo archivado en el Historial.");
        navigateTo('view-event-history');
    });
}

function deleteHistoryEvent(index) {
    showCustomModal("Eliminar Historial", "¿Estás seguro de eliminar este torneo del historial permanentemente?", true, (ok) => {
        if (!ok) return;
        state.eventHistory.splice(index, 1);
        saveState();
        renderEventHistory();
        alert("Torneo eliminado del historial.");
    });
}

function getRandomSong() {
    if (!state.activeEvent || !state.activeEvent.songPool || state.activeEvent.songPool.length === 0) return "Canción Libre";
    const pool = state.activeEvent.songPool;
    return pool[Math.floor(Math.random() * pool.length)];
}

function generateFirstSwissRound() {
    if (tempParticipants.length < 2) { alert("Se necesitan al menos 2 participantes."); return; }
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
    const pointsOf = {};
    evt.leaderboard.forEach(item => { pointsOf[item.participant.id] = item.points; });

    let pool = evt.participants.filter(p => p.id !== 'bot-bye');
    pool.sort((a, b) => (pointsOf[b.id] || 0) - (pointsOf[a.id] || 0));

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
        let winnerId = null;
        if (p1.id === 'bot-bye') winnerId = String(p2.id);
        if (p2.id === 'bot-bye') winnerId = String(p1.id);

        matches.push({ matchId: `m-${roundNum}-${matches.length}`, playerA: p1, playerB: p2, winnerId, pointsAwarded: 3 });
    }
    evt.swissRounds.push({ roundNumber: roundNum, matches, currentSong: getRandomSong(), isCompleted: false });
    updateLeaderboard();
}

function reRollRoundSong(roundIndex) {
    const evt = state.activeEvent;
    if (!evt) return;
    saveHistoryState();
    if (evt.status === 'SWISS' && evt.swissRounds[roundIndex]) {
        evt.swissRounds[roundIndex].currentSong = getRandomSong();
    } else if (evt.status === 'PLAYOFFS' && evt.playoffs && evt.playoffs.rounds[roundIndex]) {
        evt.playoffs.rounds[roundIndex].currentSong = getRandomSong();
    }
    saveState();
    refreshTournamentViews();
}

function setMatchWinner(roundIndex, matchIndex, winnerId, customPoints = 3) {
    const evt = state.activeEvent;
    const round = evt && evt.swissRounds[roundIndex];
    if (!round || !round.matches[matchIndex]) return;
    saveHistoryState();
    const match = round.matches[matchIndex];
    if (String(match.winnerId) === String(winnerId)) match.winnerId = null;
    else { match.winnerId = String(winnerId); match.pointsAwarded = parseInt(customPoints, 10) || 3; }
    updateLeaderboard();
    saveState();
    refreshTournamentViews();
}

function updateLeaderboard() {
    const evt = state.activeEvent;
    if (!evt) return;
    const scores = {};
    evt.participants.forEach(p => { scores[p.id] = { participant: p, points: 0, wins: 0, losses: 0 }; });
    evt.swissRounds.forEach(round => {
        round.matches.forEach(m => {
            if (!m.winnerId) return;
            const winner = scores[m.winnerId];
            const loserId = String(m.playerA.id) === String(m.winnerId) ? m.playerB.id : m.playerA.id;
            if (winner) { winner.points += m.pointsAwarded || 3; winner.wins += 1; }
            if (scores[loserId]) scores[loserId].losses += 1;
        });
    });
    evt.leaderboard = Object.values(scores).filter(s => s.participant.id !== 'bot-bye').sort((a, b) => b.points - a.points || b.wins - a.wins);
}

function registerPlayedAgainst(roundObj) {
    const evt = state.activeEvent;
    if (!evt) return;
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
    if (!evt) return;
    const cur = evt.swissRounds[evt.currentRound - 1];
    if (!cur) return;
    if (!cur.matches.every(m => m.winnerId !== null)) {
        showCustomModal("Partidas Pendientes", "Hay enfrentamientos sin ganador. ¿Deseas avanzar de ronda?", true, (ok) => {
            if (!ok) return;
            proceedNextSwiss(evt, cur);
        });
        return;
    }
    proceedNextSwiss(evt, cur);
}

function proceedNextSwiss(evt, cur) {
    saveHistoryState();
    cur.isCompleted = true;
    registerPlayedAgainst(cur);
    if (evt.currentRound < evt.maxSwissRounds) {
        evt.currentRound += 1;
        generatePairingsForRound(evt.currentRound);
    } else {
        alert("Límite de rondas alcanzado. Puedes generar los PlayOffs.");
    }
    saveState();
    refreshTournamentViews();
}

function addExtraSwissRound() {
    const evt = state.activeEvent;
    if (!evt) return;
    saveHistoryState();
    const cur = evt.swissRounds[evt.currentRound - 1];
    if (cur) { cur.isCompleted = true; registerPlayedAgainst(cur); }
    evt.maxSwissRounds += 1;
    evt.currentRound += 1;
    generatePairingsForRound(evt.currentRound);
    saveState();
    refreshTournamentViews();
}

function createPlayoffs() {
    const evt = state.activeEvent;
    if (!evt) return;
    updateLeaderboard();
    const topCount = parseInt(prompt("¿Cuántos clasificados a PlayOffs? (Ej: 4 u 8)", "4"), 10) || 4;
    saveHistoryState();
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
    evt.playoffs = {
        topCount,
        rounds: [{ roundName: qualified.length <= 2 ? 'GRAN FINAL' : 'SEMIFINAL', matches: roundMatches, currentSong: getRandomSong() }],
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
    match.winnerId = (match.winnerId === target) ? null : target;
    po.rounds = po.rounds.slice(0, roundIdx + 1);
    po.champion = null;
    if (evt.status === 'FINISHED') evt.status = 'PLAYOFFS';

    const currentRound = po.rounds[roundIdx];
    if (currentRound.matches.every(m => m.winnerId)) {
        const winners = currentRound.matches.map(m => (m.playerA && String(m.playerA.id) === String(m.winnerId)) ? m.playerA : m.playerB).filter(Boolean);
        if (winners.length === 1) {
            po.champion = winners[0];
            evt.status = 'FINISHED';
            if (typeof confetti === 'function') confetti({ particleCount: 200, spread: 90, origin: { y: 0.5 } });
            alert(`🏆 ¡CAMPEÓN DEL TORNEO!: ${winners[0].name}`);
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
                roundName: winners.length === 2 ? 'GRAN FINAL' : 'SEMIFINAL',
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
    showCustomModal("Guardar Torneo", "¿Deseas finalizar y guardar el torneo en el Historial?", true, (ok) => {
        if (!ok) return;
        markEventRemovedLocally();
        state.activeEvent.status = 'FINISHED';
        const copy = JSON.parse(JSON.stringify(state.activeEvent));
        delete copy.historyStates;
        state.eventHistory.unshift(copy);
        fetch(`${API_BASE}/events/active`, { method: 'DELETE' }).catch(() => {});
        state.activeEvent = null;
        saveState();
        alert("Torneo guardado en el Historial.");
        navigateTo('view-event-history');
    });
}

function renderTournamentAdmin() {
    const activeBox = document.getElementById('active-tournament-admin');
    const swissBox = document.getElementById('swiss-admin-container');
    
    if (!activeBox || !swissBox) return;

    if (!state.activeEvent) {
        activeBox.classList.add('hidden');
        return;
    }

    activeBox.classList.remove('hidden');

    const adminHeaderBar = `
        <div class="flex flex-wrap items-center justify-between gap-3 bg-wine-950/80 p-4 rounded-xl border border-wine-800 mb-4 shadow-lg glass-panel">
            <div>
                <span class="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-extrabold uppercase border border-amber-500/30">${state.activeEvent.status}</span>
                <h4 class="text-lg font-bold text-white mt-1">${escapeHtml(state.activeEvent.title)}</h4>
            </div>
            <div class="flex flex-wrap items-center gap-2">
                <button onclick="undoTournamentStep()" class="px-3 py-1.5 bg-amber-950 hover:bg-amber-900 text-amber-300 rounded-lg text-xs font-bold border border-amber-800/60 flex items-center space-x-1" title="Deshacer último cambio">
                    <i class="ph-bold ph-arrow-u-up-left"></i> <span>Deshacer</span>
                </button>
                <button onclick="archiveActiveEvent()" class="px-3 py-1.5 bg-blue-950 hover:bg-blue-900 text-blue-300 rounded-lg text-xs font-bold border border-blue-800/60 flex items-center space-x-1" title="Archivar en Historial">
                    <i class="ph-bold ph-archive"></i> <span>Archivar</span>
                </button>
                <button onclick="finishAndSaveEvent()" class="px-3 py-1.5 bg-green-800 hover:bg-green-700 text-white rounded-lg text-xs font-bold shadow flex items-center space-x-1" title="Finalizar torneo">
                    <i class="ph-bold ph-check"></i> <span>Finalizar</span>
                </button>
                <button onclick="deleteActiveEvent()" class="px-3 py-1.5 bg-red-950 hover:bg-red-900 text-red-400 rounded-lg text-xs font-bold border border-red-800/60 flex items-center space-x-1" title="Eliminar torneo permanentemente">
                    <i class="ph-bold ph-trash"></i> <span>Eliminar</span>
                </button>
            </div>
        </div>
    `;

    if (state.activeEvent.status === 'SETUP') {
        swissBox.innerHTML = `
            ${adminHeaderBar}
            <div class="p-6 bg-wine-950/40 rounded-xl border border-wine-900 text-center space-y-3 glass-panel">
                <p class="text-sm text-slate-300">El torneo está en fase de <b>Inscripción</b>. Inscribe a los jugadores arriba y presiona Iniciar Torneo.</p>
                <button onclick="generateFirstSwissRound()" class="px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded-xl shadow-lg hover-glow">🚀 Comenzar Fase Suiza</button>
            </div>
        `;
    } else if (state.activeEvent.status === 'SWISS') {
        const roundObj = state.activeEvent.swissRounds[state.activeEvent.currentRound - 1];
        if (!roundObj) return;
        swissBox.innerHTML = `
            ${adminHeaderBar}
            <div class="flex flex-wrap items-center justify-between gap-3 bg-wine-900/40 p-3 rounded-xl border border-wine-800 mb-4">
                <span class="text-sm font-bold text-white">Ronda ${state.activeEvent.currentRound} de ${state.activeEvent.maxSwissRounds}</span>
                <div class="flex gap-2">
                    <button onclick="addExtraSwissRound()" class="px-3 py-1.5 bg-wine-800 hover:bg-wine-700 text-white rounded-lg text-xs font-bold">+ Ronda Extra</button>
                    <button onclick="nextSwissRound()" class="px-4 py-1.5 bg-green-700 hover:bg-green-600 text-white rounded-lg text-xs font-bold shadow hover-glow">Siguiente Ronda ➔</button>
                </div>
            </div>
            ${roundObj.currentSong ? `
                <div class="bg-gradient-to-r from-wine-950 via-wine-900 to-wine-950 p-4 rounded-xl border-2 border-amber-500/80 shadow-lg flex items-center justify-between mb-4 glass-panel-glow">
                    <div class="flex items-center space-x-3">
                        <div class="p-2.5 bg-amber-500/20 text-amber-400 rounded-lg text-xl border border-amber-500/40">🎵</div>
                        <div>
                            <span class="text-xs font-extrabold uppercase text-amber-400 tracking-wider block">Canción de la ronda:</span>
                            <span id="global-roulette-song" class="text-lg font-black text-white">${escapeHtml(roundObj.currentSong)}</span>
                        </div>
                    </div>
                    <button onclick="spinSongRoulette(${state.activeEvent.currentRound - 1})" class="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1 shadow-md hover-glow">
                        <i class="ph-bold ph-shuffle"></i> <span>Girar Ruleta</span>
                    </button>
                </div>
            ` : ''}
            <div class="bg-[#090507] border border-wine-900 rounded-xl p-4 space-y-3">
                ${roundObj.matches.map((m, idx) => {
                    const isWinA = String(m.winnerId) === String(m.playerA.id);
                    const isWinB = m.playerB && String(m.winnerId) === String(m.playerB.id);
                    return `
                        <div class="flex items-center justify-between p-3 rounded-xl bg-wine-950/80 border border-wine-900 shadow-md">
                            <div class="flex items-center space-x-3 w-5/12 ${isWinA ? 'text-green-400 font-extrabold' : ''}">
                                ${m.playerA.isBot ? '🤖' : `<img src="${escapeHtml(getUserAvatar(m.playerA))}" onerror="this.src='https://i.imgur.com/6VBx3io.png'" class="w-7 h-7 rounded-full object-cover">`}
                                <span class="text-xs truncate cursor-pointer" onmouseenter="showUserHoverCard(event, '${escapeHtml(m.playerA.name)}')" onmouseleave="hideUserHoverCard()">${escapeHtml(m.playerA.name)}</span>
                                <button onclick="setMatchWinner(${state.activeEvent.currentRound - 1},${idx}, '${m.playerA.id}')" class="px-2 py-1 rounded ${isWinA ? 'bg-green-600 text-white' : 'bg-green-950 text-green-400'} text-xs font-semibold ml-auto">✔️ Ganador</button>
                            </div>
                            <div class="text-xs font-black text-wine-400 px-2">VS</div>
                            <div class="flex items-center justify-end space-x-3 w-5/12 ${isWinB ? 'text-green-400 font-extrabold' : ''}">
                                ${m.playerB ? `
                                    <button onclick="setMatchWinner(${state.activeEvent.currentRound - 1}, ${idx}, '${m.playerB.id}')" class="px-2 py-1 rounded ${isWinB ? 'bg-green-600 text-white' : 'bg-green-950 text-green-400'} text-xs font-semibold mr-auto">✔️ Ganador</button>
                                    <span class="text-xs truncate cursor-pointer" onmouseenter="showUserHoverCard(event, '${escapeHtml(m.playerB.name)}')" onmouseleave="hideUserHoverCard()">${escapeHtml(m.playerB.name)}</span>
                                    ${m.playerB.isBot ? '🤖' : `<img src="${escapeHtml(getUserAvatar(m.playerB))}" onerror="this.src='https://i.imgur.com/6VBx3io.png'" class="w-7 h-7 rounded-full object-cover">`}
                                ` : '<span class="text-xs text-slate-500 italic">LIBRE</span>'}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            <div class="flex justify-end pt-4">
                <button onclick="createPlayoffs()" class="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center space-x-2 hover-glow">
                    <span>🏆 Generar PlayOffs / Finales</span>
                </button>
            </div>
        `;
    } else if (state.activeEvent.status === 'PLAYOFFS' || state.activeEvent.status === 'FINISHED') {
        const po = state.activeEvent.playoffs;
        swissBox.innerHTML = `
            ${adminHeaderBar}
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
            <div class="bg-wine-950/60 border border-wine-900 rounded-2xl p-12 text-center space-y-4 glass-panel">
                <div class="w-16 h-16 rounded-2xl bg-wine-900/50 border border-wine-700/50 text-wine-400 flex items-center justify-center mx-auto"><i class="ph-bold ph-calendar-x text-3xl"></i></div>
                <h3 class="text-2xl font-bold text-white">No hay torneos en vivo</h3>
                <p class="text-slate-400 text-sm max-w-md mx-auto">Vuelve más tarde o revisa el inicio para enterarte de los próximos eventos oficiales.</p>
            </div>
        `;
        return;
    }

    const evt = state.activeEvent;
    const cur = (evt.status === 'SWISS' && evt.swissRounds.length > 0) ? evt.swissRounds[evt.currentRound - 1] : null;

    container.innerHTML = `
        <div class="bg-wine-950/80 border border-wine-900 rounded-2xl p-6 shadow-2xl space-y-6 glass-panel">
            <div class="flex items-center justify-between border-b border-wine-900 pb-4">
                <div>
                    <span class="px-3 py-1 rounded-full bg-red-950 border border-red-800 text-red-400 text-xs font-bold uppercase animate-pulse">🔴 EN VIVO</span>
                    <h3 class="text-2xl font-black text-white mt-2">${escapeHtml(evt.title)}</h3>
                </div>
            </div>
            ${cur && cur.currentSong ? `
                <div class="bg-gradient-to-r from-wine-950 via-wine-900 to-wine-950 p-5 rounded-2xl border-2 border-amber-500/80 shadow-2xl flex items-center justify-between glass-panel-glow">
                    <div class="flex items-center space-x-4">
                        <div class="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-2xl flex-shrink-0">🎵</div>
                        <div>
                            <span class="text-xs font-black uppercase text-amber-400 tracking-widest block">Canción de esta ronda:</span>
                            <h2 id="global-roulette-song" class="text-xl sm:text-2xl font-black text-white">${escapeHtml(cur.currentSong)}</h2>
                        </div>
                    </div>
                </div>
            ` : ''}
            ${(evt.status === 'SWISS' && cur) ? `
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div class="lg:col-span-2 space-y-4">
                        <h4 class="text-sm font-bold text-wine-300 uppercase">Enfrentamientos - Ronda ${evt.currentRound}</h4>
                        <div class="space-y-3">
                            ${cur.matches.map(m => `
                                <div class="flex items-center justify-between p-4 rounded-xl bg-[#090507] border border-wine-900 shadow-lg">
                                    <div class="flex items-center space-x-3 cursor-pointer" onmouseenter="showUserHoverCard(event, '${escapeHtml(m.playerA.name)}')" onmouseleave="hideUserHoverCard()">${m.playerA.isBot ? '🤖' : `<img src="${escapeHtml(getUserAvatar(m.playerA))}" onerror="this.src='https://i.imgur.com/6VBx3io.png'" class="w-7 h-7 rounded-full object-cover">`}<span class="text-sm font-bold text-white">${escapeHtml(m.playerA.name)}</span></div>
                                    <div class="text-xs font-black text-wine-500 bg-wine-950 px-3 py-1 rounded-full border">VS</div>
                                    <div class="flex items-center space-x-3 cursor-pointer" onmouseenter="showUserHoverCard(event, '${escapeHtml(m.playerB ? m.playerB.name : '')}')" onmouseleave="hideUserHoverCard()"><span class="text-sm font-bold text-white">${escapeHtml(m.playerB ? m.playerB.name : 'BYE')}</span>${m.playerB && m.playerB.isBot ? '🤖' : `<img src="${escapeHtml(getUserAvatar(m.playerB))}" onerror="this.src='https://i.imgur.com/6VBx3io.png'" class="w-7 h-7 rounded-full object-cover">`}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div>
                        <h4 class="text-sm font-bold text-wine-300 uppercase mb-4">Tabla de Posiciones</h4>
                        <div class="bg-[#090507] border border-wine-900 rounded-xl p-4">
                            <table class="w-full text-left text-xs">
                                <thead class="text-wine-400 border-b border-wine-900"><tr><th class="py-2">Puesto</th><th class="py-2">Jugador</th><th class="py-2 text-right">Pts</th></tr></thead>
                                <tbody class="divide-y divide-wine-900/40">
                                    ${evt.leaderboard.map((item, idx) => `
                                        <tr><td class="py-2 font-bold text-wine-400">#${idx + 1}</td><td class="py-2 flex items-center space-x-2 cursor-pointer" onmouseenter="showUserHoverCard(event, '${escapeHtml(item.participant.name)}')" onmouseleave="hideUserHoverCard()">${item.participant.isBot ? '🤖' : `<img src="${escapeHtml(getUserAvatar(item.participant))}" onerror="this.src='https://i.imgur.com/6VBx3io.png'" class="w-5 h-5 rounded-full object-cover">`}<span class="font-bold text-slate-200">${escapeHtml(item.participant.name)}</span></td><td class="py-2 text-right font-black text-amber-400">${item.points}</td></tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ` : ''}
            ${(evt.status === 'PLAYOFFS' || evt.status === 'FINISHED') ? renderPlayoffsBracketHTML(evt.playoffs, false) : ''}
        </div>
    `;
}

// ===== PLAYOFFS BRACKET ESPORTS CON LÍNEAS VISUALES =====
function renderPlayoffsBracketHTML(playoffs, isAdminControl = false) {
    if (!playoffs) return '';
    return `
        <div class="relative overflow-x-auto py-8 bg-[#090507] rounded-2xl border border-wine-900 p-6 glass-panel">
            ${playoffs.champion ? `
                <div class="text-center py-6 mb-8 rounded-2xl bg-amber-500/10 border-2 border-amber-500 neon-gold max-w-md mx-auto">
                    <h2 class="text-3xl font-black text-amber-400">🏆 CAMPEÓN 🏆</h2>
                    <div class="flex items-center justify-center space-x-3 mt-3">
                        ${playoffs.champion.isBot ? '🤖' : `<img src="${escapeHtml(getUserAvatar(playoffs.champion))}" onerror="this.src='https://i.imgur.com/6VBx3io.png'" class="w-12 h-12 rounded-full object-cover border-2 border-amber-400">`}
                        <span class="text-2xl font-bold text-white">${escapeHtml(playoffs.champion.name)}</span>
                    </div>
                </div>
            ` : ''}
            <div class="bracket-container">
                ${playoffs.rounds.map((round, rIdx) => `
                    <div class="bracket-round">
                        <div class="text-center mb-3">
                            <h5 class="text-xs font-extrabold text-wine-400 uppercase tracking-widest">${escapeHtml(round.roundName)}</h5>${round.currentSong ? `<span class="text-[10px] text-amber-400 font-bold block mt-1 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60">🎵 ${escapeHtml(round.currentSong)}</span>` : ''}
                            ${isAdminControl ? `<button onclick="spinSongRoulette(${rIdx})" class="mt-2 text-[10px] bg-amber-600 px-2 py-1 rounded text-white font-bold hover:bg-amber-500">🎲 Sorteo</button>` : ''}
                        </div>
                        <div class="space-y-6">
                            ${round.matches.map((m, mIdx) => {
                                const isWinA = m.winnerId && m.playerA && String(m.winnerId) === String(m.playerA.id);
                                const isWinB = m.winnerId && m.playerB && String(m.winnerId) === String(m.playerB.id);
                                return `
                                    <div class="bracket-match w-64 bg-wine-950/90 border border-wine-800 rounded-xl p-3 shadow-2xl glass-panel">
                                        <div class="flex items-center justify-between p-2 rounded-lg ${isWinA ? 'bg-green-950/90 text-green-300 font-bold border border-green-500' : 'text-slate-300'} mb-2">
                                            <div class="flex items-center space-x-2 truncate cursor-pointer" onmouseenter="showUserHoverCard(event, '${escapeHtml(m.playerA ? m.playerA.name : '')}')" onmouseleave="hideUserHoverCard()">
                                                ${m.playerA ? (m.playerA.isBot ? '🤖' : `<img src="${escapeHtml(getUserAvatar(m.playerA))}" onerror="this.src='https://i.imgur.com/6VBx3io.png'" class="w-6 h-6 rounded-full object-cover">`) : ''}
                                                <span class="text-xs font-bold truncate">${m.playerA ? escapeHtml(m.playerA.name) : 'Por Definir'}</span>
                                            </div>
                                            ${isAdminControl && m.playerA ? `<button onclick="setPlayoffWinner(${rIdx},${mIdx}, '${m.playerA.id}')" class="text-[10px] px-2 py-1 ${isWinA ? 'bg-green-600 text-white' : 'bg-wine-900 text-slate-200'} rounded font-bold">✔️</button>` : ''}
                                        </div>
                                        <div class="text-[10px] text-center font-black text-wine-500 uppercase my-1">vs</div>
                                        <div class="flex items-center justify-between p-2 rounded-lg ${isWinB ? 'bg-green-950/90 text-green-300 font-bold border border-green-500' : 'text-slate-300'}">
                                            <div class="flex items-center space-x-2 truncate cursor-pointer" onmouseenter="showUserHoverCard(event, '${escapeHtml(m.playerB ? m.playerB.name : '')}')" onmouseleave="hideUserHoverCard()">
                                                ${m.playerB ? (m.playerB.isBot ? '🤖' : `<img src="${escapeHtml(getUserAvatar(m.playerB))}" onerror="this.src='https://i.imgur.com/6VBx3io.png'" class="w-6 h-6 rounded-full object-cover">`) : ''}
                                                <span class="text-xs font-bold truncate">${m.playerB ? escapeHtml(m.playerB.name) : 'Por Definir'}</span>
                                            </div>
                                            ${isAdminControl && m.playerB ? `<button onclick="setPlayoffWinner(${rIdx},${mIdx}, '${m.playerB.id}')" class="text-[10px] px-2 py-1 ${isWinB ? 'bg-green-600 text-white' : 'bg-wine-900 text-slate-200'} rounded font-bold">✔️</button>` : ''}
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderEventHistory() {
    const container = document.getElementById('history-events-container');
    if (!container) return;
    if (state.eventHistory.length === 0) { container.innerHTML = `<p class="text-slate-500 text-sm text-center py-8">No hay torneos registrados.</p>`; return; }
    container.innerHTML = state.eventHistory.map((evt, idx) => `
        <div class="bg-wine-950/60 border border-wine-900 rounded-2xl p-6 space-y-4 shadow-xl glass-panel">
            <div class="flex items-center justify-between border-b border-wine-900 pb-3">
                <div>
                    <h3 class="text-xl font-bold text-white">${escapeHtml(evt.title)}</h3>
                    <span class="text-[10px] text-slate-400">Torneo Archivado / Finalizado</span>
                </div>
                <button onclick="deleteHistoryEvent(${idx})" class="px-3 py-1.5 bg-red-950 hover:bg-red-900 text-red-400 rounded-xl text-xs font-semibold border border-red-800/50 flex items-center space-x-1">
                    <i class="ph-bold ph-trash"></i> <span>Eliminar del Historial</span>
                </button>
            </div>
            ${evt.leaderboard && evt.leaderboard.length > 0 ? `
                <div>
                    <h4 class="text-xs font-bold text-wine-300 uppercase mb-2">Podio Final</h4>
                    <div class="flex flex-wrap gap-4 text-xs bg-[#090507] p-3 rounded-xl border border-wine-900">
                        ${evt.leaderboard.map((item, pIdx) => `<span class="text-slate-300"><b class="text-amber-400">#${pIdx + 1}</b> ${escapeHtml(item.participant.name)} (${item.points} pts)</span>`).join(' • ')}
                    </div>
                </div>
            ` : ''}
            ${renderPlayoffsBracketHTML(evt.playoffs, false)}
        </div>
    `).join('');
}

// AUTENTICACIÓN Y PERFIL
async function handleRegister(e) {
    e.preventDefault();
    const nickname = document.getElementById('reg-nickname')?.value.trim();
    const password = document.getElementById('reg-password')?.value;
    const genero = document.getElementById('reg-genero')?.value || 'Otros';
    if (!nickname || !password) { alert("Completa todos los campos."); return; }

    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nickname, password, genero })
        });
        if (res.ok) {
            const newUser = await res.json();
            alert("¡Registro exitoso!");
            state.currentUser = { id: newUser.id, nickname: newUser.nickname || nickname, nombres: newUser.nombres || nickname, modo: ['NORMAL'], familia: state.clans[0], avatar: getUserAvatar(newUser), genero, role: newUser.role || 'USER' };
            saveState();
            await fetchUsers();
            navigateTo('view-profile-edit');
        } else { alert("Error al registrar."); }
    } catch (err) { console.error(err); }
}

async function handleLogin(e) {
    e.preventDefault();
    const nickname = document.getElementById('login-nickname')?.value.trim();
    const password = document.getElementById('login-password')?.value;
    if (!nickname || !password) { alert("Usuario o contraseña incorrectos"); return; }

    try {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nickname, password })
        });
        if (res.ok) {
            const data = await res.json();
            state.currentUser = data.user;
            saveState();
            alert(`¡Bienvenido, ${state.currentUser.nickname}!`);
            navigateTo('view-home');
            return;
        }
    } catch (e) {}

    await fetchUsers();
    const found = state.users.find(u => (u.nickname || u.name || '').toLowerCase() === nickname.toLowerCase());
    if (found && (!found.password || found.password === password)) {
        state.currentUser = {
            id: found.id,
            nickname: found.nickname || found.name,
            nombres: found.nombres || found.name,
            modo: ['NORMAL'],
            familia: found.familia || state.clans[0],
            avatar: getUserAvatar(found),
            genero: found.genero || 'Otros',
            role: found.role || 'USER'
        };
        saveState();
        alert(`¡Bienvenido, ${state.currentUser.nickname}!`);
        navigateTo('view-home');
    } else {
        alert("Usuario o contraseña incorrectos");
    }
}

function handleLogout() {
    state.currentUser = null;
    saveState();
    alert("Sesión cerrada.");
    navigateTo('view-home');
}

async function deleteMyAccount() {
    showCustomModal("Eliminar Cuenta", "¿Estás seguro de eliminar tu cuenta permanentemente?", true, async (ok) => {
        if (!ok) return;
        try {
            await fetch(`${API_URL}/${state.currentUser.id}`, { method: 'DELETE' });
            handleLogout();
        } catch (e) { alert("Error al eliminar cuenta."); }
    });
}

function renderProfileCard() {
    const container = document.getElementById('profile-card-container');
    if (!container || !state.currentUser) return;
    const userTags = state.tags.filter(t => (state.assignments[state.currentUser.nickname]?.tagIds || []).includes(t.id));
    const avatarUrl = getUserAvatar(state.currentUser);
    const modosText = Array.isArray(state.currentUser.modo) ? state.currentUser.modo.join(', ') : state.currentUser.modo;

    container.innerHTML = `
        <div id="player-collectible-card" class="bg-gradient-to-b from-[#2a0d18] via-[#1c0a11] to-[#090507] border-2 border-amber-500/80 rounded-3xl p-8 shadow-2xl relative overflow-hidden text-center space-y-4 neon-gold">
            <div class="absolute top-4 right-4 bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-xs font-black uppercase border border-amber-500/40">AWC PRO</div>
            <div class="w-32 h-32 rounded-2xl overflow-hidden bg-wine-900 border-2 border-amber-400 mx-auto shadow-2xl mt-2">
                <img src="${escapeHtml(avatarUrl)}" onerror="this.src='https://i.imgur.com/6VBx3io.png'" class="w-full h-full object-cover">
            </div>
            <div>
                <h2 class="text-3xl font-black text-white uppercase font-display">${escapeHtml(state.currentUser.nickname)}</h2>
                <p class="text-xs text-amber-300 font-bold uppercase tracking-widest">${escapeHtml(state.currentUser.familia || 'Sin Clan')}</p>
            </div>
            <div class="grid grid-cols-2 gap-3 py-3 border-y border-wine-900 text-xs">
                <div><span class="block text-[10px] text-slate-400 uppercase">Modos</span><span class="font-bold text-white">${escapeHtml(modosText)}</span></div>
                <div><span class="block text-[10px] text-slate-400 uppercase">Género</span><span class="font-bold text-white">${escapeHtml(state.currentUser.genero || 'Otros')}</span></div>
            </div>
            <div class="flex flex-wrap justify-center gap-1.5 pt-1">
                ${userTags.map(t => `<span class="px-2.5 py-1 rounded-md text-xs font-black text-white shadow" style="background:${t.color}">${t.name}</span>`).join('')}
            </div>
        </div>
    `;
}

function downloadProfileCard() {
    const cardEl = document.getElementById('player-collectible-card');
    if (!cardEl) return;
    if (typeof html2canvas === 'undefined') {
        alert("Librería de captura no disponible.");
        return;
    }
    html2canvas(cardEl, { backgroundColor: '#090507', scale: 2 }).then(canvas => {
        const link = document.createElement('a');
        link.download = `Carta_${state.currentUser.nickname}_AWC.png`;
        link.href = canvas.toDataURL();
        link.click();
        showToast("¡Carta descargada con éxito!", "success");
    });
}

async function handleSaveProfile(e) {
    e.preventDefault();
    if (!state.currentUser) return;
    const nombres = document.getElementById('prof-nombres').value;
    const modo = ['NORMAL'];
    const familia = document.getElementById('prof-familia').value;
    const avatar = document.getElementById('prof-avatar').value.trim();
    const genero = document.getElementById('prof-genero').value;

    state.currentUser = { ...state.currentUser, nombres, modo, familia, avatar, genero };
    saveState();
    try {
        await fetch(`${API_URL}/${state.currentUser.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombres, modo, familia, avatar, genero })
        });
        alert("¡Perfil actualizado!");
        navigateTo('view-profile-card');
    } catch (e) { alert("Error al guardar perfil."); }
}

function fillProfileEditForm() {
    if (!state.currentUser) return;
    const nomEl = document.getElementById('prof-nombres');
    if (nomEl) nomEl.value = state.currentUser.nombres || '';
    const avEl = document.getElementById('prof-avatar');
    if (avEl) avEl.value = getUserAvatar(state.currentUser);
    const genEl = document.getElementById('prof-genero');
    if (genEl) genEl.value = state.currentUser.genero || 'Otros';
    const clanSelect = document.getElementById('prof-familia');
    if (clanSelect) {
        clanSelect.innerHTML = state.clans.map(c => `<option value="${escapeHtml(c)}" ${state.currentUser.familia === c ? 'selected' : ''}>${escapeHtml(c)}</option>`).join('');
    }
}

// ADMIN PANEL
function renderAdminPanel() {
    renderAdminTabsList();
    renderAdminTiersList();
    renderAdminTagsList();
    renderAdminClansList();
    renderAdminUserTable();
}

async function handleCreateTab(e) {
    e.preventDefault();
    const name = document.getElementById('tab-name').value.trim();
    if (!name) return;
    await fetch(`${API_BASE}/tabs`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
    document.getElementById('tab-name').value = '';
    await fetchGlobalConfig();
    renderAdminPanel();
}

async function deleteTab(id) { await fetch(`${API_BASE}/tabs/${id}`, { method: 'DELETE' }); await fetchGlobalConfig(); renderAdminPanel(); }

function renderAdminTabsList() {
    const c = document.getElementById('admin-tabs-list');
    const s = document.getElementById('tier-tab-select');
    if (!c) return;
    c.innerHTML = state.tabs.map(t => `<div class="flex items-center justify-between p-2 rounded-xl bg-[#090507] border text-xs"><span class="font-bold">${escapeHtml(t.name)}</span><button onclick="deleteTab(${t.id})" class="text-red-400"><i class="ph-bold ph-trash"></i></button></div>`).join('');
    if (s) s.innerHTML = state.tabs.map(t => `<option value="${t.id}">${escapeHtml(t.name)}</option>`).join('');
}

async function handleCreateTier(e) {
    e.preventDefault();
    const name = document.getElementById('tier-name').value.trim();
    const color = document.getElementById('tier-color').value;
    const tabId = document.getElementById('tier-tab-select').value;
    if (!name) return;
    await fetch(`${API_BASE}/tiers`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, color, tabId: Number(tabId) }) });
    document.getElementById('tier-name').value = '';
    await fetchGlobalConfig();
    renderAdminPanel();
}

async function deleteTier(id) {
    const t = state.tiers.find(x => x.id === id);
    if (!t) return;
    await fetch(`${API_BASE}/tiers/${t.dbId}`, { method: 'DELETE' });
    await fetchUsers();
    renderAdminPanel();
}

function renderAdminTiersList() {
    const c = document.getElementById('admin-tiers-list');
    if (!c) return;
    c.innerHTML = state.tiers.map(t => `<div class="flex items-center justify-between p-2 rounded-xl bg-[#090507] border text-xs"><span class="font-bold" style="color:${t.color}">${escapeHtml(t.name)}</span><button onclick="deleteTier('${t.id}')" class="text-red-400"><i class="ph-bold ph-trash"></i></button></div>`).join('');
}

function handleCreateTag(e) {
    e.preventDefault();
    const name = document.getElementById('tag-name').value.trim();
    const color = document.getElementById('tag-color').value;
    if (!name) return;
    state.tags.push({ id: 'tag-' + Date.now(), name, color });
    saveState();
    document.getElementById('tag-name').value = '';
    renderAdminPanel();
}

function deleteTag(id) { state.tags = state.tags.filter(t => t.id !== id); saveState(); renderAdminPanel(); }

function renderAdminTagsList() {
    const c = document.getElementById('admin-tags-list');
    if (!c) return;
    c.innerHTML = state.tags.map(t => `<span class="px-2 py-1 rounded text-xs text-white" style="background:${t.color}">${t.name} <button onclick="deleteTag('${t.id}')">×</button></span>`).join('');
}

function renderAdminClansList() {
    const c = document.getElementById('admin-clans-list');
    if (!c) return;
    c.innerHTML = state.clans.map(cl => `<div class="flex items-center justify-between p-2 rounded-xl bg-[#090507] border text-xs"><span class="font-bold">${escapeHtml(cl)}</span></div>`).join('');
}

async function addUserToTier(userId, tierId, puntos = 0) {
    if (!tierId) return;
    await fetch(`${API_BASE}/users/${userId}/tiers`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tierId: Number(tierId), puntos: Number(puntos) }) });
    await fetchUsers();
    renderAdminUserTable();
}

async function updateUserTierPoints(userId, tierId, pts) {
    await fetch(`${API_BASE}/users/${userId}/tiers`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tierId: Number(tierId), puntos: Number(pts) }) });
    await fetchUsers();
}

async function removeUserTier(userId, tierId) {
    await fetch(`${API_BASE}/users/${userId}/tiers/${tierId}`, { method: 'DELETE' });
    await fetchUsers();
    renderAdminUserTable();
}

// CAMBIAR ROL DIRECTAMENTE DESDE EL PANEL ADMIN
async function changeUserRole(userId, newRole) {
    try {
        const res = await fetch(`${API_URL}/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: newRole })
        });

        if (res.ok) {
            showToast(`¡Rol actualizado a ${newRole} con éxito!`, 'success');
            await fetchUsers();
            renderAdminUserTable();
        } else {
            showToast("No se pudo cambiar el rol en el servidor.", "error");
        }
    } catch (e) {
        console.error(e);
        showToast("Error de conexión al intentar cambiar el rol.", "error");
    }
}

function renderAdminUserTable() {
    const tbody = document.getElementById('admin-table-body');
    if (!tbody) return;

    tbody.innerHTML = state.users.map(u => {
        const uname = u.nickname || u.name;
        const assign = state.assignments[uname] || { tagIds: [] };
        const ranks = u.tierRanks || [];
        const avail = state.tiers.filter(t => !ranks.map(r => r.tierId).includes(t.dbId));
        const userAvatar = getUserAvatar(u);
        const currentRole = u.role || 'USER';

        return `
            <tr class="border-b border-wine-900/60 text-xs">
                <td class="py-3 px-4 font-bold text-wine-400 flex items-center space-x-2">
                    <img src="${escapeHtml(userAvatar)}" onerror="this.src='https://i.imgur.com/6VBx3io.png'" class="w-6 h-6 rounded-full object-cover">
                    <span>${escapeHtml(uname)}</span>
                </td>
                <td class="py-3 px-4">${escapeHtml(u.nombres || '')}</td>
                <td class="py-3 px-4">
                    <select onchange="changeUserRole(${u.id}, this.value)" class="bg-wine-950 border border-wine-800 rounded px-2 py-1 text-white font-bold focus:border-amber-400">
                        <option value="USER" ${currentRole === 'USER' ? 'selected' : ''}>JUGADOR</option>
                        <option value="MODERATOR" ${currentRole === 'MODERATOR' ? 'selected' : ''}>MODERADOR</option>
                        <option value="ADMIN" ${currentRole === 'ADMIN' ? 'selected' : ''}>ADMINISTRADOR</option>
                    </select>
                </td>
                <td class="py-3 px-4 space-y-1">
                    ${ranks.map(r => `<div class="flex items-center space-x-2"><span class="px-2 py-0.5 rounded text-white text-[10px]" style="background:${r.tier.color}">${r.tier.name}</span><input type="number" value="${r.puntos}" onchange="updateUserTierPoints(${u.id},${r.tierId}, this.value)" class="w-14 bg-wine-950 border rounded text-center text-amber-400"> pts <button onclick="removeUserTier(${u.id},${r.tierId})" class="text-red-400">×</button></div>`).join('')}
                    ${avail.length > 0 ? `<select onchange="addUserToTier(${u.id}, this.value)" class="bg-wine-950 border rounded p-1"><option value="">+ Añadir Tier...</option>${avail.map(t => `<option value="${t.dbId}">${t.name}</option>`).join('')}</select>` : ''}
                </td>
                <td class="py-3 px-4">
                    <div class="flex flex-wrap gap-1">
                        ${state.tags.map(t => `<button onclick="toggleUserTag('${uname}', '${t.id}')" class="px-2 py-0.5 rounded text-[10px] ${assign.tagIds.includes(t.id) ? 'text-white' : 'text-slate-500 bg-[#090507]'}" style="${assign.tagIds.includes(t.id) ? 'background:'+t.color : ''}">${t.name}</button>`).join('')}
                    </div>
                </td>
                <td class="py-3 px-4 text-center">
                    <button onclick="deleteUserByAdmin(${u.id}, '${uname}')" class="text-red-400 hover:text-red-300"><i class="ph-bold ph-trash"></i></button>
                </td>
            </tr>
        `;
    }).join('');
}

function toggleUserTag(uname, tagId) {
    if (!state.assignments[uname]) state.assignments[uname] = { tagIds: [] };
    const ids = state.assignments[uname].tagIds;
    const idx = ids.indexOf(tagId);
    if (idx > -1) ids.splice(idx, 1); else ids.push(tagId);
    saveState();
    renderAdminUserTable();
}

async function deleteUserByAdmin(id, uname) {
    showCustomModal("Eliminar Usuario", `¿Eliminar a "${uname}"?`, true, async (ok) => {
        if (!ok) return;
        await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        await fetchUsers();
        renderAdminUserTable();
    });
}

function renderTabsNavigation() {
    const c = document.getElementById('tabs-navigation');
    if (!c) return;

    if (state.tabs.length === 0) {
        c.innerHTML = `<p class="text-xs text-slate-500 italic">No hay pestañas creadas.</p>`;
        return;
    }

    if (activeTabId === null && state.tabs.length > 0) {
        activeTabId = state.tabs[0].id;
    }

    c.innerHTML = state.tabs.map(t => `
        <button onclick="setActiveTab(${t.id})" class="px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${String(activeTabId) === String(t.id) ? 'bg-wine-700 text-white shadow-lg' : 'bg-wine-950 text-slate-400 border border-wine-900 hover:bg-wine-900'}">
            ${escapeHtml(t.name)}
        </button>
    `).join('');
}

function setActiveTab(id) { activeTabId = id; renderTabsNavigation(); renderPublicTiers(); }

// ===== RENDERIZADO DE TIERS PÚBLICOS =====
function filterTierTable() { renderPublicTiers(); }

function renderPublicTiers() {
    renderTabsNavigation();
    const container = document.getElementById('public-tiers-container');
    if (!container) return;

    if (!state.currentUser) {
        container.innerHTML = `
            <div class="bg-wine-950/60 border border-wine-900 rounded-2xl p-8 text-center space-y-4 glass-panel">
                <h3 class="text-xl font-bold text-white">Contenido Privado</h3>
                <p class="text-slate-400 text-sm">Inicia sesión para ver las tablas TIER.</p>
                <button onclick="navigateTo('view-login')" class="px-5 py-2 bg-wine-700 text-white rounded-xl text-sm font-semibold">Iniciar Sesión</button>
            </div>
        `;
        return;
    }

    const filtered = state.tiers.filter(t => String(t.tabId) === String(activeTabId));
    if (filtered.length === 0) { 
        container.innerHTML = `<p class="text-slate-500 text-sm text-center py-8">No hay Tiers creados en esta pestaña actualmente.</p>`; 
        return; 
    }

    const searchQuery = document.getElementById('tier-search-input')?.value.toLowerCase() || '';
    const clanFilter = document.getElementById('tier-clan-filter')?.value || '';

    container.innerHTML = filtered.map(tier => {
        let members = [];
        state.users.forEach(u => {
            const uname = u.nickname || u.name;
            if (!uname) return;
            const rank = (u.tierRanks || []).find(r => Number(r.tierId) === Number(tier.dbId));
            if (rank) members.push({ user: u, puntos: rank.puntos });
        });
        members.sort((a, b) => b.puntos - a.puntos);

        members = members.filter(item => {
            const uname = (item.user.nickname || item.user.name).toLowerCase();
            const clan = item.user.familia || 'Sin Familia / Ninguno';
            const matchesSearch = uname.includes(searchQuery);
            const matchesClan = !clanFilter || clan === clanFilter;
            return matchesSearch && matchesClan;
        });

        const top3 = members.slice(0, 3);
        const rest = members.slice(3);

        return `
            <div class="bg-wine-950/60 border border-wine-900 rounded-2xl p-6 shadow-xl space-y-6 glass-panel" style="--tier-color: ${tier.color}">
                <div class="flex items-center justify-between border-b border-wine-900 pb-3" style="border-left: 6px solid ${tier.color}; padding-left: 1rem;">
                    <h3 class="text-xl font-black text-white uppercase font-display">${escapeHtml(tier.name)}</h3>
                    <span class="text-xs px-2.5 py-1 rounded-full bg-wine-900 text-wine-300 font-mono">${members.length} jugadores</span>
                </div>

                <!-- 1. PODIO VISUAL DEL TOP 3 -->
                ${top3.length > 0 ? `
                    <div class="podium">
                        ${top3[1] ? `
                            <div class="podium-card" style="--tier-color: ${tier.color}">
                                <div class="text-xl">🥈</div>
                                <img src="${escapeHtml(getUserAvatar(top3[1].user))}" onerror="this.src='https://i.imgur.com/6VBx3io.png'" class="w-14 h-14 rounded-full object-cover mx-auto border-2 border-slate-300 my-2">
                                <h4 class="font-bold text-sm text-white truncate cursor-pointer" onmouseenter="showUserHoverCard(event, '${escapeHtml(top3[1].user.nickname || top3[1].user.name)}')" onmouseleave="hideUserHoverCard()">${escapeHtml(top3[1].user.nickname || top3[1].user.name)}</h4>
                                <span class="text-amber-400 font-black text-xs">${top3[1].puntos} pts</span>
                            </div>
                        ` : ''}
                        <div class="podium-card first" style="--tier-color: ${tier.color}">
                            <div class="text-2xl">🥇</div>
                            <img src="${escapeHtml(getUserAvatar(top3[0].user))}" onerror="this.src='https://i.imgur.com/6VBx3io.png'" class="w-16 h-16 rounded-full object-cover mx-auto border-2 border-amber-400 my-2 shadow-lg">
                            <h4 class="font-bold text-sm text-white truncate cursor-pointer" onmouseenter="showUserHoverCard(event, '${escapeHtml(top3[0].user.nickname \vert{}\vert{} top3[0].user.name)}')" onmouseleave="hideUserHoverCard()">${escapeHtml(top3[0].user.nickname || top3[0].user.name)}</h4>
                            <span class="text-amber-400 font-black text-sm">${top3[0].puntos} pts</span>
                        </div>
                        ${top3[2] ? `
                            <div class="podium-card" style="--tier-color: ${tier.color}">
                                <div class="text-xl">🥉</div>
                                <img src="${escapeHtml(getUserAvatar(top3[2].user))}" onerror="this.src='https://i.imgur.com/6VBx3io.png'" class="w-14 h-14 rounded-full object-cover mx-auto border-2 border-amber-700 my-2">
                                <h4 class="font-bold text-sm text-white truncate cursor-pointer" onmouseenter="showUserHoverCard(event, '${escapeHtml(top3[2].user.nickname || top3[2].user.name)}')" onmouseleave="hideUserHoverCard()">${escapeHtml(top3[2].user.nickname || top3[2].user.name)}</h4>
                                <span class="text-amber-400 font-black text-xs">${top3[2].puntos} pts</span>
                            </div>
                        ` : ''}
                    </div>
                ` : ''}

                <!-- 2. TIER LIST REAL -->
                ${rest.length > 0 ? `
                    <div class="tier-row">
                        <div class="tier-badge-box" style="background: ${tier.color}">
                            ${escapeHtml(tier.name)}
                        </div>
                        <div class="tier-members-grid">
                            ${rest.map(item => `
                                <div class="tier-avatar-chip" style="--tier-color: ${tier.color}" onmouseenter="showUserHoverCard(event, '${escapeHtml(item.user.nickname || item.user.name)}')" onmouseleave="hideUserHoverCard()">
                                    <img src="${escapeHtml(getUserAvatar(item.user))}" onerror="this.src='https://i.imgur.com/6VBx3io.png'" class="w-8 h-8 rounded-full object-cover">
                                    <div class="text-left pl-2">
                                        <span class="text-xs font-bold text-white block truncate max-w-[100px]">${escapeHtml(item.user.nickname || item.user.name)}</span>
                                        <span class="text-[10px] text-amber-400 font-extrabold">${item.puntos} pts</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : members.length === 0 ? `<p class="text-xs text-slate-500 italic py-2">No hay miembros asignados a este Tier actualmente.</p>` : ''}
            </div>
        `;
    }).join('');
}

// ===== TRADING CARD FLOTANTE (HOVER CARD PRO) =====
function showUserHoverCard(e, username) {
    if (!username) return;
    let card = document.getElementById('user-hover-card');
    if (!card) {
        card = document.createElement('div');
        card.id = 'user-hover-card';
        card.className = 'hidden fixed z-[99999] pointer-events-none p-4 rounded-2xl bg-gradient-to-b from-[#2a0d18] to-[#090507] border-2 border-amber-500/80 shadow-2xl space-y-2 max-w-xs text-left neon-gold';
        document.body.appendChild(card);
    }

    const user = state.users.find(u => (u.nickname || u.name) === username);
    if (!user) return;
    const avatar = getUserAvatar(user);
    const userTags = state.tags.filter(t => (state.assignments[user.nickname]?.tagIds || []).includes(t.id));

    card.innerHTML = `
        <div class="flex items-center space-x-3 border-b border-wine-900 pb-2">
            <img src="${escapeHtml(avatar)}" onerror="this.src='https://i.imgur.com/6VBx3io.png'" class="w-12 h-12 rounded-xl object-cover border border-amber-400 shadow-md">
            <div>
                <h4 class="text-white font-black text-sm uppercase tracking-wide">${escapeHtml(username)}</h4>
                <p class="text-[10px] text-amber-300 font-bold uppercase">${escapeHtml(user.familia || 'Sin Clan')}</p>
            </div>
        </div>
        <div class="flex items-center justify-between text-[11px] pt-1">
            <span class="text-slate-400">Género: <b class="text-white">${escapeHtml(user.genero || 'Otros')}</b></span>
            <span class="text-slate-400">Rol: <b class="text-amber-400">${escapeHtml(user.role || 'JUGADOR')}</b></span>
        </div>
        <div class="flex flex-wrap gap-1 pt-2">
            ${userTags.map(t => `<span class="px-2 py-0.5 rounded text-[9px] font-bold text-white" style="background:${t.color}">${t.name}</span>`).join('')}
        </div>
    `;

    card.style.left = `${e.clientX + 15}px`;
    card.style.top = `${e.clientY + 15}px`;
    card.classList.remove('hidden');
}

function hideUserHoverCard() {
    const card = document.getElementById('user-hover-card');
    if (card) card.classList.add('hidden');
}

function escapeHtml(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[m]);
}

let currentSlide = 0;
const totalSlides = 1;
function updateCarousel() {
    const c = document.getElementById('carousel-slides');
    if (c) c.style.transform = `translateX(-${currentSlide * 100}%)`;
}
function nextSlide() { currentSlide = (currentSlide + 1) % totalSlides; updateCarousel(); }
function prevSlide() { currentSlide = (currentSlide - 1 + totalSlides) % totalSlides; updateCarousel(); }

document.addEventListener('DOMContentLoaded', () => {
    const reg = document.getElementById('form-register');
    if (reg) reg.addEventListener('submit', handleRegister);
    const log = document.getElementById('form-login');
    if (log) log.addEventListener('submit', handleLogin);
    const prof = document.getElementById('form-profile-edit');
    if (prof) prof.addEventListener('submit', handleSaveProfile);

    fetchUsers().then(() => {
        renderHomeStats();
        renderHomeLiveBanner();
        renderHallOfFame();
    });
    fetchActiveEventFromDB().then(() => {
        if (state.activeEvent && document.getElementById('event-song-list-input')) {
            document.getElementById('event-song-list-input').value = (state.activeEvent.songPool || []).join('\n');
        }
    });
    navigateTo('view-home');
});
