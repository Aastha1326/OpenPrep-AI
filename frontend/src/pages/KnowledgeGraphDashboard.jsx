import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  Target,
  Brain,
  GitBranch,
  Network,
  Clock,
  Award,
  TrendingUp,
  BookOpen,
  ChevronDown,
  Search,
  Filter,
  Zap,
  AlertTriangle,
  Link2,
  Eye,
  Map,
  Lightbulb,
} from 'lucide-react';

import {
  StatCard,
  NodeCard,
  SubjectSummaryCard,
  LearningPathCard,
  KnowledgeGapCard,
  GraphMiniMap,
  EdgeInfoCard,
} from './KnowledgeCards';

import {
  MasteryDistributionChart,
  SubjectMasteryRadar,
  WeeklyProgressChart,
  NodeTypePieChart,
  DependencyTypeBarChart,
  ImportanceVsMasteryScatter,
} from './KnowledgeCharts';

import {
  generateGraphNodes,
  generateGraphEdges,
  generateSubjectSummary,
  generateLearningPath,
  generateKnowledgeGaps,
  generateMasteryDistribution,
  generateWeeklyStudyData,
} from './knowledgeData';

import {
  NODE_TYPES,
  DEPENDENCY_TYPES,
  MASTERY_LEVELS,
  SUBJECTS,
  getMasteryColor,
  getMasteryLabel,
} from './knowledgeTypes';

