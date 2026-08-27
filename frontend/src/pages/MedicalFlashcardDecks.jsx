import { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  RefreshCw,
  Brain,
  Target,
  TrendingUp,
  Clock,
  Calendar,
  Award,
  BookOpen,
  Zap,
  BarChart3,
  Layers,
  Plus,
  Edit3,
  Trash2,
  Shuffle,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  CheckCircle,
  XCircle,
  ChevronRight,
  ChevronDown,
  Star,
  Flame,
  Sparkles,
  Eye,
  EyeOff,
  Search,
  Filter,
  SortAsc,
  Hash,
  Timer,
  Trophy,
  Lightbulb,
  ArrowUpRight,
  ArrowDownRight,
  FolderOpen,
  Package,
} from 'lucide-react';

// ─── Spaced Repetition Algorithm (SM-2 based) ──────────────────────────────
function calculateNextReview(card, quality) {
  // quality: 0 (blackout) to 5 (perfect)
  const { easeFactor = 2.5, interval = 1, repetitions = 0 } = card;

  let newEF = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  newEF = Math.max(1.3, newEF);

  let newInterval;
  let newRepetitions;

  if (quality < 3) {
    newInterval = 1;
    newRepetitions = 0;
  } else {
    if (repetitions === 0) {
      newInterval = 1;
    } else if (repetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * newEF);
    }
    newRepetitions = repetitions + 1;
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + newInterval);

  return {
    easeFactor: Math.round(newEF * 100) / 100,
    interval: newInterval,
    repetitions: newRepetitions,
    nextReview: nextReview.toISOString(),
    lastReviewed: new Date().toISOString(),
    lastQuality: quality,
  };
}

function getCardStatus(card) {
  if (!card.nextReview) return 'new';
  const now = new Date();
  const review = new Date(card.nextReview);
  if (review <= now) return 'due';
  const daysUntil = Math.ceil((review - now) / (1000 * 60 * 60 * 24));
  if (daysUntil <= 3) return 'soon';
  return 'reviewed';
}

