import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  Award,
  Brain,
  Zap,
  Star,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ChevronRight,
  ChevronDown,
  Calendar,
  Link2,
  ArrowRight,
  BookOpen,
  Timer,
  Eye,
  GitBranch,
} from 'lucide-react';
import {
  NODE_TYPES,
  MASTERY_LEVELS,
  DEPENDENCY_TYPES,
  getMasteryColor,
  getMasteryLabel,
} from './knowledgeTypes';

const StatCard = ({ icon: Icon, label, value, subValue, trend, trendValue, color = '#6366f1', delay = 0 }) => {
  const isPositive = trend === 'up';
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5 hover:shadow-lg transition-all duration-300"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}20`, color }}>
            <Icon size={22} />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{value}</p>
          </div>
        </div>
        {trendValue !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
            isPositive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trendValue)}%
          </div>
        )}
      </div>
      {subValue && <p className="text-xs text-gray-400 mt-2">{subValue}</p>}
    </motion.div>
  );
};

const NodeCard = ({ node, delay = 0, isSelected, onSelect, edges }) => {
  const [expanded, setExpanded] = useState(false);
  const masteryColor = getMasteryColor(node.mastery);
  const depCount = edges.filter(e => e.source === node.id).length;
  const depByCount = edges.filter(e => e.target === node.id).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      onClick={() => onSelect && onSelect(node)}
      className={`glass-card rounded-2xl border overflow-hidden cursor-pointer transition-all ${
        isSelected ? 'border-indigo-400 dark:border-indigo-500 shadow-lg ring-2 ring-indigo-200 dark:ring-indigo-800'
        : 'border-white/20 dark:border-white/5 hover:shadow-md'
      }`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ backgroundColor: `${node.typeConfig?.color || '#6366f1'}20` }}>
            {node.typeConfig?.icon || '💡'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{node.label}</p>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${node.typeConfig?.color}20`, color: node.typeConfig?.color }}>
                {node.typeConfig?.label}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{node.subjectName}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="w-10 h-10 rounded-full flex items-center justify-center border-2" style={{ borderColor: masteryColor }}>
              <span className="text-xs font-bold" style={{ color: masteryColor }}>{node.mastery}%</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
          <span className="flex items-center gap-1"><Link2 size={10} /> {depCount} deps</span>
          <span className="flex items-center gap-1"><ArrowRight size={10} /> {depByCount} built on</span>
          <span className="flex items-center gap-1"><Zap size={10} /> Imp: {node.importance}/10</span>
          <span className="flex items-center gap-1"><BookOpen size={10} /> {node.timesStudied}x</span>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          className="w-full mt-2 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex items-center justify-center gap-1"
        >
          {expanded ? 'Show less' : 'Show details'}
          <ChevronDown size={12} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="px-4 pb-4 space-y-3 border-t border-gray-100 dark:border-gray-800"
        >
          <div className="mt-3">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Mastery Breakdown</p>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${node.mastery}%`, backgroundColor: masteryColor }} />
            </div>
            <p className="text-[10px] mt-1" style={{ color: masteryColor }}>{getMasteryLabel(node.mastery)}</p>
          </div>
          {node.quizScores.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Recent Quiz Scores</p>
              <div className="flex gap-1">
                {node.quizScores.map((score, i) => (
                  <div key={i} className="flex-1 text-center">
                    <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded relative overflow-hidden">
                      <div className="absolute bottom-0 w-full rounded" style={{ height: `${score}%`, backgroundColor: getMasteryColor(score) }} />
                    </div>
                    <span className="text-[9px] text-gray-400">{score}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-2">
            {node.lastStudied && (
              <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-1 rounded-full">
                Last: {node.lastStudied}
              </span>
            )}
            <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-1 rounded-full">
              {node.notes} notes • {node.flashcards} cards
            </span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

const SubjectSummaryCard = ({ subject, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.3 }}
    className="glass-card rounded-2xl p-4 border border-white/20 dark:border-white/5 hover:shadow-lg transition-all"
  >
    <div className="flex items-center gap-3 mb-3">
      <span className="text-xl">{subject.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{subject.name}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{subject.totalNodes} concepts</p>
      </div>
      <span className="text-lg font-bold" style={{ color: getMasteryColor(subject.avgMastery) }}>
        {subject.avgMastery}%
      </span>
    </div>
    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${subject.avgMastery}%` }}
        transition={{ delay: delay + 0.3, duration: 0.8 }}
        className="h-full rounded-full"
        style={{ backgroundColor: getMasteryColor(subject.avgMastery) }}
      />
    </div>
    <div className="flex gap-1 flex-wrap">
      {subject.mastered > 0 && <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full">✓ {subject.mastered}</span>}
      {subject.proficient > 0 && <span className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">● {subject.proficient}</span>}
      {subject.learning > 0 && <span className="text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full">◐ {subject.learning}</span>}
      {subject.beginner > 0 && <span className="text-[10px] bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">○ {subject.beginner}</span>}
      {subject.notStarted > 0 && <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full">· {subject.notStarted}</span>}
    </div>
    {subject.weakNodes.length > 0 && (
      <div className="mt-2 flex flex-wrap gap-1">
        {subject.weakNodes.map((n, i) => (
          <span key={i} className="text-[10px] bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">⚠ {n}</span>
        ))}
      </div>
    )}
  </motion.div>
);

const LearningPathCard = ({ path, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.3 }}
    className="glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5"
  >
    <div className="flex items-center gap-3 mb-3">
      <span className="text-2xl">{path.icon}</span>
      <div className="flex-1">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{path.name}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">{path.description}</p>
      </div>
      <span className="text-sm font-bold" style={{ color: path.color }}>{path.progress}%</span>
    </div>
    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${path.progress}%` }}
        transition={{ delay: delay + 0.3, duration: 0.8 }}
        className="h-full rounded-full"
        style={{ backgroundColor: path.color }}
      />
    </div>
    <div className="flex items-center gap-1 overflow-x-auto pb-1">
      {path.steps.map((step, i) => (
        <div key={step.id} className="flex items-center gap-1 flex-shrink-0">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2"
            style={{
              borderColor: getMasteryColor(step.mastery),
              color: getMasteryColor(step.mastery),
              backgroundColor: `${getMasteryColor(step.mastery)}15`,
            }}
          >
            {step.mastery >= 90 ? '✓' : i + 1}
          </div>
          {i < path.steps.length - 1 && <ArrowRight size={10} className="text-gray-300 dark:text-gray-600" />}
        </div>
      ))}
    </div>
    <div className="mt-2 flex flex-wrap gap-1">
      {path.steps.slice(0, 5).map(step => (
        <span key={step.id} className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
          {step.label} ({step.mastery}%)
        </span>
      ))}
      {path.steps.length > 5 && (
        <span className="text-[10px] text-gray-400">+{path.steps.length - 5} more</span>
      )}
    </div>
  </motion.div>
);

const KnowledgeGapCard = ({ gap, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, duration: 0.2 }}
    className="flex items-center gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30"
  >
    <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
      <AlertTriangle size={18} className="text-red-500" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-gray-900 dark:text-white">{gap.label}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{gap.subject} • Mastery: {gap.mastery}% • Importance: {gap.importance}/10</p>
    </div>
    <div className="text-right flex-shrink-0">
      <span className="text-xs font-bold text-red-600 dark:text-red-400">Priority {gap.priority.toFixed(1)}</span>
    </div>
  </motion.div>
);

const GraphMiniMap = ({ nodes, edges, selectedNode, onNodeSelect }) => (
  <div className="relative w-full h-full bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden">
    <svg width="100%" height="100%" viewBox="0 0 900 600">
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#9ca3af" />
        </marker>
      </defs>
      {edges.slice(0, 40).map(edge => {
        const src = nodes.find(n => n.id === edge.source);
        const tgt = nodes.find(n => n.id === edge.target);
        if (!src || !tgt) return null;
        return (
          <line
            key={edge.id}
            x1={src.x}
            y1={src.y}
            x2={tgt.x}
            y2={tgt.y}
            stroke={edge.typeConfig?.color || '#9ca3af'}
            strokeWidth={1.5}
            strokeDasharray={edge.typeConfig?.style === 'dashed' ? '5,3' : edge.typeConfig?.style === 'dotted' ? '2,2' : 'none'}
            opacity={0.4}
          />
        );
      })}
      {nodes.map(node => (
        <g key={node.id} onClick={() => onNodeSelect(node)} style={{ cursor: 'pointer' }}>
          <circle
            cx={node.x}
            cy={node.y}
            r={selectedNode?.id === node.id ? 12 : 8}
            fill={getMasteryColor(node.mastery)}
            stroke={selectedNode?.id === node.id ? '#6366f1' : 'white'}
            strokeWidth={selectedNode?.id === node.id ? 3 : 2}
            opacity={0.9}
          />
          <text
            x={node.x}
            y={node.y + 20}
            textAnchor="middle"
            fill="#6b7280"
            fontSize="8"
          >
            {node.label.length > 12 ? node.label.substring(0, 12) + '…' : node.label}
          </text>
        </g>
      ))}
    </svg>
  </div>
);

const EdgeInfoCard = ({ edge, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, duration: 0.2 }}
    className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-all"
  >
    <span className="text-xs font-medium text-gray-900 dark:text-white truncate">{edge.sourceLabel}</span>
    <ArrowRight size={12} style={{ color: edge.typeConfig?.color || '#9ca3af' }} />
    <span className="text-xs font-medium text-gray-900 dark:text-white truncate">{edge.targetLabel}</span>
    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium ml-auto flex-shrink-0" style={{ backgroundColor: `${edge.typeConfig?.color}20`, color: edge.typeConfig?.color }}>
      {edge.typeConfig?.label}
    </span>
  </motion.div>
);

export {
  StatCard,
  NodeCard,
  SubjectSummaryCard,
  LearningPathCard,
  KnowledgeGapCard,
  GraphMiniMap,
  EdgeInfoCard,
};
