import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  RefreshCw,
  Brain,
  Stethoscope,
  Heart,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Star,
  Award,
  Clock,
  User,
  Thermometer,
  Droplets,
  Wind,
  Eye,
  Ear,
  Bone,
  Zap,
  FileText,
  TestTube,
  Pill,
  ArrowUpRight,
  Sparkles,
  Lightbulb,
  Target,
  BarChart3,
  TrendingUp,
  Search,
  Filter,
  Shuffle,
  Play,
  RotateCcw,
  BookOpen,
} from 'lucide-react';

// ─── Medical Case Database ──────────────────────────────────────────────────
const MEDICAL_CASES = [
  {
    id: 'case-1',
    title: 'Chest Pain in a 55-Year-Old Male',
    specialty: 'Cardiology',
    difficulty: 'intermediate',
    icon: '❤️',
    color: '#ef4444',
    presentingComplaint: 'A 55-year-old male presents to the emergency department with acute onset chest pain radiating to the left arm, associated with diaphoresis and shortness of breath for the past 2 hours.',
    patientDemographics: { age: 55, sex: 'Male', occupation: 'Office worker', bmi: 28 },
    vitals: {
      bloodPressure: '150/95 mmHg',
      heartRate: '102 bpm',
      temperature: '37.1°C',
      respiratoryRate: '22/min',
      oxygenSaturation: '94% on room air',
      painScale: '8/10',
    },
    history: {
      presentIllness: 'Crushing substernal chest pain, 8/10 intensity, radiating to left arm and jaw. Started while climbing stairs. Associated with nausea, diaphoresis, and mild dyspnea. No alleviating factors. Took aspirin 325mg at home.',
      pastMedical: ['Hypertension (8 years)', 'Type 2 Diabetes Mellitus (5 years)', 'Hyperlipidemia'],
      medications: ['Lisinopril 20mg daily', 'Metformin 1000mg BID', 'Atorvastatin 40mg daily'],
      familyHistory: 'Father — MI at age 52, died at 60. Mother — Hypertension.',
      socialHistory: 'Smoker (1 pack/day × 20 years), occasional alcohol, sedentary lifestyle',
      allergies: 'NKDA',
    },
    physicalExam: [
      { system: 'General', finding: 'Anxious, diaphoretic, clutching chest' },
      { system: 'Cardiovascular', finding: 'Tachycardic, regular rhythm, S1/S2 normal, no murmurs/rubs/gallops, bilateral pedal edema 1+' },
      { system: 'Respiratory', finding: 'Mild bilateral basal crackles, no wheezing' },
      { system: 'Abdomen', finding: 'Soft, non-tender, no organomegaly' },
      { system: 'Neuro', finding: 'Alert, oriented ×3, no focal deficits' },
    ],
    Investigations: [
      { name: '12-Lead ECG', result: 'ST-segment elevation in leads II, III, aVF; reciprocal ST depression in I, aVL', critical: true },
      { name: 'Troponin I', result: '4.8 ng/mL (normal <0.04)', critical: true },
      { name: 'CK-MB', result: '45 U/L (normal <25)', critical: false },
      { name: 'CBC', result: 'WBC 11.2, Hb 14.1, Platelets 245', critical: false },
      { name: 'BMP', result: 'Glucose 186, Creatinine 1.1, K+ 4.2', critical: false },
      { name: 'BNP', result: '180 pg/mL (mildly elevated)', critical: false },
      { name: 'Chest X-Ray', result: 'Mild cardiomegaly, no acute infiltrates', critical: false },
    ],
    differentials: [
      { diagnosis: 'ST-Elevation Myocardial Infarction (STEMI)', probability: 85, isPrimary: true, explanation: 'Classic presentation: crushing chest pain with radiation, ST elevation in inferior leads, elevated troponin. Risk factors: male, HTN, DM, smoking, family history.' },
      { diagnosis: 'NSTEMI', probability: 5, isPrimary: false, explanation: 'Less likely given ST elevation on ECG, but NSTEMI can present similarly.' },
      { diagnosis: 'Unstable Angina', probability: 3, isPrimary: false, explanation: 'Would not explain the significant troponin elevation.' },
      { diagnosis: 'Aortic Dissection', probability: 3, isPrimary: false, explanation: 'Can cause chest pain but typically tearing quality. BP difference between arms would be expected. CT angiography to rule out.' },
      { diagnosis: 'Pulmonary Embolism', probability: 2, isPrimary: false, explanation: 'Can cause chest pain and tachycardia, but ECG changes and troponin pattern favor ACS.' },
      { diagnosis: 'GERD/Esophageal Spasm', probability: 1, isPrimary: false, explanation: 'Can mimic cardiac pain but would not explain ECG changes or elevated troponin.' },
      { diagnosis: 'Pericarditis', probability: 1, isPrimary: false, explanation: 'Can cause chest pain with ECG changes, but typically positional and diffuse ST elevation.' },
    ],
    managementSteps: [
      { step: 'Immediate: Aspirin 325mg chewed', rationale: 'Antiplatelet therapy — reduces mortality in ACS', priority: 'critical' },
      { step: 'IV access, cardiac monitoring, supplemental O₂ if SpO₂ <94%', rationale: 'Standard emergency department protocol', priority: 'critical' },
      { step: 'Nitroglycerin 0.4mg SL (if SBP >90)', rationale: 'Vasodilation, reduces preload and myocardial oxygen demand', priority: 'high' },
      { step: 'Morphine 2-4mg IV for pain relief', rationale: 'Analgesia and anxiolysis', priority: 'high' },
      { step: 'Heparin bolus + infusion', rationale: 'Anticoagulation to prevent further thrombosis', priority: 'high' },
      { step: 'Emergency PCI (Percutaneous Coronary Intervention)', rationale: 'Primary PCI is the gold standard for STEMI — door-to-balloon <90 minutes', priority: 'critical' },
      { step: 'Dual antiplatelet therapy (Aspirin + Clopidogrel/Ticagrelor)', rationale: 'Reduces stent thrombosis and recurrent events', priority: 'high' },
      { step: 'Beta-blocker (if hemodynamically stable)', rationale: 'Reduces myocardial oxygen demand, antiarrhythmic', priority: 'medium' },
      { step: 'Statins, ACE inhibitor, cardiac rehab referral', rationale: 'Secondary prevention and long-term management', priority: 'medium' },
    ],
    teachingPoints: [
      'STEMI is a clinical emergency requiring immediate reperfusion therapy',
      'The 12-lead ECG is the most important initial diagnostic tool',
      'Door-to-balloon time target: <90 minutes for primary PCI',
      'Inferior STEMI (II, III, aVF) may have right ventricular involvement — check right-sided leads',
      'Troponin is the gold standard biomarker for myocardial injury',
      'Dual antiplatelet therapy is essential for at least 12 months post-PCI',
    ],
    learningObjectives: [
      'Recognize the classic presentation of STEMI',
      'Interpret 12-lead ECG findings in acute coronary syndrome',
      'Apply the MONA protocol (Morphine, Oxygen, Nitrates, Aspirin)',
      'Understand indications for emergency PCI vs thrombolysis',
      'Identify cardiovascular risk factors and their management',
    ],
  },
  {
    id: 'case-2',
    title: 'Confusion in an Elderly Woman',
    specialty: 'Internal Medicine',
    difficulty: 'advanced',
    icon: '🧠',
    color: '#8b5cf6',
    presentingComplaint: 'An 82-year-old woman brought in by her daughter for increasing confusion over the past 3 days. She was her baseline self last week but has become disoriented, agitated, and has had decreased oral intake.',
    patientDemographics: { age: 82, sex: 'Female', occupation: 'Retired teacher', bmi: 21 },
    vitals: {
      bloodPressure: '100/60 mmHg',
      heartRate: '110 bpm',
      temperature: '38.4°C',
      respiratoryRate: '20/min',
      oxygenSaturation: '96%',
      painScale: 'N/A',
    },
    history: {
      presentIllness: 'Progressive confusion ×3 days. Daughter noticed patient repeating questions, unable to recognize family members, and becoming increasingly agitated at night. Decreased food and fluid intake. No focal weakness, seizures, or head trauma. Last normal was 1 week ago.',
      pastMedical: ['Dementia (moderate, diagnosed 3 years ago)', 'Hypertension', 'Osteoarthritis', 'Hypothyroidism'],
      medications: ['Donepezil 10mg daily', 'Levothyroxine 50mcg daily', 'Amlodipine 5mg daily', 'Paracetamol PRN'],
      familyHistory: 'Husband deceased (stroke), no family history of neurological disease',
      socialHistory: 'Lives with daughter, former smoker (quit 30 years ago), no alcohol',
      allergies: 'Penicillin (rash)',
    },
    physicalExam: [
      { system: 'General', finding: 'Thin, disheveled, appears older than stated age, agitated' },
      { system: 'Neurological', finding: 'Alert but not oriented to place/time. Montreal Cognitive Assessment: 14/30. No focal deficits. No meningeal signs. Mild generalized rigidity.' },
      { system: 'Cardiovascular', finding: 'Tachycardic, regular, soft systolic murmur at apex, no JVD' },
      { system: 'Respiratory', finding: 'Clear to auscultate bilaterally' },
      { system: 'Abdomen', finding: 'Soft, mild suprapubic tenderness, no rebound' },
      { system: 'Skin', finding: 'Warm, dry, poor turgor, no rashes' },
      { system: 'Extremities', finding: 'Mild bilateral pedal edema' },
    ],
    Investigations: [
      { name: 'CBC', result: 'WBC 14.8 (left shift), Hb 11.2, Platelets 280', critical: false },
      { name: 'BMP', result: 'Na+ 128, K+ 4.8, Cr 1.8 (baseline 1.1), BUN 45, Glucose 92', critical: true },
      { name: 'Urinalysis', result: 'Cloudy, >100 WBC/hpf, bacteria+, nitrites positive', critical: true },
      { name: 'Blood Cultures', result: 'Pending', critical: false },
      { name: 'CT Head (non-contrast)', result: 'No acute hemorrhage. Global atrophy consistent with known dementia.', critical: false },
      { name: 'TSH', result: '4.8 (slightly elevated)', critical: false },
      { name: 'Lactate', result: '2.8 mmol/L (mildly elevated)', critical: false },
      { name: 'Ammonia', result: 'Normal', critical: false },
    ],
    differentials: [
      { diagnosis: 'Delirium secondary to UTI', probability: 70, isPrimary: true, explanation: 'Classic presentation: acute confusion in elderly with UTI risk factors (female, catheter history). Pyuria, bacteriuria, fever, leukocytosis all support. AKI from dehydration may worsen confusion.' },
      { diagnosis: 'Sepsis (UTI source)', probability: 15, isPrimary: false, explanation: 'Fever, tachycardia, elevated WBC, and lactate suggest early sepsis. Source appears to be urinary tract.' },
      { diagnosis: 'Acute on Chronic Kidney Disease', probability: 10, isPrimary: false, explanation: 'Creatinine elevated above baseline. Dehydration and sepsis can cause AKI. Uremia can worsen confusion.' },
      { diagnosis: 'Hypoglycemia', probability: 2, isPrimary: false, explanation: 'Glucose 92, so unlikely primary cause but always check in confused elderly.' },
      { diagnosis: 'Stroke/TIA', probability: 2, isPrimary: false, explanation: 'No focal neurological deficits, CT normal. Less likely.' },
      { diagnosis: 'Medication Side Effects', probability: 1, isPrimary: false, explanation: 'Donepezil can cause GI upset but not typically delirium. Hyponatremia could contribute.' },
    ],
    managementSteps: [
      { step: 'IV fluid resuscitation (NS bolus)', rationale: 'Correct dehydration, improve renal function, treat sepsis', priority: 'critical' },
      { step: 'Empiric antibiotics (Ciprofloxacin or Ceftriaxone)', rationale: 'Treat UTI — penicillin allergy noted, avoid penicillins', priority: 'critical' },
      { step: 'Correct hyponatremia slowly (max 8-10 mEq/L/24h)', rationale: 'Risk of osmotic demyelination if corrected too rapidly', priority: 'high' },
      { step: 'Urinary catheter if retention suspected', rationale: 'Ensure drainage, obtain culture', priority: 'medium' },
      { step: 'Disorienting stimuli reduction (clock, photos, family)', rationale: 'Non-pharmacological delirium management', priority: 'medium' },
      { step: 'Avoid anticholinergics, benzodiazepines', rationale: 'Can worsen delirium in elderly', priority: 'high' },
      { step: 'Monitor vitals, I&O, renal function q12h', rationale: 'Track response to treatment', priority: 'high' },
      { step: 'Reassess mental status daily', rationale: 'Delirium should improve as infection resolves', priority: 'medium' },
    ],
    teachingPoints: [
      'Delirium is an acute, fluctuating disturbance of consciousness — always look for a cause',
      'UTI is the most common cause of delirium in elderly women',
      'The Confusion Assessment Method (CAM) helps diagnose delirium',
      'Hyponatremia can worsen neurological symptoms — correct slowly',
      'Delirium superimposed on dementia is common and often missed',
      'Prevention: hydration, mobilization, sleep hygiene, minimizing polypharmacy',
    ],
    learningObjectives: [
      'Differentiate delirium from dementia and depression',
      'Identify common precipitants of delirium in the elderly',
      'Apply the Confusion Assessment Method (CAM) criteria',
      'Manage hyponatremia safely in delirious patients',
      'Understand the role of UTI as a delirium trigger',
    ],
  },
  {
    id: 'case-3',
    title: 'Shortness of Breath in a Young Asthmatic',
    specialty: 'Pulmonology',
    difficulty: 'beginner',
    icon: '🫁',
    color: '#06b6d4',
    presentingComplaint: 'A 24-year-old female presents with worsening shortness of breath, wheezing, and cough for 2 days. She has a history of asthma and reports using her rescue inhaler every 2 hours today.',
    patientDemographics: { age: 24, sex: 'Female', occupation: 'Graduate student', bmi: 23 },
    vitals: {
      bloodPressure: '128/82 mmHg',
      heartRate: '118 bpm',
      temperature: '37.0°C',
      respiratoryRate: '28/min',
      oxygenSaturation: '91% on room air',
      painScale: '3/10 (chest tightness)',
    },
    history: {
      presentIllness: 'Worsening dyspnea and wheezing ×2 days. Cough productive of small amounts of clear/white sputum. Using salbutamol inhaler q2h without sustained relief. No fever. Reports recent viral upper respiratory infection (cold symptoms 5 days ago). Missed her preventive fluticasone for the past week due to running out.',
      pastMedical: ['Persistent asthma (diagnosed age 8)', 'Allergic rhinitis', 'Eczema'],
      medications: ['Salbutamol MDI PRN', 'Fluticasone 250mcg BID (ran out 1 week ago)', 'Cetirizine 10mg daily'],
      familyHistory: 'Mother — asthma, Father — allergic rhinitis',
      socialHistory: 'Non-smoker, no pets, lives in urban apartment, exercise-induced symptoms',
      allergies: 'Aspirin (worsens asthma)',
    },
    physicalExam: [
      { system: 'General', finding: 'Sitting upright, speaking in short phrases, using accessory muscles, visibly distressed' },
      { system: 'Respiratory', finding: 'Bilateral expiratory wheezing, prolonged expiratory phase, reduced air entry bilaterally, no crackles' },
      { system: 'Cardiovascular', finding: 'Tachycardic, regular, no murmurs, no JVD' },
      { system: 'Peak Flow', result: '180 L/min (personal best: 450 L/min) — 40% predicted' },
      { system: 'SpO₂', result: '91% on room air' },
    ],
    Investigations: [
      { name: 'Peak Expiratory Flow', result: '180 L/min (40% of personal best) — SEVERE exacerbation', critical: true },
      { name: 'Arterial Blood Gas', result: 'pH 7.35, PaCO₂ 38, PaO₂ 68, HCO₃⁻ 22 — normal PaCO₂ in setting of tachypnea suggests fatigue', critical: true },
      { name: 'CBC', result: 'WBC 12.0 with eosinophilia (8%)', critical: false },
      { name: 'Chest X-Ray', result: 'Hyperinflation, no infiltrates, no pneumothorax', critical: false },
      { name: 'Serum IgE', result: 'Elevated at 450 IU/mL', critical: false },
    ],
    differentials: [
      { diagnosis: 'Acute Severe Asthma Exacerbation', probability: 85, isPrimary: true, explanation: 'Classic presentation: known asthmatic, recent URI trigger, medication non-compliance, severe symptoms, peak flow <50% predicted. Normal PaCO₂ is ominous — indicates fatigue.' },
      { diagnosis: 'Asthma with Respiratory Failure Risk', probability: 10, isPrimary: false, explanation: 'Peak flow 40% and normal CO₂ suggest impending respiratory failure. Requires aggressive treatment and ICU consideration.' },
      { diagnosis: 'Pneumonia', probability: 3, isPrimary: false, explanation: 'No fever, clear chest X-ray. Less likely but URI can trigger exacerbation.' },
      { diagnosis: 'Foreign Body Aspiration', probability: 1, isPrimary: false, explanation: 'Unlikely in this age group with gradual onset.' },
      { diagnosis: 'Anaphylaxis', probability: 1, isPrimary: false, explanation: 'No urticaria, angioedema, or known allergen exposure.' },
    ],
    managementSteps: [
      { step: 'Supplemental O₂ to maintain SpO₂ 94-98%', rationale: 'Hypoxia correction — target 94-98% in asthma', priority: 'critical' },
      { step: 'Nebulized salbutamol 5mg q20min ×3, then q1-4h', rationale: 'First-line bronchodilator for acute severe asthma', priority: 'critical' },
      { step: 'Ipratropium bromide 500mcg nebulized q20min ×3', rationale: 'Anticholinergic bronchodilator — adds to beta-agonist effect', priority: 'critical' },
      { step: 'Systemic corticosteroids (Prednisolone 50mg PO or Hydrocortisone 100mg IV)', rationale: 'Reduces airway inflammation, prevents relapse', priority: 'critical' },
      { step: 'IV magnesium sulfate 2g over 20min', rationale: 'Bronchodilator for severe asthma not responding to initial treatment', priority: 'high' },
      { step: 'Continuous nebulization if not improving', rationale: 'Continuous salbutamol for severe/life-threatening exacerbation', priority: 'high' },
      { step: 'Consider ICU/HDU if deteriorating (rising CO₂, falling consciousness)', rationale: 'Impending respiratory failure requires close monitoring', priority: 'critical' },
      { step: 'Restart fluticasone and provide spacer technique education', rationale: 'Prevent future exacerbations, address medication non-compliance', priority: 'medium' },
    ],
    teachingPoints: [
      'A peak flow <50% personal best = severe exacerbation requiring emergency treatment',
      'A NORMAL PaCO₂ in a tachypneic asthma patient is alarming — suggests fatigue and impending failure',
      'The "silent chest" is a danger sign — no wheezing means no air movement',
      'Nebulized beta-agonists + anticholinergics + systemic steroids = first-line treatment',
      'IV magnesium sulfate is indicated for severe exacerbations not responding to initial therapy',
      'Always check inhaler technique and medication compliance',
    ],
    learningObjectives: [
      'Classify asthma exacerbation severity using peak flow and clinical signs',
      'Recognize ominous signs: normal CO₂, silent chest, fatigue',
      'Apply the stepwise emergency management of acute severe asthma',
      'Understand when to escalate to ICU-level care',
      'Address medication compliance and inhaler technique',
    ],
  },
  {
    id: 'case-4',
    title: 'Abdominal Pain in a Pregnant Woman',
    specialty: 'Obstetrics',
    difficulty: 'advanced',
    icon: '🤰',
    color: '#ec4899',
    presentingComplaint: 'A 32-year-old G2P1 woman at 28 weeks gestation presents with sudden onset severe right upper quadrant pain, headache, and visual disturbances for 6 hours.',
    patientDemographics: { age: 32, sex: 'Female', occupation: 'Accountant', bmi: 32 },
    vitals: {
      bloodPressure: '160/100 mmHg',
      heartRate: '98 bpm',
      temperature: '36.8°C',
      respiratoryRate: '18/min',
      oxygenSaturation: '98%',
      painScale: '7/10',
    },
    history: {
      presentIllness: 'Sudden severe RUQ pain radiating to right shoulder, associated with throbbing headache and visual changes (blurring and seeing spots). No vaginal bleeding or contractions. Fetal movements present but decreased.',
      pastMedical: ['Gestational diabetes (diet-controlled)', 'Mild pre-eclampsia diagnosed at 24 weeks'],
      medications: ['Prenatal vitamins', 'Calcium supplement', 'Metformin 500mg BID'],
      familyHistory: 'Mother — hypertension, preeclampsia in first pregnancy',
      socialHistory: 'Non-smoker, non-drinker, desk job',
      allergies: 'NKDA',
    },
    physicalExam: [
      { system: 'General', finding: 'Distressed, holding RUQ, mild jaundice noted' },
      { system: 'Abdomen', finding: 'Uterus at 28 weeks, tender RUQ, hepatomegaly palpable, Murphy sign equivocal, no rebound' },
      { system: 'Neurological', finding: 'Hyperreflexia (3+), no clonus, no focal deficits, mentation normal' },
      { system: 'Fundoscopy', finding: 'Bilateral papilledema, arteriolar spasm' },
      { system: 'Extremities', finding: 'Marked pitting edema (3+) bilateral' },
    ],
    Investigations: [
      { name: 'BP Serial', result: '160/100 → 168/105 → 172/108 (rising)', critical: true },
      { name: 'ALT', result: '380 U/L (normal <40)', critical: true },
      { name: 'AST', result: '290 U/L (normal <40)', critical: true },
      { name: 'Bilirubin', result: '3.2 mg/dL (elevated)', critical: true },
      { name: 'Platelets', result: '95,000/μL (thrombocytopenia)', critical: true },
      { name: 'LDH', result: '680 U/L (elevated)', critical: false },
      { name: 'Uric Acid', result: '7.8 mg/dL (elevated)', critical: false },
      { name: 'Urinalysis', result: 'Protein 2+, no infection', critical: false },
      { name: 'Fetal NST', result: 'Non-reactive, reduced variability', critical: true },
    ],
    differentials: [
      { diagnosis: 'HELLP Syndrome (severe pre-eclampsia)', probability: 80, isPrimary: true, explanation: 'Hemolysis (elevated LDH), Elevated Liver enzymes (ALT/AST >2× ULN), Low Platelets (<100K). Triad with severe pre-eclampsia features: HTN, proteinuria, RUQ pain, visual changes, edema.' },
      { diagnosis: 'Severe Pre-eclampsia', probability: 15, isPrimary: false, explanation: 'HTN >160/110, proteinuria, visual changes, headache — pre-eclampsia criteria met. HELLP is a severe variant.' },
      { diagnosis: 'Acute Fatty Liver of Pregnancy', probability: 3, isPrimary: false, explanation: 'Can cause RUQ pain and liver dysfunction, but HELLP more likely with thrombocytopenia and hemolysis.' },
      { diagnosis: 'Cholecystitis', probability: 1, isPrimary: false, explanation: 'RUQ pain in pregnancy, but liver enzymes pattern and thrombocytopenia point to HELLP.' },
      { diagnosis: 'Hemolysis (other causes)', probability: 1, isPrimary: false, explanation: 'No schistocytes mentioned, but HELLP is most likely in this clinical context.' },
    ],
    managementSteps: [
      { step: 'Immediate delivery (C-section at 28 weeks)', rationale: 'Definitive treatment of HELLP — delivery is the cure. Maternal-fetal risk assessment favors delivery.', priority: 'critical' },
      { step: 'IV Magnesium sulfate (loading 4g, then 1-2g/hr)', rationale: 'Prevent eclamptic seizures — monitor reflexes and respiratory rate', priority: 'critical' },
      { step: 'IV Labetalol or Hydralazine for BP control', rationale: 'Target SBP <160, DBP <110 to prevent stroke', priority: 'critical' },
      { step: 'Corticosteroids (Betamethasone 12mg ×2 doses)', rationale: 'Fetal lung maturity at 28 weeks — give at least 24h before delivery if possible', priority: 'high' },
      { step: 'Platelet transfusion if <50K or active bleeding', rationale: 'Risk of hemorrhage with delivery', priority: 'high' },
      { step: 'ICU admission for mother', rationale: 'Close monitoring for HELLP complications, DIC, liver rupture', priority: 'critical' },
      { step: 'Neonatal team at delivery for premature infant', rationale: '28-week neonate requires NICU care', priority: 'critical' },
      { step: 'Monitor for DIC, liver hematoma, renal failure', rationale: 'HELLP can progress even postpartum', priority: 'high' },
    ],
    teachingPoints: [
      'HELLP syndrome is a life-threatening complication of pregnancy — H=Hemolysis, EL=Elevated Liver enzymes, LP=Low Platelets',
      'RUQ pain in pre-eclamptic patients should raise immediate concern for HELLP',
      'Visual changes + severe headache = warning signs for eclampsia',
      'Delivery is the only definitive treatment for HELLP/pre-eclampsia',
      'Magnesium sulfate is the drug of choice for seizure prophylaxis',
      'HELLP can worsen for 24-48 hours postpartum — do not let your guard down',
    ],
    learningObjectives: [
      'Recognize HELLP syndrome diagnostic criteria',
      'Understand the urgency of delivery in severe pre-eclampsia/HELLP',
      'Apply magnesium sulfate for seizure prophylaxis',
      'Manage hypertensive emergencies in pregnancy',
      'Coordinate multidisciplinary team for premature delivery',
    ],
  },
  {
    id: 'case-5',
    title: 'Fever and Rash in a Traveler',
    specialty: 'Infectious Disease',
    difficulty: 'intermediate',
    icon: '🌍',
    color: '#f59e0b',
    presentingComplaint: 'A 35-year-old male returns from a 2-week trip to Nigeria 5 days ago with high fever, headache, body aches, and a maculopapular rash that started on his trunk and is spreading.',
    patientDemographics: { age: 35, sex: 'Male', occupation: 'Journalist', bmi: 25 },
    vitals: {
      bloodPressure: '110/70 mmHg',
      heartRate: '105 bpm',
      temperature: '39.2°C',
      respiratoryRate: '20/min',
      oxygenSaturation: '97%',
      painScale: '6/10',
    },
    history: {
      presentIllness: 'Fever ×3 days (up to 39.5°C), severe retro-orbital headache, generalized myalgias, and a maculopapular rash that started on his trunk 1 day ago and is now spreading to extremities. Mild nausea, no vomiting or diarrhea. No cough or respiratory symptoms.',
      pastMedical: ['No significant past medical history'],
      medications: ['Multivitamin', 'Ibuprofen PRN'],
      familyHistory: 'Non-contributory',
      socialHistory: 'Traveled to Lagos, Nigeria for 2 weeks. Stayed in urban hotel but visited rural areas. Used DEET mosquito repellent inconsistently. No antimalarial prophylaxis taken.',
      allergies: 'NKDA',
    },
    physicalExam: [
      { system: 'General', finding: 'Febrile, uncomfortable, mild jaundice' },
      { system: 'Skin', finding: 'Maculopapular rash on trunk spreading to extremities, palms and soles involved, some lesions blanching' },
      { system: 'HEENT', finding: 'Conjunctival injection, retro-orbital tenderness, pharynx mild erythema' },
      { system: 'Abdomen', finding: 'Mild hepatosplenomegaly' },
      { system: 'Lymph nodes', finding: 'Generalized lymphadenopathy (cervical, axillary, inguinal)' },
    ],
    Investigations: [
      { name: 'Malaria Smear (thick and thin)', result: 'Positive — Plasmodium falciparum, parasitemia 3%', critical: true },
      { name: 'Rapid Malaria Test', result: 'Positive for P. falciparum', critical: true },
      { name: 'CBC', result: 'WBC 3.8, Hb 10.5, Platelets 85,000', critical: true },
      { name: 'BMP', result: 'Mildly elevated creatinine 1.4', critical: false },
      { name: 'LDH', result: 'Elevated at 580', critical: false },
      { name: 'Liver Function', result: 'ALT 95, AST 110, Bilirubin 2.8', critical: false },
      { name: 'Blood Cultures', result: 'Pending', critical: false },
      { name: 'Dengue NS1 Antigen', result: 'Negative', critical: false },
    ],
    differentials: [
      { diagnosis: 'Malaria (P. falciparum)', probability: 85, isPrimary: true, explanation: 'Travel to endemic area, no prophylaxis, fever, rash, thrombocytopenia, hepatosplenomegaly. Thick smear confirms P. falciparum with 3% parasitemia.' },
      { diagnosis: 'Dengue Fever', probability: 5, isPrimary: false, explanation: 'Can present similarly in returning travelers, but NS1 negative and malaria confirmed.' },
      { diagnosis: 'Rickettsial Infection (Typhus)', probability: 5, isPrimary: false, explanation: 'Fever, rash, travel history — but malaria confirmed on smear.' },
      { diagnosis: 'Typhoid Fever', probability: 3, isPrimary: false, explanation: 'Fever in traveler, but rash pattern and malaria confirmation point elsewhere.' },
      { diagnosis: 'Measles', probability: 2, isPrimary: false, explanation: 'Fever + rash, but palms/soles involvement and malaria positive.' },
    ],
    managementSteps: [
      { step: 'IV Artesunate (first-line for severe P. falciparum)', rationale: 'WHO-recommended treatment for severe malaria — superior to quinine', priority: 'critical' },
      { step: 'Transfer to ICU if parasitemia >5% or organ dysfunction', rationale: 'High parasitemia = severe malaria = ICU-level care', priority: 'critical' },
      { step: 'Oral Artemether-Lumefantrine (Coartem) after IV course', rationale: 'Complete treatment with oral ACT when able to tolerate', priority: 'high' },
      { step: 'Aggressive IV hydration', rationale: 'Prevent renal failure from hemolysis and dehydration', priority: 'high' },
      { step: 'Monitor parasitemia q12h until clearance', rationale: 'Track treatment response', priority: 'high' },
      { step: 'Exchange transfusion if parasitemia >10% or deteriorating', rationale: 'Reduces parasite burden in severe cases', priority: 'high' },
      { step: 'Treat fever with paracetamol (avoid aspirin — thrombocytopenia)', rationale: 'Antipyretic, avoid bleeding risk', priority: 'medium' },
      { step: 'Public health notification', rationale: 'Malaria is a reportable disease', priority: 'medium' },
    ],
    teachingPoints: [
      'P. falciparum malaria can be rapidly fatal — always check for severe malaria criteria',
      'Severe malaria: parasitemia >5%, organ dysfunction, severe anemia, cerebral malaria',
      'IV artesunate is the gold standard for severe P. falciparum malaria',
      'The "trip of death" — travelers who skip antimalarial prophylaxis are at highest risk',
      'Rash in malaria is not common but can occur — don\'t be fooled into thinking "it can\'t be malaria"',
      'Always obtain thick and thin blood smears for fever in returning travelers',
    ],
    learningObjectives: [
      'Recognize malaria in returning travelers',
      'Classify malaria severity and determine treatment setting',
      'Apply WHO-recommended treatment for severe P. falciparum malaria',
      'Understand the importance of antimalarial prophylaxis',
      'Differentiate malaria from other tropical febrile illnesses',
    ],
  },
];

