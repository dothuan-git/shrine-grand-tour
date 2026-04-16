let shrines = [];
let eventsMap = {};
let detailMap = {};
let filteredCache = [];
let openShrineName = null;
let isFirstRender = true;

const EVENT_CATEGORY_LABEL = {
    public_witness: 'Public Ceremony',
    pilgrimage_experience: 'Pilgrimage Atmosphere'
};
const EVENT_CATEGORY_CLASS = {
    public_witness: 'ev-public',
    pilgrimage_experience: 'ev-pilgrimage'
};

function getPrefecture(location) {
    if (!location) return '';
    const parts = location.split(', ');
    return parts.length > 1 ? parts[1] : parts[0];
}

Promise.all([
    fetch('shrines_meta.json').then(r => r.json()),
    fetch('shrines_detail.json').then(r => r.json()).catch(() => []),
    fetch('shrine_events.json').then(r => r.json()).catch(() => [])
]).then(([metaData, detailData, eventData]) => {
    shrines = metaData;
    detailMap = Object.fromEntries(detailData.map(d => [d.shrine_id, d]));
    eventsMap = Object.fromEntries(eventData.map(e => [e.id, { shrine: e.shrine, deity: e.deity, events: e.events }]));
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
        .map(r => getPrefecture(r.location))
    )].sort();

    pfSelect.innerHTML = '<option value="">All Prefectures</option>' +
        prefectures.map(p => `<option value="${p}">${p}</option>`).join('');

    if (prefectures.includes(currentVal)) pfSelect.value = currentVal;
}

function getTypeClass(t) {
    const map = { Sohonsha: 'tH', Complex: 'tM', Major: 'tJ', Notable: 'tN', Temple: 'tT' };
    return map[t] || 'tN';
}

function highlight(text, query) {
    if (!text || !query) return text || '';
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text.replace(new RegExp(`(${escaped})`, 'gi'), '<span class="highlight">$1</span>');
}

function getEvents(id) {
    return eventsMap[id]?.events || [];
}

function getEventFields(id) {
    return getEvents(id).flatMap(ev =>
        [ev.name, ev.time, ev.origin, ev.meaning, ev.ritual, ev.prayer, ev.type?.notes]
    );
}

function hasHiddenMatch(r, query) {
    if (!query) return false;
    const d = detailMap[r.id] || {};
    return [...[d.why_visit, d.deity_lore, d.shrine_lore], ...getEventFields(r.id)]
        .some(f => f && f.toLowerCase().includes(query));
}

function render() {
    const query = document.getElementById('sq').value.toLowerCase();
    const region = document.getElementById('rf').value;
    const prefecture = document.getElementById('pf').value;
    const type = document.getElementById('tf').value;
    const container = document.getElementById('results-list');

    const filtered = shrines.filter(r => {
        const prefName = getPrefecture(r.location);
        const d = detailMap[r.id] || {};
        const allFields = [
            ...r.deities.flatMap(de => [de.name, de.kanji, de.domain, de.title]),
            r.shrine, r.location, d.prayer_focus, d.best_time_to_visit,
            d.why_visit, d.deity_lore, d.shrine_lore,
            ...getEventFields(r.id)
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

    container.style.opacity = '0';
    container.innerHTML = filtered.map((r, i) => {
        const hiddenMatch = hasHiddenMatch(r, query);
        const isSelected = r.shrine === openShrineName;
        const d = detailMap[r.id] || {};
        const delay = isFirstRender ? `style="animation-delay:${Math.min(i * 0.04, 0.6)}s"` : '';
        return `
        <div class="shrine-card card-enter${isSelected ? ' selected' : ''}" ${delay} onclick="openPanel(${i})">
            <div class="index">${String(i + 1).padStart(2, '0')}</div>

            <div class="deity-info">
                <span class="name">${highlight(r.deities[0].name, query)}</span>
                ${r.deities[0].kanji ? `<span class="deity-kanji">${highlight(r.deities[0].kanji, query)}</span>` : ''}
                ${r.deities[0].title ? `<span class="identity">${highlight(r.deities[0].title, query)}</span>` : ''}
                <div class="domain">${highlight(r.deities.map(de => de.domain).filter(Boolean).join(' · '), query)}</div>
            </div>

            <div class="shrine-info">
                <span class="shrine-name">${highlight(r.shrine, query)}</span>
                <span class="location">${highlight(r.location, query)}</span>
                <div><span class="region-tag">${r.region}</span></div>
${hiddenMatch ? `<span class="match-badge">+ details match</span>` : ''}
            </div>

            <div class="prayer-col"><span class="col-label">Prayer Focus</span>${d.prayer_focus ? highlight(d.prayer_focus, query) : '<span class="muted-dash">—</span>'}</div>

            <div class="time-col"><span class="col-label">Best Time to Visit</span>${d.best_time_to_visit ? highlight(d.best_time_to_visit, query) : '<span class="muted-dash">—</span>'}</div>

            <div class="type-pill ${getTypeClass(r.type)}">${r.type}</div>
        </div>`;
    }).join('');

    requestAnimationFrame(() => {
        container.style.transition = 'opacity 0.2s ease';
        container.style.opacity = '1';
    });
    isFirstRender = false;
}

function panelSection(label, text, query) {
    if (!text) return '';
    return `
        <div class="panel-section">
            <strong>${label}</strong>
            <p>${highlight(text, query)}</p>
        </div>`;
}

function buildEventsHTML(id, query) {
    const events = getEvents(id);
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

    const detailContent = document.getElementById('detail-content');
    const eventMeta = eventsMap[r.id];
    const shrineName = eventMeta?.shrine || r.shrine;
    const d = detailMap[r.id] || {};

    detailContent.classList.remove('panel-fade-in');
    detailContent.innerHTML = `
        <span class="panel-shrine-name">${shrineName}</span>
        <span class="panel-location">${r.location}</span>
        <div class="panel-grid">
            ${panelSection('Shrine Notes', d.why_visit, query)}
            ${panelSection('Deity Lore', d.deity_lore, query)}
            ${panelSection('Shrine Lore', d.shrine_lore, query)}
        </div>
        ${buildEventsHTML(r.id, query)}
    `;
    void detailContent.offsetWidth;
    detailContent.classList.add('panel-fade-in');

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
