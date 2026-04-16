let shrines = [];
let eventsMap = {};
let filteredCache = [];
let openShrineName = null;

const EVENT_CATEGORY_LABEL = {
    public_witness: 'Public Ceremony',
    pilgrimage_experience: 'Pilgrimage Atmosphere'
};
const EVENT_CATEGORY_CLASS = {
    public_witness: 'ev-public',
    pilgrimage_experience: 'ev-pilgrimage'
};

function getPrefecture(place) {
    if (!place) return '';
    const parts = place.split(', ');
    return parts.length > 1 ? parts[1] : parts[0];
}

Promise.all([
    fetch('shrines_data.json').then(r => r.json()),
    fetch('shrine_events.json').then(r => r.json()).catch(() => [])
]).then(([shrineData, eventData]) => {
    shrines = shrineData;
    eventsMap = Object.fromEntries(eventData.map(e => [e.shrine, e.events]));
    updatePrefectures();
    render();
}).catch(err => {
    console.error('Failed to load data:', err);
    document.getElementById('results-list').innerHTML = '<div style="padding: 2rem; color: red;">Failed to load data. Make sure you\'re running this via a local server (VS Code Live Server or npx serve), not directly via file://</div>';
});

document.addEventListener('keydown', e => { if (e.key === 'Escape') closePanel(); });

function updatePrefectures() {
    const region = document.getElementById('rf').value;
    const pfSelect = document.getElementById('pf');
    const currentVal = pfSelect.value;

    const prefectures = [...new Set(shrines
        .filter(r => !region || r.region === region)
        .map(r => getPrefecture(r.place))
    )].sort();

    pfSelect.innerHTML = '<option value="">All Prefectures</option>' +
        prefectures.map(p => `<option value="${p}">${p}</option>`).join('');

    if (prefectures.includes(currentVal)) pfSelect.value = currentVal;
}

function getTypeClass(t) {
    const map = { Sohonsha: 'tH', Complex: 'tM', Major: 'tJ', Notable: 'tN', Temple: 'tT' };
    return map[t] || 'tN';
}

function parseDeity(deity) {
    if (!deity) return { romaji: deity, kanji: null };
    const match = deity.match(/^(.+?)\s*\(([^)]+)\)/);
    return match ? { romaji: match[1].trim(), kanji: match[2].trim() } : { romaji: deity, kanji: null };
}

function highlight(text, query) {
    if (!text || !query) return text || '';
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text.replace(new RegExp(`(${escaped})`, 'gi'), '<span class="highlight">$1</span>');
}

function getEventFields(shrine) {
    return (eventsMap[shrine] || []).flatMap(ev =>
        [ev.name, ev.time, ev.origin, ev.meaning, ev.ritual, ev.prayer, ev.type?.notes]
    );
}

function hasHiddenMatch(r, query) {
    if (!query) return false;
    return [...[r.why_visit, r.deity_lore, r.shrine_lore], ...getEventFields(r.shrine)]
        .some(f => f && f.toLowerCase().includes(query));
}

function render() {
    const query = document.getElementById('sq').value.toLowerCase();
    const region = document.getElementById('rf').value;
    const prefecture = document.getElementById('pf').value;
    const type = document.getElementById('tf').value;
    const container = document.getElementById('results-list');

    const filtered = shrines.filter(r => {
        const prefName = getPrefecture(r.place);
        const allFields = [
            r.deity, r.shrine, r.place, r.prayer_focus, r.best_time_to_visit,
            r.why_visit, r.deity_lore, r.shrine_lore,
            ...getEventFields(r.shrine)
        ];
        const matchSearch = allFields.some(f => f && f.toLowerCase().includes(query));
        const matchRegion = !region || r.region === region;
        const matchPref = !prefecture || prefName === prefecture;
        const matchType = !type || r.type === type;
        return matchSearch && matchRegion && matchPref && matchType;
    });

    filteredCache = filtered;
    document.getElementById('counter').textContent = `${filtered.length} Shrine${filtered.length === 1 ? '' : 's'}`;

    if (openShrineName && !filtered.find(r => r.shrine === openShrineName)) closePanel();

    container.innerHTML = filtered.map((r, i) => {
        const hiddenMatch = hasHiddenMatch(r, query);
        const isSelected = r.shrine === openShrineName;
        const { romaji, kanji } = parseDeity(r.deity);
        return `
        <div class="shrine-card${isSelected ? ' selected' : ''}" onclick="openPanel(${i})">
            <div class="index">${String(i + 1).padStart(2, '0')}</div>

            <div class="deity-info">
                <span class="name">${highlight(romaji, query)}</span>
                ${kanji ? `<span class="deity-kanji">${highlight(kanji, query)}</span>` : ''}
                ${r.title !== '—' ? `<span class="identity">${highlight(r.title, query)}</span>` : ''}
                <div class="domain">${highlight(r.domain, query)}</div>
            </div>

            <div class="shrine-info">
                <span class="shrine-name">${highlight(r.shrine, query)}</span>
                <span class="location">${highlight(r.place, query)}</span>
                <div><span class="region-tag">${r.region}</span></div>
${hiddenMatch ? `<span class="match-badge">+ details match</span>` : ''}
            </div>

            <div class="prayer-col"><span class="col-label">Prayer Focus</span>${r.prayer_focus ? highlight(r.prayer_focus, query) : '<span class="muted-dash">—</span>'}</div>

            <div class="time-col"><span class="col-label">Best Time to Visit</span>${r.best_time_to_visit ? highlight(r.best_time_to_visit, query) : '<span class="muted-dash">—</span>'}</div>

            <div class="type-pill ${getTypeClass(r.type)}">${r.type}</div>
        </div>`;
    }).join('');
}

