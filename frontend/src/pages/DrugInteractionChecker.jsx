import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  Plus,
  Minus,
  Pill,
  Shield,
  Zap,
  Heart,
  Brain,
  Activity,
  Droplets,
  Eye,
  Stethoscope,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Info,
  BookOpen,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Beaker,
  Dna,
  Layers,
  Target,
  Lightbulb,
  Star,
} from 'lucide-react';

// ─── Drug Database ──────────────────────────────────────────────────────────
const DRUG_DATABASE = {
  'warfarin': { name: 'Warfarin', class: 'Anticoagulant', category: 'blood', icon: '🩸', color: '#ef4444', mechanism: 'Vitamin K antagonist — inhibits vitamin K epoxide reductase (VKORC1), preventing synthesis of clotting factors II, VII, IX, X' },
  'aspirin': { name: 'Aspirin', class: 'NSAID/Platelet Inhibitor', category: 'blood', icon: '💊', color: '#f59e0b', mechanism: 'Irreversible COX-1/COX-2 inhibitor — blocks prostaglandin and thromboxane synthesis' },
  'metformin': { name: 'Metformin', class: 'Biguanide', category: 'endocrine', icon: '💉', color: '#06b6d4', mechanism: 'Activates AMPK, reduces hepatic glucose output, increases insulin sensitivity' },
  'lisinopril': { name: 'Lisinopril', class: 'ACE Inhibitor', category: 'cardiovascular', icon: '❤️', color: '#ec4899', mechanism: 'Inhibits angiotensin-converting enzyme, preventing angiotensin I → II conversion' },
  'amiodarone': { name: 'Amiodarone', class: 'Class III Antiarrhythmic', category: 'cardiovascular', icon: '💓', color: '#8b5cf6', mechanism: 'Blocks potassium channels (class III), also has sodium, calcium, and beta-blocking properties' },
  'simvastatin': { name: 'Simvastatin', class: 'HMG-CoA Reductase Inhibitor', category: 'cardiovascular', icon: '🫀', color: '#10b981', mechanism: 'Competitive inhibitor of HMG-CoA reductase — rate-limiting enzyme in cholesterol biosynthesis' },
  'omeprazole': { name: 'Omeprazole', class: 'Proton Pump Inhibitor', category: 'gi', icon: '🫁', color: '#f97316', mechanism: 'Irreversibly inhibits H⁺/K⁺-ATPase on parietal cells, reducing gastric acid secretion' },
  'ciprofloxacin': { name: 'Ciprofloxacin', class: 'Fluoroquinolone Antibiotic', category: 'antibiotics', icon: '🦠', color: '#14b8a6', mechanism: 'Inhibits bacterial DNA gyrase (topoisomerase II) and topoisomerase IV, preventing DNA replication' },
  'fluoxetine': { name: 'Floxetine', class: 'SSRI Antidepressant', category: 'psychiatric', icon: '🧠', color: '#6366f1', mechanism: 'Selective serotonin reuptake inhibitor — blocks SERT, increasing synaptic 5-HT availability' },
  'lithium': { name: 'Lithium', class: 'Mood Stabilizer', category: 'psychiatric', icon: '⚡', color: '#fbbf24', mechanism: 'Modulates neurotransmitter signaling, inhibits inositol monophosphatase, affects GSK-3β' },
  'digoxin': { name: 'Digoxin', class: 'Cardiac Glycoside', category: 'cardiovascular', icon: '💎', color: '#a855f7', mechanism: 'Inhibits Na⁺/K⁺-ATPase → increases intracellular Ca²⁺ → positive inotropic effect' },
  'metoprolol': { name: 'Metoprolol', class: 'Beta-1 Blocker', category: 'cardiovascular', icon: '🫀', color: '#0ea5e9', mechanism: 'Selective β1-adrenergic receptor antagonist — reduces heart rate, contractility, and blood pressure' },
  'furosemide': { name: 'Furosemide', class: 'Loop Diuretic', category: 'renal', icon: '💧', color: '#3b82f6', mechanism: 'Inhibits Na⁺/K⁺/2Cl⁻ cotransporter (NKCC2) in thick ascending limb of loop of Henle' },
  'prednisone': { name: 'Prednisone', class: 'Corticosteroid', category: 'endocrine', icon: '🧴', color: '#eab308', mechanism: 'Binds glucocorticoid receptors → inhibits NF-κB → reduces pro-inflammatory gene transcription' },
  'clopidogrel': { name: 'Clopidogrel', class: 'P2Y12 Inhibitor', category: 'blood', icon: '🩸', color: '#dc2626', mechanism: 'Irreversibly blocks P2Y12 ADP receptor on platelets — reduces platelet aggregation' },
  'methotrexate': { name: 'Methotrexate', class: 'Antifolate / DMARD', category: 'immunosuppressant', icon: '🧬', color: '#059669', mechanism: 'Inhibits dihydrofolate reductase (DHFR), blocking purine and pyrimidine synthesis' },
  'azithromycin': { name: 'Azithromycin', class: 'Macrolide Antibiotic', category: 'antibiotics', icon: '🦠', color: '#2563eb', mechanism: 'Binds 50S ribosomal subunit, inhibiting bacterial protein synthesis' },
  'carbamazepine': { name: 'Carbamazepine', class: 'Anticonvulsant', category: 'neurology', icon: '🧠', color: '#7c3aed', mechanism: 'Blocks voltage-gated sodium channels, stabilizing neuronal membranes' },
  'diltiazem': { name: 'Diltiazem', class: 'Calcium Channel Blocker', category: 'cardiovascular', icon: '💜', color: '#9333ea', mechanism: 'Inhibits L-type calcium channels in cardiac and vascular smooth muscle' },
  'ketoconazole': { name: 'Ketoconazole', class: 'Azole Antifungal', category: 'antifungals', icon: '🍄', color: '#b45309', mechanism: 'Inhibits fungal cytochrome P450 (CYP51/14α-demethylase), blocking ergosterol synthesis' },
  'fluconazole': { name: 'Fluconazole', class: 'Azole Antifungal', category: 'antifungals', icon: '🍄', color: '#d97706', mechanism: 'Inhibits fungal CYP51 (14α-demethylase), blocking ergosterol synthesis' },
  'erythromycin': { name: 'Erythromycin', class: 'Macrolide Antibiotic', category: 'antibiotics', icon: '🦠', color: '#1d4ed8', mechanism: 'Binds 50S ribosomal subunit, inhibiting bacterial protein synthesis. Strong CYP3A4 inhibitor.' },
  'spironolactone': { name: 'Spironolactone', class: 'Potassium-Sparing Diuretic', category: 'renal', icon: '💧', color: '#0284c7', mechanism: 'Competitive antagonist of aldosterone at mineralocorticoid receptor' },
  'nsaids': { name: 'NSAIDs (Ibuprofen)', class: 'Non-Steroidal Anti-Inflammatory', category: 'pain', icon: '💊', color: '#f97316', mechanism: 'Reversible COX-1/COX-2 inhibitor — reduces prostaglandin synthesis' },
  'codeine': { name: 'Codeine', class: 'Opioid Analgesic', category: 'pain', icon: '💉', color: '#be185d', mechanism: 'Prodrug — converted to morphine by CYP2D6, acts on μ-opioid receptors' },
};