const TABS = [
  { id: 'graph', label: 'Graph View', icon: Network },
  { id: 'nodes', label: 'Concepts', icon: BookOpen },
  { id: 'paths', label: 'Learning Paths', icon: Map },
  { id: 'gaps', label: 'Knowledge Gaps', icon: AlertTriangle },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

const FilterBar = ({ search, setSearch, typeFilter, setTypeFilter, masteryFilter, setMasteryFilter }) => (
  <div className="flex flex-wrap items-center gap-3 mb-6">
    <div className="relative flex-1 min-w-[200px] max-w-sm">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        placeholder="Search concepts, algorithms..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
      />
    </div>
    <div className="relative">
      <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <select
        value={typeFilter}
        onChange={(e) => setTypeFilter(e.target.value)}
        className="pl-8 pr-8 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
      >
        <option value="all">All Types</option>
        {Object.entries(NODE_TYPES).map(([key, val]) => (
          <option key={key} value={key}>{val.icon} {val.label}</option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
    <div className="flex items-center gap-1">
      {Object.entries(MASTERY_LEVELS).map(([key, val]) => (
        <button
          key={key}
          onClick={() => setMasteryFilter(masteryFilter === key ? 'all' : key)}
          className={`w-4 h-4 rounded-full border-2 transition-all ${
            masteryFilter === key ? 'scale-125' : 'hover:scale-110'
          }`}
          style={{ borderColor: val.color, backgroundColor: masteryFilter === key ? val.color : 'transparent' }}
          title={val.label}
        />
      ))}
    </div>
  </div>
);

const GraphTab = ({ nodes, edges, subjectSummary }) => {
  const [selectedNode, setSelectedNode] = useState(null);

  const selectedEdges = useMemo(() => {
    if (!selectedNode) return [];
    return edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id);
  }, [selectedNode, edges]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={BookOpen} label="Total Concepts" value={nodes.length} color="#6366f1" delay={0} />
        <StatCard icon={Link2} label="Connections" value={edges.length} color="#8b5cf6" delay={0.05} />
        <StatCard icon={Target} label="Avg Mastery" value={`${Math.round(nodes.reduce((s, n) => s + n.mastery, 0) / nodes.length)}%`} trend="up" trendValue={5} color="#10b981" delay={0.1} />
        <StatCard icon={Zap} label="Mastered" value={nodes.filter(n => n.mastery >= 90).length} subValue={`${Math.round(nodes.filter(n => n.mastery >= 90).length / nodes.length * 100)}% of total`} color="#f59e0b" delay={0.15} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5 min-h-[500px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Network size={16} className="text-indigo-500" /> Knowledge Graph
            </h3>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: MASTERY_LEVELS.mastered.color }} /> Mastered
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: MASTERY_LEVELS.learning.color }} /> Learning
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: MASTERY_LEVELS.not_started.color }} /> Not Started
              </span>
            </div>
          </div>
          <GraphMiniMap nodes={nodes} edges={edges} selectedNode={selectedNode} onNodeSelect={setSelectedNode} />
        </div>

        <div className="space-y-4">
          {selectedNode ? (
            <div className="glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5">
              <div className="flex items-center gap-2 mb-3">
                <Eye size={16} className="text-indigo-500" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Selected: {selectedNode.label}</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Type</span>
                  <span className="text-xs font-medium" style={{ color: selectedNode.typeConfig?.color }}>{selectedNode.typeConfig?.icon} {selectedNode.typeConfig?.label}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Mastery</span>
                  <span className="text-xs font-bold" style={{ color: getMasteryColor(selectedNode.mastery) }}>{selectedNode.mastery}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Importance</span>
                  <span className="text-xs font-medium text-gray-900 dark:text-white">{selectedNode.importance}/10</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Times Studied</span>
                  <span className="text-xs font-medium text-gray-900 dark:text-white">{selectedNode.timesStudied}x</span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${selectedNode.mastery}%`, backgroundColor: getMasteryColor(selectedNode.mastery) }} />
                </div>
              </div>
              {selectedEdges.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Connections ({selectedEdges.length})</p>
                  <div className="space-y-1 max-h-[200px] overflow-y-auto">
                    {selectedEdges.map(edge => (
                      <EdgeInfoCard key={edge.id} edge={edge} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5 text-center">
              <Eye size={24} className="text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Click a node to view details</p>
            </div>
          )}

          <div className="glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Subjects Overview</h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {subjectSummary.map((s, i) => (
                <SubjectSummaryCard key={s.id} subject={s} delay={i * 0.05} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const NodesTab = ({ nodes, edges, search, typeFilter, masteryFilter }) => {
  const filtered = useMemo(() => {
    return nodes.filter(n => {
      if (typeFilter !== 'all' && n.type !== typeFilter) return false;
      if (masteryFilter !== 'all') {
        const targetScore = MASTERY_LEVELS[masteryFilter]?.score || 0;
        if (masteryFilter === 'not_started' && n.mastery >= 25) return false;
        if (masteryFilter === 'beginner' && (n.mastery < 25 || n.mastery >= 50)) return false;
        if (masteryFilter === 'learning' && (n.mastery < 50 || n.mastery >= 75)) return false;
        if (masteryFilter === 'proficient' && (n.mastery < 75 || n.mastery >= 90)) return false;
        if (masteryFilter === 'mastered' && n.mastery < 90) return false;
      }
      if (search && !n.label.toLowerCase().includes(search.toLowerCase()) && !n.subjectName.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [nodes, typeFilter, masteryFilter, search]);

  const [selectedNode, setSelectedNode] = useState(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{filtered.length} Concepts</h3>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{filtered.filter(n => n.mastery >= 90).length} mastered</span>
          <span>•</span>
          <span>{filtered.filter(n => n.mastery < 40).length} need work</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((node, i) => (
          <NodeCard
            key={node.id}
            node={node}
            delay={i * 0.03}
            isSelected={selectedNode?.id === node.id}
            onSelect={setSelectedNode}
            edges={edges}
          />
        ))}
      </div>
    </div>
  );
};

const PathsTab = ({ paths }) => (
  <div className="space-y-6">
    <div className="glass-card rounded-2xl p-5 border border-indigo-200 dark:border-indigo-800/30 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10">
      <div className="flex items-center gap-2 mb-2">
        <Map size={18} className="text-indigo-500" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Learning Paths</h3>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">Structured sequences of concepts ordered by dependencies. Follow these paths for optimal learning progression.</p>
    </div>

    <div className="space-y-4">
      {paths.map((path, i) => (
        <LearningPathCard key={path.id} path={path} delay={i * 0.1} />
      ))}
    </div>
  </div>
);

const GapsTab = ({ gaps, nodes }) => (
  <div className="space-y-6">
    <div className="glass-card rounded-2xl p-5 border border-red-200 dark:border-red-800/30 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/10 dark:to-orange-900/10">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle size={18} className="text-red-500" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Knowledge Gaps</h3>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        High-importance concepts with low mastery. These are blocking your progress and should be prioritized.
      </p>
    </div>

    <div className="space-y-3">
      {gaps.map((gap, i) => (
        <KnowledgeGapCard key={gap.nodeId} gap={gap} delay={i * 0.05} />
      ))}
    </div>

    {gaps.length === 0 && (
      <div className="text-center py-12">
        <Award size={48} className="text-green-400 mx-auto mb-4" />
        <p className="text-lg font-semibold text-gray-900 dark:text-white">No Knowledge Gaps!</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">All high-importance concepts are well-covered.</p>
      </div>
    )}
  </div>
);

const AnalyticsTab = ({ nodes, edges, masteryDistribution, weeklyData, subjectSummary }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <MasteryDistributionChart data={masteryDistribution} />
      <SubjectMasteryRadar subjects={subjectSummary} />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <WeeklyProgressChart data={weeklyData} />
      <NodeTypePieChart nodes={nodes} />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <DependencyTypeBarChart edges={edges} />
      <ImportanceVsMasteryScatter nodes={nodes} />
    </div>
  </div>
);

const KnowledgeGraphDashboard = () => {
  const [activeTab, setActiveTab] = useState('graph');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [masteryFilter, setMasteryFilter] = useState('all');

  const nodes = useMemo(() => generateGraphNodes(), []);
  const edges = useMemo(() => generateGraphEdges(nodes), [nodes]);
  const subjectSummary = useMemo(() => generateSubjectSummary(nodes), [nodes]);
  const paths = useMemo(() => generateLearningPath(nodes, edges), [nodes, edges]);
  const gaps = useMemo(() => generateKnowledgeGaps(nodes, edges), [nodes, edges]);
  const masteryDistribution = useMemo(() => generateMasteryDistribution(nodes), [nodes]);
  const weeklyData = useMemo(() => generateWeeklyStudyData(8), []);

  const renderTab = () => {
    switch (activeTab) {
      case 'graph':
        return <GraphTab nodes={nodes} edges={edges} subjectSummary={subjectSummary} />;
      case 'nodes':
        return <NodesTab nodes={nodes} edges={edges} search={search} typeFilter={typeFilter} masteryFilter={masteryFilter} />;
      case 'paths':
        return <PathsTab paths={paths} />;
      case 'gaps':
        return <GapsTab gaps={gaps} nodes={nodes} />;
      case 'analytics':
        return <AnalyticsTab nodes={nodes} edges={edges} masteryDistribution={masteryDistribution} weeklyData={weeklyData} subjectSummary={subjectSummary} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-950/20 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
                  <GitBranch size={22} />
                </div>
                Knowledge Graph
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 ml-13">Visualize concept connections and track your mastery journey</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <Brain size={16} className="text-purple-500" />
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{nodes.length} Concepts</span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-1 mb-6 overflow-x-auto pb-2 -mx-2 px-2"
        >
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </motion.div>

        {activeTab === 'nodes' && (
          <FilterBar
            search={search}
            setSearch={setSearch}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            masteryFilter={masteryFilter}
            setMasteryFilter={setMasteryFilter}
          />
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
          >
            {renderTab()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default KnowledgeGraphDashboard;
