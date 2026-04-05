let shrines = [];

// Helper to extract prefecture name from place string
function getPrefecture(place) {
    if (!place) return '';
    const parts = place.split(', ');
    return parts.length > 1 ? parts[1] : parts[0];
}

fetch('shrines_v2.json')
    .then(r => r.json())
    .then(raw => {
        shrines = raw;
        updatePrefectures();
        render();
    })
    .catch(err => {
        console.error('Failed to load shrines_v2.json:', err);
        document.getElementById('results-list').innerHTML = '<div style="padding: 2rem; color: red;">Failed to load data. Make sure you\'re running this via a local server (VS Code Live Server or npx serve), not directly via file://</div>';
    });

function updatePrefectures() {
    const region = document.getElementById('rf').value;
    const pfSelect = document.getElementById('pf');
    const currentVal = pfSelect.value;

    // Get unique prefectures from filtered shrines
    const prefectures = [...new Set(shrines
        .filter(r => !region || r.region === region)
        .map(r => getPrefecture(r.place))
    )].sort();

    pfSelect.innerHTML = '<option value="">All Prefectures</option>' +
        prefectures.map(p => `<option value="${p}">${p}</option>`).join('');

    if (prefectures.includes(currentVal)) pfSelect.value = currentVal;
}

function getTypeClass(t) {
    const map = {Sohonsha:'tH', Complex:'tM', Major:'tJ', Notable:'tN', Temple:'tT'};
    return map[t] || 'tN';
}

function highlight(text, query) {
    if (!text || !query) return text;
    const re = new RegExp(`(${query})`, 'gi');
    return text.replace(re, `<span class="highlight">$1</span>`);
}

function render() {
    const query = document.getElementById('sq').value.toLowerCase();
    const region = document.getElementById('rf').value;
    const prefecture = document.getElementById('pf').value;
    const type = document.getElementById('tf').value;
    const container = document.getElementById('results-list');

    const filtered = shrines.filter(r => {
        const prefName = getPrefecture(r.place);
        const matchSearch = [r.deity, r.shrine, r.place, r.why_visit, r.deity_lore, r.shrine_lore].some(f => f && f.toLowerCase().includes(query));
        const matchRegion = !region || r.region === region;
        const matchPref = !prefecture || prefName === prefecture;
        const matchType = !type || r.type === type;
        return matchSearch && matchRegion && matchPref && matchType;
    });

    document.getElementById('counter').textContent = `${filtered.length} Shrine${filtered.length === 1 ? '' : 's'}`;

    container.innerHTML = filtered.map((r, i) => `
        <div class="shrine-card">
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
            </div>

            <div class="note-box">
                <strong>Shrine Notes</strong>
                ${highlight(r.why_visit, query)}
            </div>

            <div class="lore-box">
                <strong>Deity Lore</strong>
                ${highlight(r.deity_lore, query)}
                ${r.shrine_lore ? `<strong style="margin-top:1rem; display:block;">Shrine Lore</strong>${highlight(r.shrine_lore, query)}` : ''}
            </div>

            <div class="type-pill ${getTypeClass(r.type)}">${r.type}</div>
        </div>
    `).join('');
}
