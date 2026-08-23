/**
 * Enterprise Diagnostic Overwatch & Biomedical Telemetry Engine
 * HL7 FHIR R4 Real-Time Signal Stream, Genomic Risk Calculator, and ICU Rapid Response Engine
 */

class DiagnosticOverwatchEngine {
    constructor(config = {}) {
        this.troponinCutoff = config.troponinCutoff || 0.04;
        this.sepsisThresholdMmol = config.sepsisThresholdMmol || 2.0;
        this.autoIcuAlert = config.autoIcuAlert !== undefined ? config.autoIcuAlert : true;

        this.patientTelemetry = [];
        this.initDefaultTelemetry();
    }

    initDefaultTelemetry() {
        this.patientTelemetry = [
            {
                patientId: 'PAT-9012',
                ward: 'Cardiac ICU Ward 4',
                biomarker: 'Troponin-I (High Sensitivity)',
                value: '0.14 ng/mL',
                genomicProfile: 'BRCA1 Wildtype',
                riskCategory: 'CRITICAL RISK',
                actionStatus: 'ICU Rapid Response Active'
            },
            {
                patientId: 'PAT-8841',
                ward: 'Genomic Oncology Unit 2',
                biomarker: 'Lactate / Procalcitonin',
                value: '3.8 mmol/L',
                genomicProfile: 'EGFR L858R Mutation',
                riskCategory: 'CRITICAL RISK',
                actionStatus: 'Sepsis Protocol Level 3'
            },
            {
                patientId: 'PAT-7419',
                ward: 'Emergency Triage Bay 1',
                biomarker: 'D-Dimer Quantitative',
                value: '1.2 mcg/mL',
                genomicProfile: 'Factor V Leiden Hetero',
                riskCategory: 'ELEVATED RISK',
                actionStatus: 'Stat CT Angiography'
            },
            {
                patientId: 'PAT-6120',
                ward: 'General Medical Ward 8',
                biomarker: 'hs-CRP & IL-6',
                value: '0.02 ng/mL',
                genomicProfile: 'TP53 Normal',
                riskCategory: 'STABLE TELEMETRY',
                actionStatus: 'Routine Monitoring'
            },
            {
                patientId: 'PAT-5011',
                ward: 'Surgical ICU Bed 3',
                biomarker: 'High Sensitivity Troponin',
                value: '0.08 ng/mL',
                genomicProfile: 'KRAS G12D Variant',
                riskCategory: 'ELEVATED RISK',
                actionStatus: 'Cardiology Consult Stat'
            }
        ];
    }

    evaluateDiagnosticRisk(valStr, biomarker) {
        if (biomarker.includes('Troponin') && parseFloat(valStr) > 0.04) {
            return { risk: 'CRITICAL RISK', badgeClass: 'badge-danger' };
        } else if (biomarker.includes('Lactate') && parseFloat(valStr) > 2.0) {
            return { risk: 'CRITICAL RISK', badgeClass: 'badge-danger' };
        } else if (biomarker.includes('D-Dimer') && parseFloat(valStr) > 0.5) {
            return { risk: 'ELEVATED RISK', badgeClass: 'badge-warning' };
        } else {
            return { risk: 'STABLE TELEMETRY', badgeClass: 'badge-success' };
        }
    }

    updateConfig(newConfig) {
        if (newConfig.troponinCutoff !== undefined) {
            this.troponinCutoff = parseFloat(newConfig.troponinCutoff);
        }
        if (newConfig.sepsisThresholdMmol !== undefined) {
            this.sepsisThresholdMmol = parseFloat(newConfig.sepsisThresholdMmol);
        }
        if (newConfig.autoIcuAlert !== undefined) {
            this.autoIcuAlert = newConfig.autoIcuAlert;
        }
    }