// ─── Components ─────────────────────────────────────────────────────────────

function CaseCard({ caseData, onStart, delay = 0 }) {
  const difficultyColors = {
    beginner: { bg: 'bg-emerald-900/30', text: 'text-emerald-400', border: 'border-emerald-700/40' },
    intermediate: { bg: 'bg-amber-900/30', text: 'text-amber-400', border: 'border-amber-700/40' },
    advanced: { bg: 'bg-red-900/30', text: 'text-red-400', border: 'border-red-700/40' },
  };
  const dc = difficultyColors[caseData.difficulty] || difficultyColors.intermediate;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="bg-stone-900/60 border border-stone-700/40 rounded-2xl p-5 hover:border-stone-600/60 transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{caseData.icon}</span>
          <div>
            <h3 className="font-semibold text-stone-200 text-sm">{caseData.title}</h3>
            <p className="text-xs text-stone-400">{caseData.specialty}</p>
          </div>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${dc.bg} ${dc.text}`}>
          {caseData.difficulty}
        </span>
      </div>

      <p className="text-xs text-stone-400 mb-4 leading-relaxed line-clamp-3">{caseData.presentingComplaint}</p>

      <div className="flex items-center gap-4 text-[10px] text-stone-500 mb-4">
        <span className="flex items-center gap-1"><User className="h-3 w-3" /> {caseData.patientDemographics.age}y {caseData.patientDemographics.sex}</span>
        <span className="flex items-center gap-1"><Thermometer className="h-3 w-3" /> {caseData.vitals.temperature}</span>
        <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {caseData.vitals.heartRate}</span>
      </div>

      <button
        onClick={() => onStart(caseData)}
        className="w-full py-2.5 rounded-xl text-sm font-medium text-white transition-all flex items-center justify-center gap-2 hover:opacity-90"
        style={{ backgroundColor: caseData.color }}
      >
        <Play className="h-4 w-4" /> Start Case
      </button>
    </motion.div>
  );
}

function ClinicalCase({ caseData, onComplete }) {
  const [phase, setPhase] = useState('presentation'); // presentation → history → exam → investigations → diagnosis → management → complete
  const [diagnosisScore, setDiagnosisScore] = useState(0);
  const [selectedDifferentials, setSelectedDifferentials] = useState([]);
  const [managementSteps, setManagementSteps] = useState([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [totalScore, setTotalScore] = useState(0);

  const phases = [
    { id: 'presentation', label: 'Presenting Complaint', icon: User },
    { id: 'history', label: 'History', icon: FileText },
    { id: 'exam', label: 'Physical Exam', icon: Stethoscope },
    { id: 'investigations', label: 'Investigations', icon: TestTube },
    { id: 'diagnosis', label: 'Diagnosis', icon: Brain },
    { id: 'management', label: 'Management', icon: Pill },
  ];

  const currentPhaseIndex = phases.findIndex(p => p.id === phase);

  const handleDiagnosisSubmit = () => {
    const primary = caseData.differentials.find(d => d.isPrimary);
    const selected = selectedDifferentials.includes(primary.diagnosis);
    const score = selected ? 100 : 0;
    setDiagnosisScore(score);
    setTotalScore(prev => prev + score);
    setShowExplanation(true);
  };

  const handleManagementSubmit = () => {
    const criticalSteps = caseData.managementSteps.filter(s => s.priority === 'critical');
    const selectedCritical = managementSteps.filter(s => criticalSteps.some(cs => cs.step === s));
    const score = Math.round((selectedCritical.length / criticalSteps.length) * 100);
    setTotalScore(prev => prev + score);
    setPhase('complete');
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Phase Progress */}
      <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-2">
        {phases.map((p, i) => {
          const isActive = p.id === phase;
          const isPast = i < currentPhaseIndex;
          return (
            <button
              key={p.id}
              onClick={() => !isPast && setPhase(p.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                isActive ? 'bg-stone-700 text-stone-100' :
                isPast ? 'bg-stone-800/60 text-emerald-400' :
                'text-stone-500'
              }`}
              disabled={!isPast}
            >
              {isPast ? <CheckCircle className="h-3 w-3" /> : <p.icon className="h-3 w-3" />}
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Phase Content */}
      <AnimatePresence mode="wait">
        {/* Presentation */}
        {phase === 'presentation' && (
          <motion.div key="presentation" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
            <div className="bg-stone-900/60 border border-stone-700/40 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5" style={{ color: caseData.color }} />
                <h2 className="text-lg font-bold text-stone-100">Presenting Complaint</h2>
              </div>
              <p className="text-sm text-stone-300 leading-relaxed mb-6">{caseData.presentingComplaint}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {Object.entries(caseData.vitals).map(([key, val]) => (
                  <div key={key} className="p-3 bg-stone-800/60 rounded-xl">
                    <p className="text-[10px] text-stone-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                    <p className="text-sm font-bold text-stone-200">{val}</p>
                  </div>
                ))}
              </div>
              <button onClick={() => setPhase('history')} className="px-4 py-2 rounded-xl text-sm font-medium bg-stone-700 text-stone-200 hover:bg-stone-600 transition-all flex items-center gap-2">
                Take History <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* History */}
        {phase === 'history' && (
          <motion.div key="history" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
            <div className="bg-stone-900/60 border border-stone-700/40 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-blue-400" />
                <h2 className="text-lg font-bold text-stone-100">Clinical History</h2>
              </div>
              <div className="space-y-4">
                {Object.entries(caseData.history).map(([key, val]) => (
                  <div key={key}>
                    <h3 className="text-sm font-semibold text-stone-200 mb-1 capitalize">{key.replace(/([A-Z])/g, ' $1')}</h3>
                    {Array.isArray(val) ? (
                      <ul className="list-disc list-inside text-xs text-stone-400 space-y-0.5">
                        {val.map((item, i) => <li key={i}>{item}</li>)}
                      </ul>
                    ) : (
                      <p className="text-xs text-stone-400 leading-relaxed">{val}</p>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={() => setPhase('exam')} className="mt-6 px-4 py-2 rounded-xl text-sm font-medium bg-stone-700 text-stone-200 hover:bg-stone-600 transition-all flex items-center gap-2">
                Examine Patient <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Physical Exam */}
        {phase === 'exam' && (
          <motion.div key="exam" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
            <div className="bg-stone-900/60 border border-stone-700/40 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Stethoscope className="h-5 w-5 text-emerald-400" />
                <h2 className="text-lg font-bold text-stone-100">Physical Examination</h2>
              </div>
              <div className="space-y-3">
                {caseData.physicalExam.map((item, i) => (
                  <div key={i} className="p-3 bg-stone-800/60 rounded-xl flex items-start gap-3">
                    <span className="text-sm font-semibold text-stone-200 w-24 shrink-0">{item.system}</span>
                    <p className="text-xs text-stone-400 leading-relaxed">{item.finding || item.result}</p>
                  </div>
                ))}
              </div>
              <button onClick={() => setPhase('investigations')} className="mt-6 px-4 py-2 rounded-xl text-sm font-medium bg-stone-700 text-stone-200 hover:bg-stone-600 transition-all flex items-center gap-2">
                Order Investigations <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Investigations */}
        {phase === 'investigations' && (
          <motion.div key="investigations" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
            <div className="bg-stone-900/60 border border-stone-700/40 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <TestTube className="h-5 w-5 text-amber-400" />
                <h2 className="text-lg font-bold text-stone-100">Investigations</h2>
              </div>
              <div className="space-y-2">
                {caseData.Investigations.map((inv, i) => (
                  <div key={i} className={`p-3 rounded-xl flex items-center justify-between ${inv.critical ? 'bg-red-900/20 border border-red-700/30' : 'bg-stone-800/60'}`}>
                    <div>
                      <p className="text-sm font-medium text-stone-200">{inv.name}</p>
                      <p className="text-xs text-stone-400">{inv.result}</p>
                    </div>
                    {inv.critical && <AlertTriangle className="h-4 w-4 text-red-400" />}
                  </div>
                ))}
              </div>
              <button onClick={() => setPhase('diagnosis')} className="mt-6 px-4 py-2 rounded-xl text-sm font-medium bg-stone-700 text-stone-200 hover:bg-stone-600 transition-all flex items-center gap-2">
                Make Your Diagnosis <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Diagnosis */}
        {phase === 'diagnosis' && (
          <motion.div key="diagnosis" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
            <div className="bg-stone-900/60 border border-stone-700/40 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="h-5 w-5 text-purple-400" />
                <h2 className="text-lg font-bold text-stone-100">Differential Diagnosis</h2>
              </div>
              <p className="text-xs text-stone-400 mb-4">Select your primary diagnosis:</p>
              <div className="space-y-2 mb-6">
                {caseData.differentials.map((diff, i) => (
                  <label
                    key={i}
                    className={`p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-all border ${
                      selectedDifferentials.includes(diff.diagnosis)
                        ? 'bg-stone-700/60 border-stone-500'
                        : 'bg-stone-800/60 border-stone-700/30 hover:border-stone-600/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="diagnosis"
                      checked={selectedDifferentials.includes(diff.diagnosis)}
                      onChange={() => setSelectedDifferentials([diff.diagnosis])}
                      className="w-4 h-4 accent-purple-500"
                    />
                    <span className="text-sm text-stone-200">{diff.diagnosis}</span>
                  </label>
                ))}
              </div>

              {!showExplanation ? (
                <button
                  onClick={handleDiagnosisSubmit}
                  disabled={selectedDifferentials.length === 0}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-50 transition-all"
                >
                  Submit Diagnosis
                </button>
              ) : (
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl ${diagnosisScore > 0 ? 'bg-emerald-900/30 border border-emerald-700/40' : 'bg-red-900/30 border border-red-700/40'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {diagnosisScore > 0 ? <CheckCircle className="h-5 w-5 text-emerald-400" /> : <XCircle className="h-5 w-5 text-red-400" />}
                      <span className={`font-bold ${diagnosisScore > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {diagnosisScore > 0 ? 'Correct!' : 'Not quite right'}
                      </span>
                    </div>
                    {caseData.differentials.filter(d => d.isPrimary).map((d, i) => (
                      <p key={i} className="text-xs text-stone-300 leading-relaxed">{d.explanation}</p>
                    ))}
                  </div>
                  <button onClick={() => setPhase('management')} className="px-4 py-2 rounded-xl text-sm font-medium bg-stone-700 text-stone-200 hover:bg-stone-600 transition-all flex items-center gap-2">
                    Plan Management <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Management */}
        {phase === 'management' && (
          <motion.div key="management" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
            <div className="bg-stone-900/60 border border-stone-700/40 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Pill className="h-5 w-5 text-cyan-400" />
                <h2 className="text-lg font-bold text-stone-100">Management Plan</h2>
              </div>
              <p className="text-xs text-stone-400 mb-4">Select the management steps you would prioritize (select critical ones):</p>
              <div className="space-y-2 mb-6">
                {caseData.managementSteps.map((step, i) => {
                  const priorityColors = { critical: 'border-red-700/40', high: 'border-amber-700/40', medium: 'border-stone-700/30' };
                  return (
                    <label
                      key={i}
                      className={`p-3 rounded-xl flex items-start gap-3 cursor-pointer transition-all border ${
                        managementSteps.includes(step.step)
                          ? 'bg-stone-700/60 border-stone-500'
                          : `bg-stone-800/60 ${priorityColors[step.priority]} hover:border-stone-600/50`
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={managementSteps.includes(step.step)}
                        onChange={(e) => {
                          if (e.target.checked) setManagementSteps([...managementSteps, step.step]);
                          else setManagementSteps(managementSteps.filter(s => s !== step.step));
                        }}
                        className="w-4 h-4 mt-0.5 accent-cyan-500"
                      />
                      <div className="flex-1">
                        <p className="text-sm text-stone-200">{step.step}</p>
                        <p className="text-[10px] text-stone-500 mt-0.5">{step.rationale}</p>
                      </div>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                        step.priority === 'critical' ? 'bg-red-900/40 text-red-400' :
                        step.priority === 'high' ? 'bg-amber-900/40 text-amber-400' :
                        'bg-stone-800 text-stone-500'
                      }`}>
                        {step.priority}
                      </span>
                    </label>
                  );
                })}
              </div>
              <button onClick={handleManagementSubmit} className="px-4 py-2 rounded-xl text-sm font-medium bg-cyan-600 text-white hover:bg-cyan-500 transition-all">
                Submit Management
              </button>
            </div>
          </motion.div>
        )}

        {/* Complete */}
        {phase === 'complete' && (
          <motion.div key="complete" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-stone-900/60 border border-stone-700/40 rounded-2xl p-8 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-stone-100 mb-2">Case Complete!</h2>
            <p className="text-stone-400 mb-6">{caseData.title}</p>

            <div className="flex justify-center gap-8 mb-6">
              <div>
                <p className="text-4xl font-bold" style={{ color: caseData.color }}>{totalScore}%</p>
                <p className="text-xs text-stone-500">Overall Score</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-emerald-400">{diagnosisScore}%</p>
                <p className="text-xs text-stone-500">Diagnosis</p>
              </div>
            </div>

            {/* Teaching Points */}
            <div className="text-left bg-stone-800/60 rounded-xl p-5 mb-6">
              <h3 className="text-sm font-semibold text-stone-200 mb-3 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-400" /> Teaching Points
              </h3>
              <ul className="space-y-2">
                {caseData.teachingPoints.map((point, i) => (
                  <li key={i} className="text-xs text-stone-400 flex items-start gap-2">
                    <CheckCircle className="h-3 w-3 text-emerald-400 mt-0.5 shrink-0" /> {point}
                  </li>
                ))}
              </ul>
            </div>

            {/* Learning Objectives */}
            <div className="text-left bg-stone-800/60 rounded-xl p-5 mb-6">
              <h3 className="text-sm font-semibold text-stone-200 mb-3 flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-400" /> Learning Objectives
              </h3>
              <ul className="space-y-2">
                {caseData.learningObjectives.map((obj, i) => (
                  <li key={i} className="text-xs text-stone-400 flex items-start gap-2">
                    <Star className="h-3 w-3 text-blue-400 mt-0.5 shrink-0" /> {obj}
                  </li>
                ))}
              </ul>
            </div>

            <button onClick={onComplete} className="px-6 py-3 rounded-xl text-sm font-medium bg-stone-700 text-stone-200 hover:bg-stone-600 transition-all">
              Back to Cases
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Dashboard ─────────────────────────────────────────────────────────

export default function CaseSimulator() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('cases');
  const [activeCase, setActiveCase] = useState(null);
  const [completedCases, setCompletedCases] = useState([]);
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [filterSpecialty, setFilterSpecialty] = useState('all');

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const specialties = [...new Set(MEDICAL_CASES.map(c => c.specialty))];
  const filteredCases = MEDICAL_CASES.filter(c => {
    if (filterDifficulty !== 'all' && c.difficulty !== filterDifficulty) return false;
    if (filterSpecialty !== 'all' && c.specialty !== filterSpecialty) return false;
    return true;
  });

  if (activeCase) {
    return (
      <div className="min-h-screen bg-stone-950 p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => setActiveCase(null)}
                    className="p-2 rounded-xl bg-stone-900/60 border border-stone-700/40 text-stone-400 hover:text-stone-200 transition-all">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-stone-100 flex items-center gap-2">
                <span>{activeCase.icon}</span> {activeCase.title}
              </h1>
              <p className="text-xs text-stone-400">{activeCase.specialty} • {activeCase.difficulty}</p>
            </div>
          </div>
          <ClinicalCase caseData={activeCase} onComplete={() => { setCompletedCases([...completedCases, activeCase.id]); setActiveCase(null); }} />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 p-6">
        <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
          <div className="h-12 bg-stone-900/60 rounded-xl w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-64 bg-stone-900/60 rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
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
                <Stethoscope className="h-7 w-7 text-rose-400" />
                Case Simulator
              </h1>
              <p className="text-sm text-stone-400">Clinical case-based learning with differential diagnosis training</p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-stone-900/40 rounded-xl p-1 border border-stone-700/30">
          {[
            { id: 'cases', label: 'Case Library', icon: BookOpen },
            { id: 'completed', label: 'Completed', icon: CheckCircle },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeTab === tab.id ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
                    }`}>
              <tab.icon className="h-4 w-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* Cases Tab */}
        {activeTab === 'cases' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex gap-3">
              <select value={filterDifficulty} onChange={(e) => setFilterDifficulty(e.target.value)}
                      className="px-3 py-2 text-sm bg-stone-900/60 border border-stone-700/40 rounded-xl text-stone-200 focus:outline-none">
                <option value="all">All Difficulties</option>
                <option value="beginner">🌱 Beginner</option>
                <option value="intermediate">🌿 Intermediate</option>
                <option value="advanced">🌳 Advanced</option>
              </select>
              <select value={filterSpecialty} onChange={(e) => setFilterSpecialty(e.target.value)}
                      className="px-3 py-2 text-sm bg-stone-900/60 border border-stone-700/40 rounded-xl text-stone-200 focus:outline-none">
                <option value="all">All Specialties</option>
                {specialties.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCases.map((c, i) => (
                <CaseCard key={c.id} caseData={c} onStart={setActiveCase} delay={i * 0.1} />
              ))}
            </div>
          </div>
        )}

        {/* Completed Tab */}
        {activeTab === 'completed' && (
          <div className="space-y-4">
            {completedCases.length === 0 ? (
              <div className="text-center py-16">
                <Stethoscope className="h-12 w-12 text-stone-700 mx-auto mb-3" />
                <p className="text-stone-500">No cases completed yet. Start a case to begin!</p>
              </div>
            ) : (
              completedCases.map(id => {
                const c = MEDICAL_CASES.find(mc => mc.id === id);
                return c ? (
                  <div key={id} className="bg-stone-900/60 border border-stone-700/40 rounded-2xl p-4 flex items-center gap-4">
                    <span className="text-2xl">{c.icon}</span>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-stone-200">{c.title}</h3>
                      <p className="text-xs text-stone-400">{c.specialty} • {c.difficulty}</p>
                    </div>
                    <CheckCircle className="h-5 w-5 text-emerald-400" />
                    <button onClick={() => setActiveCase(c)}
                            className="px-3 py-1.5 rounded-lg text-xs bg-stone-800 border border-stone-700/50 text-stone-400 hover:text-stone-200 transition-all">
                      Review Again
                    </button>
                  </div>
                ) : null;
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