// ─── Interaction Database ───────────────────────────────────────────────────
const INTERACTIONS = {
  'warfarin+aspirin': { severity: 'major', description: 'Increased bleeding risk. Aspirin inhibits platelets AND warfarin inhibits clotting cascade — synergistic anticoagulant effect.', mechanism: 'Pharmacodynamic: Both impair hemostasis through different mechanisms. Aspirin damages gastric mucosa, increasing GI bleeding risk with warfarin.', management: 'Avoid combination unless specifically indicated (e.g., mechanical heart valve). If necessary, monitor INR closely and use low-dose aspirin.', evidenceLevel: 'Level A' },
  'warfarin+amiodarone': { severity: 'major', description: 'Amiodarone potentiates warfarin effect by inhibiting CYP2C9 metabolism. INR can increase 30-50%.', mechanism: 'Pharmacokinetic: Amiodarone inhibits CYP2C9, the primary enzyme metabolizing S-warfarin (more potent enantiomer).', management: 'Reduce warfarin dose by 30-50% when starting amiodarone. Monitor INR weekly for several weeks.', evidenceLevel: 'Level A' },
  'warfarin+simvastatin': { severity: 'moderate', description: 'Simvastatin may slightly increase warfarin effect via CYP3A4 interaction.', mechanism: 'Pharmacokinetic: Mild CYP3A4 interaction. Simvastatin is metabolized by CYP3A4 and may competitively inhibit warfarin metabolism.', management: 'Monitor INR when starting or changing statin dose. Usually small effect.', evidenceLevel: 'Level B' },
  'warfarin+fluconazole': { severity: 'major', description: 'Fluconazole significantly inhibits CYP2C9, increasing warfarin levels and bleeding risk.', mechanism: 'Pharmacokinetic: Fluconazole is a potent CYP2C9 inhibitor, reducing warfarin clearance by ~50%.', management: 'Reduce warfarin dose by 25-50%. Monitor INR closely (every 2-3 days initially).', evidenceLevel: 'Level A' },
  'metformin+ciprofloxacin': { severity: 'moderate', description: 'Fluoroquinolones may alter blood glucose levels unpredictably in diabetic patients.', mechanism: 'Pharmacodynamic: Fluoroquinolones can stimulate insulin secretion, causing hypoglycemia, or impair glucose tolerance.', management: 'Monitor blood glucose closely during and after antibiotic course.', evidenceLevel: 'Level B' },
  'lisinopril+spironolactone': { severity: 'major', description: 'Risk of severe hyperkalemia. Both drugs increase potassium levels.', mechanism: 'Pharmacodynamic: ACE inhibitor reduces aldosterone secretion; spironolactone blocks aldosterone receptor. Combined effect = markedly reduced potassium excretion.', management: 'Check potassium and renal function within 1 week. Contraindicated if K⁺ >5.0 or eGFR <30. Acceptable in heart failure with monitoring.', evidenceLevel: 'Level A' },
  'amiodarone+simvastatin': { severity: 'major', description: 'Amiodarone inhibits CYP3A4, increasing simvastatin levels. Risk of rhabdomyolysis.', mechanism: 'Pharmacokinetic: Amiodarone inhibits CYP3A4, the primary enzyme metabolizing simvastatin. Levels can increase 2-3 fold.', management: 'Limit simvastatin dose to 20mg/day when combined with amiodarone. Consider switching to pravastatin or rosuvastatin.', evidenceLevel: 'Level A' },
  'amiodarone+diltiazem': { severity: 'major', description: 'Both depress cardiac conduction. Combined use can cause severe bradycardia, heart block, or cardiac arrest.', mechanism: 'Pharmacodynamic: Additive negative chronotropic and dromotropic effects on the AV node.', management: 'Contraindicated in most cases. If absolutely necessary, monitor ECG continuously and watch for bradycardia.', evidenceLevel: 'Level A' },
  'fluoxetine+codeine': { severity: 'major', description: 'Fluoxetine inhibits CYP2D6, reducing codeine conversion to morphine. May also cause serotonin syndrome.', mechanism: 'Pharmacokinetic + Pharmacodynamic: CYP2D6 inhibition reduces analgesic effect. Both increase serotonin — risk of serotonin syndrome.', management: 'Avoid combination. Use alternative analgesic (e.g., tramadol with caution, or non-opioid).', evidenceLevel: 'Level B' },
  'lithium+nsaids': { severity: 'major', description: 'NSAIDs reduce renal lithium clearance, increasing lithium levels and risk of toxicity.', mechanism: 'Pharmacokinetic: NSAIDs inhibit renal prostaglandin synthesis, reducing GFR and lithium excretion.', management: 'Avoid NSAIDs with lithium. Use paracetamol for pain. If unavoidable, reduce lithium dose and monitor levels closely.', evidenceLevel: 'Level A' },
  'digoxin+amiodarone': { severity: 'major', description: 'Amiodarone increases digoxin levels by 70-100% through P-glycoprotein inhibition.', mechanism: 'Pharmacokinetic: Amiodarone inhibits P-glycoprotein and renal clearance of digoxin.', management: 'Reduce digoxin dose by 50% when starting amiodarone. Monitor digoxin levels and clinical response.', evidenceLevel: 'Level A' },
  'metoprolol+diltiazem': { severity: 'major', description: 'Both slow heart rate and conduction. Combined use risks severe bradycardia and heart block.', mechanism: 'Pharmacodynamic: Additive negative chronotropic and dromotropic effects.', management: 'Use with extreme caution. Monitor HR and ECG. Avoid in patients with conduction disease.', evidenceLevel: 'Level A' },
  'prednisone+nsaids': { severity: 'moderate', description: 'Combined GI irritant effect increases risk of peptic ulcer and GI bleeding.', mechanism: 'Pharmacodynamic: Corticosteroids impair mucosal defense; NSAIDs inhibit protective prostaglandins.', management: 'Add PPI (e.g., omeprazole) for GI protection if combination is necessary.', evidenceLevel: 'Level B' },
  'methotrexate+nsaids': { severity: 'major', description: 'NSAIDs reduce renal methotrexate clearance, increasing toxicity risk (pancytopenia, mucositis).', mechanism: 'Pharmacokinetic: NSAIDs reduce GFR and compete for renal tubular secretion of methotrexate.', management: 'Avoid NSAIDs with high-dose methotrexate. Low-dose methotrexate: use with caution and monitor CBC.', evidenceLevel: 'Level A' },
  'ketoconazole+simvastatin': { severity: 'major', description: 'Ketoconazole potently inhibits CYP3A4, massively increasing simvastatin levels. High rhabdomyolysis risk.', mechanism: 'Pharmacokinetic: Ketoconazole is a strong CYP3A4 inhibitor, increasing simvastatin AUC by >10-fold.', management: 'Contraindicated. Stop simvastatin if ketoconazole must be used.', evidenceLevel: 'Level A' },
  'fluconazole+warfarin': { severity: 'major', description: 'Fluconazole inhibits CYP2C9, significantly potentiating warfarin. Major bleeding risk.', mechanism: 'Pharmacokinetic: Potent CYP2C9 inhibition reduces S-warfarin metabolism.', management: 'Reduce warfarin dose by 25-50%. Monitor INR every 2-3 days during and after fluconazole course.', evidenceLevel: 'Level A' },
  'carbamazepine+fluconazole': { severity: 'moderate', description: 'Fluconazole inhibits CYP3A4 metabolism of carbamazepine, potentially increasing levels and toxicity.', mechanism: 'Pharmacokinetic: CYP3A4 inhibition increases carbamazepine levels.', management: 'Monitor carbamazepine levels and for signs of toxicity (dizziness, ataxia, diplopia).', evidenceLevel: 'Level B' },
  'erythromycin+simvastatin': { severity: 'major', description: 'Erythromycin potently inhibits CYP3A4, increasing simvastatin levels. Rhabdomyolysis risk.', mechanism: 'Pharmacokinetic: Strong CYP3A4 inhibition increases simvastatin exposure by 10-15 fold.', management: 'Contraindicated. Use azithromycin instead (no CYP3A4 inhibition).', evidenceLevel: 'Level A' },
  'aspirin+clopidogrel': { severity: 'moderate', description: 'Dual antiplatelet therapy — increases bleeding risk but indicated post-PCI.', mechanism: 'Pharmacodynamic: Aspirin inhibits COX-1/TXA2; clopidogrel inhibits P2Y12/ADP pathway. Synergistic platelet inhibition.', management: 'Intentional combination post-ACS/PCI. Monitor for bleeding. Duration typically 12 months.', evidenceLevel: 'Level A' },
  'warfarin+nsaids': { severity: 'major', description: 'NSAIDs increase bleeding risk through multiple mechanisms: antiplatelet effect, GI mucosal damage, and potential CYP interaction.', mechanism: 'Pharmacodynamic + Pharmacokinetic: Impaired hemostasis + potential CYP2C9 competition.', management: 'Avoid if possible. Use paracetamol instead. If necessary, co-prescribe PPI and monitor INR.', evidenceLevel: 'Level A' },
};

