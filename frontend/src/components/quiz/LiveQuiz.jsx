import React, { useState, useEffect } from 'react';
import { Clock, Trophy, Award, CheckCircle2, XCircle, Sparkles, Users, HelpCircle, ArrowRight, CornerDownRight } from 'lucide-react';

export default function LiveQuiz({
  socket,
  roomId,
  currentUserId,
  currentQuestion,
  questionResult,
  roomState,
  quizEndedData,
  onLeaveRoom,
}) {
  const [selectedOption, setSelectedOption] = useState(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(20);

  // Reset local state when a new question arrives
  useEffect(() => {
    if (currentQuestion) {
      setSelectedOption(null);
      setHasSubmitted(false);
      setTimeRemaining(currentQuestion.timeLimit || 20);
    }
  }, [currentQuestion?.questionIndex]);

  // Listen to timer ticks
  useEffect(() => {
    if (!socket) return;
    const handleTimerTick = (data) => {
      setTimeRemaining(data.timeRemaining);
    };

    socket.on('timer_tick', handleTimerTick);
    return () => {
      socket.off('timer_tick', handleTimerTick);
    };
  }, [socket]);

  const handleOptionSelect = (index) => {
    if (hasSubmitted || questionResult || quizEndedData) return;

    setSelectedOption(index);
    setHasSubmitted(true);

    if (socket && roomId) {
      socket.emit('answer', {
        roomId,
        questionIndex: currentQuestion?.questionIndex || 0,
        optionIndex: index,
        timeSpentMs: ((currentQuestion?.timeLimit || 20) - timeRemaining) * 1000,
      });
    }
  };

  const participants = roomState?.participants || [];
  const totalQuestions = currentQuestion?.totalQuestions || roomState?.totalQuestions || 1;
  const currentQIndex = (currentQuestion?.questionIndex ?? 0) + 1;

  // Final Quiz Summary Screen
  if (quizEndedData) {
    const leaderboard = quizEndedData.leaderboard || [];
    return (
      <div className="max-w-3xl mx-auto p-8 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-xl text-white">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 mb-4 text-amber-400">
            <Trophy className="w-10 h-10 animate-bounce" />
          </div>
          <h2 className="text-4xl font-extrabold bg-gradient-to-r from-amber-400 via-orange-300 to-amber-200 bg-clip-text text-transparent">
            Collaborative Quiz Completed!
          </h2>
          <p className="text-slate-400 text-sm mt-2">Here are the final leaderboard scores for this room.</p>
        </div>

        {/* Leaderboard Rankings */}
        <div className="space-y-3 mb-8">
          {leaderboard.map((item, idx) => {
            const isWinner = idx === 0;
            return (
              <div
                key={item.userId || idx}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                  isWinner
                    ? 'bg-amber-500/10 border-amber-500/40 shadow-lg shadow-amber-500/10'
                    : 'bg-slate-800/50 border-slate-700/50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl font-bold flex items-center justify-center text-sm ${
                      idx === 0
                        ? 'bg-amber-500 text-slate-950'
                        : idx === 1
                        ? 'bg-slate-300 text-slate-950'
                        : idx === 2
                        ? 'bg-amber-700 text-white'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    #{idx + 1}
                  </div>
                  <div>
                    <span className="font-semibold text-base text-white">{item.username || 'Learner'}</span>
                    <span className="text-xs text-slate-400 block">{item.correctCount || 0} Correct Answers</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xl font-bold text-amber-400">{item.score} pts</span>
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onLeaveRoom}
          className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-base shadow-lg transition-all"
        >
          Return to Room Lobby
        </button>
      </div>
    );
  }

  const timePercentage = Math.max(0, (timeRemaining / (currentQuestion?.timeLimit || 20)) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-white">
      {/* Top Header & Live Scores */}
      <div className="p-4 md:p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold">
            ROOM: {roomId}
          </div>
          <span className="text-sm font-semibold text-slate-300">
            Question {currentQIndex} of {totalQuestions}
          </span>
        </div>

        {/* Live Timer Progress */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Clock className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="w-full md:w-48 h-3 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
            <div
              className={`h-full transition-all duration-1000 ${
                timeRemaining <= 5 ? 'bg-rose-500' : timeRemaining <= 10 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${timePercentage}%` }}
            />
          </div>
          <span className="font-mono text-sm font-bold text-amber-300 w-8">{timeRemaining}s</span>
        </div>
      </div>

      {/* Participants Live Score Sidebar / Header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {participants.map((p) => {
          const isMe = p.userId === currentUserId;
          return (
            <div
              key={p.userId}
              className={`p-3 rounded-xl border flex items-center justify-between ${
                isMe
                  ? 'bg-amber-500/10 border-amber-500/30 text-white'
                  : 'bg-slate-900/60 border-slate-800 text-slate-300'
              }`}
            >
              <div className="truncate mr-2">
                <span className="text-xs font-semibold block truncate">
                  {p.username} {isMe && '(You)'}
                </span>
                <span className="font-mono text-xs font-bold text-amber-400">{p.score} pts</span>
              </div>
              <div className="shrink-0">
                {p.answered ? (
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center justify-center">
                    ✓
                  </span>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Question Card */}
      <div className="p-6 md:p-8 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-xl space-y-6">
        <h3 className="text-xl md:text-2xl font-bold leading-relaxed text-slate-100">
          {currentQuestion?.questionText || 'Loading live question...'}
        </h3>

        {/* Options */}
        <div className="grid grid-cols-1 gap-3.5">
          {currentQuestion?.options?.map((optionText, idx) => {
            let optionStyle = 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-amber-500/50 text-slate-200';

            if (questionResult) {
              const isCorrectOpt = idx === questionResult.correctAnswerIndex;
              const isSelectedOpt = idx === selectedOption;

              if (isCorrectOpt) {
                optionStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-200 font-semibold';
              } else if (isSelectedOpt && !isCorrectOpt) {
                optionStyle = 'bg-rose-500/20 border-rose-500 text-rose-200';
              } else {
                optionStyle = 'bg-slate-800/30 border-slate-800/60 text-slate-500 opacity-60';
              }
            } else if (selectedOption === idx) {
              optionStyle = 'bg-amber-500/20 border-amber-500 text-amber-200 font-semibold';
            }

            return (
              <button
                key={idx}
                type="button"
                disabled={hasSubmitted || Boolean(questionResult)}
                onClick={() => handleOptionSelect(idx)}
                className={`w-full p-4 md:p-5 rounded-2xl border text-left text-sm md:text-base transition-all flex items-center justify-between gap-4 ${optionStyle}`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-slate-950/40 border border-slate-700/60 font-mono text-xs font-bold flex items-center justify-center text-amber-400">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span>{optionText}</span>
                </div>
                {questionResult && idx === questionResult.correctAnswerIndex && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                )}
                {questionResult && selectedOption === idx && idx !== questionResult.correctAnswerIndex && (
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Question Result & Explanation Banner */}
        {questionResult && (
          <div className="mt-6 p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2 animate-fadeIn">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
              <CornerDownRight className="w-4 h-4" />
              Explanation & Review
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              {questionResult.explanation || 'Next synchronized question loading automatically...'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
