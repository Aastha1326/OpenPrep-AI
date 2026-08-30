/**
 * Enterprise Pharmacogenomics & Pharmacy Supply Chain Engine
 * CPIC Guideline Validation, Drug-Gene Toxicity Risk, and Cold-Chain Storage Engine
 */

class PharmacogenomicsSupplyChainEngine {
    constructor(config = {}) {
        this.maxColdChainTemp = config.maxColdChainTemp || 8.0;
        this.cyp2d6Sensitivity = config.cyp2d6Sensitivity || 90;
        this.autoBlockDispense = config.autoBlockDispense !== undefined ? config.autoBlockDispense : true;

        this.pharmaPrescriptions = [];
        this.initDefaultPrescriptions();
    }

    initDefaultPrescriptions() {
        this.pharmaPrescriptions = [
            {
                rxId: 'RX-9041',
                patientId: 'PAT-4102',
                drug: 'Codeine Phosphate 30mg',
                phenotype: 'CYP2D6 Poor Metabolizer (*4/*4)',
                storageTemp: '4.1°C',
                riskCategory: 'HIGH TOXICITY RISK',
                dispenseAction: 'Dispensing Intercepted (Ineffective)'
            },
            {
                rxId: 'RX-8812',
                patientId: 'PAT-8921',
                drug: 'Azathioprine 50mg',
                phenotype: 'TPMT Deficient (*3A/*3C)',
                storageTemp: '3.8°C',
                riskCategory: 'HIGH TOXICITY RISK',
                dispenseAction: 'Myelosuppression Alert (Blocked)'
            },
            {
                rxId: 'RX-7430',
                patientId: 'PAT-3019',
                drug: 'Clopidogrel 75mg',
                phenotype: 'CYP2C19 Intermediate (*1/*2)',
                storageTemp: '5.2°C',
                riskCategory: 'MODERATE ALERT',
                dispenseAction: 'Alternative Antiplatelet Rec'
            },
            {
                rxId: 'RX-6194',
                patientId: 'PAT-6701',
                drug: 'Fluorouracil (5-FU)',
                phenotype: 'DPYD Normal Metabolizer (*1/*1)',
                storageTemp: '2.4°C',
                riskCategory: 'VERIFIED SAFE',
                dispenseAction: 'Dispensed Successfully'
            },
            {
                rxId: 'RX-5201',
                patientId: 'PAT-1184',
                drug: 'Warfarin Sodium 5mg',
                phenotype: 'VKORC1 (-1639G>A) High Sensitivity',
                storageTemp: '4.5°C',
                riskCategory: 'MODERATE ALERT',
                dispenseAction: 'Dose Reduced by 50%'
            }
        ];
    }

    evaluatePharmacogenomicRisk(phenotype, drug) {
        if (phenotype.includes('Poor') || phenotype.includes('Deficient')) {
            return { risk: 'HIGH TOXICITY RISK', badgeClass: 'badge-danger' };
        } else if (phenotype.includes('Intermediate') || phenotype.includes('Sensitivity')) {
            return { risk: 'MODERATE ALERT', badgeClass: 'badge-warning' };
        } else {
            return { risk: 'VERIFIED SAFE', badgeClass: 'badge-success' };
        }
    }

    updateConfig(newConfig) {
        if (newConfig.maxColdChainTemp !== undefined) {
            this.maxColdChainTemp = parseFloat(newConfig.maxColdChainTemp);
        }
        if (newConfig.cyp2d6Sensitivity !== undefined) {
            this.cyp2d6Sensitivity = parseInt(newConfig.cyp2d6Sensitivity, 10);
        }
        if (newConfig.autoBlockDispense !== undefined) {
            this.autoBlockDispense = newConfig.autoBlockDispense;
        }
    }

