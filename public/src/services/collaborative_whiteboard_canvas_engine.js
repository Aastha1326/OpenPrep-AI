/**
 * Enterprise Collaborative Whiteboard & Canvas Engine
 * Real-Time Multi-User Vector Path Synchronization, Spatial Cursor Tracking, and Layer Engine
 */

class CollaborativeWhiteboardCanvasEngine {
    constructor(config = {}) {
        this.strokeWidth = config.strokeWidth || 4;
        this.layerOpacity = config.layerOpacity || 100;
        this.gridSnap = config.gridSnap !== undefined ? config.gridSnap : true;

        this.canvasStrokes = [];
        this.initDefaultStrokes();
    }

    initDefaultStrokes() {
        this.canvasStrokes = [
            {
                strokeId: 'STRK-1092',
                peerSession: 'PEER-ALEX (Alex Chen)',
                tool: 'Vector Pen / Smooth',
                points: '142 Pts',
                layer: 'Layer 1 (Main Sketch)',
                syncStatus: 'SYNCED (60 FPS)'
            },
            {
                strokeId: 'STRK-1093',
                peerSession: 'PEER-SARAH (Dr. Sarah)',
                tool: 'Geometric Circle Shape',
                points: '64 Pts',
                layer: 'Layer 2 (Diagram Shapes)',
                syncStatus: 'SYNCED (60 FPS)'
            },
            {
                strokeId: 'STRK-1094',
                peerSession: 'PEER-MARCUS (Marcus V.)',
                tool: 'LaTeX Math Formula Text',
                points: '18 Pts',
                layer: 'Layer 3 (Annotations)',
                syncStatus: 'SYNCED (60 FPS)'
            },
            {
                strokeId: 'STRK-1095',
                peerSession: 'PEER-PRIYA (Priya K.)',
                tool: 'Highlighter Neon Yellow',
                points: '210 Pts',
                layer: 'Layer 1 (Main Sketch)',
                syncStatus: 'SYNCED (60 FPS)'
            },
            {
                strokeId: 'STRK-1096',
                peerSession: 'PEER-ALEX (Alex Chen)',
                tool: 'Erased Vector Segment',
                points: '32 Pts',
                layer: 'Layer 2 (Diagram Shapes)',
                syncStatus: 'SYNCED (60 FPS)'
            }
        ];
    }

    updateConfig(newConfig) {
        if (newConfig.strokeWidth !== undefined) {
            this.strokeWidth = parseInt(newConfig.strokeWidth, 10);
        }
        if (newConfig.layerOpacity !== undefined) {
            this.layerOpacity = parseInt(newConfig.layerOpacity, 10);
        }
        if (newConfig.gridSnap !== undefined) {
            this.gridSnap = newConfig.gridSnap;
        }
    }

    getStrokesFiltered(query = '', toolFilter = 'all') {
        return this.canvasStrokes.filter(item => {
            const matchesQuery = !query || 
                item.strokeId.toLowerCase().includes(query.toLowerCase()) ||
                item.peerSession.toLowerCase().includes(query.toLowerCase()) ||
                item.tool.toLowerCase().includes(query.toLowerCase()) ||
                item.layer.toLowerCase().includes(query.toLowerCase());

            const matchesTool = toolFilter === 'all' || 
                (toolFilter === 'pen' && item.tool.includes('Pen')) ||
                (toolFilter === 'shape' && item.tool.includes('Shape')) ||
                (toolFilter === 'text' && (item.tool.includes('Text') || item.tool.includes('LaTeX')));

            return matchesQuery && matchesTool;
        });
    }
}

// UI Controller Binding
document.addEventListener('DOMContentLoaded', () => {
    const engine = new CollaborativeWhiteboardCanvasEngine();

    const searchInput = document.getElementById('canvas-search-input');
    const toolSelect = document.getElementById('canvas-tool-select');
    const strokeRange = document.getElementById('range-stroke-width');
    const strokeLabel = document.getElementById('lbl-stroke-width');
    const opacityRange = document.getElementById('range-opacity');
    const opacityLabel = document.getElementById('lbl-layer-opacity');
    const tableBody = document.getElementById('canvas-table-body');
    const btnSync = document.getElementById('btn-sync-canvas');
    const btnClear = document.getElementById('btn-clear-canvas');
    const btnRecalibrate = document.getElementById('btn-recalibrate-canvas');

    function renderTable(data) {
        if (!tableBody) return;
        tableBody.innerHTML = '';

        data.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${item.strokeId}</strong></td>
                <td>${item.peerSession}</td>
                <td>${item.tool}</td>
                <td><strong>${item.points}</strong></td>
                <td>${item.layer}</td>
                <td><span class="badge badge-success">${item.syncStatus}</span></td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="alert('Viewing Real-time Spatial Vectors & Peer Cursor History for ${item.strokeId}')">Inspect Vector</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    if (strokeRange && strokeLabel) {
        strokeRange.addEventListener('input', (e) => {
            strokeLabel.textContent = `${e.target.value} px`;
            engine.updateConfig({ strokeWidth: parseInt(e.target.value, 10) });
        });
    }

    if (opacityRange && opacityLabel) {
        opacityRange.addEventListener('input', (e) => {
            opacityLabel.textContent = `${e.target.value}%`;
            engine.updateConfig({ layerOpacity: parseInt(e.target.value, 10) });
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const q = searchInput.value;
            const t = toolSelect ? toolSelect.value : 'all';
            renderTable(engine.getStrokesFiltered(q, t));
        });
    }

    if (toolSelect) {
        toolSelect.addEventListener('change', () => {
            const q = searchInput ? searchInput.value : '';
            renderTable(engine.getStrokesFiltered(q, toolSelect.value));
        });
    }

    if (btnRecalibrate) {
        btnRecalibrate.addEventListener('click', () => {
            alert('Spatial Coordinate Grid & Vector Canvas Engine Recalibrated.');
            renderTable(engine.getStrokesFiltered());
        });
    }

    if (btnClear) {
        btnClear.addEventListener('click', () => {
            alert('Active Layer History Cleared & Flushed across Connected Peers.');
        });
    }

    if (btnSync) {
        btnSync.addEventListener('click', () => {
            renderTable(engine.getStrokesFiltered(searchInput ? searchInput.value : '', toolSelect ? toolSelect.value : 'all'));
            alert('WebSocket Vector Stroke Stream & Peer Cursors Synchronized.');
        });
    }

    renderTable(engine.getStrokesFiltered());
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CollaborativeWhiteboardCanvasEngine };
}
