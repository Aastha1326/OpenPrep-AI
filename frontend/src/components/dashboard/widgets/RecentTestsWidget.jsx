import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Award, Target, ArrowRight, CheckCircle, Clock } from 'lucide-react';
import VintagePaper from '../VintagePaper';

const RecentTestsWidget = () => {
  const navigate = useNavigate();
  const { stats, recentActivity } = useSelector((state) => state.dashboard);

  // Extract recent test/quiz attempts from recentActivity or stats
  const testActivities = (recentActivity || []).filter(
    (a) => a.type === 'quiz_attempt' || a.type === 'pyq_upload' || a.activityType === 'quiz'
  );

  const fallbackTests = [
    {
      id: 'test-1',
      title: 'Physics Mechanics Quiz',
      score: '85%',
      date: '2 hours ago',
      status: 'Passed',
    },
    {
      id: 'test-2',
      title: 'Chemistry Organic Compounds PYQ',
      score: '90%',
      date: 'Yesterday',
      status: 'Passed',
    },
    {
      id: 'test-3',
      title: 'Calculus Integration Practice',
      score: '72%',
      date: '3 days ago',
      status: 'Completed',
    },
  ];

  const displayTests = testActivities.length > 0
    ? testActivities.slice(0, 4).map((item, idx) => ({
        id: item.id || `act-${idx}`,
        title: item.title || item.description || 'Practice Quiz',
        score: item.score ? `${item.score}%` : 'Completed',
        date: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent',
        status: 'Completed',
      }))
    : fallbackTests;

  return (
    <VintagePaper className="h-full flex flex-col justify-between p-5 border-t-4 border-t-blue-600">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-playfair font-bold text-lg text-neutral-800 dark:text-neutral-100">
              Recent Tests & Practice
            </h3>
          </div>
          <button
            onClick={() => navigate('/pyqs')}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
          >
            View All <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2.5">
          {displayTests.map((test) => (
            <div
              key={test.id}
              className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/60 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                    {test.title}
                  </h4>
                  <span className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" /> {test.date}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 block font-playfair">
                  {test.score}
                </span>
                <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">
                  {test.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-700 flex justify-end">
        <button
          onClick={() => navigate('/pyq-analytics')}
          className="text-xs font-bold text-blue-700 dark:text-blue-400 hover:text-blue-800 uppercase tracking-wider flex items-center gap-1"
        >
          Detailed Test Analytics &rarr;
        </button>
      </div>
    </VintagePaper>
  );
};

export default RecentTestsWidget;
