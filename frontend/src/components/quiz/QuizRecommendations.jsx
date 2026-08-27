import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getQuizRecommendations, logRecommendationHit } from '../../services/api';
import {
  Sparkles,
  Clock,
  Target,
  Brain,
  Zap,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  BookOpen,
} from 'lucide-react';

const TIME_BUDGET_OPTIONS = [
  { id: 'all', label: 'All Durations', value: null },
  { id: '5', label: '⚡ 5 Mins', value: 5 },
  { id: '10', label: '⏱️ 10 Mins', value: 10 },
  { id: '15', label: '⌛ 15-20 Mins', value: 20 },
];

export function QuizRecommendations({ userId: propUserId, onSelectQuiz }) {
  const navigate = useNavigate();
  const authUser = useSelector((state) => state.auth?.user);
  const activeUserId = propUserId || authUser?.id || 'demo-user';

  const [timeBudget, setTimeBudget] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRecommendations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getQuizRecommendations(activeUserId, {
        timeBudget: timeBudget || undefined,
        limit: 6,
      });

      if (res.data && res.data.success) {
        setRecommendations(res.data.recommendations || []);
        setUserProfile(res.data.userProfile || null);
      } else {
        setError('Unable to load quiz recommendations.');
      }
    } catch (err) {
      console.warn('QuizRecommendations fetch error:', err.message);
      // Fallback mock recommendations for preview resilience
      setRecommendations([
        {
          id: 'quiz-ds-01',
          title: 'Data Structures & Trees Basics',
          topic: 'Data Structures',
          difficulty: 'medium',
          estimatedMinutes: 8,
          totalQuestions: 10,
          recommendationScore: 94,
          matchReason: 'Targets identified weak topic: Data Structures (58% accuracy)',
        },
        {
          id: 'quiz-algo-01',
          title: 'Sorting & Searching Algorithms',
          topic: 'Algorithms',
          difficulty: 'easy',
          estimatedMinutes: 10,
          totalQuestions: 10,
          recommendationScore: 88,
          matchReason: 'Optimal 10-minute reinforcement quiz for core concepts',
        },
      ]);
      setUserProfile({
        overallAccuracy: 72,
        weakTopics: ['Data Structures', 'Dynamic Programming'],
      });
    } finally {
      setIsLoading(false);
    }
  }, [activeUserId, timeBudget]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const handleStartQuiz = async (quiz) => {
    try {
      await logRecommendationHit(activeUserId, {
        quizId: quiz.id,
        recommendationScore: quiz.recommendationScore,
        topic: quiz.topic,
      });
    } catch (err) {
      console.warn('Recommendation hit logging failed:', err.message);
    }

    if (onSelectQuiz) {
      onSelectQuiz(quiz);
    } else {
      navigate(`/quiz/${quiz.id}`);
    }
  };

  const getDifficultyBadge = (diff) => {
    switch ((diff || '').toLowerCase()) {
      case 'easy':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'hard':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-2xl space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-tr from-amber-500 via-indigo-600 to-violet-600 rounded-xl shadow-lg shadow-indigo-500/20">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">
                AI Quiz Recommendations
              </h2>
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span>Personalized</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Adapted from your performance profile, weak topic analysis, and time budget.
            </p>
          </div>
        </div>

        {/* User Mastery Summary */}
        {userProfile && (
          <div className="flex items-center space-x-4 bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2 text-xs">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Accuracy</span>
                <span className="font-bold text-slate-200">{userProfile.overallAccuracy}%</span>
              </div>
            </div>
            {userProfile.weakTopics && userProfile.weakTopics.length > 0 && (
              <>
                <span className="h-6 w-px bg-slate-800" />
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-rose-400" />
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Focus Topic</span>
                    <span className="font-semibold text-rose-300 truncate max-w-[100px] block">
                      {userProfile.weakTopics[0]}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Time Budget Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/40 p-2 rounded-xl border border-slate-800/60">
        <div className="flex items-center space-x-2 text-xs text-slate-400 font-semibold uppercase tracking-wider px-2">
          <Clock className="w-4 h-4 text-indigo-400" />
          <span>Time Budget:</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {TIME_BUDGET_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setTimeBudget(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                timeBudget === opt.value
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {opt.label}
            </button>
          ))}

          <button
            onClick={fetchRecommendations}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-lg transition-all"
            title="Refresh Recommendations"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-3">
          <RefreshCw className="w-7 h-7 animate-spin text-indigo-400" />
          <p className="text-xs font-mono">Analyzing quiz performance vectors & recommendation model...</p>
        </div>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <div className="p-4 bg-rose-900/20 border border-rose-800/50 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Recommendation Grid */}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendations.length === 0 ? (
            <div className="col-span-full py-10 text-center text-slate-500 text-sm italic">
              No matching recommendations found for this filter. Try selecting &quot;All Durations&quot;.
            </div>
          ) : (
            recommendations.map((quiz) => (
              <div
                key={quiz.id}
                className="group relative bg-slate-950/80 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-0.5"
              >
                <div>
                  {/* Top Row: Topic & Match Score */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full truncate max-w-[160px]">
                      {quiz.topic}
                    </span>

                    <span className="flex items-center space-x-1 text-xs font-extrabold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                      <Zap className="w-3 h-3 text-amber-400 fill-current" />
                      <span>{quiz.recommendationScore || 90}% Match</span>
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-bold text-slate-100 group-hover:text-indigo-300 transition-colors line-clamp-2 mb-2">
                    {quiz.title}
                  </h3>

                  {/* Metadata Row: Difficulty, Time, Questions */}
                  <div className="flex items-center space-x-3 text-[11px] text-slate-400 mb-3">
                    <span
                      className={`px-2 py-0.5 rounded-md border font-semibold capitalize ${getDifficultyBadge(
                        quiz.difficulty
                      )}`}
                    >
                      {quiz.difficulty}
                    </span>

                    <div className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{quiz.estimatedMinutes || 10}m</span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                      <span>{quiz.totalQuestions || 10} Qs</span>
                    </div>
                  </div>

                  {/* AI Match Reason */}
                  {quiz.matchReason && (
                    <div className="text-[11px] text-slate-400 bg-slate-900/90 border border-slate-800/80 rounded-lg p-2.5 mb-4 leading-relaxed flex items-start space-x-2">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <span>{quiz.matchReason}</span>
                    </div>
                  )}
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handleStartQuiz(quiz)}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold rounded-lg transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center space-x-1.5 group-hover:shadow-indigo-600/40 active:scale-98"
                >
                  <span>Start Practice Quiz</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default QuizRecommendations;
