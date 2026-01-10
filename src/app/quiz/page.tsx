'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getQuizSession, saveQuizSession, getGameSettings } from '@/lib/storage';
import { QuizSession, UserAnswer, GameSettings } from '@/types';

export default function QuizPage() {
    const router = useRouter();
    const [session, setSession] = useState<QuizSession | null>(null);
    const [settings, setSettings] = useState<GameSettings | null>(null);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [timeLeft, setTimeLeft] = useState(60);
    const [isAnswered, setIsAnswered] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);

    useEffect(() => {
        const savedSession = getQuizSession();
        const savedSettings = getGameSettings();

        if (!savedSession) {
            router.push('/home');
            return;
        }

        setSession(savedSession);
        setSettings(savedSettings);
        setTimeLeft(savedSettings?.timeLimit || 60);
    }, [router]);

    // Timer countdown
    useEffect(() => {
        if (!session || isAnswered) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    handleTimeout();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [session, isAnswered]);

    const handleTimeout = useCallback(() => {
        if (isAnswered) return;
        handleAnswer(-1); // -1 indicates timeout
    }, [isAnswered]);

    const handleAnswer = (answerIndex: number) => {
        if (!session) return;

        setSelectedAnswer(answerIndex);
        setIsAnswered(true);

        const currentQuestion = session.questions[session.currentQuestionIndex];
        const correct = answerIndex === currentQuestion.correctAnswer;
        setIsCorrect(correct);
        setShowFeedback(true);

        const answer: UserAnswer = {
            questionId: currentQuestion.id,
            selectedAnswer: answerIndex,
            isCorrect: correct,
            timeSpent: (settings?.timeLimit || 60) - timeLeft,
            bonusPoints: correct ? 100 : 0,
        };

        const updatedSession: QuizSession = {
            ...session,
            answers: [...session.answers, answer],
            totalPoints: session.totalPoints + (correct ? 100 : 0),
        };

        setSession(updatedSession);
        saveQuizSession(updatedSession);

        // Wait for feedback, then proceed
        setTimeout(() => {
            goToNext(updatedSession);
        }, 1500);
    };

    const goToNext = (currentSession: QuizSession) => {
        const nextIndex = currentSession.currentQuestionIndex + 1;

        // After question 3 (index 2), go to racing game
        if (nextIndex === 3) {
            const updatedSession: QuizSession = {
                ...currentSession,
                currentQuestionIndex: nextIndex,
            };
            saveQuizSession(updatedSession);
            router.push('/gamespeed');
            return;
        }

        // If all questions answered, go to results
        if (nextIndex >= currentSession.questions.length) {
            const finalSession: QuizSession = {
                ...currentSession,
                status: 'completed',
                endTime: new Date().toISOString(),
            };
            saveQuizSession(finalSession);
            router.push('/results');
            return;
        }

        // Go to next question
        const updatedSession: QuizSession = {
            ...currentSession,
            currentQuestionIndex: nextIndex,
        };
        setSession(updatedSession);
        saveQuizSession(updatedSession);

        // Reset state for next question
        setSelectedAnswer(null);
        setIsAnswered(false);
        setShowFeedback(false);
        setTimeLeft(settings?.timeLimit || 60);
    };

    if (!session) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animated-bg" />
                <div className="spinner w-12 h-12" />
            </div>
        );
    }

    const currentQuestion = session.questions[session.currentQuestionIndex];
    const progress = ((session.currentQuestionIndex + 1) / session.questions.length) * 100;
    const timerPercentage = (timeLeft / (settings?.timeLimit || 60)) * 100;

    return (
        <div className="min-h-screen py-8 px-4">
            <div className="animated-bg" />

            <div className="container mx-auto max-w-3xl">
                {/* Header with stats */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="glass-card px-4 py-2 flex items-center gap-2">
                            <span className="text-xl">📝</span>
                            <span className="font-bold text-white">
                                {session.currentQuestionIndex + 1}/{session.questions.length}
                            </span>
                        </div>
                        <div className="glass-card px-4 py-2 flex items-center gap-2">
                            <span className="text-amber-400">⭐</span>
                            <span className="font-bold text-amber-300">{session.totalPoints} pts</span>
                        </div>
                    </div>

                    {/* Timer */}
                    <div className="relative">
                        <div className={`glass-card px-6 py-3 flex items-center gap-3 ${timeLeft <= 10 ? 'border-red-500/50 animate-pulse' : ''
                            }`}>
                            <span className={`text-2xl ${timeLeft <= 10 ? 'text-red-400' : 'text-white'}`}>⏱️</span>
                            <span className={`text-2xl font-bold font-mono ${timeLeft <= 10 ? 'text-red-400' : 'text-white'
                                }`}>
                                {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:
                                {String(timeLeft % 60).padStart(2, '0')}
                            </span>
                        </div>
                        <div
                            className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-1000"
                            style={{ width: `${timerPercentage}%` }}
                        />
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="progress-bar h-3">
                        <div
                            className="progress-fill transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Question Card */}
                <div className="glass-card p-8 mb-8 fade-in">
                    <div className="flex items-center gap-3 mb-6">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-400">
                            Soal {session.currentQuestionIndex + 1}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 capitalize">
                            {currentQuestion.difficulty}
                        </span>
                    </div>

                    <h2 className="text-2xl md:text-3xl font-bold text-white leading-relaxed">
                        {currentQuestion.question}
                    </h2>
                </div>

                {/* Answer Options */}
                <div className="grid gap-4 mb-8">
                    {currentQuestion.options.map((option, index) => {
                        let buttonClass = 'quiz-card p-5 text-left transition-all';

                        if (showFeedback) {
                            if (index === currentQuestion.correctAnswer) {
                                buttonClass += ' border-emerald-500 bg-emerald-500/20';
                            } else if (index === selectedAnswer && !isCorrect) {
                                buttonClass += ' border-red-500 bg-red-500/20';
                            }
                        } else if (selectedAnswer === index) {
                            buttonClass += ' border-indigo-500 bg-indigo-500/20';
                        }

                        return (
                            <button
                                key={index}
                                onClick={() => !isAnswered && handleAnswer(index)}
                                disabled={isAnswered}
                                className={`${buttonClass} ${isAnswered ? 'cursor-not-allowed' : 'hover:border-indigo-500'} slide-up`}
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${showFeedback && index === currentQuestion.correctAnswer
                                        ? 'bg-emerald-500 text-white'
                                        : showFeedback && index === selectedAnswer && !isCorrect
                                            ? 'bg-red-500 text-white'
                                            : 'bg-white/10 text-white'
                                        }`}>
                                        {String.fromCharCode(65 + index)}
                                    </div>
                                    <span className="text-lg text-white">{option}</span>

                                    {showFeedback && index === currentQuestion.correctAnswer && (
                                        <span className="ml-auto text-2xl">✅</span>
                                    )}
                                    {showFeedback && index === selectedAnswer && !isCorrect && (
                                        <span className="ml-auto text-2xl">❌</span>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Feedback Message */}
                {showFeedback && (
                    <div className={`glass-card p-6 text-center fade-in ${isCorrect ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-red-500/50 bg-red-500/10'
                        }`}>
                        <div className="text-4xl mb-3">{isCorrect ? '🎉' : '😔'}</div>
                        <h3 className={`text-xl font-bold ${isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                            {isCorrect ? 'Benar! +100 poin' : 'Salah!'}
                        </h3>
                        <p className="text-gray-400 mt-2">
                            {session.currentQuestionIndex === 2
                                ? 'Bersiap untuk mini-game balapan!'
                                : 'Lanjut ke soal berikutnya...'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
