/**
 * Enterprise Exam Simulation & AI Proctoring Engine
 * Biometric Gaze Tracking, Integrity Anomaly Telemetry, and Active Session Surveillance Engine
 */

class ExamSimulationProctoringEngine {
    constructor(config = {}) {
        this.gazeSensitivity = config.gazeSensitivity || 85;
        this.audioThresholdDb = config.audioThresholdDb || 45;
        this.autoTerminate = config.autoTerminate !== undefined ? config.autoTerminate : true;

        this.examSessions = [];
        this.initDefaultSessions();
    }

    initDefaultSessions() {
        this.examSessions = [
            {
                sessionId: 'SESS-801',
                candidateId: 'CAND-9042',
                examModule: 'Advanced AI & Machine Learning Cert',
                biometricScore: 99.4,
                gazeDrift: '0.2s Normal',
                riskStatus: 'VERIFIED',
                proctorStatus: 'Monitoring Active'
            },
            {
                sessionId: 'SESS-802',
                candidateId: 'CAND-4180',
                examModule: 'Quantum Computing Fundamentals',
                biometricScore: 68.5,
                gazeDrift: '4.8s Secondary Display',
                riskStatus: 'HIGH RISK FLAG',
                proctorStatus: 'Flagged for Review'
            },
            {
                sessionId: 'SESS-803',
                candidateId: 'CAND-7712',
                examModule: 'Full-Stack Enterprise Architecture',
                biometricScore: 84.1,
                gazeDrift: '2.1s Off-Screen Audio',
                riskStatus: 'MODERATE FLAG',
                proctorStatus: 'Under Observation'
            },
            {
                sessionId: 'SESS-804',
                candidateId: 'CAND-3091',
                examModule: 'Biomedical Data Science Exam',
                biometricScore: 97.8,
                gazeDrift: '0.4s Normal',
                riskStatus: 'VERIFIED',
                proctorStatus: 'Monitoring Active'
            },
            {
                sessionId: 'SESS-805',
                candidateId: 'CAND-1104',
                examModule: 'Cybersecurity & Ethical Hacking',
                biometricScore: 54.0,
                gazeDrift: '6.2s Tab Switch Anomaly',
                riskStatus: 'HIGH RISK FLAG',
                proctorStatus: 'Session Paused'
            }
        ];
    }

    evaluateIntegrityRisk(biometricScore) {
        if (biometricScore < 70.0) {
            return { risk: 'HIGH RISK FLAG', badgeClass: 'badge-danger' };
        } else if (biometricScore < 90.0) {
            return { risk: 'MODERATE FLAG', badgeClass: 'badge-warning' };
        } else {
            return { risk: 'VERIFIED', badgeClass: 'badge-success' };
        }
    }

    updateConfig(newConfig) {
        if (newConfig.gazeSensitivity !== undefined) {
            this.gazeSensitivity = parseInt(newConfig.gazeSensitivity, 10);
        }
        if (newConfig.audioThresholdDb !== undefined) {
            this.audioThresholdDb = parseInt(newConfig.audioThresholdDb, 10);
        }
        if (newConfig.autoTerminate !== undefined) {
            this.autoTerminate = newConfig.autoTerminate;
        }
    }

    getSessionsFiltered(query = '', riskFilter = 'all') {
        return this.examSessions.filter(session => {
            const matchesQuery = !query || 
                session.sessionId.toLowerCase().includes(query.toLowerCase()) ||
                session.candidateId.toLowerCase().includes(query.toLowerCase()) ||
                session.examModule.toLowerCase().includes(query.toLowerCase()) ||
                session.riskStatus.toLowerCase().includes(query.toLowerCase());

            const matchesRisk = riskFilter === 'all' || 
                (riskFilter === 'high-risk' && session.riskStatus.includes('HIGH')) ||
                (riskFilter === 'moderate-risk' && session.riskStatus.includes('MODERATE')) ||
                (riskFilter === 'verified' && session.riskStatus.includes('VERIFIED'));

            return matchesQuery && matchesRisk;
        });
    }
}

// UI Controller Binding
document.addEventListener('DOMContentLoaded', () => {
    const engine = new ExamSimulationProctoringEngine();

    const searchInput = document.getElementById('exam-search-input');
    const riskSelect = document.getElementById('integrity-level-select');
    const gazeRange = document.getElementById('range-gaze-sensitivity');
    const gazeLabel = document.getElementById('lbl-gaze-sens');
    const audioRange = document.getElementById('range-audio-threshold');
    const audioLabel = document.getElementById('lbl-audio-thresh');
    const tableBody = document.getElementById('proctor-table-body');
    const btnSync = document.getElementById('btn-sync-telemetry');
    const btnSimulate = document.getElementById('btn-simulate-exam');
    const btnRecalibrate = document.getElementById('btn-recalibrate-proctor');

    function renderTable(data) {
        if (!tableBody) return;
        tableBody.innerHTML = '';

        data.forEach(item => {
            const riskEval = engine.evaluateIntegrityRisk(item.biometricScore);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${item.sessionId}</strong></td>
                <td>${item.candidateId}</td>
                <td>${item.examModule}</td>
                <td><strong>${item.biometricScore.toFixed(1)}%</strong></td>
                <td>${item.gazeDrift}</td>
                <td><span class="badge ${riskEval.badgeClass}">${riskEval.risk}</span></td>
                <td>${item.proctorStatus}</td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="alert('Viewing Real-time Biometric Stream & Video Feed for ${item.candidateId}')">Proctor Feed</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    if (gazeRange && gazeLabel) {
        gazeRange.addEventListener('input', (e) => {
            gazeLabel.textContent = `${e.target.value}%`;
            engine.updateConfig({ gazeSensitivity: parseInt(e.target.value, 10) });
        });
    }

    if (audioRange && audioLabel) {
        audioRange.addEventListener('input', (e) => {
            audioLabel.textContent = `${e.target.value} dB`;
            engine.updateConfig({ audioThresholdDb: parseInt(e.target.value, 10) });
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const q = searchInput.value;
            const r = riskSelect ? riskSelect.value : 'all';
            renderTable(engine.getSessionsFiltered(q, r));
        });
    }

    if (riskSelect) {
        riskSelect.addEventListener('change', () => {
            const q = searchInput ? searchInput.value : '';
            renderTable(engine.getSessionsFiltered(q, riskSelect.value));
        });
    }

    if (btnRecalibrate) {
        btnRecalibrate.addEventListener('click', () => {
            alert('AI Neural Gaze & Acoustic Proctoring Sensors Recalibrated.');
            renderTable(engine.getSessionsFiltered());
        });
    }

    if (btnSimulate) {
        btnSimulate.addEventListener('click', () => {
            alert('High-Stakes Exam Simulator Environment Launched with Biometric Proctoring Active.');
        });
    }

    if (btnSync) {
        btnSync.addEventListener('click', () => {
            renderTable(engine.getSessionsFiltered(searchInput ? searchInput.value : '', riskSelect ? riskSelect.value : 'all'));
            alert('Active Proctoring Video Streams & Anomaly Logs Synchronized.');
        });
    }

    renderTable(engine.getSessionsFiltered());
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ExamSimulationProctoringEngine };
}