// ─── Sample Data ────────────────────────────────────────────────────────────
const SUBJECT_DECKS = [
  {
    id: 'deck-1', name: 'Anatomy Essentials', subject: 'Anatomy', icon: '🦴', color: '#ef4444',
    description: 'Core anatomy concepts for USMLE Step 1', cardCount: 245, reviewed: 180,
    cards: generateCards('Anatomy', [
      { q: 'What is the largest organ in the human body?', a: 'The skin (integumentary system) — approximately 1.5-2m² in adults' },
      { q: 'Name the 12 pairs of cranial nerves', a: 'I Olfactory, II Optic, III Oculomotor, IV Trochlear, V Trigeminal, VI Abducens, VII Facial, VIII Vestibulocochlear, IX Glossopharyngeal, X Vagus, XI Accessory, XII Hypoglossal' },
      { q: 'What muscle inserts on the radial tuberosity?', a: 'Biceps brachii (via its distal tendon)' },
      { q: 'What is the brachial plexus?', a: 'A network of nerves (C5-T1) formed by anterior rami of lower four cervical and first thoracic spinal nerves, supplying the upper limb' },
      { q: 'Where does the aortic arch begin and end?', a: 'Begins at the upper border of T2 vertebra (ascending aorta), ends at T4 (descending thoracic aorta) at the ligamentum arteriosum' },
      { q: 'What are the branches of the internal carotid artery?', a: 'Ophthalmic, Posterior communicating, Anterior choroidal, Anterior cerebral, Middle cerebral (in circle of Willis)' },
    ]),
  },
  {
    id: 'deck-2', name: 'Pharmacology Master', subject: 'Pharmacology', icon: '💊', color: '#06b6d4',
    description: 'Drug mechanisms, interactions, and clinical applications', cardCount: 312, reviewed: 210,
    cards: generateCards('Pharmacology', [
      { q: 'What is the mechanism of action of aspirin?', a: 'Irreversible inhibition of cyclooxygenase (COX-1 and COX-2), blocking prostaglandin and thromboxane synthesis' },
      { q: 'Name the contraindications for metformin', a: 'eGFR <30, acute/metabolic acidosis, severe hepatic impairment, use of iodinated contrast within 48h, heavy alcohol use' },
      { q: 'What is the antidote for warfarin toxicity?', a: 'Vitamin K (phytonadione) — for coagulopathy; Fresh Frozen Plasma or Prothrombin Complex Concentrate for acute bleeding' },
      { q: 'Which antibiotics are bactericidal vs bacteriostatic?', a: 'Bactericidal: β-lactams, fluoroquinolones, aminoglycosides, vancomycin. Bacteriostatic: macrolides, tetracyclines, chloramphenicol, clindamycin' },
    ]),
  },
  {
    id: 'deck-3', name: 'Pathology Review', subject: 'Pathology', icon: '🔬', color: '#8b5cf6',
    description: 'Disease mechanisms, histology, and clinical correlations', cardCount: 198, reviewed: 145,
    cards: generateCards('Pathology', [
      { q: 'What is the hallmark of acute inflammation?', a: 'Neutrophilic infiltrate, vascular dilation, increased permeability, and edema' },
      { q: 'Describe the stages of wound healing', a: '1) Hemostasis (platelets, fibrin), 2) Inflammation (neutrophils, macrophages), 3) Proliferation (fibroblasts, granulation tissue), 4) Remodeling (collagen maturation)' },
      { q: 'What distinguishes benign from malignant tumors?', a: 'Benign: well-differentiated, no invasion, slow growth, encapsulated. Malignant: anaplasia, invasion, metastasis, rapid growth, neovascularization' },
    ]),
  },
  {
    id: 'deck-4', name: 'Physiology Concepts', subject: 'Physiology', icon: '❤️', color: '#f59e0b',
    description: 'Cardiovascular, respiratory, renal, and GI physiology', cardCount: 178, reviewed: 120,
    cards: generateCards('Physiology', [
      { q: 'What is Starling\'s law of the heart?', a: 'Stroke volume increases with increased venous return (preload), within physiological limits — the Frank-Starling mechanism' },
      { q: 'Describe the oxygen-hemoglobin dissociation curve', a: 'Sigmoidal curve; right-shifted by ↑CO₂, ↑temperature, ↑2,3-DPG, ↓pH (Bohr effect); left-shifted by opposite conditions' },
      { q: 'What determines GFR?', a: 'GFR = Kf × (Pgc - Pbs - πgc), where Kf = filtration coefficient, Pgc = glomerular capillary pressure, Pbs = Bowman\'s space pressure, πgc = oncotic pressure' },
    ]),
  },
  {
    id: 'deck-5', name: 'Microbiology Quick Review', subject: 'Microbiology', icon: '🦠', color: '#10b981',
    description: 'Bacteria, viruses, fungi, and parasites', cardCount: 220, reviewed: 165,
    cards: generateCards('Microbiology', [
      { q: 'What are the gram-positive cocci in clusters?', a: 'Staphylococcus species (S. aureus, S. epidermidis, S. saprophyticus)' },
      { q: 'Name the enveloped DNA viruses', a: 'Herpesviridae (HSV, VZV, CMV, EBV, HHV-6/8), Poxviridae, Hepadnaviridae (HBV), Paramyxoviridae (exceptions with RNA)' },
      { q: 'What is the capsule of Streptococcus pneumoniae made of?', a: 'Polysaccharide (polyribosylribitol phosphate in some serotypes) — key virulence factor, target of pneumococcal vaccines' },
    ]),
  },
  {
    id: 'deck-6', name: 'Biochemistry Pathways', subject: 'Biochemistry', icon: '🧬', color: '#ec4899',
    description: 'Metabolic pathways, enzymes, and molecular biology', cardCount: 165, reviewed: 98,
    cards: generateCards('Biochemistry', [
      { q: 'What are the rate-limiting enzymes of glycolysis?', a: 'Hexokinase (or Glucokinase in liver), Phosphofructokinase-1 (PFK-1 — main regulatory step), Pyruvate kinase' },
      { q: 'Describe the electron transport chain complexes', a: 'Complex I (NADH dehydrogenase), Complex II (Succinate dehydrogenase), Complex III (Cytochrome bc1), Complex IV (Cytochrome c oxidase), Complex V (ATP synthase)' },
      { q: 'What is the citric acid cycle?', a: 'Aerobic metabolic pathway in mitochondrial matrix: Acetyl-CoA + Oxaloacetate → Citrate → ... → Oxaloacetate, producing 3 NADH, 1 FADH₂, 1 GTP per turn' },
    ]),
  },
];