function panelSection(label, text, query) {
    if (!text) return '';
    return `
        <div class="panel-section">
            <strong>${label}</strong>
            <p>${highlight(text, query)}</p>
        </div>`;
}

function buildEventsHTML(shrine, query) {
    const events = eventsMap[shrine] || [];
    if (!events.length) return '';

    const eventRows = events.map((ev, i) => `
        <div class="event-row">
            <button class="event-toggle" onclick="toggleEvent(this)" aria-expanded="false">
                <div class="event-toggle-main">
                    <span class="event-name">${highlight(ev.name, query)}</span>
                    <div class="event-meta">
                        <span class="event-time">${highlight(ev.time, query)}</span>
                        <span class="event-category ${EVENT_CATEGORY_CLASS[ev.type?.category] || ''}">
                            ${EVENT_CATEGORY_LABEL[ev.type?.category] || ev.type?.category || ''}
                        </span>
                    </div>
                </div>
                <span class="event-chevron">&#x25BE;</span>
            </button>
            <div class="event-body">
                <div class="event-body-inner">
                    ${panelSection('Origin', ev.origin, query)}
                    ${panelSection('Meaning', ev.meaning, query)}
                    ${panelSection('Ritual', ev.ritual, query)}
                    ${panelSection('Prayer', ev.prayer, query)}
                    ${panelSection('Visitor Notes', ev.type?.notes, query)}
                </div>
            </div>
        </div>`).join('');

    return `
        <div class="events-section">
            <div class="events-section-title">Festivals &amp; Events</div>
            ${eventRows}
        </div>`;
}

function toggleEvent(btn) {
    const row = btn.closest('.event-row');
    const body = row.querySelector('.event-body');
    const isOpen = row.classList.contains('open');

    if (isOpen) {
        body.style.maxHeight = body.scrollHeight + 'px';
        requestAnimationFrame(() => { body.style.maxHeight = '0'; });
        row.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
    } else {
        body.style.maxHeight = body.scrollHeight + 'px';
        row.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
        body.addEventListener('transitionend', () => {
            if (row.classList.contains('open')) body.style.maxHeight = 'none';
        }, { once: true });
    }
}

function openPanel(idx) {
    const r = filteredCache[idx];
    const query = document.getElementById('sq').value;
    openShrineName = r.shrine;

    document.getElementById('detail-content').innerHTML = `
        <span class="panel-shrine-name">${r.shrine}</span>
        <span class="panel-location">${r.place}</span>
        <div class="panel-grid">
            ${panelSection('Shrine Notes', r.why_visit, query)}
            ${panelSection('Deity Lore', r.deity_lore, query)}
            ${panelSection('Shrine Lore', r.shrine_lore, query)}
        </div>
        ${buildEventsHTML(r.shrine, query)}
    `;

    document.getElementById('detail-panel').classList.add('open');
    document.getElementById('detail-overlay').classList.add('visible');

    document.querySelectorAll('.shrine-card').forEach((card, i) => {
        card.classList.toggle('selected', filteredCache[i]?.shrine === openShrineName);
    });
}

function closePanel() {
    openShrineName = null;
    document.getElementById('detail-panel').classList.remove('open');
    document.getElementById('detail-overlay').classList.remove('visible');
    document.querySelectorAll('.shrine-card').forEach(c => c.classList.remove('selected'));
}
