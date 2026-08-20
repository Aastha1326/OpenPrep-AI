import React, { useState, useEffect } from 'react';
import { X, ChevronRight, Check } from 'lucide-react';

const STEPS = [
  {
    title: 'Welcome to OpenPrep!',
    content: 'Let\'s take a quick tour of your new AI-powered study dashboard.',
  },
  {
    title: 'Generate Study Plans',
    content: 'Import your syllabus to instantly generate a tailored daily study plan.',
  },
  {
    title: 'Flashcard Mastery',
    content: 'Use spaced-repetition (SM-2) to master complex topics efficiently.',
  },
  {
    title: 'Battle Arena',
    content: 'Challenge your study squad in real-time quiz battles!',
  },
  {
    title: 'You\'re All Set!',
    content: 'Start learning, maintain your streak, and level up!',
  }
];

export default function Walkthrough() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Show walkthrough only once per device
    const hasSeen = localStorage.getItem('hasSeenWalkthrough');
    if (!hasSeen) {
      setIsOpen(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('hasSeenWalkthrough', 'true');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative animate-in fade-in zoom-in duration-300">
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="flex gap-1.5 mb-6">
          {STEPS.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${idx <= currentStep ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}
            />
          ))}
        </div>

        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 font-playfair">
          {STEPS[currentStep].title}
        </h3>
        <p className="text-slate-600 dark:text-slate-300 mb-8 min-h-[48px] leading-relaxed">
          {STEPS[currentStep].content}
        </p>

        <div className="flex justify-between items-center">
          <button 
            onClick={handleClose}
            className="text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            Skip Tour
          </button>
          
          <button 
            onClick={handleNext}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-indigo-200 dark:shadow-none"
          >
            {currentStep === STEPS.length - 1 ? (
              <>Get Started <Check className="w-4 h-4" /></>
            ) : (
              <>Next <ChevronRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