function generateCards(subject, cardData) {
  return cardData.map((c, i) => ({
    id: `card-${subject}-${i}`,
    front: c.q,
    back: c.a,
    subject,
    easeFactor: 2.5,
    interval: 1,
    repetitions: 0,
    nextReview: null,
    lastReviewed: null,
    lastQuality: null,
    timesReviewed: 0,
    correctCount: 0,
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
  }));
}

// ─── Components ─────────────────────────────────────────────────────────────

function DeckCard({ deck, onStudy, delay = 0 }) {
  const [expanded, setExpanded] = useState(false);
  const dueCards = deck.cards.filter(c => getCardStatus(c) === 'due' || getCardStatus(c) === 'new').length;
  const masteredCards = deck.cards.filter(c => c.repetitions >= 3).length;
  const progress = deck.cardCount > 0 ? Math.round((deck.reviewed / deck.cardCount) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="bg-stone-900/60 border border-stone-700/40 rounded-2xl p-5 hover:border-stone-600/60 transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{deck.icon}</span>
          <div>
            <h3 className="font-semibold text-stone-200">{deck.name}</h3>
            <p className="text-xs text-stone-400">{deck.subject} • {deck.description}</p>
          </div>
        </div>
        <span className="text-xs px-2 py-1 rounded-full font-medium"
              style={{ backgroundColor: `${deck.color}20`, color: deck.color }}>
          {deck.cards.length} cards
        </span>
      </div>

      {/* Progress */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-stone-400">Mastery Progress</span>
          <span style={{ color: deck.color }} className="font-bold">{progress}%</span>
        </div>
        <div className="h-2 bg-stone-800 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: deck.color }} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 text-center mb-3">
        <div>
          <p className="text-lg font-bold text-stone-200">{deck.cards.length}</p>
          <p className="text-[10px] text-stone-500">Total</p>
        </div>
        <div>
          <p className="text-lg font-bold text-orange-400">{dueCards}</p>
          <p className="text-[10px] text-stone-500">Due</p>
        </div>
        <div>
          <p className="text-lg font-bold text-emerald-400">{masteredCards}</p>
          <p className="text-[10px] text-stone-500">Mastered</p>
        </div>
        <div>
          <p className="text-lg font-bold text-blue-400">{deck.reviewed}</p>
          <p className="text-[10px] text-stone-500">Reviewed</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onStudy(deck)}
          className="flex-1 py-2 rounded-xl text-sm font-medium text-white transition-all flex items-center justify-center gap-2"
          style={{ backgroundColor: deck.color }}
        >
          <Play className="h-4 w-4" /> Study Now
        </button>
        <button
          onClick={() => setExpanded(!expanded)}
          className="px-3 py-2 rounded-xl bg-stone-800 border border-stone-700/50 text-stone-400 hover:text-stone-200 transition-all"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Expanded preview */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-stone-700/30 space-y-2">
              {deck.cards.slice(0, 3).map((card, i) => {
                const status = getCardStatus(card);
                const statusColors = { new: 'bg-blue-900/40 text-blue-400', due: 'bg-orange-900/40 text-orange-400', soon: 'bg-yellow-900/40 text-yellow-400', reviewed: 'bg-emerald-900/40 text-emerald-400' };
                return (
                  <div key={i} className="p-2 bg-stone-800/40 rounded-lg">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-stone-300 truncate flex-1">{card.front}</p>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full ml-2 ${statusColors[status]}`}>
                        {status}
                      </span>
                    </div>
                  </div>
                );
              })}
              {deck.cards.length > 3 && (
                <p className="text-[10px] text-stone-500 text-center">+{deck.cards.length - 3} more cards</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function FlashcardSession({ deck, onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionCards, setSessionCards] = useState([]);
  const [sessionStats, setSessionStats] = useState({ correct: 0, incorrect: 0, reviewed: 0 });
  const [showComplete, setShowComplete] = useState(false);

  useEffect(() => {
    // Prioritize due cards, then new cards
    const due = deck.cards.filter(c => getCardStatus(c) === 'due' || getCardStatus(c) === 'new');
    const others = deck.cards.filter(c => getCardStatus(c) !== 'due' && getCardStatus(c) !== 'new');
    setSessionCards([...due, ...others].slice(0, 20));
  }, [deck]);

  const currentCard = sessionCards[currentIndex];

  const handleResponse = (quality) => {
    if (!currentCard) return;

    const updates = calculateNextReview(currentCard, quality);
    const updatedCard = { ...currentCard, ...updates, timesReviewed: (currentCard.timesReviewed || 0) + 1 };

    if (quality >= 3) {
      setSessionStats(prev => ({ ...prev, correct: prev.correct + 1, reviewed: prev.reviewed + 1 }));
    } else {
      setSessionStats(prev => ({ ...prev, incorrect: prev.incorrect + 1, reviewed: prev.reviewed + 1 }));
    }

    // Update the card in the deck
    const cardIdx = deck.cards.findIndex(c => c.id === currentCard.id);
    if (cardIdx !== -1) {
      deck.cards[cardIdx] = updatedCard;
    }

    // Move to next card
    if (currentIndex < sessionCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    } else {
      setShowComplete(true);
    }
  };

  if (showComplete) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-stone-900/60 border border-stone-700/40 rounded-2xl p-8 text-center max-w-lg mx-auto"
      >
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-stone-100 mb-2">Session Complete!</h2>
        <p className="text-stone-400 mb-6">Great work on {deck.name}</p>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-stone-800/60 rounded-xl">
            <p className="text-3xl font-bold text-emerald-400">{sessionStats.correct}</p>
            <p className="text-xs text-stone-500">Correct</p>
          </div>
          <div className="p-4 bg-stone-800/60 rounded-xl">
            <p className="text-3xl font-bold text-red-400">{sessionStats.incorrect}</p>
            <p className="text-xs text-stone-500">Incorrect</p>
          </div>
          <div className="p-4 bg-stone-800/60 rounded-xl">
            <p className="text-3xl font-bold text-blue-400">{sessionStats.reviewed}</p>
            <p className="text-xs text-stone-500">Reviewed</p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-sm text-stone-400">Accuracy</p>
          <p className="text-4xl font-bold" style={{ color: deck.color }}>
            {sessionStats.reviewed > 0 ? Math.round((sessionStats.correct / sessionStats.reviewed) * 100) : 0}%
          </p>
        </div>

        <div className="flex gap-3 justify-center">
          <button onClick={() => { setCurrentIndex(0); setIsFlipped(false); setSessionStats({ correct: 0, incorrect: 0, reviewed: 0 }); setShowComplete(false); }}
                  className="px-4 py-2 rounded-xl bg-stone-800 border border-stone-700/50 text-stone-300 hover:text-white transition-all flex items-center gap-2">
            <RotateCcw className="h-4 w-4" /> Review Again
          </button>
          <button onClick={onComplete}
                  className="px-4 py-2 rounded-xl text-white font-medium transition-all flex items-center gap-2"
                  style={{ backgroundColor: deck.color }}>
            <CheckCircle className="h-4 w-4" /> Done
          </button>
        </div>
      </motion.div>
    );
  }

  if (!currentCard) return null;

  const progress = ((currentIndex + 1) / sessionCards.length) * 100;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-stone-400 mb-1">
          <span>Card {currentIndex + 1} of {sessionCards.length}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <div className="h-1.5 bg-stone-800 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: deck.color }} />
        </div>
      </div>

      {/* Session stats */}
      <div className="flex justify-center gap-4 mb-6">
        <span className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> {sessionStats.correct}</span>
        <span className="text-xs text-red-400 flex items-center gap-1"><XCircle className="h-3 w-3" /> {sessionStats.incorrect}</span>
      </div>

      {/* Flashcard */}
      <motion.div
        key={currentCard.id}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-stone-900/80 border border-stone-700/40 rounded-2xl min-h-[300px] cursor-pointer hover:border-stone-600/60 transition-all"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div className="p-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: `${deck.color}20`, color: deck.color }}>
              {deck.subject}
            </span>
            <span className="text-[10px] text-stone-500">
              {isFlipped ? 'Answer' : 'Question'}
            </span>
          </div>

          <div className="flex items-center justify-center min-h-[200px]">
            <AnimatePresence mode="wait">
              {!isFlipped ? (
                <motion.div
                  key="front"
                  initial={{ opacity: 0, rotateY: -90 }}
                  animate={{ opacity: 1, rotateY: 0 }}
                  exit={{ opacity: 0, rotateY: 90 }}
                  className="text-center"
                >
                  <p className="text-xl text-stone-100 font-medium leading-relaxed">{currentCard.front}</p>
                  <p className="text-xs text-stone-500 mt-4 flex items-center justify-center gap-1">
                    <Eye className="h-3 w-3" /> Click to reveal answer
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="back"
                  initial={{ opacity: 0, rotateY: -90 }}
                  animate={{ opacity: 1, rotateY: 0 }}
                  exit={{ opacity: 0, rotateY: 90 }}
                  className="text-center"
                >
                  <p className="text-lg text-stone-200 leading-relaxed">{currentCard.back}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Rating buttons */}
      {isFlipped && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 grid grid-cols-4 gap-2"
        >
          {[
            { quality: 1, label: 'Again', color: '#ef4444', desc: 'Forgot', icon: XCircle },
            { quality: 3, label: 'Hard', color: '#f59e0b', desc: 'Struggled', icon: AlertTriangle },
            { quality: 4, label: 'Good', color: '#3b82f6', desc: 'Recalled', icon: CheckCircle },
            { quality: 5, label: 'Easy', color: '#22c55e', desc: 'Instant', icon: Zap },
          ].map(({ quality, label, color, desc, icon: Icon }) => (
            <button
              key={quality}
              onClick={(e) => { e.stopPropagation(); handleResponse(quality); }}
              className="py-3 rounded-xl text-sm font-medium transition-all hover:scale-105 border"
              style={{ borderColor: `${color}40`, backgroundColor: `${color}15`, color }}
            >
              <Icon className="h-4 w-4 mx-auto mb-1" />
              {label}
              <br /><span className="text-[10px] opacity-70">{desc}</span>
            </button>
          ))}
        </motion.div>
      )}

      {!isFlipped && (
        <div className="mt-4 text-center">
          <p className="text-xs text-stone-500">Click the card to flip it, then rate your recall</p>
        </div>
      )}
    </div>
  );
}

