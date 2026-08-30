import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Delete, RotateCcw, History } from 'lucide-react';

/**
 * Safe math evaluator - no eval(), uses a whitelist of operations.
 */
const safeEval = (expr) => {
  try {
    const sanitized = expr
      .replace(/[^0-9+\-*/().,%^sincotaqrlgepb pi]/gi, '')
      .replace(/\b(pi|π)\b/gi, `${Math.PI}`)
      .replace(/\be\b/gi, `${Math.E}`)
      .replace(/\bsin\(/gi, 'Math.sin(')
      .replace(/\bcos\(/gi, 'Math.cos(')
      .replace(/\btan\(/gi, 'Math.tan(')
      .replace(/\basin\(/gi, 'Math.asin(')
      .replace(/\bacos\(/gi, 'Math.acos(')
      .replace(/\batan\(/gi, 'Math.atan(')
      .replace(/\bsqrt\(/gi, 'Math.sqrt(')
      .replace(/\bcbrt\(/gi, 'Math.cbrt(')
      .replace(/\blog\(/gi, 'Math.log10(')
      .replace(/\bln\(/gi, 'Math.log(')
      .replace(/\babs\(/gi, 'Math.abs(')
      .replace(/\bceil\(/gi, 'Math.ceil(')
      .replace(/\bfloor\(/gi, 'Math.floor(')
      .replace(/\bround\(/gi, 'Math.round(')
      .replace(/\bpow\(/gi, 'Math.pow(')
      .replace(/\^/g, '**');
    const result = new Function(`"use strict"; return (${sanitized})`)();
    if (typeof result !== 'number' || !isFinite(result)) return 'Error';
    return result;
  } catch {
    return 'Error';
  }
};

/**
 * Format number for display
 */
const formatResult = (val) => {
  if (val === 'Error') return 'Invalid Expression';
  if (typeof val !== 'number') return String(val);
  if (Number.isInteger(val) && Math.abs(val) < 1e15) return val.toLocaleString();
  const abs = Math.abs(val);
  if (abs < 0.0001 || abs >= 1e12) return val.toExponential(6);
  return parseFloat(val.toPrecision(10)).toString();
};

// ─── Button Layout ──────────────────────────────────────────────────────────

const BASIC_BUTTONS = [
  ['C', '(', ')', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '−'],
  ['1', '2', '3', '+'],
  ['±', '0', '.', '='],
];

const SCIENTIFIC_BUTTONS = [
  ['sin', 'cos', 'tan', 'π'],
  ['asin', 'acos', 'atan', 'e'],
  ['log', 'ln', '√', 'x²'],
  ['!', '%', '^', 'abs'],
  ['ceil', 'floor', '(', ')'],
];

const BUTTON_CLASSES = {
  number: 'bg-stone-800 hover:bg-stone-700 text-stone-100 border-stone-700/50',
  operator: 'bg-indigo-600/80 hover:bg-indigo-500 text-white border-indigo-500/30',
  function: 'bg-violet-600/60 hover:bg-violet-500/80 text-violet-100 border-violet-500/30',
  clear: 'bg-rose-600/70 hover:bg-rose-500 text-white border-rose-500/30',
  equals: 'bg-emerald-600/80 hover:bg-emerald-500 text-white border-emerald-500/30',
  constant: 'bg-amber-600/60 hover:bg-amber-500/80 text-amber-100 border-amber-500/30',
};

const getButtonClass = (btn) => {
  if (btn === 'C' || btn === 'AC') return BUTTON_CLASSES.clear;
  if (btn === '=') return BUTTON_CLASSES.equals;
  if (['π', 'e'].includes(btn)) return BUTTON_CLASSES.constant;
  if (['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'log', 'ln', '√', 'abs', 'ceil', 'floor', 'x²', '!'].includes(btn)) return BUTTON_CLASSES.function;
  if (['+', '−', '×', '÷', '^', '%'].includes(btn)) return BUTTON_CLASSES.operator;
  return BUTTON_CLASSES.number;
};

const getButtonValue = (btn) => {
  if (btn === '×') return '*';
  if (btn === '÷') return '/';
  if (btn === '−') return '-';
  if (btn === '√') return 'sqrt(';
  if (btn === 'x²') return '**2';
  if (btn === '!') return 'factorial(';
  if (btn === '±') return 'negate';
  return btn;
};

/**
 * ScientificCalculator
 * A full-featured scientific calculator with basic/advanced modes,
 * history panel, and keyboard support.
 */
export default function ScientificCalculator({ onInsertToScratchpad }) {
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState('');
  const [mode, setMode] = useState('basic'); // basic | scientific
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const handleButton = useCallback((btn) => {
    const val = getButtonValue(btn);

    if (btn === 'C') {
      setExpression('');
      setResult('');
      return;
    }

    if (btn === '=') {
      if (!expression.trim()) return;
      const r = safeEval(expression);
      setResult(formatResult(r));
      if (r !== 'Error') {
        setHistory((prev) => [
          { expr: expression, result: formatResult(r), ts: Date.now() },
          ...prev.slice(0, 49),
        ]);
        setExpression(formatResult(r));
      }
      return;
    }

    if (val === 'negate') {
      setExpression((prev) => (prev.startsWith('-') ? prev.slice(1) : `-${prev}`));
      return;
    }

    // Functions need opening paren appended if not already present
    if (['sin(', 'cos(', 'tan(', 'asin(', 'acos(', 'atan(', 'log(', 'ln(', 'sqrt(', 'abs(', 'ceil(', 'floor(', 'factorial('].includes(val)) {
      setExpression((prev) => prev + val);
      return;
    }

    setExpression((prev) => prev + val);
  }, [expression]);

  // Keyboard support
  useEffect(() => {
    const handler = (e) => {
      if (e.key >= '0' && e.key <= '9') handleButton(e.key);
      else if (e.key === '+') handleButton('+');
      else if (e.key === '-') handleButton('−');
      else if (e.key === '*') handleButton('×');
      else if (e.key === '/') { e.preventDefault(); handleButton('÷'); }
      else if (e.key === '(' || e.key === ')') handleButton(e.key);
      else if (e.key === '.') handleButton('.');
      else if (e.key === 'Enter' || e.key === '=') handleButton('=');
      else if (e.key === 'Escape') handleButton('C');
      else if (e.key === 'Backspace') setExpression((prev) => prev.slice(0, -1));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleButton]);

  const renderButton = (btn, idx) => (
    <motion.button
      key={`${btn}-${idx}`}
      whileTap={{ scale: 0.92 }}
      onClick={() => handleButton(btn)}
      className={`${getButtonClass(btn)} border rounded-lg py-2.5 text-sm font-bold font-mono transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400/50 active:scale-95`}
      aria-label={btn === '=' ? 'Evaluate expression' : btn === 'C' ? 'Clear' : btn}
      tabIndex={0}
    >
      {btn}
    </motion.button>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Mode Toggle */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <button
          onClick={() => setMode('basic')}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
            mode === 'basic'
              ? 'bg-indigo-600 text-white'
              : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
          }`}
        >
          Basic
        </button>
        <button
          onClick={() => setMode('scientific')}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
            mode === 'scientific'
              ? 'bg-violet-600 text-white'
              : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
          }`}
        >
          Scientific
        </button>
        <div className="flex-1" />
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="p-1.5 rounded-lg bg-stone-800 text-stone-400 hover:bg-stone-700 transition"
          aria-label="Toggle history"
        >
          <History className="w-4 h-4" />
        </button>
      </div>

      {/* Display */}
      <div className="bg-stone-950 border border-stone-700/40 rounded-xl p-4 mb-3 min-h-[80px]">
        <p className="text-xs text-stone-500 font-mono truncate min-h-[16px]">
          {expression || '\u00A0'}
        </p>
        <p className="text-2xl font-black font-mono text-stone-100 mt-1 truncate">
          {result || '\u00A0'}
        </p>
      </div>

      {/* History Panel */}
      {showHistory && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-stone-900/60 border border-stone-700/30 rounded-xl p-3 mb-3 max-h-32 overflow-y-auto"
        >
          {history.length === 0 ? (
            <p className="text-xs text-stone-600 text-center py-2">No history yet</p>
          ) : (
            history.map((h, i) => (
              <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-stone-800/50 last:border-0">
                <span className="text-stone-500 font-mono truncate">{h.expr}</span>
                <span className="text-stone-300 font-mono font-bold ml-2">= {h.result}</span>
              </div>
            ))
          )}
        </motion.div>
      )}

      {/* Scientific buttons (if in scientific mode) */}
      {mode === 'scientific' && (
        <div className="grid grid-cols-4 gap-1.5 mb-2">
          {SCIENTIFIC_BUTTONS.flat().map((btn, i) => renderButton(btn, `sci-${i}`))}
        </div>
      )}

      {/* Basic buttons */}
      <div className="grid grid-cols-4 gap-1.5 flex-1">
        {BASIC_BUTTONS.flat().map((btn, i) => renderButton(btn, `basic-${i}`))}
      </div>

      {/* Action buttons */}
      {onInsertToScratchpad && result && result !== 'Invalid Expression' && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onInsertToScratchpad(result)}
          className="mt-3 w-full py-2 bg-indigo-600/80 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition"
        >
          Insert Result into Scratchpad
        </motion.button>
      )}
    </div>
  );
}