function getInteractionKey(drug1, drug2) {
  const key1 = `${drug1}+${drug2}`;
  const key2 = `${drug2}+${drug1}`;
  return INTERACTIONS[key1] || INTERACTIONS[key2] || null;
}

// ─── Components ─────────────────────────────────────────────────────────────

function DrugSearchInput({ onSelect, placeholder = "Search drugs..." }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const handleSearch = (q) => {
    setQuery(q);
    if (q.length < 2) { setResults([]); setIsOpen(false); return; }
    const matches = Object.entries(DRUG_DATABASE).filter(([key, drug]) =>
      drug.name.toLowerCase().includes(q.toLowerCase()) ||
      drug.class.toLowerCase().includes(q.toLowerCase()) ||
      key.toLowerCase().includes(q.toLowerCase())
    ).slice(0, 8);
    setResults(matches);
    setIsOpen(matches.length > 0);
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
      <input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        onFocus={() => query.length >= 2 && results.length > 0 && setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        className="w-full pl-9 pr-3 py-2.5 text-sm bg-stone-900/60 border border-stone-700/40 rounded-xl text-stone-200 placeholder-stone-500 focus:border-stone-600/60 focus:outline-none"
      />
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-1 bg-stone-900 border border-stone-700/60 rounded-xl overflow-hidden shadow-xl"
          >
            {results.map(([key, drug]) => (
              <button
                key={key}
                onClick={() => { onSelect(key); setQuery(''); setIsOpen(false); }}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-stone-800/80 transition-colors text-left"
              >
                <span className="text-lg">{drug.icon}</span>
                <div>
                  <p className="text-sm font-medium text-stone-200">{drug.name}</p>
                  <p className="text-[10px] text-stone-500">{drug.class}</p>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function InteractionCard({ drug1, drug2, interaction }) {
  const [expanded, setExpanded] = useState(false);
  const severityConfig = {
    major: { bg: 'bg-red-900/30', border: 'border-red-700/50', text: 'text-red-400', badge: 'bg-red-900/50 text-red-300', icon: AlertTriangle },
    moderate: { bg: 'bg-amber-900/30', border: 'border-amber-700/50', text: 'text-amber-400', badge: 'bg-amber-900/50 text-amber-300', icon: AlertTriangle },
    minor: { bg: 'bg-blue-900/30', border: 'border-blue-700/50', text: 'text-blue-400', badge: 'bg-blue-900/50 text-blue-300', icon: Info },
  };
  const config = severityConfig[interaction.severity] || severityConfig.moderate;
  const SeverityIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-xl border ${config.border} ${config.bg} cursor-pointer hover:scale-[1.01] transition-transform`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SeverityIcon className={`h-5 w-5 ${config.text}`} />
          <div>
            <p className="text-sm font-semibold text-stone-200">{drug1} + {drug2}</p>
            <p className="text-xs text-stone-400 mt-0.5">{interaction.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${config.badge}`}>
            {interaction.severity.toUpperCase()}
          </span>
          <ChevronDown className={`h-4 w-4 text-stone-500 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-3 border-t border-stone-700/30 space-y-3">
              <div>
                <h4 className="text-xs font-semibold text-stone-300 mb-1 flex items-center gap-1">
                  <Dna className="h-3 w-3 text-purple-400" /> Mechanism
                </h4>
                <p className="text-xs text-stone-400 leading-relaxed">{interaction.mechanism}</p>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-stone-300 mb-1 flex items-center gap-1">
                  <Shield className="h-3 w-3 text-emerald-400" /> Management
                </h4>
                <p className="text-xs text-stone-400 leading-relaxed">{interaction.management}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-800 text-stone-400">
                  Evidence: {interaction.evidenceLevel}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function InteractionNetwork({ selectedDrugs }) {
  if (selectedDrugs.length < 2) return null;

  const drugs = selectedDrugs.map(key => ({ key, ...DRUG_DATABASE[key] }));
  const centerX = 200;
  const centerY = 150;
  const radius = 100;

  return (
    <div className="bg-stone-900/60 border border-stone-700/40 rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-stone-200 mb-4 flex items-center gap-2">
        <Layers className="h-4 w-4 text-blue-400" /> Interaction Network
      </h3>
      <svg viewBox="0 0 400 300" className="w-full max-h-[300px]">
        {/* Draw connection lines */}
        {drugs.map((d1, i) =>
          drugs.map((d2, j) => {
            if (j <= i) return null;
            const interaction = getInteractionKey(d1.key, d2.key);
            const angle1 = (2 * Math.PI * i) / drugs.length - Math.PI / 2;
            const angle2 = (2 * Math.PI * j) / drugs.length - Math.PI / 2;
            const x1 = centerX + radius * Math.cos(angle1);
            const y1 = centerY + radius * Math.sin(angle1);
            const x2 = centerX + radius * Math.cos(angle2);
            const y2 = centerY + radius * Math.sin(angle2);

            const strokeColor = interaction
              ? interaction.severity === 'major' ? '#ef4444'
              : interaction.severity === 'moderate' ? '#f59e0b'
              : '#3b82f6'
              : '#22c55e';

            const strokeWidth = interaction
              ? interaction.severity === 'major' ? 3 : 2
              : 1;

            const dashArray = interaction ? 'none' : '5,5';

            return (
              <g key={`${i}-${j}`}>
                <line x1={x1} y1={y1} x2={x2} y2={y2}
                      stroke={strokeColor} strokeWidth={strokeWidth}
                      strokeDasharray={dashArray} opacity={0.7} />
                {interaction && (
                  <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 5}
                        textAnchor="middle" fill={strokeColor}
                        fontSize="8" fontWeight="bold">
                    {interaction.severity === 'major' ? '⚠️' : '⚡'}
                  </text>
                )}
              </g>
            );
          })
        )}

        {/* Draw drug nodes */}
        {drugs.map((drug, i) => {
          const angle = (2 * Math.PI * i) / drugs.length - Math.PI / 2;
          const x = centerX + radius * Math.cos(angle);
          const y = centerY + radius * Math.sin(angle);

          return (
            <g key={drug.key}>
              <circle cx={x} cy={y} r="28" fill={drug.color} opacity="0.15" stroke={drug.color} strokeWidth="2" />
              <text x={x} y={y + 4} textAnchor="middle" fontSize="16">{drug.icon}</text>
              <text x={x} y={y + 20} textAnchor="middle" fill="#e7e5e4" fontSize="8" fontWeight="600">
                {drug.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Main Dashboard ─────────────────────────────────────────────────────────

export default function DrugInteractionChecker() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedDrugs, setSelectedDrugs] = useState([]);
  const [activeTab, setActiveTab] = useState('checker');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const addDrug = (drugKey) => {
    if (!selectedDrugs.includes(drugKey)) {
      setSelectedDrugs([...selectedDrugs, drugKey]);
    }
  };

  const removeDrug = (drugKey) => {
    setSelectedDrugs(selectedDrugs.filter(d => d !== drugKey));
  };

  // Calculate all interactions
  const interactions = useMemo(() => {
    const results = [];
    for (let i = 0; i < selectedDrugs.length; i++) {
      for (let j = i + 1; j < selectedDrugs.length; j++) {
        const interaction = getInteractionKey(selectedDrugs[i], selectedDrugs[j]);
        if (interaction) {
          results.push({
            drug1: DRUG_DATABASE[selectedDrugs[i]]?.name || selectedDrugs[i],
            drug2: DRUG_DATABASE[selectedDrugs[j]]?.name || selectedDrugs[j],
            interaction,
          });
        }
      }
    }
    return results.sort((a, b) => {
      const order = { major: 0, moderate: 1, minor: 2 };
      return (order[a.interaction.severity] || 3) - (order[b.interaction.severity] || 3);
    });
  }, [selectedDrugs]);

  const majorCount = interactions.filter(i => i.interaction.severity === 'major').length;
  const moderateCount = interactions.filter(i => i.interaction.severity === 'moderate').length;
  const minorCount = interactions.filter(i => i.interaction.severity === 'minor').length;
  const safePairs = (selectedDrugs.length * (selectedDrugs.length - 1)) / 2 - interactions.length;

  const allDrugs = Object.entries(DRUG_DATABASE).filter(([key, drug]) => {
    if (!searchQuery) return true;
    return drug.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           drug.class.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const tabs = [
    { id: 'checker', label: 'Interaction Checker', icon: Search },
    { id: 'database', label: 'Drug Database', icon: BookOpen },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 p-6">
        <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
          <div className="h-12 bg-stone-900/60 rounded-xl w-72" />
          <div className="h-64 bg-stone-900/60 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)}
                    className="p-2 rounded-xl bg-stone-900/60 border border-stone-700/40 text-stone-400 hover:text-stone-200 transition-all">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-stone-100 flex items-center gap-2">
                <Beaker className="h-7 w-7 text-amber-400" />
                Drug Interaction Checker
              </h1>
              <p className="text-sm text-stone-400">Check for dangerous drug-drug interactions with visual mapping</p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-stone-900/40 rounded-xl p-1 border border-stone-700/30">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeTab === tab.id ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20' : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
                    }`}>
              <tab.icon className="h-4 w-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* ═══ Checker Tab ═══ */}
        {activeTab === 'checker' && (
          <div className="space-y-6">
            {/* Drug Input */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-stone-900/60 border border-stone-700/40 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-stone-200 mb-3 flex items-center gap-2">
                <Pill className="h-4 w-4 text-amber-400" /> Add Medications
              </h3>
              <DrugSearchInput onSelect={addDrug} placeholder="Search for a drug to add..." />

              {/* Selected drugs */}
              {selectedDrugs.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {selectedDrugs.map(key => {
                    const drug = DRUG_DATABASE[key];
                    return (
                      <motion.div
                        key={key}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-stone-600/50"
                        style={{ backgroundColor: `${drug.color}15` }}
                      >
                        <span className="text-sm">{drug.icon}</span>
                        <span className="text-xs font-medium text-stone-200">{drug.name}</span>
                        <button onClick={() => removeDrug(key)}
                                className="p-0.5 rounded-full hover:bg-stone-700 text-stone-500 hover:text-stone-300 transition-all">
                          <XCircle className="h-3.5 w-3.5" />
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {selectedDrugs.length === 0 && (
                <p className="text-xs text-stone-500 mt-3">Search and add medications to check for interactions</p>
              )}
            </motion.div>

            {/* Results Summary */}
            {selectedDrugs.length >= 2 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                  <div className={`p-4 rounded-xl text-center ${majorCount > 0 ? 'bg-red-900/30 border border-red-700/40' : 'bg-stone-900/60 border border-stone-700/40'}`}>
                    <p className="text-2xl font-bold text-red-400">{majorCount}</p>
                    <p className="text-xs text-stone-400">⚠️ Major</p>
                  </div>
                  <div className={`p-4 rounded-xl text-center ${moderateCount > 0 ? 'bg-amber-900/30 border border-amber-700/40' : 'bg-stone-900/60 border border-stone-700/40'}`}>
                    <p className="text-2xl font-bold text-amber-400">{moderateCount}</p>
                    <p className="text-xs text-stone-400">⚡ Moderate</p>
                  </div>
                  <div className="p-4 rounded-xl text-center bg-stone-900/60 border border-stone-700/40">
                    <p className="text-2xl font-bold text-blue-400">{minorCount}</p>
                    <p className="text-xs text-stone-400">ℹ️ Minor</p>
                  </div>
                  <div className="p-4 rounded-xl text-center bg-stone-900/60 border border-stone-700/40">
                    <p className="text-2xl font-bold text-emerald-400">{safePairs}</p>
                    <p className="text-xs text-stone-400">✅ Safe Pairs</p>
                  </div>
                </div>

                {/* Network Visualization */}
                <InteractionNetwork selectedDrugs={selectedDrugs} />

                {/* Interaction List */}
                <div className="mt-6 space-y-3">
                  <h3 className="text-sm font-semibold text-stone-200 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-400" /> Detected Interactions ({interactions.length})
                  </h3>
                  {interactions.length > 0 ? (
                    interactions.map((item, i) => (
                      <InteractionCard key={i} drug1={item.drug1} drug2={item.drug2} interaction={item.interaction} />
                    ))
                  ) : (
                    <div className="p-6 bg-emerald-900/20 border border-emerald-700/40 rounded-xl text-center">
                      <CheckCircle className="h-10 w-10 text-emerald-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-emerald-300">No Interactions Found</p>
                      <p className="text-xs text-stone-400 mt-1">These medications appear to be safe to use together</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {selectedDrugs.length < 2 && (
              <div className="text-center py-16">
                <Beaker className="h-16 w-16 text-stone-800 mx-auto mb-4" />
                <p className="text-stone-500 text-lg mb-2">Add at least 2 medications</p>
                <p className="text-stone-600 text-sm">to check for drug-drug interactions</p>
              </div>
            )}
          </div>
        )}

        {/* ═══ Database Tab ═══ */}
        {activeTab === 'database' && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
              <input
                type="text"
                placeholder="Search drug database..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-stone-900/60 border border-stone-700/40 rounded-xl text-stone-200 placeholder-stone-500 focus:border-stone-600/60 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              {allDrugs.map(([key, drug]) => {
                const interactionCount = Object.keys(INTERACTIONS).filter(k => k.includes(key)).length;
                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-stone-900/60 border border-stone-700/40 rounded-xl p-4 hover:border-stone-600/60 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{drug.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-stone-200">{drug.name}</h3>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-800 text-stone-400">
                            {drug.class}
                          </span>
                          {interactionCount > 0 && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-900/40 text-amber-400">
                              {interactionCount} interactions
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">{drug.mechanism}</p>
                      </div>
                      <button onClick={() => { addDrug(key); setActiveTab('checker'); }}
                              className="px-3 py-1.5 rounded-lg text-xs bg-stone-800 border border-stone-700/50 text-stone-400 hover:text-stone-200 transition-all flex items-center gap-1">
                        <Plus className="h-3 w-3" /> Add
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
