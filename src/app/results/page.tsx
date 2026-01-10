'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getQuizSession, getUser, saveGameHistory, saveUser, removeQuizSession } from '@/lib/storage';
import { QuizSession, User, GameHistory, LeaderboardEntry } from '@/types';
import { categoryNames, categoryIcons } from '@/lib/questions';
import { botNames } from '@/lib/characters';

export default function ResultsPage() {
    const router = useRouter();
    const [session, setSession] = useState<QuizSession | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        const savedSession = getQuizSession();
        const savedUser = getUser();

        if (!savedSession || !savedUser) {
            router.push('/home');
            return;
        }

        setSession(savedSession);
        setUser(savedUser);

        // Generate leaderboard with bots
        const playerScore = savedSession.totalPoints;
        const botScores = botNames.slice(0, 5).map((name) => ({
            name,
            points: Math.floor(Math.random() * 400) + 100,
        }));

        const allScores = [
            { name: savedUser.username, points: playerScore, isPlayer: true },
            ...botScores.map((s) => ({ ...s, isPlayer: false })),
        ].sort((a, b) => b.points - a.points);

        const leaderboardData: LeaderboardEntry[] = allScores.map((score, index) => ({
            rank: index + 1,
            playerName: score.name,
            points: score.points,
            isCurrentPlayer: score.isPlayer,
        }));

        setLeaderboard(leaderboardData);

        // Save game history
        const playerRank = leaderboardData.find((l) => l.isCurrentPlayer)?.rank || 4;
        const correctAnswers = savedSession.answers.filter((a) => a.isCorrect).length;

        const history: GameHistory = {
            id: `history-${Date.now()}`,
            date: new Date().toISOString(),
            category: savedSession.category,
            totalQuestions: savedSession.questions.length,
            correctAnswers,
            totalPoints: savedSession.totalPoints,
            finalPosition: playerRank,
            timeSpent: savedSession.answers.reduce((acc, a) => acc + a.timeSpent, 0),
            character: 'Speed Racer', // Could get from saved character
        };
        saveGameHistory(history);

        // Update user stats
        const updatedUser: User = {
            ...savedUser,
            totalPoints: savedUser.totalPoints + savedSession.totalPoints,
            gamesPlayed: savedUser.gamesPlayed + 1,
        };
        saveUser(updatedUser);
        setUser(updatedUser);

        // Clean up session
        removeQuizSession();
    }, [router]);

    const handleGoHome = () => {
        router.push('/home');
    };

    const handlePlayAgain = () => {
        router.push('/home');
    };

    if (!session || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animated-bg" />
                <div className="spinner w-12 h-12" />
            </div>
        );
    }

    const correctAnswers = session.answers.filter((a) => a.isCorrect).length;
    const accuracy = Math.round((correctAnswers / session.questions.length) * 100);
    const playerRank = leaderboard.find((l) => l.isCurrentPlayer)?.rank || 1;

    return (
        <div className="min-h-screen py-8 px-4">
            <div className="animated-bg" />

            <div className="container mx-auto max-w-4xl">
                {/* Header */}
                <div className="text-center mb-10 fade-in">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 mb-6">
                        <span className="text-5xl">🏆</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-pink-400 bg-clip-text text-transparent">
                            Permainan Selesai!
                        </span>
                    </h1>
                    <p className="text-gray-400 text-lg">
                        {categoryIcons[session.category]} {categoryNames[session.category]}
                    </p>
                </div>

                {/* Main Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                    {[
                        {
                            label: 'Total Poin',
                            value: session.totalPoints,
                            icon: '⭐',
                            color: 'from-amber-500 to-orange-500',
                            suffix: 'pts'
                        },
                        {
                            label: 'Peringkat',
                            value: `#${playerRank}`,
                            icon: '🏅',
                            color: playerRank === 1 ? 'from-amber-400 to-yellow-500' : 'from-blue-500 to-indigo-500',
                            suffix: ''
                        },
                        {
                            label: 'Jawaban Benar',
                            value: `${correctAnswers}/${session.questions.length}`,
                            icon: '✅',
                            color: 'from-emerald-500 to-teal-500',
                            suffix: ''
                        },
                        {
                            label: 'Akurasi',
                            value: accuracy,
                            icon: '🎯',
                            color: accuracy >= 80 ? 'from-emerald-500 to-teal-500' : accuracy >= 50 ? 'from-amber-500 to-orange-500' : 'from-red-500 to-pink-500',
                            suffix: '%'
                        },
                    ].map((stat, i) => (
                        <div
                            key={i}
                            className="glass-card p-6 text-center slide-up"
                            style={{ animationDelay: `${i * 0.1}s` }}
                        >
                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-2xl mx-auto mb-3`}>
                                {stat.icon}
                            </div>
                            <p className="text-3xl font-bold text-white">{stat.value}{stat.suffix}</p>
                            <p className="text-sm text-gray-400">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Leaderboard */}
                <div className="glass-card p-6 mb-8 slide-up" style={{ animationDelay: '0.4s' }}>
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                        <span className="text-2xl">🏆</span>
                        Leaderboard
                    </h3>
                    <div className="space-y-3">
                        {leaderboard.map((entry, index) => (
                            <div
                                key={index}
                                className={`leaderboard-item ${entry.isCurrentPlayer
                                        ? 'border border-emerald-500/30 bg-emerald-500/10'
                                        : ''
                                    }`}
                            >
                                <div className={`rank-badge ${entry.rank === 1 ? 'rank-1' :
                                        entry.rank === 2 ? 'rank-2' :
                                            entry.rank === 3 ? 'rank-3' :
                                                'bg-gray-600'
                                    }`}>
                                    {entry.rank}
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-white flex items-center gap-2">
                                        {entry.playerName}
                                        {entry.isCurrentPlayer && (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                                                Kamu
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-amber-400">{entry.points} pts</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Answer Details */}
                <div className="glass-card p-6 mb-8 slide-up" style={{ animationDelay: '0.5s' }}>
                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="w-full flex items-center justify-between text-left"
                    >
                        <h3 className="text-xl font-bold text-white flex items-center gap-3">
                            <span className="text-2xl">📋</span>
                            Detail Jawaban
                        </h3>
                        <span className={`text-2xl transition-transform ${showDetails ? 'rotate-180' : ''}`}>
                            ▼
                        </span>
                    </button>

                    {showDetails && (
                        <div className="mt-6 space-y-4 fade-in">
                            {session.questions.map((question, index) => {
                                const answer = session.answers[index];
                                const isCorrect = answer?.isCorrect;

                                return (
                                    <div
                                        key={question.id}
                                        className={`p-4 rounded-xl ${isCorrect
                                                ? 'bg-emerald-500/10 border border-emerald-500/30'
                                                : 'bg-red-500/10 border border-red-500/30'
                                            }`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isCorrect ? 'bg-emerald-500' : 'bg-red-500'
                                                }`}>
                                                {isCorrect ? '✓' : '✗'}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-white mb-2">{question.question}</p>
                                                <div className="flex flex-wrap gap-2 text-sm">
                                                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400">
                                                        Benar: {question.options[question.correctAnswer]}
                                                    </span>
                                                    {!isCorrect && answer && (
                                                        <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400">
                                                            Jawabanmu: {answer.selectedAnswer >= 0
                                                                ? question.options[answer.selectedAnswer]
                                                                : 'Waktu habis'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={`font-bold ${isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {isCorrect ? '+100' : '0'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center slide-up" style={{ animationDelay: '0.6s' }}>
                    <button onClick={handlePlayAgain} className="btn-race px-10 py-4">
                        <span className="flex items-center gap-3">
                            <span className="text-2xl">🔄</span>
                            Main Lagi
                        </span>
                    </button>
                    <button onClick={handleGoHome} className="btn-secondary px-10 py-4">
                        <span className="flex items-center gap-3">
                            <span className="text-2xl">🏠</span>
                            Kembali ke Home
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}