// ─── Main Dashboard ─────────────────────────────────────────────────────────

export default function MedicalFlashcardDecks() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [decks, setDecks] = useState(SUBJECT_DECKS);
  const [activeTab, setActiveTab] = useState('decks');
  const [studyingDeck, setStudyingDeck] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const totalCards = decks.reduce((s, d) => s + d.cards.length, 0);
  const totalDue = decks.reduce((s, d) => s + d.cards.filter(c => getCardStatus(c) === 'due' || getCardStatus(c) === 'new').length, 0);
  const totalMastered = decks.reduce((s, d) => s + d.cards.filter(c => c.repetitions >= 3).length, 0);

  const filteredDecks = decks.filter(d => {
    if (filterSubject !== 'all' && d.subject !== filterSubject) return false;
    if (searchTerm && !d.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const subjects = [...new Set(decks.map(d => d.subject))];

  if (studyingDeck) {
    return (
      <div className="min-h-screen bg-stone-950 p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => setStudyingDeck(null)}
                    className="p-2 rounded-xl bg-stone-900/60 border border-stone-700/40 text-stone-400 hover:text-stone-200 transition-all">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-stone-100 flex items-center gap-2">
                <span>{studyingDeck.icon}</span> {studyingDeck.name}
              </h1>
              <p className="text-xs text-stone-400">Study Session</p>
            </div>
          </div>
          <FlashcardSession deck={studyingDeck} onComplete={() => setStudyingDeck(null)} />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 p-6">
        <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
          <div className="h-12 bg-stone-900/60 rounded-xl w-64" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-stone-900/60 rounded-2xl" />)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <div key={i} className="h-48 bg-stone-900/60 rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'decks', label: 'My Decks', icon: Layers },
    { id: 'due', label: 'Due Cards', icon: Clock },
    { id: 'stats', label: 'Statistics', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-stone-950 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)}
                    className="p-2 rounded-xl bg-stone-900/60 border border-stone-700/40 text-stone-400 hover:text-stone-200 transition-all">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-stone-100 flex items-center gap-2">
                <Layers className="h-7 w-7 text-purple-400" />
                Medical Flashcard Decks
              </h1>
              <p className="text-sm text-stone-400">Spaced repetition for efficient medical learning</p>
            </div>
          </div>
          <button onClick={() => {/* refresh */}}
                  className="p-2.5 rounded-xl bg-stone-900/60 border border-stone-700/40 text-stone-400 hover:text-stone-200 transition-all">
            <RefreshCw className="h-5 w-5" />
          </button>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-stone-900/40 rounded-xl p-1 border border-stone-700/30">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeTab === tab.id ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
                    }`}>
              <tab.icon className="h-4 w-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* ═══ Decks Tab ═══ */}
        {activeTab === 'decks' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={Layers} label="Total Decks" value={decks.length} color="#8b5cf6" delay={0} />
              <StatCard icon={Package} label="Total Cards" value={totalCards} color="#06b6d4" delay={0.1} />
              <StatCard icon={Clock} label="Due for Review" value={totalDue} subtext="Start studying!" color="#f59e0b" delay={0.2} />
              <StatCard icon={Trophy} label="Mastered" value={totalMastered} color="#22c55e" trend="up" delay={0.3} />
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
                <input
                  type="text"
                  placeholder="Search decks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-stone-900/60 border border-stone-700/40 rounded-xl text-stone-200 placeholder-stone-500 focus:border-stone-600/60 focus:outline-none"
                />
              </div>
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="px-3 py-2 text-sm bg-stone-900/60 border border-stone-700/40 rounded-xl text-stone-200 focus:border-stone-600/60 focus:outline-none"
              >
                <option value="all">All Subjects</option>
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Deck Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredDecks.map((deck, i) => (
                <DeckCard key={deck.id} deck={deck} onStudy={setStudyingDeck} delay={i * 0.1} />
              ))}
            </div>

            {filteredDecks.length === 0 && (
              <div className="text-center py-16">
                <Layers className="h-12 w-12 text-stone-700 mx-auto mb-3" />
                <p className="text-stone-500">No decks found matching your search</p>
              </div>
            )}
          </div>
        )}

        {/* ═══ Due Cards Tab ═══ */}
        {activeTab === 'due' && (
          <div className="space-y-4">
            {totalDue === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-stone-900/60 border border-stone-700/40 rounded-2xl p-8 text-center"
              >
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-xl font-bold text-stone-100 mb-2">All caught up!</h3>
                <p className="text-stone-400">No cards are due for review. Come back later or study ahead.</p>
              </motion.div>
            ) : (
              decks.filter(d => d.cards.some(c => getCardStatus(c) === 'due' || getCardStatus(c) === 'new')).map((deck, i) => {
                const dueCards = deck.cards.filter(c => getCardStatus(c) === 'due' || getCardStatus(c) === 'new');
                return (
                  <motion.div
                    key={deck.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-stone-900/60 border border-stone-700/40 rounded-2xl p-4 flex items-center justify-between hover:border-stone-600/60 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{deck.icon}</span>
                      <div>
                        <h3 className="font-medium text-stone-200">{deck.name}</h3>
                        <p className="text-xs text-stone-400">{dueCards.length} cards due</p>
                      </div>
                    </div>
                    <button onClick={() => setStudyingDeck(deck)}
                            className="px-4 py-2 rounded-xl text-sm font-medium text-white flex items-center gap-2"
                            style={{ backgroundColor: deck.color }}>
                      <Play className="h-4 w-4" /> Study
                    </button>
                  </motion.div>
                );
              })
            )}
          </div>
        )}

        {/* ═══ Stats Tab ═══ */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={Brain} label="Total Reviews" value={decks.reduce((s, d) => s + d.cards.reduce((cs, c) => cs + (c.timesReviewed || 0), 0), 0)} color="#8b5cf6" delay={0} />
              <StatCard icon={Target} label="Avg Ease Factor" value={(decks.reduce((s, d) => s + d.cards.reduce((cs, c) => cs + (c.easeFactor || 2.5), 0), 0) / totalCards).toFixed(2)} color="#06b6d4" delay={0.1} />
              <StatCard icon={Flame} label="Study Streak" value="14 days" color="#f59e0b" delay={0.2} />
              <StatCard icon={Award} label="Cards Mastered" value={`${totalMastered}/${totalCards}`} color="#22c55e" delay={0.3} />
            </div>

            {/* Deck breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-stone-900/60 border border-stone-700/40 rounded-2xl p-5"
            >
              <h3 className="text-sm font-semibold text-stone-200 mb-4 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-purple-400" /> Deck Performance
              </h3>
              <div className="space-y-3">
                {decks.map((deck, i) => {
                  const mastered = deck.cards.filter(c => c.repetitions >= 3).length;
                  const pct = deck.cards.length > 0 ? (mastered / deck.cards.length) * 100 : 0;
                  return (
                    <div key={deck.id} className="flex items-center gap-3">
                      <span className="text-lg w-6">{deck.icon}</span>
                      <span className="text-sm text-stone-300 w-36 truncate">{deck.name}</span>
                      <div className="flex-1 h-2 bg-stone-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: deck.color }} />
                      </div>
                      <span className="text-xs font-bold w-12 text-right" style={{ color: deck.color }}>{Math.round(pct)}%</span>
                      <span className="text-[10px] text-stone-500 w-16">{mastered}/{deck.cards.length}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Spaced Repetition Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-700/30 rounded-2xl p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="h-5 w-5 text-purple-400" />
                <h3 className="text-sm font-semibold text-purple-300">How Spaced Repetition Works</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-stone-400">
                <div className="p-3 bg-stone-900/40 rounded-xl">
                  <p className="text-stone-200 font-medium mb-1">📊 SM-2 Algorithm</p>
                  <p>Cards you find easy appear less frequently. Difficult cards come back sooner for maximum retention.</p>
                </div>
                <div className="p-3 bg-stone-900/40 rounded-xl">
                  <p className="text-stone-200 font-medium mb-1">⏰ Optimal Timing</p>
                  <p>Reviews are scheduled just before you'd forget — the sweet spot for long-term memory encoding.</p>
                </div>
                <div className="p-3 bg-stone-900/40 rounded-xl">
                  <p className="text-stone-200 font-medium mb-1">🧠 Active Recall</p>
                  <p>Self-testing is 50% more effective than re-reading. Each flip strengthens neural pathways.</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, subtext, trend, color, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="bg-stone-900/60 border border-stone-700/40 rounded-2xl p-5 hover:border-stone-600/60 transition-all"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${color}20` }}>
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        {trend && (
          <span className="flex items-center gap-0.5 text-xs font-medium text-emerald-400">
            <ArrowUpRight className="h-3 w-3" /> +8%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-stone-100">{value}</p>
      <p className="text-sm text-stone-400 mt-0.5">{label}</p>
      {subtext && <p className="text-xs text-stone-500 mt-1">{subtext}</p>}
    </motion.div>
  );
}
