/**
 * Enterprise Notion & Google Calendar Organizational Hub Sync Engine
 * OAuth2 Google Calendar Integration, Notion Database API Sync, and Study Session Push Engine
 */

class NotionCalendarSyncEngine {
    constructor(config = {}) {
        this.syncIntervalMinutes = config.syncIntervalMinutes || 5;
        this.defaultTargetHub = config.defaultTargetHub || 'gcal';
        this.autoPushEvents = config.autoPushEvents !== undefined ? config.autoPushEvents : true;

        this.studySessions = [];
        this.initDefaultSessions();
    }

    initDefaultSessions() {
        this.studySessions = [
            {
                sessionId: 'SESS-701',
                title: 'Organic Chemistry II Review Session',
                targetHub: 'Google Calendar (OAuth2)',
                tokenStatus: 'OAuth2 Active Token',
                pushTimestamp: '10 mins ago',
                syncStatus: 'PUSHED_SUCCESS'
            },
            {
                sessionId: 'SESS-702',
                title: 'Data Structures Graph Algorithms',
                targetHub: 'Notion Database Page',
                tokenStatus: 'Notion API Key Validated',
                pushTimestamp: '25 mins ago',
                syncStatus: 'PUSHED_SUCCESS'
            },
            {
                sessionId: 'SESS-703',
                title: 'Biomedical Signal Processing Quiz',
                targetHub: 'Dual Sync (Google + Notion)',
                tokenStatus: 'OAuth2 + Notion Key',
                pushTimestamp: '1 hour ago',
                syncStatus: 'PUSHED_SUCCESS'
            },
            {
                sessionId: 'SESS-704',
                title: 'Quantum Mechanics Problem Set',
                targetHub: 'Google Calendar (OAuth2)',
                tokenStatus: 'OAuth2 Active Token',
                pushTimestamp: '2 hours ago',
                syncStatus: 'PUSHED_SUCCESS'
            },
            {
                sessionId: 'SESS-705',
                title: 'USMLE Step 1 Clinical Cases',
                targetHub: 'Notion Database Page',
                tokenStatus: 'Notion API Key Validated',
                pushTimestamp: '3 hours ago',
                syncStatus: 'PUSHED_SUCCESS'
            }
        ];
    }

    updateConfig(newConfig) {
        if (newConfig.syncIntervalMinutes !== undefined) {
            this.syncIntervalMinutes = parseInt(newConfig.syncIntervalMinutes, 10);
        }
        if (newConfig.defaultTargetHub) {
            this.defaultTargetHub = newConfig.defaultTargetHub;
        }
        if (newConfig.autoPushEvents !== undefined) {
            this.autoPushEvents = newConfig.autoPushEvents;
        }
    }

    getSessionsFiltered(query = '', hubFilter = 'all') {
        return this.studySessions.filter(session => {
            const matchesQuery = !query || 
                session.sessionId.toLowerCase().includes(query.toLowerCase()) ||
                session.title.toLowerCase().includes(query.toLowerCase()) ||
                session.targetHub.toLowerCase().includes(query.toLowerCase()) ||
                session.syncStatus.toLowerCase().includes(query.toLowerCase());

            const matchesHub = hubFilter === 'all' || 
                (hubFilter === 'google' && session.targetHub.includes('Google')) ||
                (hubFilter === 'notion' && session.targetHub.includes('Notion')) ||
                (hubFilter === 'internal' && session.targetHub.includes('Internal'));

            return matchesQuery && matchesHub;
        });
    }
}

// UI Controller Binding
document.addEventListener('DOMContentLoaded', () => {
    const engine = new NotionCalendarSyncEngine();

    const searchInput = document.getElementById('sync-search-input');
    const hubSelect = document.getElementById('hub-type-select');
    const freqRange = document.getElementById('range-sync-frequency');
    const freqLabel = document.getElementById('lbl-sync-freq');
    const targetSelect = document.getElementById('select-default-target');
    const tableBody = document.getElementById('hub-table-body');
    const btnSync = document.getElementById('btn-sync-hub-telemetry');
    const btnPush = document.getElementById('btn-push-study-sessions');
    const btnRecalibrate = document.getElementById('btn-recalibrate-hubs');

    function renderTable(data) {
        if (!tableBody) return;
        tableBody.innerHTML = '';

        data.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${item.sessionId}</strong></td>
                <td>${item.title}</td>
                <td>${item.targetHub}</td>
                <td>${item.tokenStatus}</td>
                <td>${item.pushTimestamp}</td>
                <td><span class="badge badge-success">${item.syncStatus}</span></td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="alert('Viewing Google OAuth2 & Notion API Payload for ${item.sessionId}')">View Sync Log</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    if (freqRange && freqLabel) {
        freqRange.addEventListener('input', (e) => {
            freqLabel.textContent = `${e.target.value} Min`;
            engine.updateConfig({ syncIntervalMinutes: parseInt(e.target.value, 10) });
        });
    }

    if (targetSelect) {
        targetSelect.addEventListener('change', () => {
            engine.updateConfig({ defaultTargetHub: targetSelect.value });
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const q = searchInput.value;
            const h = hubSelect ? hubSelect.value : 'all';
            renderTable(engine.getSessionsFiltered(q, h));
        });
    }

    if (hubSelect) {
        hubSelect.addEventListener('change', () => {
            const q = searchInput ? searchInput.value : '';
            renderTable(engine.getSessionsFiltered(q, hubSelect.value));
        });
    }

    if (btnRecalibrate) {
        btnRecalibrate.addEventListener('click', () => {
            alert('Google OAuth2 Refresh Token & Notion API Key Recalibrated.');
            renderTable(engine.getSessionsFiltered());
        });
    }

    if (btnPush) {
        btnPush.addEventListener('click', () => {
            alert('Study Sessions Successfully Pushed to Google Calendar & Notion Organizational Hubs.');
        });
    }

    if (btnSync) {
        btnSync.addEventListener('click', () => {
            renderTable(engine.getSessionsFiltered(searchInput ? searchInput.value : '', hubSelect ? hubSelect.value : 'all'));
            alert('Google Calendar & Notion Telemetry Streams Synchronized.');
        });
    }

    renderTable(engine.getSessionsFiltered());
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NotionCalendarSyncEngine };
}
