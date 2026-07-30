import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaTimesCircle, FaArrowRight, FaTrophy, FaArrowLeft } from 'react-icons/fa';
import API from '../services/api';

const QuizSession = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { questionId: selectedOption }
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  
  useEffect(() => {
    fetchQuiz();
  }, [id]);

  const fetchQuiz = async () => {
    try {
      const res = await API.get(`/quizzes/${id}`);
      setQuiz(res.data.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load quiz details.');
      setLoading(false);
    }
  };

  const handleOptionSelect = (questionId, option) => {
    if (submitted) return;
    setAnswers({
      ...answers,
      [questionId]: option
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      // Format answers for API
      const formattedAnswers = Object.entries(answers).map(([qId, selected]) => ({
        questionId: qId,
        selectedAnswer: selected
      }));
      
      const res = await API.post(`/quizzes/${id}/submit`, { answers: formattedAnswers });
      setResult(res.data.data);
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      alert('Failed to submit quiz attempt.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center">
        <p className="text-red-400 mb-4">{error || 'Quiz not found.'}</p>
        <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-indigo-600 rounded-lg">Return to Dashboard</button>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans py-10 px-4 md:px-20">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 border-b border-slate-700 pb-4">
          <h1 className="text-2xl font-bold text-slate-100">{quiz.title}</h1>
          {!submitted && (
            <span className="text-sm font-medium bg-slate-800 px-3 py-1 rounded-full text-indigo-300">
              Question {currentQuestionIndex + 1} of {quiz.questions.length}
            </span>
          )}
        </div>

        {/* Quiz Content */}
        {!submitted ? (
          <div className="bg-slate-800 rounded-xl p-6 md:p-8 shadow-xl border border-slate-700">
            <h2 className="text-xl font-semibold mb-6 leading-relaxed">
              {currentQuestion.questionText}
            </h2>

            <div className="space-y-3 mb-8">
              {currentQuestion.options.map((option, index) => {
                const isSelected = answers[currentQuestion._id] === option;
                return (
                  <button
                    key={index}
                    onClick={() => handleOptionSelect(currentQuestion._id, option)}
                    className={`w-full text-left p-4 rounded-lg border transition-all duration-200 flex items-center ${
                      isSelected 
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-100' 
                        : 'bg-slate-700/50 border-slate-600 hover:border-indigo-400 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border flex-shrink-0 mr-4 flex items-center justify-center ${isSelected ? 'border-indigo-400' : 'border-slate-400'}`}>
                      {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-indigo-400"></div>}
                    </div>
                    <span>{option}</span>
                  </button>
                );
              })}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center mt-8">
              <button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className="flex items-center px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                <FaArrowLeft className="mr-2" /> Previous
              </button>
              
              {isLastQuestion ? (
                <button
                  onClick={handleSubmit}
                  disabled={Object.keys(answers).length < quiz.questions.length}
                  className="flex items-center px-6 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold shadow-lg shadow-emerald-500/20 transition-all"
                >
                  Submit Quiz <FaCheckCircle className="ml-2" />
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="flex items-center px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors"
                >
                  Next <FaArrowRight className="ml-2" />
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Results View */
          <div className="bg-slate-800 rounded-xl p-8 shadow-xl border border-slate-700">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-500/10 rounded-full mb-4">
                <FaTrophy className="text-4xl text-emerald-400" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Quiz Completed!</h2>
              <p className="text-slate-400 text-lg">
                You scored <span className="text-emerald-400 font-bold text-2xl">{result?.score}</span> out of {quiz.questions.length}
              </p>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-semibold border-b border-slate-700 pb-2 mb-4">Review Answers</h3>
              {quiz.questions.map((q, idx) => {
                const userAnswer = answers[q._id];
                const isCorrect = userAnswer === q.correctAnswer;

                return (
                  <div key={q._id} className="p-5 bg-slate-900/50 rounded-lg border border-slate-700">
                    <p className="font-medium text-slate-200 mb-3"><span className="text-slate-400 mr-2">{idx + 1}.</span>{q.questionText}</p>
                    
                    <div className="space-y-2 mb-4">
                      {q.options.map((opt, oIdx) => {
                        let btnClass = "w-full text-left p-3 rounded-md border text-sm flex items-center justify-between ";
                        
                        if (opt === q.correctAnswer) {
                          btnClass += "bg-emerald-500/20 border-emerald-500 text-emerald-100";
                        } else if (opt === userAnswer && !isCorrect) {
                          btnClass += "bg-red-500/20 border-red-500 text-red-100";
                        } else {
                          btnClass += "bg-slate-800 border-slate-700 text-slate-400 opacity-75";
                        }

                        return (
                          <div key={oIdx} className={btnClass}>
                            <span>{opt}</span>
                            {opt === q.correctAnswer && <FaCheckCircle className="text-emerald-400" />}
                            {opt === userAnswer && !isCorrect && <FaTimesCircle className="text-red-400" />}
                          </div>
                        );
                      })}
                    </div>

                    {q.explanation && (
                      <div className="bg-indigo-900/30 p-3 rounded border border-indigo-500/30">
                        <p className="text-sm text-indigo-200"><span className="font-semibold">Explanation:</span> {q.explanation}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="mt-8 text-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizSession;
