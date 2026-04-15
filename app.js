let shrines = [];
let filteredCache = [];
let openShrineName = null;

function getPrefecture(place) {
    if (!place) return '';
    const parts = place.split(', ');
    return parts.length > 1 ? parts[1] : parts[0];
}

fetch('shrines_data.json')
    .then(r => r.json())
    .then(raw => {
        shrines = raw;
        updatePrefectures();
        render();
    })
    .catch(err => {
        console.error('Failed to load shrines_data.json:', err);
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

function highlight(text, query) {
    if (!text || !query) return text || '';
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text.replace(new RegExp(`(${escaped})`, 'gi'), '<span class="highlight">$1</span>');
}

// Returns true if the search query matches fields that live only in the detail panel
function hasHiddenMatch(r, query) {
    if (!query) return false;
    return [r.why_visit, r.deity_lore, r.shrine_lore].some(f => f && f.toLowerCase().includes(query));
}

function render() {
    const query = document.getElementById('sq').value.toLowerCase();
    const region = document.getElementById('rf').value;
    const prefecture = document.getElementById('pf').value;
    const type = document.getElementById('tf').value;
    const container = document.getElementById('results-list');

    const filtered = shrines.filter(r => {
        const prefName = getPrefecture(r.place);
        const matchSearch = [r.deity, r.shrine, r.place, r.why_visit, r.deity_lore, r.shrine_lore, r.prayer_focus, r.best_time_to_visit].some(f => f && f.toLowerCase().includes(query));
        const matchRegion = !region || r.region === region;
        const matchPref = !prefecture || prefName === prefecture;
        const matchType = !type || r.type === type;
        return matchSearch && matchRegion && matchPref && matchType;
    });

    filteredCache = filtered;
    document.getElementById('counter').textContent = `${filtered.length} Shrine${filtered.length === 1 ? '' : 's'}`;

    // Close panel if its shrine was filtered out
    if (openShrineName && !filtered.find(r => r.shrine === openShrineName)) {
        closePanel();
    }

    container.innerHTML = filtered.map((r, i) => {
        const hiddenMatch = hasHiddenMatch(r, query);
        const isSelected = r.shrine === openShrineName;
        return `
        <div class="shrine-card${isSelected ? ' selected' : ''}" onclick="openPanel(${i})">
            <div class="index">${String(i + 1).padStart(2, '0')}</div>

            <div class="deity-info">
                <span class="name">${highlight(r.deity, query)}</span>
                ${r.title !== '—' ? `<span class="identity">${highlight(r.title, query)}</span>` : ''}
                <div class="domain">${highlight(r.domain, query)}</div>
            </div>

            <div class="shrine-info">
                <span class="shrine-name">${highlight(r.shrine, query)}</span>
                <span class="location">${highlight(r.place, query)}</span>
                <div><span class="region-tag">${r.region}</span></div>
                ${hiddenMatch ? `<span class="match-badge">+ details match</span>` : ''}
            </div>

            <div class="prayer-col">${r.prayer_focus ? highlight(r.prayer_focus, query) : '<span class="muted-dash">—</span>'}</div>

            <div class="time-col">${r.best_time_to_visit ? highlight(r.best_time_to_visit, query) : '<span class="muted-dash">—</span>'}</div>

            <div class="type-pill ${getTypeClass(r.type)}">${r.type}</div>
        </div>`;
    }).join('');
}

function openPanel(idx) {
    const r = filteredCache[idx];
    const query = document.getElementById('sq').value;

    openShrineName = r.shrine;

    document.getElementById('detail-content').innerHTML = `
        <span class="panel-shrine-name">${r.shrine}</span>
        <span class="panel-location">${r.place}</span>
        ${r.why_visit ? `
            <div class="panel-section">
                <strong>Shrine Notes</strong>
                <p>${highlight(r.why_visit, query)}</p>
            </div>` : ''}
        ${r.deity_lore ? `
            <div class="panel-section">
                <strong>Deity Lore</strong>
                <p>${highlight(r.deity_lore, query)}</p>
            </div>` : ''}
        ${r.shrine_lore ? `
            <div class="panel-section">
                <strong>Shrine Lore</strong>
                <p>${highlight(r.shrine_lore, query)}</p>
            </div>` : ''}
    `;

    document.getElementById('detail-panel').classList.add('open');
    document.getElementById('detail-overlay').classList.add('visible');

    // Sync selected state on all cards
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
