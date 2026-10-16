console.log("Sistema Audition World Class LATAM listo y conectado");

// ===== SISTEMA DE NOTIFICACIONES TOAST (ELEGANTES Y ESPORTS) =====
// Los estilos se inyectan desde aquí, así no necesitas tocar tu CSS ni tu HTML.
(function injectToastStyles() {
    if (document.getElementById('toast-styles')) return;
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
        #toast-container {
            position: fixed;
            top: 1.25rem;
            right: 1.25rem;
            z-index: 99999;
            display: flex;
            flex-direction: column;
            gap: 0.6rem;
            pointer-events: none;
            max-width: calc(100vw - 2.5rem);
        }
        .toast-item {
            pointer-events: auto;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            min-width: 260px;
            max-width: 380px;
            padding: 0.85rem 1.1rem;
            border-radius: 0.85rem;
            background: linear-gradient(135deg, #1a0a10 0%, #2a0d18 100%);
            border: 1px solid #800020;
            border-left: 5px solid #c92a52;
            color: #f1e4e8;
            font-size: 0.85rem;
            font-weight: 600;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.55), 0 0 18px rgba(128, 0, 32, 0.35);
            animation: toast-in 0.35s cubic-bezier(0.22, 1, 0.36, 1);
            word-break: break-word;
        }
        .toast-item.toast-success { border-left-color: #34d399; }
        .toast-item.toast-error   { border-left-color: #f43f5e; }
        .toast-item.toast-warning { border-left-color: #fbbf24; }
        .toast-item.toast-info    { border-left-color: #c92a52; }
        .toast-item i { flex-shrink: 0; }
        @keyframes toast-in {
            from { opacity: 0; transform: translateX(60px); }
            to   { opacity: 1; transform: translateX(0); }
        }
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

    // El mensaje se inserta como texto (no como HTML) para evitar inyección con nicknames
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

// Detecta el tipo de toast según el contenido del mensaje (para que cada alert() tenga su color)
function inferToastType(msg) {
    const m = String(msg).toLowerCase();
    if (msg.includes('⚠️') || m.includes('error') || m.includes('no se pudo') ||
        m.includes('incorrecto') || m.includes('rechaz') || m.includes('ocurrió un error')) return 'error';
    if (m.includes('por favor') || m.includes('no hay ') || m.includes('ya está inscrito') ||
        m.includes('ya existe') || m.includes('se necesitan') || m.includes('has alcanzado') ||
        m.includes('no coinciden') || m.includes('al menos')) return 'warning';
    if (m.includes('éxito') || m.includes('exitosamente') || m.includes('correctamente') ||
        m.includes('creado') || m.includes('creada') || m.includes('bienvenido') ||
        m.includes('sesión iniciada') || m.includes('actualizado') || m.includes('actualizada') ||
        m.includes('eliminado') || m.includes('cerrado sesión') || m.includes('ganador')) return 'success';
    return 'info';
}

// Reemplaza el alert nativo globalmente
window.alert = function (msg) {
    showToast(msg, inferToastType(String(msg)));
};

// ===== MODALES PROPIOS (reemplazan confirm() y prompt() del navegador) =====
function openModal({ title = '', message = '', confirmText = 'Aceptar', cancelText = 'Cancelar', danger = false, input = null }) {
    return new Promise(resolve => {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';

        const box = document.createElement('div');
        box.className = 'modal-box' + (danger ? ' modal-danger' : '');
        box.setAttribute('role', 'dialog');
        box.setAttribute('aria-modal', 'true');

        const icon = document.createElement('div');
        icon.className = 'modal-icon';
        icon.innerHTML = `<i class="ph-bold ${danger ? 'ph-warning' : 'ph-question'}"></i>`;

        const h = document.createElement('h3');
        h.textContent = title;
        const p = document.createElement('p');
        p.textContent = message;
        box.append(icon, h, p);

        let field = null;
        if (input) {
            field = document.createElement('input');
            field.className = 'modal-input';
            field.type = input.type || 'text';
            field.value = input.value != null ? input.value : '';
            box.appendChild(field);
        }

        const actions = document.createElement('div');
        actions.className = 'modal-actions';
        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'modal-btn modal-cancel';
        cancelBtn.textContent = cancelText;
        const okBtn = document.createElement('button');
        okBtn.type = 'button';
        okBtn.className = 'modal-btn ' + (danger ? 'modal-ok-danger' : 'modal-ok');
        okBtn.textContent = confirmText;
        actions.append(cancelBtn, okBtn);
        box.appendChild(actions);

        const close = (val) => {
            document.removeEventListener('keydown', onKey);
            overlay.classList.add('closing');
            setTimeout(() => overlay.remove(), 180);
            resolve(val);
        };
        const onKey = (e) => {
            if (e.key === 'Escape') close(input ? null : false);
            if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') close(input ? field.value : true);
        };

        cancelBtn.onclick = () => close(input ? null : false);
        okBtn.onclick = () => close(input ? field.value : true);
        overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) cancelBtn.click(); });
        document.addEventListener('keydown', onKey);

        overlay.appendChild(box);
        document.body.appendChild(overlay);
        (field || okBtn).focus();
        if (field) field.select();
    });
}

function confirmDialog(message, opts = {}) {
    return openModal({
        title: opts.title || 'Confirmar acción',
        message: String(message).replace(/^⚠️\s*/, ''),
        confirmText: opts.confirmText || 'Confirmar',
        danger: !!opts.danger
    });
}

function promptDialog(message, defaultValue = '', opts = {}) {
    return openModal({
        title: opts.title || 'Ingresa un valor',
        message,
        confirmText: 'Aceptar',
        input: { value: defaultValue, type: opts.type || 'text' }
    });
}

// ===== OJITO PARA MOSTRAR / OCULTAR CONTRASEÑAS =====
function togglePassword(btn) {
    const input = btn.parentElement.querySelector('input');
    if (!input) return;
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    const icon = btn.querySelector('i');
    if (icon) icon.className = `ph-bold ${show ? 'ph-eye-slash' : 'ph-eye'}`;
    btn.setAttribute('aria-label', show ? 'Ocultar contraseña' : 'Mostrar contraseña');
    input.focus();
}

// Al cambiar de vista, todas las contraseñas vuelven a estar ocultas
function resetPasswordToggles() {
    document.querySelectorAll('.pw-toggle').forEach(btn => {
        const input = btn.parentElement.querySelector('input');
        if (input) input.type = 'password';
        const icon = btn.querySelector('i');
        if (icon) icon.className = 'ph-bold ph-eye';
        btn.setAttribute('aria-label', 'Mostrar contraseña');
    });
}

// Si el servidor rechaza una acción por permisos, se muestra el motivo en vez de fallar en silencio
(function patchFetchForPermissionErrors() {
    const nativeFetch = window.fetch ? window.fetch.bind(window) : null;
    if (!nativeFetch) return;
    let lastToast = 0;
    window.fetch = async function (input, init) {
        const res = await nativeFetch(input, init);
        try {
            const method = String((init && init.method) || 'GET').toUpperCase();
            if ((res.status === 401 || res.status === 403) && method !== 'GET' && Date.now() - lastToast > 4000) {
                lastToast = Date.now();
                showToast(`El servidor rechazó la acción (error ${res.status}). Tu backend no está dejando hacer esto al rol actual: debe permitir también el rol MODERATOR en esa ruta.`, 'error');
            }
        } catch (e) { /* ignorar */ }
        return res;
    };
})();

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
if (!isPrivilegedUser()) {
    state.activeEvent = null;
    localStorage.removeItem('uh_active_event');
}

// ===== HELPERS NUEVOS =====
// Normaliza el rol que venga del servidor: "moderator", "MODERADOR", "ROLE_MODERATOR"... => 'MODERATOR'
function normalizeRole(r) {
    const v = String(r || '').trim().toUpperCase().replace(/^ROLE_/, '');
    if (v === 'MODERATOR' || v === 'MODERADOR' || v === 'MOD') return 'MODERATOR';
    if (v === 'ADMIN' || v === 'ADMINISTRATOR' || v === 'ADMINISTRADOR') return 'ADMIN';
    return 'USER';
}

function currentRoleKey() {
    const cu = state.currentUser;
    if (!cu) return 'USER';
    if (String(cu.nickname || '').toLowerCase() === 'admin') return 'ADMIN';
    return normalizeRole(cu.role);
}

// Administrador y moderador tienen exactamente los mismos permisos en la página
function isPrivilegedUser() {
    const key = currentRoleKey();
    return !!state.currentUser && (key === 'ADMIN' || key === 'MODERATOR');
}

function roleChipHTML() {
    const key = currentRoleKey();
    if (key === 'ADMIN') return '<span class="role-chip role-admin">ADMIN</span>';
    if (key === 'MODERATOR') return '<span class="role-chip role-mod">MODERADOR</span>';
    return '';
}

const MAX_HISTORY = 15;

// Re-render sin tocar el servidor (se usa en TODAS las acciones del admin)
function refreshTournamentViews() {
    renderTournamentAdmin();
    renderUserEventsView(true);
    syncTournamentSetupUI();
}

function syncTournamentSetupUI() {
    const area = document.getElementById('event-registration-area');
    if (area) {
        if (state.activeEvent && (!state.activeEvent.type || state.activeEvent.type === 'SWISS') && state.activeEvent.status === 'SETUP') {
            area.classList.remove('hidden');
            renderParticipantsBadges();
        } else {
            area.classList.add('hidden');
        }
    }
    syncDirectUI();
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

    if ((viewId === 'view-admin' || viewId === 'view-tournaments' || viewId === 'view-event-history') && !isPrivileged) {
        const requestedView = viewId;
        viewId = 'view-home';
        if (state.currentUser && state.currentUser.id) {
            // Puede que el admin te haya dado el rol hace poco: se pregunta al servidor y se reintenta
            fetchUsers().then(() => {
                if (isPrivilegedUser()) navigateTo(requestedView);
                else showToast(`Tu cuenta es "${state.currentUser ? (state.currentUser.role || 'USER') : 'USER'}" según el servidor. Pídele al admin que te asigne el rol de Moderador y confirma que se guardó.`, 'warning');
            });
        }
    }

    resetPasswordToggles();

    const sections = document.querySelectorAll('.view-section');
    sections.forEach(section => section.classList.add('hidden'));

    const targetSection = document.getElementById(viewId);
    if (targetSection) {
        targetSection.classList.remove('hidden');
        window.scrollTo(0, 0);
    }

    renderNavActions();
    if (viewId === 'view-home') Promise.all([fetchUsers(), fetchActiveEventFromDB()]).then(() => { renderPublicTiers(); renderHomeStats(); });
    if (viewId === 'view-tiers') fetchUsers().then(() => renderPublicTiers());
    if (viewId === 'view-admin') fetchUsers().then(() => renderAdminPanel());
    if (viewId === 'view-tournaments') Promise.all([fetchUsers(), fetchActiveEventFromDB()]).then(() => {
        if (state.activeEvent) setTournamentTab(tabForEvent(state.activeEvent));
        renderTournamentAdmin();
        syncTournamentSetupUI();
    });
    if (viewId === 'view-events') renderUserEventsView();
    if (viewId === 'view-event-history') renderEventHistory();
    if (viewId === 'view-profile-card') { renderProfileCard(); fetchUsers().then(() => renderProfileCard()); }
    if (viewId === 'view-profile-edit') fillProfileEditForm();
}

function renderNavActions() {
    const navContainer = document.getElementById('nav-actions');
    const ctaButtons = document.getElementById('home-cta-buttons');
    if (!navContainer) return;

    if (state.currentUser) {
        const isPrivileged = isPrivilegedUser();
        navContainer.innerHTML = `
            <span class="text-xs text-wine-300 hidden sm:inline">Hola, <b class="text-wine-400">${escapeHtml(state.currentUser.nickname)}</b> ${roleChipHTML()}</span>
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
                <button onclick="navigateTo('view-tournaments')" class="px-3 py-1.5 rounded-lg bg-wine-950 hover:bg-wine-900 text-amber-300 text-xs font-semibold flex items-center space-x-1 border border-amber-800/60">
                    <i class="ph-bold ph-trophy"></i> <span>Control de Torneos</span>
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
        syncSessionWithServer(users);

        users.forEach(u => {
            const username = u.nickname || u.name;
            if (username && !state.assignments[username]) {
                state.assignments[username] = { tagIds: [] };
            }
            if (normalizeRole(u.role) === 'MODERATOR') {
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
    const registeredOnly = state.users.filter(u => (u.nickname || u.name || '').toLowerCase() !== 'admin');
    const html = `<option value="">Seleccionar Usuario Registrado...</option>` +
        registeredOnly.map(u => `
            <option value="${u.id}">${escapeHtml(u.nickname || u.name)}</option>
        `).join('');

    ['registered-user-select', 'direct-user-select', 'score-user-select'].forEach(id => {
        const select = document.getElementById(id);
        if (!select) return;
        const cur = select.value;
        select.innerHTML = html;
        if (cur && registeredOnly.some(u => String(u.id) === cur)) select.value = cur;
    });
}

async function startNewEvent() {
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

    if (!(await confirmReplaceActiveEvent())) return;

    state.activeEvent = {
        id: 'evt-' + Date.now(),
        type: 'SWISS',
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
        playoffs: state.activeEvent.playoffs,
        direct: state.activeEvent.direct,
        rooms: state.activeEvent.rooms,
        scoreRounds: state.activeEvent.scoreRounds,
        totalRounds: state.activeEvent.totalRounds,
        winners: state.activeEvent.winners
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

    const confirmacion = await confirmDialog(`¿Estás seguro de que deseas eliminar permanentemente el torneo activo "${state.activeEvent.title}"? Esta acción no se puede deshacer.`, { danger: true, confirmText: 'Eliminar torneo' });
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

async function deleteHistoryEvent(index) {
    if (index < 0 || index >= state.eventHistory.length) return;

    const evt = state.eventHistory[index];
    const confirmacion = await confirmDialog(`¿Estás seguro de eliminar el torneo "${evt.title}" del historial?`, { danger: true, confirmText: 'Eliminar' });
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
        songRollId: Date.now(),
        isCompleted: false
    });

    updateLeaderboard();
}

function reRollRoundSong(roundIndex) {
    const evt = state.activeEvent;
    if (!evt || !evt.swissRounds[roundIndex]) return;

    saveHistoryState();
    evt.swissRounds[roundIndex].currentSong = getRandomSong();
    evt.swissRounds[roundIndex].songRollId = Date.now();
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

async function nextSwissRound() {
    let evt = state.activeEvent;
    let currentRoundObj = evt.swissRounds[evt.currentRound - 1];
    if (!currentRoundObj) return;

    if (!currentRoundObj.matches.every(m => m.winnerId !== null)) {
        if (!await confirmDialog("Hay partidas sin ganador marcado. ¿Deseas continuar a la siguiente ronda de todos modos?", { confirmText: 'Continuar' })) return;
        evt = state.activeEvent;
        if (!evt) return;
        currentRoundObj = evt.swissRounds[evt.currentRound - 1];
        if (!currentRoundObj) return;
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

async function createPlayoffs() {
    const answer = await promptDialog("¿Cuántos clasificados deseas en los PlayOffs? (Ej: 4 u 8)", "4", { title: 'Crear PlayOffs', type: 'number' });
    if (answer === null) return;
    const evt = state.activeEvent;
    if (!evt) return;
    const topCount = parseInt(answer, 10) || 4;

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

async function finishAndSaveEvent() {
    if (!state.activeEvent) return;
    if (!await confirmDialog("¿Deseas finalizar y guardar este torneo en el Historial de Eventos?", { confirmText: 'Finalizar y guardar' })) return;
    if (!state.activeEvent) return;

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

// =====================================================================
//  SESIÓN: el rol (moderador) se sincroniza con el servidor
// =====================================================================
function syncSessionWithServer(users) {
    const cu = state.currentUser;
    if (!cu) return;
    if (!cu.id && String(cu.nickname || '').toLowerCase() === 'admin') return; // admin local: no está en la base de datos

    let me = cu.id ? users.find(u => String(u.id) === String(cu.id)) : null;
    if (!me) {
        const nick = String(cu.nickname || '').toLowerCase();
        me = users.find(u => String(u.nickname || u.name || '').toLowerCase() === nick);
    }
    if (!me) return;

    const newRole = normalizeRole(me.role);
    if (!cu.id && me.id) cu.id = me.id;
    if (cu.role === newRole) return;

    const wasPrivileged = isPrivilegedUser();
    cu.role = newRole;
    saveState();
    renderNavActions();
    const nowPrivileged = isPrivilegedUser();

    if (!wasPrivileged && nowPrivileged) {
        showToast('Ahora eres Moderador: ya tienes acceso a Control de Torneos y al Panel Admin.', 'success');
    } else if (wasPrivileged && !nowPrivileged) {
        showToast('Tu rol de Moderador fue retirado.', 'warning');
        const guarded = ['view-admin', 'view-tournaments', 'view-event-history'];
        const onGuardedView = guarded.some(id => {
            const el = document.getElementById(id);
            return el && !el.classList.contains('hidden');
        });
        if (onGuardedView) navigateTo('view-home');
    }
}

// =====================================================================
//  PLAY OFF DIRECTO (con o sin Lower Bracket)
// =====================================================================
const BYE = { id: '__bye', name: 'BYE', isBye: true };
const isBye = (p) => !!p && p.isBye === true;

let directLowerEnabled = false;
let directUiLoadedFor = null;
let tournamentTab = 'swiss';

function shuffleArray(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function revBits(n, bits) {
    let r = 0;
    for (let i = 0; i < bits; i++) {
        r = (r << 1) | (n & 1);
        n >>= 1;
    }
    return r;
}

function parseSongList(text) {
    return String(text || '').split(/[\n,]+/).map(s => s.trim()).filter(s => s.length > 0);
}

function pickDirectSong(pool, avoid = []) {
    if (!pool || pool.length === 0) return 'Canción Libre (Sin lista configurada)';
    let candidates = pool.filter(s => !avoid.includes(s));
    if (candidates.length === 0) candidates = pool;
    return candidates[Math.floor(Math.random() * candidates.length)];
}

// Sortea sin repetir hasta agotar la lista; luego vuelve a empezar
function makeSongDrawer(pool) {
    let used = [];
    return () => {
        const song = pickDirectSong(pool, used);
        used.push(song);
        if (pool && used.length >= pool.length) used = [];
        return song;
    };
}

// Si no hay canciones propias para el Lower Bracket, se usan las del bracket principal
function directLowerPool(evt) {
    return (evt.lowerSongPool && evt.lowerSongPool.length > 0) ? evt.lowerSongPool : (evt.songPool || []);
}

function directUpperName(r, k, hasLower) {
    const fromEnd = k - r;
    if (!hasLower) {
        if (fromEnd === 0) return 'GRAN FINAL';
        if (fromEnd === 1) return 'SEMIFINAL';
        if (fromEnd === 2) return 'CUARTOS DE FINAL';
        return `Ronda ${r}`;
    }
    if (fromEnd === 0) return 'UPPER FINAL';
    if (fromEnd === 1) return 'UPPER SEMIFINAL';
    return `Upper R${r}`;
}

function newDirectMatch(id, a, b, srcA = null, srcB = null) {
    return { id, playerA: a, playerB: b, winnerId: null, srcA, srcB };
}
const wSrc = (br, r, m) => ({ t: 'W', br, r, m });
const lSrc = (br, r, m) => ({ t: 'L', br, r, m });

// Construye el bracket completo con los enfrentamientos de la primera ronda al azar
function buildDirectBracket(evt, prev) {
    const hasLower = !!evt.hasLower;
    const players = shuffleArray(evt.participants.filter(p => !isBye(p)))
        .map(p => ({ id: p.id, name: p.name, avatar: p.avatar, isBot: !!p.isBot }));

    const N = players.length;
    let P = 2;
    while (P < N) P *= 2;
    const k = Math.round(Math.log2(P));
    const M = P / 2;
    const byes = P - N;
    const bits = Math.round(Math.log2(M));

    // Los BYE se reparten por el bracket (orden de bits invertidos)
    const byeMatches = new Set(Array.from({ length: M }, (_, i) => revBits(i, bits)).slice(0, byes));

    const compatible = !!(prev && prev.size === P && !!prev.hasLower === hasLower);
    const drawU = makeSongDrawer(evt.songPool);
    const drawL = makeSongDrawer(directLowerPool(evt));

    // ---- Upper Bracket
    const upper = [];
    let pi = 0;
    for (let r = 1; r <= k; r++) {
        const cnt = P / Math.pow(2, r);
        const matches = [];
        for (let i = 0; i < cnt; i++) {
            if (r === 1) {
                const a = players[pi++];
                const b = byeMatches.has(i) ? BYE : players[pi++];
                matches.push(newDirectMatch(`U1-${i}`, a, b));
            } else {
                matches.push(newDirectMatch(`U${r}-${i}`, null, null, wSrc('U', r - 1, 2 * i), wSrc('U', r - 1, 2 * i + 1)));
            }
        }
        const song = (compatible && prev.upper[r - 1]) ? prev.upper[r - 1].song : drawU();
        upper.push({ round: r, name: directUpperName(r, k, hasLower), song, matches });
    }

    // ---- Lower Bracket (doble eliminación)
    const lower = [];
    if (hasLower && k >= 2) {
        const total = 2 * (k - 1);
        for (let j = 1; j <= total; j++) {
            const cnt = P / Math.pow(2, Math.ceil(j / 2) + 1);
            const matches = [];
            for (let i = 0; i < cnt; i++) {
                let srcA, srcB;
                if (j === 1) {
                    srcA = lSrc('U', 1, 2 * i);
                    srcB = lSrc('U', 1, 2 * i + 1);
                } else if (j % 2 === 1) {
                    srcA = wSrc('L', j - 1, 2 * i);
                    srcB = wSrc('L', j - 1, 2 * i + 1);
                } else {
                    const m = j / 2;
                    srcA = wSrc('L', j - 1, i);
                    srcB = lSrc('U', m + 1, cnt - 1 - i);
                }
                matches.push(newDirectMatch(`L${j}-${i}`, null, null, srcA, srcB));
            }
            const song = (compatible && prev.lower[j - 1]) ? prev.lower[j - 1].song : drawL();
            lower.push({ round: j, name: j === total ? 'LOWER FINAL' : `Lower R${j}`, song, matches });
        }
    }

    // ---- Gran Final (solo con Lower Bracket)
    let gf = null;
    if (hasLower) {
        const song = (compatible && prev.gf) ? prev.gf.song : drawU();
        gf = {
            name: 'GRAN FINAL',
            song,
            matches: [newDirectMatch('GF-0', null, null, wSrc('U', k, 0), wSrc('L', 2 * (k - 1), 0))]
        };
    }

    return { size: P, k, hasLower, upper, lower, gf, gfReset: null, champion: null };
}

function findDirectMatch(d, br, r, mi) {
    if (!d) return null;
    if (br === 'U') return d.upper[r - 1] ? d.upper[r - 1].matches[mi] : null;
    if (br === 'L') return d.lower[r - 1] ? d.lower[r - 1].matches[mi] : null;
    if (br === 'GF') return d.gf ? d.gf.matches[0] : null;
    if (br === 'GR') return d.gfReset ? d.gfReset.matches[0] : null;
    return null;
}

// Resultado de un match: null si aún no se puede decidir
function matchOutcome(m) {
    const a = m.playerA;
    const b = m.playerB;
    if (a === null || a === undefined || b === null || b === undefined) return null;
    if (isBye(a) && isBye(b)) return { winner: BYE, loser: BYE };
    if (isBye(a)) return { winner: b, loser: BYE };
    if (isBye(b)) return { winner: a, loser: BYE };
    if (m.winnerId) {
        if (String(m.winnerId) === String(a.id)) return { winner: a, loser: b };
        if (String(m.winnerId) === String(b.id)) return { winner: b, loser: a };
    }
    return null;
}

function slotFrom(d, src) {
    const m = findDirectMatch(d, src.br, src.r, src.m);
    const o = m ? matchOutcome(m) : null;
    if (!o) return null;
    return src.t === 'W' ? o.winner : o.loser;
}

function refreshDirectMatch(d, m) {
    if (m.srcA) m.playerA = slotFrom(d, m.srcA);
    if (m.srcB) m.playerB = slotFrom(d, m.srcB);
    if (m.winnerId) {
        const ids = [m.playerA, m.playerB].filter(x => x && !isBye(x)).map(x => String(x.id));
        if (!ids.includes(String(m.winnerId))) m.winnerId = null; // el rival cambió: se limpia
    }
}

// Recalcula todos los cruces a partir de los ganadores marcados
function recomputeDirect(evt) {
    const d = evt.direct;
    if (!d) return;
    const prevChampion = d.champion;

    d.upper.forEach(rd => rd.matches.forEach(m => refreshDirectMatch(d, m)));
    d.lower.forEach(rd => rd.matches.forEach(m => refreshDirectMatch(d, m)));

    d.champion = null;

    if (!d.hasLower) {
        const last = d.upper[d.upper.length - 1].matches[0];
        const o = matchOutcome(last);
        if (o && !isBye(o.winner)) d.champion = o.winner;
    } else {
        const g1 = d.gf.matches[0];
        refreshDirectMatch(d, g1);
        const o1 = matchOutcome(g1);

        // Si gana el del Lower Bracket, se juega una segunda Gran Final (reset)
        if (o1 && g1.playerB && String(o1.winner.id) === String(g1.playerB.id)) {
            const prevReset = d.gfReset;
            const m2 = newDirectMatch('GR-0', g1.playerA, g1.playerB);
            if (prevReset && prevReset.matches[0].winnerId) {
                const w = String(prevReset.matches[0].winnerId);
                if (w === String(g1.playerA.id) || w === String(g1.playerB.id)) m2.winnerId = w;
            }
            d.gfReset = {
                name: 'GRAN FINAL · RESET',
                song: prevReset ? prevReset.song : pickDirectSong(evt.songPool, [d.gf.song]),
                matches: [m2]
            };
            const o2 = matchOutcome(m2);
            if (o2) d.champion = o2.winner;
        } else {
            d.gfReset = null;
            if (o1) d.champion = o1.winner;
        }
    }

    evt.status = d.champion ? 'FINISHED' : 'PLAYOFFS';
    if (d.champion && !prevChampion) {
        alert(`🏆 ¡TENEMOS UN GANADOR DEL TORNEO!: ${d.champion.name}`);
    }
}

function hasDirectResults(d) {
    const all = [];
    d.upper.forEach(rd => rd.matches.forEach(m => all.push(m)));
    d.lower.forEach(rd => rd.matches.forEach(m => all.push(m)));
    if (d.gf) all.push(d.gf.matches[0]);
    return all.some(m => !!m.winnerId);
}

// Campeón de cualquier tipo de torneo (suizo + playoffs, o play off directo)
function getEventChampion(e) {
    if (!e) return null;
    if (e.type === 'DIRECT') return (e.direct && e.direct.champion) || null;
    if (e.type === 'SCORE') return (e.winners && e.winners[0]) || null;
    return (e.playoffs && e.playoffs.champion) || null;
}

// ---------------------------------------------------------------------
//  ACCIONES DE LA PESTAÑA "PLAY OFF DIRECTO"
// ---------------------------------------------------------------------
async function confirmReplaceActiveEvent() {
    if (!state.activeEvent) return true;
    return await confirmDialog(
        `Ya hay un torneo activo: "${state.activeEvent.title}". Si creas uno nuevo, se reemplazará y se perderá su progreso. ¿Continuar?`,
        { danger: true, confirmText: 'Reemplazar' }
    );
}

function setTournamentTab(tab) {
    tournamentTab = tab;
    ['swiss', 'direct', 'score'].forEach(t => {
        const panel = document.getElementById('tourn-panel-' + t);
        if (panel) panel.classList.toggle('hidden', t !== tab);
        const btn = document.getElementById('tourn-tab-' + t);
        if (btn) btn.classList.toggle('active', t === tab);
    });
}

function setDirectLower(flag) {
    directLowerEnabled = !!flag;
    const no = document.getElementById('direct-lower-no');
    const yes = document.getElementById('direct-lower-yes');
    if (no) no.classList.toggle('active', !directLowerEnabled);
    if (yes) yes.classList.toggle('active', directLowerEnabled);

    const box = document.getElementById('direct-lower-songs-box');
    if (box) box.classList.toggle('hidden', !directLowerEnabled);

    const hint = document.getElementById('direct-lower-hint');
    if (hint) {
        hint.textContent = directLowerEnabled
            ? 'Doble eliminación: quien pierde cae al Lower Bracket y tiene una segunda oportunidad. Si el del Lower gana la Gran Final, se juega una segunda Gran Final (reset). Mínimo 3 jugadores.'
            : 'Eliminación simple: quien pierde queda eliminado. Mínimo 2 jugadores.';
    }
}

async function startDirectEvent() {
    const titleEl = document.getElementById('direct-title-input');
    const title = titleEl ? titleEl.value.trim() : '';
    if (!title) {
        alert('Por favor ingresa un nombre para el evento.');
        return;
    }

    const songPool = parseSongList((document.getElementById('direct-song-list-input') || {}).value);
    const lowerSongPool = parseSongList((document.getElementById('direct-lower-song-list-input') || {}).value);
    const hasLower = directLowerEnabled;

    if (!(await confirmReplaceActiveEvent())) return;

    state.activeEvent = {
        id: 'evt-' + Date.now(),
        type: 'DIRECT',
        title,
        status: 'SETUP',
        hasLower,
        participants: [],
        songPool,
        lowerSongPool,
        direct: null,
        // Campos del formato suizo (vacíos) para que el resto del código no falle
        maxSwissRounds: 0,
        currentRound: 0,
        swissRounds: [],
        leaderboard: [],
        playoffs: null,
        historyStates: []
    };

    directUiLoadedFor = state.activeEvent.id;
    saveState();
    syncTournamentSetupUI();
    renderTournamentAdmin();
    alert(`Evento "${title}" creado. Ahora inscribe a los participantes.`);
}

function updateDirectSongs() {
    const evt = state.activeEvent;
    if (!evt || evt.type !== 'DIRECT') {
        alert('No hay ningún Play Off Directo activo.');
        return;
    }
    evt.songPool = parseSongList((document.getElementById('direct-song-list-input') || {}).value);
    evt.lowerSongPool = parseSongList((document.getElementById('direct-lower-song-list-input') || {}).value);
    saveState();
    alert('¡Lista de canciones actualizada con éxito! Se usará en los próximos sorteos.');
}

function addDirectPlayer() {
    const evt = state.activeEvent;
    if (!evt || evt.type !== 'DIRECT' || evt.status !== 'SETUP') return;
    const select = document.getElementById('direct-user-select');
    if (!select || !select.value) return;

    const user = state.users.find(u => String(u.id) === String(select.value));
    if (!user) return;

    const uname = user.nickname || user.name;
    if (evt.participants.some(p => p.name === uname)) {
        alert('El usuario ya está inscrito.');
        return;
    }

    evt.participants.push({
        id: `usr-${user.id}`,
        name: uname,
        avatar: user.avatar || 'https://i.imgur.com/6VBx3io.png',
        isBot: false
    });
    saveState();
    renderDirectParticipantsBadges();
}

function addDirectBot() {
    const evt = state.activeEvent;
    if (!evt || evt.type !== 'DIRECT' || evt.status !== 'SETUP') return;
    const input = document.getElementById('direct-bot-input');
    const name = (input && input.value.trim()) || `Bot_${evt.participants.length + 1}`;

    if (evt.participants.some(p => p.name === name)) {
        alert('Ya existe un participante o bot con ese nombre.');
        return;
    }

    evt.participants.push({
        id: `bot-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        name,
        avatar: '🤖',
        isBot: true
    });
    if (input) input.value = '';
    saveState();
    renderDirectParticipantsBadges();
}

function removeDirectParticipant(id) {
    const evt = state.activeEvent;
    if (!evt || evt.type !== 'DIRECT' || evt.status !== 'SETUP') return;
    evt.participants = evt.participants.filter(p => String(p.id) !== String(id));
    saveState();
    renderDirectParticipantsBadges();
}

function renderDirectParticipantsBadges() {
    const container = document.getElementById('direct-participants-badges');
    const counter = document.getElementById('direct-count');
    const evt = state.activeEvent;
    const list = (evt && evt.type === 'DIRECT') ? evt.participants : [];
    if (counter) counter.textContent = list.length;
    if (!container) return;

    if (list.length === 0) {
        container.innerHTML = `<span class="text-xs text-slate-500 italic">No hay inscritos aún.</span>`;
        return;
    }

    container.innerHTML = list.map(p => `
        <span class="inline-flex items-center space-x-2 px-3 py-1 rounded-xl bg-wine-900 border border-wine-700 text-xs text-white">
            ${p.isBot ? '🤖' : `<img src="${escapeHtml(p.avatar)}" class="w-4 h-4 rounded-full object-cover">`}
            <span class="font-bold">${escapeHtml(p.name)}</span>
            <button onclick="removeDirectParticipant('${p.id}')" class="text-slate-400 hover:text-red-400 ml-1">
                <i class="ph-bold ph-x"></i>
            </button>
        </span>
    `).join('');
}

function generateDirectBracketAction() {
    const evt = state.activeEvent;
    if (!evt || evt.type !== 'DIRECT' || evt.status !== 'SETUP') {
        alert('Primero crea un Play Off Directo.');
        return;
    }
    const min = evt.hasLower ? 3 : 2;
    if (evt.participants.length < min) {
        alert(`Se necesitan al menos ${min} participantes${evt.hasLower ? ' para usar Lower Bracket' : ''}.`);
        return;
    }

    saveHistoryState();
    evt.direct = buildDirectBracket(evt, null);
    recomputeDirect(evt);
    saveState();
    refreshTournamentViews();
}

async function reshuffleDirectBracket() {
    let evt = state.activeEvent;
    if (!evt || evt.type !== 'DIRECT' || !evt.direct) return;

    if (hasDirectResults(evt.direct)) {
        const ok = await confirmDialog(
            'Ya hay resultados marcados. Si mezclas de nuevo, se reiniciarán todos los resultados del bracket. ¿Continuar?',
            { danger: true, confirmText: 'Mezclar de nuevo' }
        );
        if (!ok) return;
    }

    evt = state.activeEvent;
    if (!evt || evt.type !== 'DIRECT') return;

    saveHistoryState();
    evt.direct = buildDirectBracket(evt, evt.direct); // conserva las canciones ya sorteadas
    recomputeDirect(evt);
    saveState();
    refreshTournamentViews();
    showToast('Jugadores mezclados: nuevos enfrentamientos aleatorios.', 'success');
}

function setDirectWinner(group, r, mi, playerId) {
    const evt = state.activeEvent;
    if (!evt || evt.type !== 'DIRECT' || !evt.direct) return;
    const m = findDirectMatch(evt.direct, group, r, mi);
    if (!m) return;

    saveHistoryState();
    const target = String(playerId);
    m.winnerId = (String(m.winnerId) === target) ? null : target; // segundo clic = desmarcar
    recomputeDirect(evt);
    saveState();
    refreshTournamentViews();
}

function rerollDirectSong(group, idx) {
    const evt = state.activeEvent;
    if (!evt || evt.type !== 'DIRECT' || !evt.direct) return;
    const d = evt.direct;

    let roundObj = null;
    let pool = evt.songPool;
    if (group === 'U') roundObj = d.upper[idx];
    else if (group === 'L') { roundObj = d.lower[idx]; pool = directLowerPool(evt); }
    else if (group === 'GF') roundObj = d.gf;
    else if (group === 'GR') roundObj = d.gfReset;
    if (!roundObj) return;

    saveHistoryState();
    roundObj.song = pickDirectSong(pool, [roundObj.song]);
    saveState();
    refreshTournamentViews();
}

// Muestra / oculta áreas según el torneo activo y rellena el formulario
function syncDirectUI() {
    const evt = state.activeEvent;
    const isDirect = !!(evt && evt.type === 'DIRECT');

    const reg = document.getElementById('direct-registration-area');
    if (reg) {
        if (isDirect && evt.status === 'SETUP') {
            reg.classList.remove('hidden');
            renderDirectParticipantsBadges();
        } else {
            reg.classList.add('hidden');
        }
    }

    if (isDirect && directUiLoadedFor !== evt.id) {
        directUiLoadedFor = evt.id;
        setDirectLower(!!evt.hasLower);
        const up = document.getElementById('direct-song-list-input');
        const lo = document.getElementById('direct-lower-song-list-input');
        const ti = document.getElementById('direct-title-input');
        if (up) up.value = (evt.songPool || []).join('\n');
        if (lo) lo.value = (evt.lowerSongPool || []).join('\n');
        if (ti && !ti.value) ti.value = evt.title;
    }

    syncTournamentNotices();
    syncScoreUI();
}

// ---------------------------------------------------------------------
//  RENDER DEL BRACKET DIRECTO
// ---------------------------------------------------------------------
function directMatchHTML(m, group, r, mi, isAdmin) {
    const out = matchOutcome(m);
    const winId = (out && out.winner && !isBye(out.winner)) ? String(out.winner.id) : null;
    const bothReal = !!(m.playerA && m.playerB && !isBye(m.playerA) && !isBye(m.playerB));

    const side = (p) => {
        if (p === null || p === undefined) {
            return `<div class="direct-side direct-tbd">Por definir</div>`;
        }
        if (isBye(p)) {
            return `<div class="direct-side direct-bye">BYE · pasa directo</div>`;
        }
        const isWin = winId === String(p.id);
        const isLose = !!winId && !isWin;
        return `
            <div class="direct-side ${isWin ? 'direct-win' : (isLose ? 'direct-lose' : '')}">
                <div class="flex items-center space-x-2 truncate">
                    ${p.isBot ? '<span class="text-base">🤖</span>' : `<img src="${escapeHtml(p.avatar || '')}" class="w-6 h-6 rounded-full object-cover">`}
                    <span class="text-xs font-bold truncate">${escapeHtml(p.name)}</span>
                </div>
                ${isAdmin && bothReal ? `
                    <button onclick="setDirectWinner('${group}', ${r}, ${mi}, '${p.id}')" class="direct-pick ${isWin ? 'on' : ''}">
                        ✔️ ${isWin ? 'Ganador' : 'Elegir'}
                    </button>
                ` : ''}
            </div>
        `;
    };

    return `
        <div class="direct-card">
            ${side(m.playerA)}
            <div class="direct-vs">vs</div>
            ${side(m.playerB)}
        </div>
    `;
}

function directRoundHTML(round, group, idx, isAdmin, hideByeMatches) {
    const visible = round.matches
        .map((m, mi) => ({ m, mi }))
        .filter(({ m }) => {
            if (isBye(m.playerA) && isBye(m.playerB)) return false;
            if (hideByeMatches && (isBye(m.playerA) || isBye(m.playerB))) return false;
            return true;
        });
    if (visible.length === 0) return '';

    const started = round.matches.some(m => m.playerA && m.playerB && !isBye(m.playerA) && !isBye(m.playerB));
    const showSong = isAdmin || started; // los jugadores no ven la canción antes de que empiece la ronda
    const r = round.round || 1;

    return `
        <div class="direct-round">
            <div class="text-center mb-3 space-y-1">
                <h5 class="text-xs font-extrabold text-wine-400 uppercase">${escapeHtml(round.name)}</h5>
                ${showSong && round.song ? `<span class="direct-song">🎵 ${escapeHtml(round.song)}</span>` : ''}
                ${isAdmin ? `
                    <button onclick="rerollDirectSong('${group}', ${idx})" class="direct-reroll">
                        <i class="ph-bold ph-shuffle"></i> Re-sortear
                    </button>
                ` : ''}
            </div>
            <div class="direct-matches">
                ${visible.map(({ m, mi }) => directMatchHTML(m, group, r, mi, isAdmin)).join('')}
            </div>
        </div>
    `;
}

function getOpenDirectRounds(evt) {
    const d = evt.direct;
    const out = [];
    if (!d) return out;
    const add = (rd) => {
        if (!rd) return;
        const open = rd.matches.some(m =>
            m.playerA && m.playerB && !isBye(m.playerA) && !isBye(m.playerB) && !matchOutcome(m));
        if (open) out.push({ label: rd.name, song: rd.song });
    };
    d.upper.forEach(add);
    d.lower.forEach(add);
    add(d.gf);
    add(d.gfReset);
    return out;
}

function directOpenRoundsHTML(evt) {
    const open = getOpenDirectRounds(evt);
    if (open.length === 0) return '';
    return `
        <div class="direct-open-grid">
            ${open.map(o => `
                <div class="direct-open">
                    <span class="direct-open-label">${escapeHtml(o.label)} · en juego</span>
                    <span class="direct-open-song">🎵 ${escapeHtml(o.song)}</span>
                </div>
            `).join('')}
        </div>
    `;
}

function renderDirectBracketHTML(evt, isAdmin) {
    const d = evt.direct;
    if (!d) return '';

    const upperHTML = d.upper.map((rd, i) => directRoundHTML(rd, 'U', i, isAdmin, false)).join('');
    const lowerHTML = d.hasLower ? d.lower.map((rd, i) => directRoundHTML(rd, 'L', i, isAdmin, true)).join('') : '';
    const finalsHTML = d.gf
        ? directRoundHTML(d.gf, 'GF', 0, isAdmin, false) + (d.gfReset ? directRoundHTML(d.gfReset, 'GR', 0, isAdmin, false) : '')
        : '';

    return `
        <div class="direct-bracket-box">
            ${d.champion ? `
                <div class="text-center py-6 rounded-2xl bg-amber-500/10 border-2 border-amber-500 neon-gold max-w-md mx-auto">
                    <h2 class="text-3xl font-black text-amber-400 tracking-wider">🏆 GANADOR 🏆</h2>
                    <div class="flex items-center justify-center space-x-3 mt-3">
                        ${d.champion.isBot ? '<span class="text-3xl">🤖</span>' : `<img src="${escapeHtml(d.champion.avatar)}" class="w-12 h-12 rounded-full object-cover border-2 border-amber-400">`}
                        <span class="text-2xl font-bold text-white">${escapeHtml(d.champion.name)}</span>
                    </div>
                </div>
            ` : ''}

            <div class="direct-section">
                <h4 class="direct-title">⬆ ${d.hasLower ? 'Upper Bracket' : 'Bracket'}</h4>
                <div class="direct-scroll"><div class="direct-row">${upperHTML}</div></div>
            </div>

            ${lowerHTML ? `
                <div class="direct-section direct-section-lower">
                    <h4 class="direct-title">⬇ Lower Bracket</h4>
                    <div class="direct-scroll"><div class="direct-row">${lowerHTML}</div></div>
                </div>
            ` : ''}

            ${finalsHTML ? `
                <div class="direct-section direct-section-final">
                    <h4 class="direct-title">🏆 Gran Final</h4>
                    <div class="direct-scroll"><div class="direct-row">${finalsHTML}</div></div>
                    <p class="text-[11px] text-slate-500 mt-2">Si gana el jugador del Lower Bracket, se juega una segunda Gran Final (reset), porque el del Upper aún no había perdido.</p>
                </div>
            ` : ''}
        </div>
    `;
}

// Panel del administrador / moderador
function renderDirectAdmin() {
    const box = document.getElementById('direct-active-admin');
    if (!box) return;
    const evt = state.activeEvent;
    if (!evt || evt.type !== 'DIRECT' || evt.status === 'SETUP' || !evt.direct) {
        box.classList.add('hidden');
        return;
    }
    box.classList.remove('hidden');
    const d = evt.direct;

    box.innerHTML = `
        <div class="flex flex-wrap items-center justify-between gap-3 bg-wine-900/40 p-4 rounded-xl border border-wine-800">
            <div>
                <h4 class="text-lg font-bold text-white">${escapeHtml(evt.title)} - Play Off Directo</h4>
                <p class="text-xs text-slate-400">
                    ${d.hasLower ? 'Doble eliminación (con Lower Bracket)' : 'Eliminación simple'} · ${evt.participants.length} jugadores.
                    Elige con ✔️ al ganador de cada enfrentamiento.
                </p>
            </div>
            <div class="flex flex-wrap gap-2">
                <button onclick="undoTournamentStep()" class="px-3 py-1.5 bg-amber-950 hover:bg-amber-900 text-amber-300 rounded-lg text-xs font-bold border border-amber-800/60 flex items-center space-x-1">
                    <i class="ph-bold ph-arrow-u-up-left"></i> <span>Retroceder</span>
                </button>
                <button onclick="reshuffleDirectBracket()" class="px-3 py-1.5 bg-wine-800 hover:bg-wine-700 text-white rounded-lg text-xs font-bold border border-wine-700 flex items-center space-x-1">
                    <i class="ph-bold ph-shuffle"></i> <span>Mezclar de nuevo</span>
                </button>
                ${d.champion ? `
                    <button onclick="finishAndSaveEvent()" class="px-4 py-1.5 bg-green-700 hover:bg-green-600 text-white rounded-lg text-xs font-bold shadow-lg">
                        💾 Finalizar y Guardar en Historial
                    </button>
                ` : ''}
                <button onclick="deleteActiveEvent()" class="px-3 py-1.5 bg-red-950/80 hover:bg-red-900 text-red-400 rounded-lg text-xs font-bold border border-red-800/60 transition-all flex items-center space-x-1" title="Eliminar torneo activo">
                    <i class="ph-bold ph-trash"></i> <span>Eliminar Torneo</span>
                </button>
            </div>
        </div>

        ${directOpenRoundsHTML(evt)}

        ${renderDirectBracketHTML(evt, true)}
    `;
}

// Vista de jugadores / visitantes
function renderDirectUserHTML(evt) {
    return `
        <div class="bg-wine-950/80 border border-wine-900 rounded-2xl p-6 shadow-2xl space-y-6">
            <div class="flex items-center justify-between border-b border-wine-900 pb-4">
                <div>
                    <span class="px-3 py-1 rounded-full bg-red-950 border border-red-800 text-red-400 text-xs font-bold uppercase tracking-wider animate-pulse">
                        🔴 En Vivo
                    </span>
                    <h3 class="text-2xl font-black text-white mt-2">${escapeHtml(evt.title)}</h3>
                    <p class="text-xs text-slate-400 mt-1">Play Off Directo · ${evt.direct && evt.direct.hasLower ? 'con Lower Bracket' : 'eliminación simple'}</p>
                </div>
            </div>

            ${directOpenRoundsHTML(evt)}

            ${renderDirectBracketHTML(evt, false)}
        </div>
    `;
}

// =====================================================================
//  FORMATO POR PUNTAJE (salas fijas + puntos por ronda + podio)
// =====================================================================
const SCORE_ROOM_MAX = 6;
let scoreViewRound = 0;
let scoreViewFor = null;
let scoreUiLoadedFor = null;

function fmtPts(n) {
    const v = Math.round((Number(n) || 0) * 100) / 100;
    return Number.isInteger(v) ? String(v) : String(v);
}

// Reparte a los inscritos en salas de máximo 6, lo más parejas posible (23 -> 6, 6, 6 y 5)
function buildScoreRooms(participants) {
    const ids = shuffleArray(participants).map(p => p.id);
    const N = ids.length;
    if (N === 0) return [];
    const roomCount = Math.ceil(N / SCORE_ROOM_MAX);
    const base = Math.floor(N / roomCount);
    const extra = N % roomCount;

    const rooms = [];
    let idx = 0;
    for (let i = 0; i < roomCount; i++) {
        const size = base + (i < extra ? 1 : 0);
        rooms.push({ name: `Sala ${i + 1}`, playerIds: ids.slice(idx, idx + size) });
        idx += size;
    }
    return rooms;
}

function newScoreRound(evt, number) {
    const used = (evt.scoreRounds || []).map(r => r.song);
    return { number, song: pickDirectSong(evt.songPool, used), songRollId: Date.now(), scores: {} };
}

function scoreSongKey(evt, round) {
    return `${evt.id}|score|${round.number}|${round.songRollId || ''}|${round.song}`;
}

// Tabla de posiciones: suma de puntos de todas las rondas
function computeScoreStandings(evt) {
    const rounds = evt.scoreRounds || [];
    const roomOf = {};
    (evt.rooms || []).forEach(r => r.playerIds.forEach(id => { roomOf[id] = r.name; }));

    const rows = (evt.participants || []).map(p => {
        const per = rounds.map(r => {
            const v = r.scores ? r.scores[p.id] : undefined;
            return typeof v === 'number' ? v : 0;
        });
        const total = Math.round(per.reduce((a, b) => a + b, 0) * 100) / 100;
        return { player: p, per, total, room: roomOf[p.id] || '-' };
    });

    // Desempate: más puntos en las últimas rondas, luego orden alfabético
    rows.sort((a, b) => {
        if (b.total !== a.total) return b.total - a.total;
        for (let i = a.per.length - 1; i >= 0; i--) {
            if (b.per[i] !== a.per[i]) return b.per[i] - a.per[i];
        }
        return String(a.player.name).localeCompare(String(b.player.name));
    });
    return rows;
}

function buildScoreWinners(evt) {
    return computeScoreStandings(evt).slice(0, 3).map((row, i) => ({
        id: row.player.id,
        name: row.player.name,
        avatar: row.player.avatar,
        isBot: !!row.player.isBot,
        points: row.total,
        place: i + 1
    }));
}

function scoreStandingsInner(evt) {
    const rows = computeScoreStandings(evt);
    const rounds = evt.scoreRounds || [];
    const medal = ['🥇', '🥈', '🥉'];

    return `
        <div class="flex items-center justify-between border-b border-wine-900 pb-2 mb-3">
            <h5 class="text-sm font-bold text-wine-300">Tabla de Posiciones</h5>
            <span class="text-[10px] text-slate-400">${rounds.length} ${rounds.length === 1 ? 'ronda' : 'rondas'}</span>
        </div>
        <div class="overflow-x-auto">
            <table class="w-full text-left text-xs text-slate-300">
                <thead class="text-wine-400 uppercase border-b border-wine-900/60">
                    <tr>
                        <th class="py-2 pr-2">Puesto</th>
                        <th class="py-2 pr-2">Jugador</th>
                        <th class="py-2 pr-2">Sala</th>
                        ${rounds.map(r => `<th class="py-2 px-1 text-center">R${r.number}</th>`).join('')}
                        <th class="py-2 pl-2 text-center">Total</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-wine-900/40">
                    ${rows.map((row, idx) => `
                        <tr>
                            <td class="py-2 pr-2 font-bold text-wine-400">${idx < 3 && row.total > 0 ? medal[idx] : '#' + (idx + 1)}</td>
                            <td class="py-2 pr-2">
                                <div class="flex items-center space-x-2">
                                    ${row.player.isBot ? '🤖' : `<img src="${escapeHtml(row.player.avatar)}" class="w-5 h-5 rounded-full object-cover">`}
                                    <span class="font-bold text-white">${escapeHtml(row.player.name)}</span>
                                </div>
                            </td>
                            <td class="py-2 pr-2 text-slate-400">${escapeHtml(row.room)}</td>
                            ${row.per.map(v => `<td class="py-2 px-1 text-center text-slate-300">${fmtPts(v)}</td>`).join('')}
                            <td class="py-2 pl-2 text-center font-extrabold text-amber-400">${fmtPts(row.total)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function scorePodiumHTML(winners) {
    if (!winners || winners.length === 0) return '';
    const order = [winners[1], winners[0], winners[2]].filter(Boolean);
    const cls = { 1: 'first', 2: 'second', 3: 'third' };
    const medal = { 1: '🥇', 2: '🥈', 3: '🥉' };

    return `
        <div class="score-podium-box" style="--tier-color:#f59e0b">
            <h4 class="direct-title text-center">🏆 Podio de Ganadores</h4>
            <div class="podium px-2 pt-8 pb-2">
                ${order.map(w => `
                    <div class="podium-card tilt ${cls[w.place]}">
                        <div class="podium-medal">${medal[w.place]}</div>
                        <div class="podium-avatar">
                            ${w.isBot ? '<span class="podium-bot">🤖</span>' : `<img src="${escapeHtml(w.avatar || '')}" onerror="this.src='https://i.imgur.com/6VBx3io.png'" alt="">`}
                        </div>
                        <span class="podium-name">${escapeHtml(w.name)}</span>
                        <div class="podium-points">${fmtPts(w.points)}<small>PTS</small></div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Salas con sus jugadores. editable = campo de puntos junto a cada participante
function scoreRoomsHTML(evt, roundNumber, editable) {
    const byId = {};
    (evt.participants || []).forEach(p => { byId[p.id] = p; });
    const totals = {};
    computeScoreStandings(evt).forEach(r => { totals[r.player.id] = r.total; });
    const round = (evt.scoreRounds || [])[roundNumber - 1];
    const disabled = evt.status !== 'PLAYING';

    return `
        <div class="score-rooms">
            ${(evt.rooms || []).map(room => `
                <div class="score-room">
                    <div class="score-room-head">
                        <span>${escapeHtml(room.name)}</span>
                        <small>${room.playerIds.length} jugadores</small>
                    </div>
                    ${room.playerIds.map(id => {
                        const p = byId[id];
                        if (!p) return '';
                        const v = round && round.scores ? round.scores[id] : undefined;
                        return `
                            <div class="score-row">
                                <div class="flex items-center gap-2 min-w-0">
                                    ${p.isBot ? '<span class="text-base">🤖</span>' : `<img src="${escapeHtml(p.avatar)}" class="w-6 h-6 rounded-full object-cover flex-shrink-0">`}
                                    <span class="text-xs font-bold text-white truncate">${escapeHtml(p.name)}</span>
                                </div>
                                <div class="flex items-center gap-2 flex-shrink-0">
                                    <span class="score-total" data-total="${escapeHtml(id)}">Total: ${fmtPts(totals[id] || 0)}</span>
                                    ${editable ? `
                                        <input type="number" step="any" inputmode="decimal" class="score-input" placeholder="0"
                                               value="${typeof v === 'number' ? v : ''}" ${disabled ? 'disabled' : ''}
                                               onchange="setScorePoints(${roundNumber}, '${escapeHtml(id)}', this.value)">
                                    ` : `<span class="score-pill">${typeof v === 'number' ? fmtPts(v) : '–'}</span>`}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `).join('')}
        </div>
    `;
}

function scoreSongBannerHTML(evt, round, isAdmin) {
    if (!round) return '';
    return `
        <div class="bg-gradient-to-r from-wine-950 via-wine-900 to-wine-950 p-4 rounded-xl border-2 border-amber-500/80 shadow-lg flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center space-x-3">
                <div class="p-2.5 bg-amber-500/20 text-amber-400 rounded-lg text-xl border border-amber-500/40">🎵</div>
                <div>
                    <span class="text-xs font-extrabold uppercase text-amber-400 tracking-wider block">La canción de la ronda ${round.number} es:</span>
                    <span class="song-text text-lg font-black text-white">${escapeHtml(round.song)}</span>
                </div>
            </div>
            ${isAdmin ? `
                <button onclick="rerollScoreSong(${round.number - 1})" class="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold shadow-md flex items-center space-x-1">
                    <i class="ph-bold ph-shuffle"></i> <span>Re-sortear Canción</span>
                </button>
            ` : ''}
        </div>
    `;
}

// Monitor del administrador / moderador
function renderScoreAdmin() {
    const box = document.getElementById('score-active-admin');
    if (!box) return;
    const evt = state.activeEvent;
    if (!evt || evt.type !== 'SCORE' || evt.status === 'SETUP') {
        box.classList.add('hidden');
        return;
    }
    box.classList.remove('hidden');

    if (scoreViewFor !== evt.id) {
        scoreViewFor = evt.id;
        scoreViewRound = evt.currentRound;
    }
    if (!scoreViewRound || scoreViewRound > evt.scoreRounds.length) scoreViewRound = evt.currentRound;

    const finished = evt.status === 'FINISHED';
    const current = evt.scoreRounds[evt.currentRound - 1];

    box.innerHTML = `
        <div class="flex flex-wrap items-center justify-between gap-3 bg-wine-900/40 p-4 rounded-xl border border-wine-800">
            <div>
                <h4 class="text-lg font-bold text-white">${escapeHtml(evt.title)} - Formato por Puntaje</h4>
                <p class="text-xs text-slate-400">
                    Ronda ${evt.currentRound} de ${evt.totalRounds} · ${evt.rooms.length} salas · ${evt.participants.length} jugadores.
                    ${finished ? 'Torneo finalizado.' : 'Escribe los puntos junto a cada participante.'}
                </p>
            </div>
            <div class="flex flex-wrap gap-2">
                <button onclick="undoTournamentStep()" class="px-3 py-1.5 bg-amber-950 hover:bg-amber-900 text-amber-300 rounded-lg text-xs font-bold border border-amber-800/60 flex items-center space-x-1">
                    <i class="ph-bold ph-arrow-u-up-left"></i> <span>Retroceder</span>
                </button>
                ${!finished && evt.currentRound < evt.totalRounds ? `
                    <button onclick="nextScoreRound()" class="px-4 py-1.5 bg-green-700 hover:bg-green-600 text-white rounded-lg text-xs font-bold shadow-lg">
                        Siguiente Ronda ➔
                    </button>
                ` : ''}
                ${!finished ? `
                    <button onclick="giveScoreWinners()" class="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold shadow-lg">
                        🏆 Dar Ganadores
                    </button>
                ` : `
                    <button onclick="finishAndSaveEvent()" class="px-4 py-1.5 bg-green-700 hover:bg-green-600 text-white rounded-lg text-xs font-bold shadow-lg">
                        💾 Finalizar y Guardar en Historial
                    </button>
                `}
                <button onclick="deleteActiveEvent()" class="px-3 py-1.5 bg-red-950/80 hover:bg-red-900 text-red-400 rounded-lg text-xs font-bold border border-red-800/60 transition-all flex items-center space-x-1" title="Eliminar torneo activo">
                    <i class="ph-bold ph-trash"></i> <span>Eliminar Torneo</span>
                </button>
            </div>
        </div>

        ${finished ? scorePodiumHTML(evt.winners) : ''}

        ${scoreSongBannerHTML(evt, current, true)}

        <div class="score-round-tabs">
            ${evt.scoreRounds.map(r => `
                <button type="button" onclick="selectScoreRound(${r.number})" class="score-round-tab ${r.number === scoreViewRound ? 'active' : ''}">
                    Ronda ${r.number}
                </button>
            `).join('')}
        </div>

        <div>
            <h5 class="text-sm font-bold text-wine-300 mb-3">Puntos de la Ronda ${scoreViewRound}</h5>
            ${scoreRoomsHTML(evt, scoreViewRound, true)}
        </div>

        <div id="score-standings-admin" class="bg-[#090507] border border-wine-900 rounded-xl p-4">
            ${scoreStandingsInner(evt)}
        </div>
    `;

    if (current) spinSongIfChanged('score-active-admin', scoreSongKey(evt, current), current.song);
}

// Vista de jugadores / visitantes
function renderScoreUserHTML(evt) {
    const finished = evt.status === 'FINISHED';
    const current = evt.scoreRounds[evt.currentRound - 1];

    return `
        <div class="bg-wine-950/80 border border-wine-900 rounded-2xl p-6 shadow-2xl space-y-6">
            <div class="flex items-center justify-between border-b border-wine-900 pb-4">
                <div>
                    <span class="px-3 py-1 rounded-full ${finished ? 'bg-green-950 border border-green-800 text-green-400' : 'bg-red-950 border border-red-800 text-red-400 animate-pulse'} text-xs font-bold uppercase tracking-wider">
                        ${finished ? '🏁 Finalizado' : '🔴 En Vivo'}
                    </span>
                    <h3 class="text-2xl font-black text-white mt-2">${escapeHtml(evt.title)}</h3>
                    <p class="text-xs text-slate-400 mt-1">Formato por puntaje · Ronda ${evt.currentRound} de ${evt.totalRounds}</p>
                </div>
            </div>

            ${finished ? scorePodiumHTML(evt.winners) : scoreSongBannerHTML(evt, current, false)}

            ${finished ? '' : `
                <div>
                    <h4 class="text-sm font-bold text-wine-300 uppercase tracking-wider mb-3">Salas - Ronda ${evt.currentRound}</h4>
                    ${scoreRoomsHTML(evt, evt.currentRound, false)}
                </div>
            `}

            <div class="bg-[#090507] border border-wine-900 rounded-xl p-4">
                ${scoreStandingsInner(evt)}
            </div>
        </div>
    `;
}

// Historial: podio + tabla final
function scoreHistoryHTML(evt) {
    return `
        ${scorePodiumHTML(evt.winners)}
        <div>
            <h4 class="text-xs font-bold text-wine-300 uppercase mb-2">Tabla de Posiciones Final</h4>
            <div class="bg-[#090507] border border-wine-900 rounded-xl p-4">
                ${scoreStandingsInner(evt)}
            </div>
        </div>
    `;
}

// ---------------------------------------------------------------------
//  ACCIONES
// ---------------------------------------------------------------------
async function startScoreEvent() {
    const titleEl = document.getElementById('score-title-input');
    const title = titleEl ? titleEl.value.trim() : '';
    if (!title) {
        alert('Por favor ingresa un nombre para el evento.');
        return;
    }
    const songPool = parseSongList((document.getElementById('score-song-list-input') || {}).value);

    if (!(await confirmReplaceActiveEvent())) return;

    state.activeEvent = {
        id: 'evt-' + Date.now(),
        type: 'SCORE',
        title,
        status: 'SETUP',
        participants: [],
        songPool,
        rooms: [],
        totalRounds: 3,
        currentRound: 0,
        scoreRounds: [],
        winners: null,
        // Campos del formato suizo (vacíos) para que el resto del código no falle
        maxSwissRounds: 0,
        swissRounds: [],
        leaderboard: [],
        playoffs: null,
        historyStates: []
    };

    scoreUiLoadedFor = state.activeEvent.id;
    scoreViewFor = null;
    saveState();
    syncTournamentSetupUI();
    renderTournamentAdmin();
    alert(`Evento "${title}" creado. Ahora inscribe a los participantes.`);
}

function updateScoreSongs() {
    const evt = state.activeEvent;
    if (!evt || evt.type !== 'SCORE') {
        alert('No hay ningún torneo por puntaje activo.');
        return;
    }
    evt.songPool = parseSongList((document.getElementById('score-song-list-input') || {}).value);
    saveState();
    alert('¡Lista de canciones actualizada con éxito! Se usará en los próximos sorteos.');
}

function addScorePlayer() {
    const evt = state.activeEvent;
    if (!evt || evt.type !== 'SCORE' || evt.status !== 'SETUP') return;
    const select = document.getElementById('score-user-select');
    if (!select || !select.value) return;

    const user = state.users.find(u => String(u.id) === String(select.value));
    if (!user) return;

    const uname = user.nickname || user.name;
    if (evt.participants.some(p => p.name === uname)) {
        alert('El usuario ya está inscrito.');
        return;
    }

    evt.participants.push({
        id: `usr-${user.id}`,
        name: uname,
        avatar: user.avatar || 'https://i.imgur.com/6VBx3io.png',
        isBot: false
    });
    evt.rooms = []; // cambió la lista: hay que volver a generar las salas
    saveState();
    syncTournamentSetupUI();
}

function addScoreBot() {
    const evt = state.activeEvent;
    if (!evt || evt.type !== 'SCORE' || evt.status !== 'SETUP') return;
    const input = document.getElementById('score-bot-input');
    const name = (input && input.value.trim()) || `Bot_${evt.participants.length + 1}`;

    if (evt.participants.some(p => p.name === name)) {
        alert('Ya existe un participante o bot con ese nombre.');
        return;
    }

    evt.participants.push({
        id: `bot-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        name,
        avatar: '🤖',
        isBot: true
    });
    if (input) input.value = '';
    evt.rooms = [];
    saveState();
    syncTournamentSetupUI();
}

function removeScoreParticipant(id) {
    const evt = state.activeEvent;
    if (!evt || evt.type !== 'SCORE' || evt.status !== 'SETUP') return;
    evt.participants = evt.participants.filter(p => String(p.id) !== String(id));
    evt.rooms = [];
    saveState();
    syncTournamentSetupUI();
}

function renderScoreParticipantsBadges() {
    const container = document.getElementById('score-participants-badges');
    const counter = document.getElementById('score-count');
    const evt = state.activeEvent;
    const list = (evt && evt.type === 'SCORE') ? evt.participants : [];
    if (counter) counter.textContent = list.length;
    if (!container) return;

    if (list.length === 0) {
        container.innerHTML = `<span class="text-xs text-slate-500 italic">No hay inscritos aún.</span>`;
        return;
    }

    container.innerHTML = list.map(p => `
        <span class="inline-flex items-center space-x-2 px-3 py-1 rounded-xl bg-wine-900 border border-wine-700 text-xs text-white">
            ${p.isBot ? '🤖' : `<img src="${escapeHtml(p.avatar)}" class="w-4 h-4 rounded-full object-cover">`}
            <span class="font-bold">${escapeHtml(p.name)}</span>
            <button onclick="removeScoreParticipant('${p.id}')" class="text-slate-400 hover:text-red-400 ml-1">
                <i class="ph-bold ph-x"></i>
            </button>
        </span>
    `).join('');
}

function generateScoreRoomsAction() {
    const evt = state.activeEvent;
    if (!evt || evt.type !== 'SCORE' || evt.status !== 'SETUP') {
        alert('Primero crea un torneo por puntaje.');
        return;
    }
    if (evt.participants.length < 2) {
        alert('Se necesitan al menos 2 participantes.');
        return;
    }
    evt.rooms = buildScoreRooms(evt.participants);
    saveState();
    syncTournamentSetupUI();
}

function reshuffleScoreRooms() {
    const evt = state.activeEvent;
    if (!evt || evt.type !== 'SCORE' || evt.status !== 'SETUP') return;
    if (evt.participants.length < 2) return;
    evt.rooms = buildScoreRooms(evt.participants);
    saveState();
    syncTournamentSetupUI();
    showToast('Inscritos mezclados: salas nuevas generadas al azar.', 'success');
}

function setScoreRounds(value) {
    const evt = state.activeEvent;
    if (!evt || evt.type !== 'SCORE' || evt.status !== 'SETUP') return;
    const n = Math.max(1, Math.min(50, parseInt(value, 10) || 3));
    evt.totalRounds = n;
    const input = document.getElementById('score-rounds-input');
    if (input) input.value = n;
    saveState();
}

async function startScoreTournament() {
    let evt = state.activeEvent;
    if (!evt || evt.type !== 'SCORE' || evt.status !== 'SETUP') return;
    if (!evt.rooms || evt.rooms.length === 0) {
        alert('Primero genera las salas.');
        return;
    }

    const rounds = Math.max(1, Math.min(50, parseInt(evt.totalRounds, 10) || 3));
    const ok = await confirmDialog(
        `Se iniciará el torneo con ${evt.rooms.length} salas y ${rounds} rondas. Las salas se mantendrán iguales durante todo el torneo. ¿Comenzar?`,
        { confirmText: 'Comenzar torneo' }
    );
    if (!ok) return;

    evt = state.activeEvent;
    if (!evt || evt.type !== 'SCORE' || evt.status !== 'SETUP') return;

    saveHistoryState();
    evt.totalRounds = rounds;
    evt.status = 'PLAYING';
    evt.currentRound = 1;
    evt.scoreRounds = [newScoreRound(evt, 1)];
    evt.winners = null;
    scoreViewFor = evt.id;
    scoreViewRound = 1;

    saveState();
    refreshTournamentViews();
}

function nextScoreRound() {
    const evt = state.activeEvent;
    if (!evt || evt.type !== 'SCORE' || evt.status !== 'PLAYING') return;
    if (evt.currentRound >= evt.totalRounds) {
        alert('Estás en la última ronda. Usa "Dar Ganadores" para terminar el torneo.');
        return;
    }

    saveHistoryState();
    evt.currentRound += 1;
    evt.scoreRounds.push(newScoreRound(evt, evt.currentRound));
    scoreViewRound = evt.currentRound;

    saveState();
    refreshTournamentViews();
}

function rerollScoreSong(idx) {
    const evt = state.activeEvent;
    if (!evt || evt.type !== 'SCORE') return;
    const round = evt.scoreRounds[idx];
    if (!round) return;

    saveHistoryState();
    round.song = pickDirectSong(evt.songPool, [round.song]);
    round.songRollId = Date.now();
    saveState();
    refreshTournamentViews();
}

function selectScoreRound(n) {
    scoreViewRound = n;
    renderScoreAdmin();
}

// Guarda los puntos sin volver a dibujar los campos (así puedes seguir escribiendo con Tab)
function setScorePoints(roundNumber, playerId, value) {
    const evt = state.activeEvent;
    if (!evt || evt.type !== 'SCORE' || evt.status !== 'PLAYING') return;
    const round = evt.scoreRounds[roundNumber - 1];
    if (!round) return;
    if (!round.scores) round.scores = {};

    const raw = String(value).trim();
    const num = parseFloat(raw);
    if (raw === '' || isNaN(num)) delete round.scores[playerId];
    else round.scores[playerId] = Math.round(num * 100) / 100;

    saveState();

    const st = document.getElementById('score-standings-admin');
    if (st) st.innerHTML = scoreStandingsInner(evt);
    const totals = {};
    computeScoreStandings(evt).forEach(r => { totals[r.player.id] = r.total; });
    document.querySelectorAll('#score-active-admin [data-total]').forEach(el => {
        el.textContent = 'Total: ' + fmtPts(totals[el.dataset.total] || 0);
    });
}

async function giveScoreWinners() {
    let evt = state.activeEvent;
    if (!evt || evt.type !== 'SCORE' || evt.status !== 'PLAYING') return;

    const ok = await confirmDialog(
        'Se tomarán los 3 mejores de la tabla de posiciones y se mostrará el podio. Podrás deshacerlo con "Retroceder". ¿Dar ganadores?',
        { confirmText: 'Dar ganadores' }
    );
    if (!ok) return;

    evt = state.activeEvent;
    if (!evt || evt.type !== 'SCORE' || evt.status !== 'PLAYING') return;

    saveHistoryState();
    evt.winners = buildScoreWinners(evt);
    evt.status = 'FINISHED';
    saveState();
    refreshTournamentViews();
}

// ---------------------------------------------------------------------
//  INTERFAZ DE LA PESTAÑA
// ---------------------------------------------------------------------
function renderScoreRoomsPreview() {
    const evt = state.activeEvent;
    const grid = document.getElementById('score-rooms-grid');
    const input = document.getElementById('score-rounds-input');
    if (!evt || evt.type !== 'SCORE' || !grid) return;
    if (input) input.value = evt.totalRounds || 3;

    const byId = {};
    evt.participants.forEach(p => { byId[p.id] = p; });

    grid.innerHTML = evt.rooms.map(room => `
        <div class="score-room">
            <div class="score-room-head">
                <span>${escapeHtml(room.name)}</span>
                <small>${room.playerIds.length} jugadores</small>
            </div>
            ${room.playerIds.map(id => {
                const p = byId[id];
                if (!p) return '';
                return `
                    <div class="score-row">
                        <div class="flex items-center gap-2 min-w-0">
                            ${p.isBot ? '<span class="text-base">🤖</span>' : `<img src="${escapeHtml(p.avatar)}" class="w-6 h-6 rounded-full object-cover flex-shrink-0">`}
                            <span class="text-xs font-bold text-white truncate">${escapeHtml(p.name)}</span>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `).join('');
}

function syncScoreUI() {
    const evt = state.activeEvent;
    const isScore = !!(evt && evt.type === 'SCORE');
    const setup = isScore && evt.status === 'SETUP';

    const reg = document.getElementById('score-registration-area');
    if (reg) {
        if (setup) {
            reg.classList.remove('hidden');
            renderScoreParticipantsBadges();
        } else {
            reg.classList.add('hidden');
        }
    }

    const preview = document.getElementById('score-rooms-preview');
    if (preview) {
        if (setup && evt.rooms && evt.rooms.length > 0) {
            preview.classList.remove('hidden');
            renderScoreRoomsPreview();
        } else {
            preview.classList.add('hidden');
        }
    }

    if (isScore && scoreUiLoadedFor !== evt.id) {
        scoreUiLoadedFor = evt.id;
        const ti = document.getElementById('score-title-input');
        const so = document.getElementById('score-song-list-input');
        if (ti && !ti.value) ti.value = evt.title;
        if (so) so.value = (evt.songPool || []).join('\n');
    }
}

function tournamentTypeLabel(evt) {
    if (evt.type === 'DIRECT') return 'Play Off Directo';
    if (evt.type === 'SCORE') return 'torneo por puntaje';
    return 'torneo suizo';
}

// Avisa en cada pestaña cuando el torneo activo es de otro tipo
function syncTournamentNotices() {
    const evt = state.activeEvent;
    const type = evt ? (evt.type || 'SWISS') : null;
    [['swiss-notice', 'SWISS'], ['direct-notice', 'DIRECT'], ['score-notice', 'SCORE']].forEach(([id, t]) => {
        const el = document.getElementById(id);
        if (!el) return;
        if (evt && type !== t) {
            el.textContent = `Hay un ${tournamentTypeLabel(evt)} activo ("${evt.title}"). Si creas uno nuevo aquí, lo reemplazará.`;
            el.classList.remove('hidden');
        } else {
            el.classList.add('hidden');
        }
    });
}

function tabForEvent(evt) {
    if (!evt) return 'swiss';
    if (evt.type === 'DIRECT') return 'direct';
    if (evt.type === 'SCORE') return 'score';
    return 'swiss';
}

// Tabla de posiciones del sistema suizo (se mantiene visible en PlayOffs y al finalizar)
function swissStandingsHTML(evt) {
    if (!evt || !evt.leaderboard || evt.leaderboard.length === 0) return '';

    const qualified = new Set();
    if (evt.playoffs && evt.playoffs.topCount) {
        evt.leaderboard.slice(0, evt.playoffs.topCount).forEach(item => qualified.add(String(item.participant.id)));
    }
    const roundsPlayed = (evt.swissRounds || []).length;

    return `
        <div class="bg-[#090507] border border-wine-900 rounded-xl p-4">
            <div class="flex items-center justify-between border-b border-wine-900 pb-2 mb-3">
                <h5 class="text-sm font-bold text-wine-300">Tabla de Posiciones Suizo</h5>
                <span class="text-[10px] text-slate-400">${roundsPlayed} ${roundsPlayed === 1 ? 'ronda jugada' : 'rondas jugadas'}</span>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-left text-xs text-slate-300">
                    <thead class="text-wine-400 uppercase border-b border-wine-900/60">
                        <tr>
                            <th class="py-2">Puesto</th>
                            <th class="py-2">Jugador</th>
                            <th class="py-2 text-center">Puntos</th>
                            <th class="py-2 text-center">G / P</th>
                            <th class="py-2 text-right"></th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-wine-900/40">
                        ${evt.leaderboard.map((item, idx) => `
                            <tr>
                                <td class="py-2 font-bold text-wine-400">#${idx + 1}</td>
                                <td class="py-2">
                                    <div class="flex items-center space-x-2">
                                        ${item.participant.isBot ? '🤖' : `<img src="${escapeHtml(item.participant.avatar)}" class="w-5 h-5 rounded-full object-cover">`}
                                        <span class="font-bold text-white">${escapeHtml(item.participant.name)}</span>
                                    </div>
                                </td>
                                <td class="py-2 text-center font-extrabold text-amber-400">${item.points} pts</td>
                                <td class="py-2 text-center text-slate-400">${item.wins}V / ${item.losses}D</td>
                                <td class="py-2 text-right">
                                    ${qualified.has(String(item.participant.id)) ? '<span class="px-2 py-0.5 rounded-full bg-green-950 text-green-400 border border-green-800 text-[10px] font-bold">Clasificado</span>' : ''}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function renderTournamentAdmin() {
    // Play Off Directo y Formato por Puntaje tienen su propio monitor dentro de su pestaña
    const evtType = state.activeEvent ? state.activeEvent.type : null;
    const directBox = document.getElementById('direct-active-admin');
    const scoreBox = document.getElementById('score-active-admin');
    if (evtType !== 'DIRECT' && directBox) directBox.classList.add('hidden');
    if (evtType !== 'SCORE' && scoreBox) scoreBox.classList.add('hidden');

    if (evtType === 'DIRECT' || evtType === 'SCORE') {
        const swissActive = document.getElementById('active-tournament-admin');
        if (swissActive) swissActive.classList.add('hidden');
        if (evtType === 'DIRECT') renderDirectAdmin();
        else renderScoreAdmin();
        maybeCelebrate(state.activeEvent);
        return;
    }

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
                            <span class="song-text text-lg font-black text-white">${escapeHtml(roundObj.currentSong)}</span>
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
        spinSongIfChanged('swiss-admin-container', songKeyFor(state.activeEvent, roundObj), roundObj.currentSong);
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

            ${swissStandingsHTML(state.activeEvent)}
        `;
        observeBrackets();
    }
    maybeCelebrate(state.activeEvent);
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
                <button onclick="navigateTo('view-tiers')" class="mt-2 px-5 py-2.5 rounded-xl bg-wine-700 hover:bg-wine-600 text-white text-sm font-semibold inline-flex items-center space-x-2">
                    <i class="ph-bold ph-ranking"></i> <span>Ver Tabla Tiers</span>
                </button>
            </div>
        `;
        return;
    }

    const evt = state.activeEvent;
    if (evt.type === 'DIRECT') {
        container.innerHTML = renderDirectUserHTML(evt);
        maybeCelebrate(evt);
        return;
    }
    if (evt.type === 'SCORE') {
        container.innerHTML = renderScoreUserHTML(evt);
        const cur = evt.scoreRounds[evt.currentRound - 1];
        if (cur && evt.status === 'PLAYING') {
            spinSongIfChanged('user-events-view-container', scoreSongKey(evt, cur), cur.song);
        }
        maybeCelebrate(evt);
        return;
    }
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
                        <h2 class="song-text text-xl sm:text-2xl font-black text-white drop-shadow">${escapeHtml(currentSwissRound.currentSong)}</h2>
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
                    <h4 class="text-sm font-bold text-wine-300 uppercase tracking-wider text-center">Fase Final - Llaves de PlayOffs</h4>
                    ${renderPlayoffsBracketHTML(evt.playoffs, false)}
                    ${swissStandingsHTML(evt)}
                </div>
            ` : ''}
        </div>
    `;
    if (currentSwissRound && currentSwissRound.currentSong) {
        spinSongIfChanged('user-events-view-container', songKeyFor(evt, currentSwissRound), currentSwissRound.currentSong);
    }
    observeBrackets();
    maybeCelebrate(evt);
}

function renderPlayoffsBracketHTML(playoffs, isAdminControl = false) {
    if (!playoffs) return '';

    const sideHTML = (player, isWin, rIdx, mIdx) => `
        <div class="flex items-center justify-between p-2 rounded-lg ${isWin ? 'bg-green-950/90 text-green-300 font-bold border border-green-600' : 'text-slate-300'}">
            <div class="flex items-center space-x-2 truncate">
                ${player ? (player.isBot ? '🤖' : `<img src="${escapeHtml(player.avatar)}" class="w-6 h-6 rounded-full object-cover">`) : ''}
                <span class="text-xs font-bold truncate">${player ? escapeHtml(player.name) : 'TBD'}</span>
            </div>
            ${isAdminControl && player ? `
                <button onclick="setPlayoffWinner(${rIdx},${mIdx}, '${player.id}')" class="text-[10px] px-2 py-1 ${isWin ? 'bg-green-600 text-white' : 'bg-wine-900 hover:bg-green-700 text-slate-200'} rounded font-bold shadow-md transition-all">
                    ✔️ ${isWin ? 'Ganador' : 'Elegir'}
                </button>
            ` : ''}
        </div>
    `;

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

            <div class="bracket-wrap relative flex items-stretch gap-16 min-w-max w-fit mx-auto">
                ${playoffs.rounds.map((round, rIdx) => `
                    <div class="bracket-round flex flex-col relative z-10">
                        <div class="text-center mb-4">
                            <h5 class="text-xs font-extrabold text-wine-400 uppercase">${escapeHtml(round.roundName)}</h5>${round.currentSong ? `
                                <span class="text-[10px] text-amber-400 font-bold block mt-1 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60">
                                    🎵 ${escapeHtml(round.currentSong)}
                                </span>
                            ` : ''}
                        </div>
                        <div class="bracket-matches flex flex-col justify-around flex-1 gap-6">
                            ${round.matches.map((m, mIdx) => {
                                const isWinA = m.winnerId && m.playerA && String(m.winnerId) === String(m.playerA.id);
                                const isWinB = m.winnerId && m.playerB && String(m.winnerId) === String(m.playerB.id);
                                return `
                                    <div class="bracket-card w-64 bg-wine-950/90 border border-wine-800 rounded-xl p-3 shadow-xl relative">
                                        ${sideHTML(m.playerA, isWinA, rIdx, mIdx)}
                                        <div class="text-[10px] text-center font-black text-wine-500 uppercase my-1">vs</div>
                                        ${sideHTML(m.playerB, isWinB, rIdx, mIdx)}
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

// Dibuja las líneas neón que conectan cada pareja de partidas con la siguiente ronda
function drawBracketLinesFor(wrap) {
    const old = wrap.querySelector(':scope > svg.bracket-lines');
    if (old) old.remove();

    const rounds = Array.from(wrap.querySelectorAll(':scope > .bracket-round'));
    if (rounds.length < 2) return;

    const base = wrap.getBoundingClientRect();
    if (!base.width) return;

    const pos = (el) => {
        const r = el.getBoundingClientRect();
        return { l: r.left - base.left, r: r.right - base.left, cy: r.top - base.top + r.height / 2 };
    };

    let d = '';
    for (let i = 0; i < rounds.length - 1; i++) {
        const cur = Array.from(rounds[i].querySelectorAll('.bracket-card'));
        const nxt = Array.from(rounds[i + 1].querySelectorAll('.bracket-card'));
        nxt.forEach((n, k) => {
            const np = pos(n);
            const parents = [cur[2 * k], cur[2 * k + 1]].filter(Boolean).map(pos);
            if (!parents.length) return;
            const midX = (parents[0].r + np.l) / 2;
            parents.forEach(p => { d += `M${p.r} ${p.cy}H${midX}`; });
            d += `M${midX} ${parents[0].cy}V${parents[parents.length - 1].cy}`;
            d += `M${midX} ${np.cy}H${np.l}`;
        });
    }
    if (!d) return;

    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('class', 'bracket-lines');
    svg.setAttribute('width', base.width);
    svg.setAttribute('height', base.height);
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d', d);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', '#c92a52');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('stroke-linecap', 'round');
    svg.appendChild(path);
    wrap.insertBefore(svg, wrap.firstChild);
}

function observeBrackets() {
    requestAnimationFrame(() => {
        document.querySelectorAll('.bracket-wrap').forEach(wrap => {
            if (wrap._ro) return;
            wrap._ro = new ResizeObserver(() => drawBracketLinesFor(wrap));
            wrap._ro.observe(wrap);
        });
    });
}

function renderEventHistory() {
    const container = document.getElementById('history-events-container');
    if (!container) return;

    if (state.eventHistory.length === 0) {
        container.innerHTML = emptyStateHTML('ph-clock-counter-clockwise', 'Historial vacío', 'Cuando finalices un torneo, aparecerá aquí con su tabla de posiciones y su bracket.');
        return;
    }

    container.innerHTML = state.eventHistory.map((evt, idx) => `
        <div class="bg-wine-950/60 border border-wine-900 rounded-2xl p-6 space-y-4">
            <div class="flex items-center justify-between border-b border-wine-900 pb-3">
                <div class="flex flex-wrap items-center gap-2">
                    <h3 class="text-xl font-bold text-white">${escapeHtml(evt.title)}</h3>
                    <span class="text-xs px-3 py-1 rounded-full bg-green-950 text-green-400 border border-green-800">Finalizado</span>
                    ${evt.type === 'DIRECT' ? `<span class="text-xs px-3 py-1 rounded-full bg-amber-950 text-amber-300 border border-amber-800/60">Play Off Directo${evt.hasLower ? ' · Lower Bracket' : ''}</span>` : ''}
                    ${evt.type === 'SCORE' ? `<span class="text-xs px-3 py-1 rounded-full bg-amber-950 text-amber-300 border border-amber-800/60">Formato por Puntaje · ${(evt.scoreRounds || []).length} rondas</span>` : ''}
                </div>
                <button onclick="deleteHistoryEvent(${idx})" class="px-3 py-1.5 bg-red-950/60 hover:bg-red-900/80 text-red-400 border border-red-800/60 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1">
                    <i class="ph-bold ph-trash"></i>
                    <span>Eliminar Registro</span>
                </button>
            </div>

            ${evt.type === 'SCORE' ? scoreHistoryHTML(evt) : (evt.type === 'DIRECT' ? `
                <div>
                    <h4 class="text-xs font-bold text-wine-300 uppercase mb-2">Bracket</h4>
                    ${renderDirectBracketHTML(evt, false)}
                </div>
            ` : `
                <div>
                    <h4 class="text-xs font-bold text-wine-300 uppercase mb-2">Tabla de Posiciones Final</h4>
                    <div class="bg-[#090507] p-3 rounded-xl border border-wine-900">
                        <div class="flex flex-wrap gap-4 text-xs">
                            ${(evt.leaderboard || []).map((item, pIdx) => `
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
            `)}
        </div>
    `).join('');
    observeBrackets();
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
                role: normalizeRole(newUser.role)
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
            role: normalizeRole(foundUser.role)
        };
        saveState();
        alert(`¡Bienvenido de nuevo, ${state.currentUser.nickname}!${currentRoleKey() === 'MODERATOR' ? ' Sesión de Moderador: tienes acceso a Control de Torneos y Panel Admin.' : ''}`);
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

    const confirmacion = await confirmDialog("¿Estás seguro de que deseas eliminar tu cuenta? Esta acción borra permanentemente todos tus datos y puntos.", { danger: true, confirmText: 'Eliminar mi cuenta' });
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
    if (!await confirmDialog(`¿Estás seguro de que deseas eliminar permanentemente a "${username}"?`, { danger: true, confirmText: 'Eliminar usuario' })) return;

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

        if (!response.ok) {
            alert(`No se pudo actualizar el rol (error ${response.status}).`);
            await fetchUsers();
            renderAdminUserTable();
            return;
        }

        let updated = {};
        try { updated = await response.json(); } catch (e) { updated = {}; }

        const known = state.users.find(u => String(u.id) === String(userId));
        const username = (updated && (updated.nickname || updated.name)) || (known && (known.nickname || known.name));

        if (username) {
            if (!state.assignments[username]) {
                state.assignments[username] = { tagIds: [] };
            }
            const tagIds = state.assignments[username].tagIds;
            if (newRole === 'MODERATOR' && !tagIds.includes('tag-mod')) {
                tagIds.push('tag-mod');
            } else if (newRole === 'USER') {
                state.assignments[username].tagIds = tagIds.filter(id => id !== 'tag-mod');
            }
        }

        saveState();
        await fetchUsers();
        renderAdminUserTable();
        renderPublicTiers();

        // Comprueba que el servidor realmente guardó el rol
        const after = state.users.find(u => String(u.id) === String(userId));
        const savedRole = after ? normalizeRole(after.role) : null;
        if (savedRole !== normalizeRole(newRole)) {
            showToast(`El servidor NO guardó el rol: ese usuario sigue como "${savedRole || 'desconocido'}". Revisa la ruta PUT /api/users/:id/role de tu backend (debe guardar el campo role y devolverlo en GET /api/users).`, 'error');
        } else {
            alert(`Rol actualizado a ${newRole === 'MODERATOR' ? 'Moderador' : 'Usuario'} para ${username || 'el usuario'}. En su sesión se activa solo en unos segundos.`);
        }
    } catch (err) {
        console.error("Error al actualizar rol:", err);
        alert('No se pudo conectar con el servidor para actualizar el rol.');
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

let profileCardRanks = [];

function renderProfileCard() {
    const container = document.getElementById('profile-card-container');
    if (!container || !state.currentUser) return;

    const me = state.users.find(u => String(u.id) === String(state.currentUser.id));
    const ranks = (me && me.tierRanks) ? [...me.tierRanks].sort((a, b) => b.puntos - a.puntos) : [];
    const best = ranks[0];
    profileCardRanks = ranks;
    const frameColor = best && best.tier && best.tier.color ? best.tier.color : '#c92a52';

    const assign = state.assignments[state.currentUser.nickname] || {};
    const userTagIds = assign.tagIds || [];
    const userTags = state.tags.filter(t => userTagIds.includes(t.id));
    const modosText = Array.isArray(state.currentUser.modo) ? state.currentUser.modo.join(', ') : (state.currentUser.modo || 'NORMAL');
    const avatarUrl = state.currentUser.avatar || 'https://i.imgur.com/6VBx3io.png';
    const generoVal = state.currentUser.genero || 'Otros';

    container.innerHTML = `
        <div class="max-w-md mx-auto">
            <div id="profile-collectible" class="collectible tilt" style="--tier-color:${escapeHtml(frameColor)}">
                <div class="collectible-top">
                    <span class="collectible-brand">AWC LATAM</span>
                    ${best && best.tier ? `<span id="card-tier-badge" class="collectible-tier" style="background:${escapeHtml(frameColor)}">${escapeHtml(best.tier.name)}</span>` : ''}
                </div>

                <div class="collectible-avatar">
                    <img src="${escapeHtml(avatarUrl)}" onerror="this.src='https://i.imgur.com/6VBx3io.png'" alt="Avatar">
                </div>

                <h2 class="collectible-name">${escapeHtml(state.currentUser.nickname)}</h2>
                <p class="collectible-sub">${escapeHtml(state.currentUser.nombres || 'Sin nombre asignado')} · ${escapeHtml(generoVal)}</p>
                ${roleChipHTML() ? `<div class="collectible-rolebox">${roleChipHTML()}</div>` : ''}

                <div class="collectible-points">
                    <span id="card-points">${best ? best.puntos : 0}</span><small>PTS</small>
                </div>
                <div id="card-tier-label" class="collectible-tier-label">${best && best.tier ? escapeHtml(best.tier.name) : 'Sin tier asignado'}</div>

                <div class="collectible-grid">
                    <div>
                        <span class="collectible-label">Modo preferido</span>
                        <span class="collectible-value">${escapeHtml(modosText)}</span>
                    </div>
                    <div>
                        <span class="collectible-label">Familia</span>
                        <span class="collectible-value">${escapeHtml(state.currentUser.familia || 'Sin Familia / Ninguno')}</span>
                    </div>
                </div>

                ${ranks.length > 0 ? `
                    <div class="collectible-chips">
                        ${ranks.map((tr, i) => `
                            <button type="button" class="tier-pick ${i === 0 ? 'active' : ''}" onclick="selectCardTier(${i})"
                                    style="background:${escapeHtml(tr.tier.color)}" title="Ver los puntos de este Tier">
                                ${escapeHtml(tr.tier.name)} · ${tr.puntos}
                            </button>
                        `).join('')}
                    </div>
                    ${ranks.length > 1 ? '<p class="collectible-hint" data-html2canvas-ignore="true">Toca un Tier para ver sus puntos</p>' : ''}
                ` : ''}

                ${userTags.length > 0 ? `
                    <div class="collectible-chips">
                        ${userTags.map(tag => `<span style="background:${escapeHtml(tag.color)}">${escapeHtml(tag.name)}</span>`).join('')}
                    </div>
                ` : ''}
            </div>

            <div class="flex flex-wrap items-center justify-center gap-3 mt-5">
                <button onclick="downloadProfileCard()" class="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-semibold transition-all flex items-center space-x-2">
                    <i class="ph-bold ph-download-simple"></i>
                    <span>Descargar Carta</span>
                </button>
                <button onclick="navigateTo('view-profile-edit')" class="px-4 py-2 bg-wine-700 hover:bg-wine-600 text-white rounded-xl text-sm font-semibold transition-all flex items-center space-x-2">
                    <i class="ph-bold ph-pencil"></i>
                    <span>Editar Perfil</span>
                </button>
            </div>
        </div>
    `;
}

// Al tocar un Tier de la carta, se muestran los puntos de ese Tier
function selectCardTier(i) {
    const tr = profileCardRanks[i];
    const card = document.getElementById('profile-collectible');
    if (!tr || !card) return;

    const color = (tr.tier && tr.tier.color) || '#c92a52';
    card.style.setProperty('--tier-color', color);

    const pts = document.getElementById('card-points');
    if (pts) {
        pts.textContent = tr.puntos;
        pts.classList.remove('pts-pop');
        void pts.offsetWidth; // reinicia la animación
        pts.classList.add('pts-pop');
    }

    const label = document.getElementById('card-tier-label');
    if (label) label.textContent = tr.tier.name;

    const badge = document.getElementById('card-tier-badge');
    if (badge) {
        badge.textContent = tr.tier.name;
        badge.style.background = color;
    }

    card.querySelectorAll('.tier-pick').forEach((b, idx) => b.classList.toggle('active', idx === i));
}

async function downloadProfileCard() {
    const el = document.getElementById('profile-collectible');
    if (!el) return;
    if (typeof html2canvas !== 'function') {
        showToast('No se pudo cargar el generador de imágenes. Revisa tu conexión.', 'error');
        return;
    }
    const prevTransform = el.style.transform;
    el.style.transform = 'none';
    try {
        showToast('Generando tu carta…', 'info');
        const canvas = await html2canvas(el, { backgroundColor: '#1c0a11', scale: 2, useCORS: true });
        canvas.toBlob(blob => {
            if (!blob) { showToast('No se pudo generar la imagen.', 'error'); return; }
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `carta-${state.currentUser.nickname}.png`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(a.href), 2000);
            showToast('¡Carta descargada!', 'success');
        }, 'image/png');
    } catch (err) {
        console.error('Error generando carta:', err);
        showToast('No se pudo exportar la carta (el servidor de tu avatar bloquea la exportación).', 'error');
    } finally {
        el.style.transform = prevTransform;
    }
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
    if (!await confirmDialog(`¿Eliminar el tier "${tier.name}"? Los usuarios asignados perderán este Tier.`, { danger: true, confirmText: 'Eliminar tier' })) return;

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
        const currentRole = normalizeRole(user.role);

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

// ===== TIERS: vista, filtros, podio y cambios de posición =====
let tiersViewMode = localStorage.getItem('uh_tiers_view') || 'table';
const RANK_KEY = 'uh_rank_snapshots';

function loadRankSnapshots() {
    try { return JSON.parse(localStorage.getItem(RANK_KEY)) || {}; } catch (e) { return {}; }
}
function saveRankSnapshots(snaps) {
    try { localStorage.setItem(RANK_KEY, JSON.stringify(snaps)); } catch (e) { /* sin espacio */ }
}

function emptyStateHTML(icon, title, text, action = '') {
    return `
        <div class="empty-state">
            <div class="empty-icon"><i class="ph-bold ${icon}"></i></div>
            <h3>${title}</h3>
            <p>${text}</p>
            ${action}
        </div>
    `;
}

function setTiersView(mode) {
    tiersViewMode = mode;
    try { localStorage.setItem('uh_tiers_view', mode); } catch (e) { /* ignorar */ }
    renderPublicTiers();
}

function updateTiersToolbar() {
    const bt = document.getElementById('tiers-view-table');
    const bl = document.getElementById('tiers-view-list');
    if (bt) bt.classList.toggle('active', tiersViewMode === 'table');
    if (bl) bl.classList.toggle('active', tiersViewMode === 'list');

    const sel = document.getElementById('tiers-family-filter');
    if (sel && sel.options.length !== state.clans.length + 1) {
        const cur = sel.value || 'all';
        sel.innerHTML = `<option value="all">Todas las familias</option>` +
            state.clans.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
        sel.value = Array.from(sel.options).some(o => o.value === cur) ? cur : 'all';
    }
}

function getModoText(u) {
    let arr = ['NORMAL'];
    try {
        if (u.modo) arr = u.modo.startsWith('[') ? JSON.parse(u.modo) : [u.modo];
    } catch (e) {
        arr = [u.modo || 'NORMAL'];
    }
    return Array.isArray(arr) ? arr.join(', ') : String(arr);
}

function showUserCardFromEl(ev, el) {
    showUserCard(ev, el.dataset.user);
}

// Compara el ranking actual con el del día anterior (guardado en este navegador)
function computeRankDeltas(snaps, tier, members, today) {
    const key = String(tier.dbId);
    const current = {};
    members.forEach(m => { current[m.user.id] = m.rank; });

    let snap = snaps[key];
    if (!snap) snap = { day: today, current, previous: {} };
    else if (snap.day !== today) snap = { day: today, previous: snap.current || {}, current };
    else snap.current = current;
    snaps[key] = snap;

    const out = {};
    members.forEach(m => {
        const prev = snap.previous[m.user.id];
        if (prev) out[m.user.id] = prev - m.rank;
    });
    return out;
}

function deltaBadge(d) {
    if (!d) return '';
    return d > 0
        ? `<span class="rank-delta up">▲${d}</span>`
        : `<span class="rank-delta down">▼${Math.abs(d)}</span>`;
}

function renderPodium(top3, delta) {
    const order = [top3[1], top3[0], top3[2]].filter(Boolean);
    const cls = { 1: 'first', 2: 'second', 3: 'third' };
    const medal = { 1: '🥇', 2: '🥈', 3: '🥉' };

    return `
        <div class="podium px-4 pt-8 pb-2">
            ${order.map(m => {
                const u = m.user;
                const uname = u.nickname || u.name;
                const avatar = u.avatar || 'https://i.imgur.com/6VBx3io.png';
                return `
                    <div class="podium-card tilt ${cls[m.rank]}">
                        <div class="podium-medal">${medal[m.rank]}</div>
                        <div class="podium-avatar"><img src="${escapeHtml(avatar)}" onerror="this.src='https://i.imgur.com/6VBx3io.png'" alt=""></div>
                        <span class="podium-name cursor-pointer" data-user="${escapeHtml(uname)}" onmouseenter="showUserCardFromEl(event, this)" onmouseleave="hideUserCard()">${escapeHtml(uname)}</span>
                        <div class="podium-points">${m.puntos}<small>PTS</small></div>
                        ${deltaBadge(delta[u.id])}
                        <div class="podium-family">${escapeHtml(u.familia || 'Sin Familia / Ninguno')}</div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function renderTierRow(m, delta) {
    const u = m.user;
    const uname = u.nickname || u.name;
    const rank = m.rank;
    const avatar = u.avatar || 'https://i.imgur.com/6VBx3io.png';

    let rankBadge = `<span class="font-bold text-slate-400">#${rank}</span>`;
    if (rank === 1) rankBadge = `<span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-black border border-amber-500/40 text-xs">🥇</span>`;
    else if (rank === 2) rankBadge = `<span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300/20 text-slate-300 font-black border border-slate-300/40 text-xs">🥈</span>`;
    else if (rank === 3) rankBadge = `<span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700/20 text-amber-600 font-black border border-amber-700/40 text-xs">🥉</span>`;

    return `
        <tr class="hover:bg-wine-900/30 transition-colors ${rank === 1 ? 'bg-amber-500/5' : ''}">
            <td class="py-3 px-4 text-center font-bold">
                <div class="inline-flex flex-col items-center gap-0.5">${rankBadge}${deltaBadge(delta[u.id])}</div>
            </td>
            <td class="py-3 px-4">
                <div class="flex items-center gap-2 font-bold text-slate-100">
                    <div class="w-7 h-7 rounded-full overflow-hidden bg-wine-900 border border-wine-700/60 flex-shrink-0">
                        <img src="${escapeHtml(avatar)}" onerror="this.src='https://i.imgur.com/6VBx3io.png'" class="w-full h-full object-cover">
                    </div>
                    <span class="cursor-pointer hover:text-wine-400 transition-colors" data-user="${escapeHtml(uname)}"
                          onmouseenter="showUserCardFromEl(event, this)" onmouseleave="hideUserCard()">${escapeHtml(uname)}</span>
                </div>
            </td>
            <td class="py-3 px-4 text-center font-extrabold text-amber-400">${m.puntos} pts</td>
            <td class="py-3 px-4 text-slate-300 font-medium">${escapeHtml(u.familia || 'Sin Familia / Ninguno')}</td>
            <td class="py-3 px-4 text-wine-300 font-medium">
                <span class="px-2.5 py-1 rounded-lg bg-wine-950/80 border border-wine-800 text-wine-300 text-xs font-semibold">${escapeHtml(getModoText(u))}</span>
            </td>
        </tr>
    `;
}

function renderTierTableBlock(tier, total, visible, delta, filtering) {
    const showPodium = !filtering && visible.length > 0;
    const rows = showPodium ? visible.slice(3) : visible;
    const emptyMsg = total === 0
        ? 'No hay miembros asignados a este Tier actualmente.'
        : 'Ningún jugador coincide con la búsqueda.';

    return `
        <div class="bg-wine-950/60 border border-wine-900 rounded-2xl overflow-hidden shadow-xl" style="--tier-color:${escapeHtml(tier.color)}">
            <div class="px-6 py-4 flex items-center justify-between border-b border-wine-900/80" style="border-left: 6px solid ${escapeHtml(tier.color)}">
                <h3 class="text-lg font-bold text-white flex items-center gap-2">
                    <span>${escapeHtml(tier.name)}</span>
                    <span class="text-xs px-2 py-0.5 rounded-full bg-wine-900/80 text-wine-300 font-mono">${total} miembros</span>
                </h3>
            </div>

            ${showPodium ? renderPodium(visible.slice(0, 3), delta) : ''}

            <div class="p-4 overflow-x-auto">
                ${rows.length > 0 ? `
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
                            ${rows.map(m => renderTierRow(m, delta)).join('')}
                        </tbody>
                    </table>
                ` : (showPodium ? '' : `<p class="text-xs text-slate-500 italic py-2">${emptyMsg}</p>`)}
            </div>
        </div>
    `;
}

function renderTierListBlock(tier, total, visible, delta) {
    return `
        <div class="tierlist-row" style="--tier-color:${escapeHtml(tier.color)}">
            <div class="tierlist-label">
                <span>${escapeHtml(tier.name)}</span>
                <small>${total} miembros</small>
            </div>
            <div class="tierlist-members">
                ${visible.length > 0 ? visible.map(m => {
                    const u = m.user;
                    const uname = u.nickname || u.name;
                    const avatar = u.avatar || 'https://i.imgur.com/6VBx3io.png';
                    return `
                        <div class="tier-chip">
                            <img src="${escapeHtml(avatar)}" onerror="this.src='https://i.imgur.com/6VBx3io.png'" alt="">
                            <div class="min-w-0">
                                <span class="chip-name cursor-pointer" data-user="${escapeHtml(uname)}" onmouseenter="showUserCardFromEl(event, this)" onmouseleave="hideUserCard()">${escapeHtml(uname)}</span>
                                <span class="chip-pts">#${m.rank} · ${m.puntos} pts</span>
                            </div>
                            ${deltaBadge(delta[u.id])}
                        </div>
                    `;
                }).join('') : `<span class="text-xs text-slate-500 italic">${total === 0 ? 'Sin miembros en este Tier.' : 'Sin resultados.'}</span>`}
            </div>
        </div>
    `;
}

function renderPublicTiers() {
    renderTabsNavigation();
    updateTiersToolbar();
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
        container.innerHTML = emptyStateHTML('ph-ranking', 'Sin Tiers todavía', 'No hay Tiers creados para esta pestaña actualmente.');
        return;
    }

    const q = ((document.getElementById('tiers-search') || {}).value || '').trim().toLowerCase();
    const fam = (document.getElementById('tiers-family-filter') || {}).value || 'all';
    const filtering = !!q || fam !== 'all';
    const snaps = loadRankSnapshots();
    const today = new Date().toLocaleDateString('en-CA');

    const html = filteredTiers.map(tier => {
        const members = [];
        state.users.forEach(u => {
            const uname = u.nickname || u.name;
            if (!uname || uname.toLowerCase() === 'admin') return;
            const userRank = (u.tierRanks || []).find(tr => tr.tierId === tier.dbId);
            if (userRank) members.push({ user: u, puntos: userRank.puntos });
        });

        members.sort((a, b) => b.puntos - a.puntos);
        members.forEach((m, i) => { m.rank = i + 1; });

        const delta = computeRankDeltas(snaps, tier, members, today);

        const visible = members.filter(m => {
            const name = (m.user.nickname || m.user.name || '').toLowerCase();
            const famOk = fam === 'all' || (m.user.familia || 'Sin Familia / Ninguno') === fam;
            return (!q || name.includes(q)) && famOk;
        });

        return tiersViewMode === 'list'
            ? renderTierListBlock(tier, members.length, visible, delta)
            : renderTierTableBlock(tier, members.length, visible, delta, filtering);
    }).join('');

    saveRankSnapshots(snaps);
    container.innerHTML = html;
}

// ===== PORTADA: contadores animados, franja "EN VIVO" y Salón de la Fama =====
function countUp(el, to, ms = 1100) {
    if (!el) return;
    const from = parseInt(el.dataset.val || '0', 10);
    if (el.dataset.val !== undefined && from === to) return;
    el.dataset.val = to;
    const t0 = performance.now();
    (function tick(t) {
        const p = Math.min((t - t0) / ms, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(from + (to - from) * eased);
        if (p < 1) requestAnimationFrame(tick);
    })(t0);
}

function renderHomeStats() {
    const players = state.users.filter(u => (u.nickname || u.name || '').toLowerCase() !== 'admin').length;
    countUp(document.getElementById('stat-players'), players);
    countUp(document.getElementById('stat-modes'), state.tabs.length);
    countUp(document.getElementById('stat-families'), state.clans.filter(c => c !== 'Sin Familia / Ninguno').length);

    const banner = document.getElementById('live-banner');
    const title = document.getElementById('live-banner-title');
    const evt = state.activeEvent;
    if (banner) {
        const live = !!(evt && evt.status && evt.status !== 'SETUP');
        banner.classList.toggle('hidden', !live);
        if (live && title) title.textContent = evt.title;
    }

    renderHallOfFame();
}

function renderHallOfFame() {
    const c = document.getElementById('hof-container');
    if (!c) return;

    const champs = state.eventHistory.filter(e => getEventChampion(e)).slice(0, 6);
    if (champs.length === 0) {
        c.innerHTML = emptyStateHTML('ph-crown', 'Aún no hay campeones', 'Los ganadores de cada torneo aparecerán aquí. ¡El primer nombre puede ser el tuyo!');
        return;
    }

    c.innerHTML = `
        <div class="hof-grid">
            ${champs.map(e => {
                const ch = getEventChampion(e);
                return `
                    <div class="hof-card tilt">
                        <div class="hof-crown">🏆</div>
                        <div class="hof-avatar">
                            ${ch.isBot ? '<span class="text-3xl">🤖</span>' : `<img src="${escapeHtml(ch.avatar)}" onerror="this.src='https://i.imgur.com/6VBx3io.png'" alt="">`}
                        </div>
                        <div class="hof-name">${escapeHtml(ch.name)}</div>
                        <div class="hof-event">${escapeHtml(e.title)}</div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// ===== SORTEO DE CANCIÓN estilo ruleta =====
const songKeys = {};

function songKeyFor(evt, round) {
    return `${evt.id}|${round.roundNumber}|${round.songRollId || ''}|${round.currentSong}`;
}

function spinSongIfChanged(containerId, key, finalText) {
    const el = document.querySelector(`#${containerId} .song-text`);
    if (!el) return;

    const prev = songKeys[containerId];
    songKeys[containerId] = key;
    if (prev === undefined || prev === key) return; // primera vez o sin cambios

    const pool = state.activeEvent && state.activeEvent.songPool;
    if (!pool || pool.length < 2) return;

    let n = 0;
    el.classList.add('song-spinning');
    const timer = setInterval(() => {
        n++;
        if (n >= 22) {
            clearInterval(timer);
            el.textContent = finalText;
            el.classList.remove('song-spinning');
            el.classList.add('song-landed');
            setTimeout(() => el.classList.remove('song-landed'), 700);
            return;
        }
        el.textContent = pool[Math.floor(Math.random() * pool.length)];
    }, 70);
}

// ===== CONFETI al coronar un campeón =====
let lastChampionKey;

function fireConfetti() {
    if (typeof confetti !== 'function') return;
    const colors = ['#c92a52', '#f59e0b', '#ffffff', '#e6738c'];
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.65 }, colors });
    setTimeout(() => confetti({ particleCount: 80, angle: 60, spread: 70, origin: { x: 0 }, colors }), 250);
    setTimeout(() => confetti({ particleCount: 80, angle: 120, spread: 70, origin: { x: 1 }, colors }), 400);
}

function maybeCelebrate(evt) {
    const champ = getEventChampion(evt);
    const key = champ ? `${evt.id}|${champ.id}` : null;
    if (lastChampionKey === undefined) { lastChampionKey = key; return; }
    if (key && key !== lastChampionKey) fireConfetti();
    lastChampionKey = key;
}

// ===== EFECTOS: inclinación 3D en tarjetas y ripple en botones =====
function initFx() {
    if (window.matchMedia('(hover: hover)').matches) {
        document.addEventListener('pointermove', (e) => {
            const el = e.target.closest ? e.target.closest('.tilt') : null;
            document.querySelectorAll('.tilt.tilting').forEach(t => {
                if (t !== el) { t.classList.remove('tilting'); t.style.transform = ''; }
            });
            if (!el) return;
            const r = el.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width - 0.5;
            const y = (e.clientY - r.top) / r.height - 0.5;
            el.classList.add('tilting');
            el.style.transform = `perspective(800px) rotateX(${(-y * 6).toFixed(2)}deg) rotateY(${(x * 8).toFixed(2)}deg) translateY(-2px)`;
        });
    }

    document.addEventListener('pointerdown', (e) => {
        const btn = e.target.closest ? e.target.closest('button') : null;
        if (!btn || btn.classList.contains('carousel-dot')) return;
        const r = btn.getBoundingClientRect();
        const size = Math.max(r.width, r.height);
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (e.clientX - r.left - size / 2) + 'px';
        ripple.style.top = (e.clientY - r.top - size / 2) + 'px';
        btn.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    });
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

    initFx();

    document.addEventListener('click', (e) => {
        const btn = document.getElementById('mode-dropdown-btn');
        const menu = document.getElementById('mode-dropdown-menu');
        if (btn && menu && !btn.contains(e.target) && !menu.contains(e.target)) {
            menu.classList.add('hidden');
        }
    });

    fetchUsers().then(() => { renderPublicTiers(); renderHomeStats(); });
    fetchActiveEventFromDB().then(() => {
        renderHomeStats();
        if (state.activeEvent && document.getElementById('event-song-list-input')) {
            document.getElementById('event-song-list-input').value = (state.activeEvent.songPool || []).join('\n');
        }
    });
    navigateTo('view-home');
    startCarouselTimer();

    // Refresca el rol de la sesión: si el admin te nombra moderador con la página abierta, se activa solo
    setInterval(() => {
        if (state.currentUser && state.currentUser.id && !document.hidden) fetchUsers();
    }, 20000);

    // Sincroniza con el servidor cada 5 s: si el admin elimina o cambia el torneo,
    // todos (usuarios, moderadores) lo ven actualizado sin recargar
    setInterval(async () => {
        const evView = document.getElementById('view-events');
        const adminView = document.getElementById('view-tournaments'); // monitor del torneo (Control de Torneos)
        const onEvents = evView && !evView.classList.contains('hidden');
        const onAdmin = adminView && !adminView.classList.contains('hidden');
        const homeView = document.getElementById('view-home');
        const onHome = homeView && !homeView.classList.contains('hidden');
        if (!onEvents && !onAdmin && !onHome) return;

        const before = JSON.stringify(state.activeEvent);
        await fetchActiveEventFromDB();
        if (JSON.stringify(state.activeEvent) === before) return; // sin cambios: no se redibuja

        if (onEvents) renderUserEventsView(true);
        if (onAdmin) { renderTournamentAdmin(); syncTournamentSetupUI(); }
        if (onHome) renderHomeStats();
    }, 5000);
});