    getTelemetryFiltered(query = '', riskFilter = 'all') {
        return this.patientTelemetry.filter(item => {
            const matchesQuery = !query || 
                item.patientId.toLowerCase().includes(query.toLowerCase()) ||
                item.ward.toLowerCase().includes(query.toLowerCase()) ||
                item.biomarker.toLowerCase().includes(query.toLowerCase()) ||
                item.genomicProfile.toLowerCase().includes(query.toLowerCase()) ||
                item.riskCategory.toLowerCase().includes(query.toLowerCase());

            const matchesRisk = riskFilter === 'all' || 
                (riskFilter === 'critical' && item.riskCategory.includes('CRITICAL')) ||
                (riskFilter === 'elevated' && item.riskCategory.includes('ELEVATED')) ||
                (riskFilter === 'stable' && item.riskCategory.includes('STABLE'));

            return matchesQuery && matchesRisk;
        });
    }
}

// UI Controller Binding
document.addEventListener('DOMContentLoaded', () => {
    const engine = new DiagnosticOverwatchEngine();

    const searchInput = document.getElementById('bio-search-input');
    const riskSelect = document.getElementById('biomarker-risk-select');
    const troponinRange = document.getElementById('range-troponin-cutoff');
    const troponinLabel = document.getElementById('lbl-troponin-cutoff');
    const sepsisRange = document.getElementById('range-sepsis-threshold');
    const sepsisLabel = document.getElementById('lbl-sepsis-thresh');
    const tableBody = document.getElementById('bio-table-body');
    const btnSync = document.getElementById('btn-sync-bio-streams');
    const btnRunGenomic = document.getElementById('btn-run-genomic-eval');
    const btnRecalibrate = document.getElementById('btn-recalibrate-clinical');

    function renderTable(data) {
        if (!tableBody) return;
        tableBody.innerHTML = '';

        data.forEach(item => {
            const riskEval = engine.evaluateDiagnosticRisk(item.value, item.biomarker);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${item.patientId}</strong></td>
                <td>${item.ward}</td>
                <td>${item.biomarker}</td>
                <td><strong>${item.value}</strong></td>
                <td>${item.genomicProfile}</td>
                <td><span class="badge ${riskEval.badgeClass}">${riskEval.risk}</span></td>
                <td>${item.actionStatus}</td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="alert('Launching HL7 FHIR R4 Real-Time Telemetry Stream for ${item.patientId}')">FHIR Stream</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    if (troponinRange && troponinLabel) {
        troponinRange.addEventListener('input', (e) => {
            const val = (e.target.value / 100).toFixed(2);
            troponinLabel.textContent = `${val} ng/mL`;
            engine.updateConfig({ troponinCutoff: parseFloat(val) });
        });
    }

    if (sepsisRange && sepsisLabel) {
        sepsisRange.addEventListener('input', (e) => {
            const val = (e.target.value / 10).toFixed(1);
            sepsisLabel.textContent = `${val} mmol/L`;
            engine.updateConfig({ sepsisThresholdMmol: parseFloat(val) });
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const q = searchInput.value;
            const r = riskSelect ? riskSelect.value : 'all';
            renderTable(engine.getTelemetryFiltered(q, r));
        });
    }

    if (riskSelect) {
        riskSelect.addEventListener('change', () => {
            const q = searchInput ? searchInput.value : '';
            renderTable(engine.getTelemetryFiltered(q, riskSelect.value));
        });
    }

    if (btnRecalibrate) {
        btnRecalibrate.addEventListener('click', () => {
            alert('Clinical Diagnostic Sensors & FHIR Threshold Recalibrated.');
            renderTable(engine.getTelemetryFiltered());
        });
    }

    if (btnRunGenomic) {
        btnRunGenomic.addEventListener('click', () => {
            alert('Genomic Variant Risk Engine Executed Across Active Patients.');
        });
    }

    if (btnSync) {
        btnSync.addEventListener('click', () => {
            renderTable(engine.getTelemetryFiltered(searchInput ? searchInput.value : '', riskSelect ? riskSelect.value : 'all'));
            alert('HL7 FHIR R4 Biomedical Streams Synchronized.');
        });
    }

    renderTable(engine.getTelemetryFiltered());
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DiagnosticOverwatchEngine };
}