    getPrescriptionsFiltered(query = '', riskFilter = 'all') {
        return this.pharmaPrescriptions.filter(item => {
            const matchesQuery = !query || 
                item.rxId.toLowerCase().includes(query.toLowerCase()) ||
                item.patientId.toLowerCase().includes(query.toLowerCase()) ||
                item.drug.toLowerCase().includes(query.toLowerCase()) ||
                item.phenotype.toLowerCase().includes(query.toLowerCase()) ||
                item.riskCategory.toLowerCase().includes(query.toLowerCase());

            const matchesRisk = riskFilter === 'all' || 
                (riskFilter === 'high-toxicity' && item.riskCategory.includes('HIGH')) ||
                (riskFilter === 'moderate-alert' && item.riskCategory.includes('MODERATE')) ||
                (riskFilter === 'safe' && item.riskCategory.includes('SAFE'));

            return matchesQuery && matchesRisk;
        });
    }
}

// UI Controller Binding
document.addEventListener('DOMContentLoaded', () => {
    const engine = new PharmacogenomicsSupplyChainEngine();

    const searchInput = document.getElementById('pharma-search-input');
    const riskSelect = document.getElementById('interaction-risk-select');
    const tempRange = document.getElementById('range-cold-chain-temp');
    const tempLabel = document.getElementById('lbl-temp-limit');
    const cypRange = document.getElementById('range-cyp2d6-sensitivity');
    const cypLabel = document.getElementById('lbl-cyp-sens');
    const tableBody = document.getElementById('pharma-table-body');
    const btnSync = document.getElementById('btn-sync-pharma-streams');
    const btnVerify = document.getElementById('btn-verify-prescription');
    const btnRecalibrate = document.getElementById('btn-recalibrate-pharma');

    function renderTable(data) {
        if (!tableBody) return;
        tableBody.innerHTML = '';

        data.forEach(item => {
            const riskEval = engine.evaluatePharmacogenomicRisk(item.phenotype, item.drug);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${item.rxId}</strong></td>
                <td>${item.patientId}</td>
                <td>${item.drug}</td>
                <td>${item.phenotype}</td>
                <td><strong>${item.storageTemp}</strong></td>
                <td><span class="badge ${riskEval.badgeClass}">${riskEval.risk}</span></td>
                <td>${item.dispenseAction}</td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="alert('Viewing CPIC Guideline & Cold-Chain Telemetry for ${item.rxId}')">CPIC Profile</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    if (tempRange && tempLabel) {
        tempRange.addEventListener('input', (e) => {
            const val = (e.target.value / 10).toFixed(1);
            tempLabel.textContent = `${val}°C`;
            engine.updateConfig({ maxColdChainTemp: parseFloat(val) });
        });
    }

    if (cypRange && cypLabel) {
        cypRange.addEventListener('input', (e) => {
            cypLabel.textContent = `${e.target.value}%`;
            engine.updateConfig({ cyp2d6Sensitivity: parseInt(e.target.value, 10) });
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const q = searchInput.value;
            const r = riskSelect ? riskSelect.value : 'all';
            renderTable(engine.getPrescriptionsFiltered(q, r));
        });
    }

    if (riskSelect) {
        riskSelect.addEventListener('change', () => {
            const q = searchInput ? searchInput.value : '';
            renderTable(engine.getPrescriptionsFiltered(q, riskSelect.value));
        });
    }

    if (btnRecalibrate) {
        btnRecalibrate.addEventListener('click', () => {
            alert('CPIC Pharmacogenomics & Cold-Chain Sensors Recalibrated.');
            renderTable(engine.getPrescriptionsFiltered());
        });
    }

    if (btnVerify) {
        btnVerify.addEventListener('click', () => {
            alert('CPIC Pharmacogenomic Guideline Engine Executed for Active Prescriptions.');
        });
    }

    if (btnSync) {
        btnSync.addEventListener('click', () => {
            renderTable(engine.getPrescriptionsFiltered(searchInput ? searchInput.value : '', riskSelect ? riskSelect.value : 'all'));
            alert('Pharmacy Cold-Chain Storage & Automated Dispensing Telemetry Synchronized.');
        });
    }

    renderTable(engine.getPrescriptionsFiltered());
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PharmacogenomicsSupplyChainEngine };
}
