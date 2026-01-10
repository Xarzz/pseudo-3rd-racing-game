'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSelectedCharacter, saveGameSettings, saveQuizSession } from '@/lib/storage';
import { getRandomQuestions, categoryNames, categoryIcons } from '@/lib/questions';
import { Character, QuizCategory, GameSettings, QuizSession } from '@/types';

const timeOptions = [
    { label: '30 detik', value: 30 },
    { label: '1 menit', value: 60 },
    { label: '2 menit', value: 120 },
    { label: '3 menit', value: 180 },
];

const difficultyOptions = [
    { label: 'Mudah', value: 'easy' as const, color: 'from-emerald-500 to-teal-500', icon: '🌱' },
    { label: 'Sedang', value: 'medium' as const, color: 'from-amber-500 to-orange-500', icon: '⚡' },
    { label: 'Sulit', value: 'hard' as const, color: 'from-rose-500 to-pink-500', icon: '🔥' },
];

function GameSettingsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const category = searchParams.get('category') as QuizCategory;

    const [character, setCharacter] = useState<Character | null>(null);
    const [selectedTime, setSelectedTime] = useState(60);
    const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
    const [isStarting, setIsStarting] = useState(false);
    const [countdown, setCountdown] = useState<number | null>(null);

    useEffect(() => {
        const savedCharacter = getSelectedCharacter();
        if (!savedCharacter || !category) {
            router.push('/home');
            return;
        }
        setCharacter(savedCharacter);
    }, [category, router]);

    const handleStart = () => {
        setIsStarting(true);
        setCountdown(3);

        // Save game settings
        const settings: GameSettings = {
            timeLimit: selectedTime,
            selectedCharacter: character,
            difficulty: selectedDifficulty,
        };
        saveGameSettings(settings);

        // Generate quiz session
        const questions = getRandomQuestions(category, 5);
        const session: QuizSession = {
            id: `quiz-${Date.now()}`,
            category,
            questions,
            currentQuestionIndex: 0,
            answers: [],
            startTime: new Date().toISOString(),
            totalPoints: 0,
            status: 'in-progress',
        };
        saveQuizSession(session);

        // Countdown animation
        const countdownInterval = setInterval(() => {
            setCountdown((prev) => {
                if (prev === 1) {
                    clearInterval(countdownInterval);
                    return 0; // Set to 0 to indicate finish
                }
                return prev ? prev - 1 : null;
            });
        }, 1000);
    };

    // Handle navigation when countdown reaches 0
    useEffect(() => {
        if (countdown === 0) {
            router.push('/quiz');
        }
    }, [countdown, router]);

    if (countdown !== null) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animated-bg" />
                <div className="text-center">
                    <div className="w-40 h-40 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-8 animate-pulse">
                        <span className="text-7xl font-bold">{countdown}</span>
                    </div>
                    <h2 className="text-3xl font-bold text-white">Bersiap-siap...</h2>
                    <p className="text-gray-400 mt-2">Permainan akan segera dimulai!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-8 px-4">
            <div className="animated-bg" />

            <div className="container mx-auto max-w-3xl">
                {/* Header */}
                <div className="text-center mb-10 fade-in">
                    <button
                        onClick={() => router.back()}
                        className="absolute left-4 top-8 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <span className="text-xl">←</span>
                    </button>

                    <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-indigo-500/20 border border-indigo-500/30 mb-6">
                        <span className="text-2xl">{categoryIcons[category]}</span>
                        <span className="font-semibold text-indigo-300">{categoryNames[category]}</span>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                            Pengaturan Permainan
                        </span>
                    </h1>
                </div>

                {/* Selected Character Preview */}
                <div className="glass-card p-6 mb-8 flex items-center gap-6 slide-up">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-4xl">
                        🏎️
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-white">{character?.name}</h3>
                        <p className="text-gray-400">Karakter terpilih</p>
                    </div>
                    <button
                        onClick={() => router.back()}
                        className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition-colors"
                    >
                        Ganti
                    </button>
                </div>

                {/* Time Selection */}
                <div className="glass-card p-6 mb-6 slide-up" style={{ animationDelay: '0.1s' }}>
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <span className="text-2xl">⏱️</span>
                        Waktu per Soal
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {timeOptions.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => setSelectedTime(option.value)}
                                className={`p-4 rounded-xl text-center transition-all ${selectedTime === option.value
                                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                                    : 'bg-white/5 hover:bg-white/10 text-gray-300'
                                    }`}
                            >
                                <span className="text-2xl font-bold block">{option.value}</span>
                                <span className="text-sm opacity-80">{option.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Difficulty Selection */}
                <div className="glass-card p-6 mb-8 slide-up" style={{ animationDelay: '0.2s' }}>
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <span className="text-2xl">🎯</span>
                        Tingkat Kesulitan
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                        {difficultyOptions.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => setSelectedDifficulty(option.value)}
                                className={`p-5 rounded-xl text-center transition-all ${selectedDifficulty === option.value
                                    ? `bg-gradient-to-br ${option.color} text-white scale-105`
                                    : 'bg-white/5 hover:bg-white/10 text-gray-300'
                                    }`}
                            >
                                <span className="text-3xl block mb-2">{option.icon}</span>
                                <span className="font-semibold">{option.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Game Rules */}
                <div className="glass-card p-6 mb-8 slide-up" style={{ animationDelay: '0.3s' }}>
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <span className="text-2xl">📋</span>
                        Aturan Permainan
                    </h3>
                    <ul className="space-y-3 text-gray-300">
                        <li className="flex items-start gap-3">
                            <span className="text-emerald-400">✓</span>
                            <span>Jawab 5 soal quiz, dengan mini-game balapan di tengah</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="text-emerald-400">✓</span>
                            <span>Setelah soal ke-3, kamu akan bermain balapan untuk bonus poin</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="text-emerald-400">✓</span>
                            <span>Selesaikan 1 lap untuk mendapat bonus +200 poin</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="text-amber-400">!</span>
                            <span>Game over jika nabrak penghalang atau keluar jalur</span>
                        </li>
                    </ul>
                </div>

                {/* Start Button */}
                <div className="text-center slide-up" style={{ animationDelay: '0.4s' }}>
                    <button
                        onClick={handleStart}
                        disabled={isStarting}
                        className="btn-race text-xl px-16 py-6 pulse"
                    >
                        <span className="flex items-center gap-3">
                            <span className="text-3xl">🚀</span>
                            MULAI PERMAINAN
                            <span className="text-3xl">🏁</span>
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function GameSettingsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="animated-bg" />
                <div className="spinner w-12 h-12" />
            </div>
        }>
            <GameSettingsContent />
        </Suspense>
    );
}
