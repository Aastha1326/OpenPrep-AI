import React, { useState } from 'react';
import { Sparkles, TrendingUp, CheckCircle, XCircle, ArrowRight, Loader2 } from 'lucide-react';
import API from '../../services/api';

export default function AdaptiveQuizPlayer({ quizId }) {
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [difficulty, setDifficulty] = useState('Medium');
  const [streak, setStreak] = useState(0);
  const [streakType, setStreakType] = useState('correct');
  const [answeredIds, setAnsweredIds] = useState([]);
  const [sessionHistory, setSessionHistory] = useState([]); // [{ questionNum, difficulty, isCorrect }]
  const [selectedOption, setSelectedOption] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const fetchNextQuestion = async (currStreak, currType, currDiff, historyArr) => {
    setLoading(true);
    try {
      const response = await API.post('/quizzes/adaptive/next-question', {
        quizId,
        currentStreak: currStreak,
        streakType: currType,
        currentDifficulty: currDiff,
        answeredQuestionIds: answeredIds,
      });

      if (response.data.success) {
        setCurrentQuestion(response.data.question);
        setDifficulty(response.data.difficulty);
      }
    } catch (err) {
      console.error('Failed to fetch adaptive question', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSubmit = (optionIndex) => {
    setSelectedOption(optionIndex);
    const isCorrect = optionIndex === currentQuestion.correctAnswer;

    // Update streak tracking
    let newStreak = streakType === (isCorrect ? 'correct' : 'incorrect') ? streak + 1 : 1;
    let newType = isCorrect ? 'correct' : 'incorrect';

    if (newStreak >= 3) {
      newStreak = 0; // reset counter after transition adjustment
    }

    setStreak(newStreak);
    setStreakType(newType);
    setAnsweredIds([...answeredIds, currentQuestion.id]);
    setSessionHistory([...sessionHistory, { questionNum: sessionHistory.length + 1, difficulty, isCorrect }]);

    setTimeout(() => {
      setSelectedOption(null);
      if (sessionHistory.length >= 9) {
        setIsCompleted(true);
      } else {
        fetchNextQuestion(newStreak, newType, difficulty, sessionHistory);
      }
    }, 1200);
  };

  if (isCompleted) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-[#FFFBE9] dark:bg-[#16120E] rounded-3xl border border-[#CEAB93]/60 dark:border-[#412D15] shadow-xl text-center">
        <h2 className="text-2xl font-bold font-playfair mb-2 flex items-center justify-center gap-2">
          <TrendingUp className="w-6 h-6 text-amber-500" /> Adaptive Quiz Completed!
        </h2>
        <p className="text-xs text-[#8C6A53] dark:text-[#C4BA9D] mb-6">
          Here is your real-time difficulty progression curve over the session:
        </p>

        {/* Difficulty Progression Curve Graph */}
        <div className="p-4 bg-white dark:bg-[#251D17] rounded-2xl border border-[#CEAB93]/30 mb-6">
          <div className="flex justify-between items-end h-40 px-4 pt-6 gap-2 border-b border-neutral-300 dark:border-neutral-700">
            {sessionHistory.map((item, idx) => {
              const heightMap = { Easy: 'h-1/3', Medium: 'h-2/3', Hard: 'h-full' };
              const colorMap = { Easy: 'bg-green-500', Medium: 'bg-amber-500', Hard: 'bg-red-500' };
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <div className={`w-full rounded-t-lg ${heightMap[item.difficulty]} ${colorMap[item.difficulty]} transition-all duration-500`} title={`${item.difficulty} (${item.isCorrect ? 'Correct' : 'Incorrect'})`} />
                  <span className="text-[10px] font-mono">Q{item.questionNum}</span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-center gap-6 mt-4 text-[11px] font-semibold">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500" /> Easy</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500" /> Medium</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500" /> Hard</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-[#FFFBE9] dark:bg-[#16120E] rounded-3xl border border-[#CEAB93]/60 dark:border-[#412D15] shadow-xl">
      <div className="flex justify-between items-center mb-6 border-b border-[#CEAB93]/30 pb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-[#8C6A53] dark:text-[#C4BA9D] flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-500" /> Adaptive Mode
        </span>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${difficulty === 'Hard' ? 'bg-red-500/10 text-red-600 border border-red-500/30' : difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/30' : 'bg-green-500/10 text-green-600 border border-green-500/30'}`}>
          Difficulty: {difficulty}
        </span>
      </div>

      {loading || !currentQuestion ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-2" />
          <p className="text-xs font-medium">Adapting next question to your performance level...</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-base font-bold font-playfair">{currentQuestion.question}</h3>
          <div className="space-y-2.5">
            {currentQuestion.options.map((opt, idx) => (
              <button
                key={idx}
                disabled={selectedOption !== null}
                onClick={() => handleAnswerSubmit(idx)}
                className={`w-full text-left p-3.5 rounded-xl border text-xs font-medium transition cursor-pointer ${selectedOption === idx ? (idx === currentQuestion.correctAnswer ? 'bg-green-500/20 border-green-500 text-green-700 dark:text-green-300' : 'bg-red-500/20 border-red-500 text-red-700 dark:text-red-300') : 'bg-white dark:bg-[#251D17] border-[#CEAB93]/40 dark:border-[#412D15] hover:border-amber-500'}`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
