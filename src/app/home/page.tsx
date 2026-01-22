'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, removeUser, getGameHistories } from '@/lib/storage';
import { User, GameHistory, QuizCategory } from '@/types';
import { categoryNames, categoryIcons } from '@/lib/questions';

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Trophy,
    Brain,
    Target,
    TrendingUp,
    Gamepad2,
    BarChart3,
    Flame,
    LogOut,
    ChevronRight,
    Star,
    Clock,
    Award,
    Users,
    Zap,
    BookOpen
} from "lucide-react";

export default function HomePage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [history, setHistory] = useState<GameHistory[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const currentUser = getUser();
        if (!currentUser) {
            router.push('/login');
            return;
        }
        setUser(currentUser);
        const gameHistories = getGameHistories();
        setHistory(gameHistories);
        setIsLoading(false);
    }, [router]);

    const handleLogout = () => {
        removeUser();
        router.push('/login');
    };

    const handleStartTryout = (category: QuizCategory) => {
        router.push(`/select-character?category=${category}`);
    };

    const categories: QuizCategory[] = [
        'matematika',
        'sejarah',
        'ipa',
        'bahasa-indonesia',
        'bahasa-inggris',
        'umum',
    ];

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-950">
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 animate-pulse">
                        <Trophy className="w-8 h-8 text-white" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-xl font-semibold text-white">Loading Dashboard</h2>
                        <p className="text-gray-400 text-sm">Preparing your racing stats...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    // Calculate stats
    const totalPoints = user.totalPoints || 0;
    const gamesPlayed = user.gamesPlayed || 0;
    const averageScore = history.length > 0
        ? Math.round(history.reduce((a, h) => a + h.totalPoints, 0) / history.length)
        : 0;
    const winRate = history.length > 0
        ? Math.round((history.filter(h => h.finalPosition === 1).length / history.length) * 100)
        : 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-white/10 bg-gray-900/80 backdrop-blur-xl">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        {/* Logo */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                                <Trophy className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white">NitroQuiz</h1>
                                <p className="text-xs text-gray-400">Learning through racing</p>
                            </div>
                        </div>

                        {/* User Profile & Stats */}
                        <div className="flex items-center gap-6">
                            <div className="hidden md:flex items-center gap-4">
                                <div className="text-right">
                                    <p className="font-medium text-white">{user.username}</p>
                                    <p className="text-xs text-gray-400">Racer Level</p>
                                </div>
                                <Avatar className="h-10 w-10 border-2 border-purple-500/50">
                                    <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white">
                                        {user.username.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                            </div>

                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleLogout}
                                className="text-gray-400 hover:text-white"
                            >
                                <LogOut className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 space-y-8">
                {/* Welcome Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Welcome Card */}
                    <Card className="col-span-1 lg:col-span-2 border-gray-800 bg-gradient-to-br from-gray-900/50 to-gray-900/30 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                <div>
                                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                                        Welcome back, <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{user.username}</span>! 🏎️
                                    </h2>
                                    <p className="text-gray-400">
                                        Ready for today's learning adventure? Choose a category and start racing!
                                    </p>
                                </div>
                                <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2">
                                    <Trophy className="w-4 h-4 mr-2" />
                                    {totalPoints} Total Points
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Performance Chart Mini */}
                    <Card className="border-gray-800 bg-gray-900/50 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-white">Recent Performance</h3>
                                <TrendingUp className="w-5 h-5 text-purple-400" />
                            </div>
                            <div className="flex items-end justify-between h-24 gap-2">
                                {history.slice(0, 5).reverse().map((h, i) => {
                                    const height = Math.min(100, (h.totalPoints / 500) * 100);
                                    return (
                                        <div key={i} className="flex flex-col items-center flex-1 group relative">
                                            <div
                                                className="w-full rounded-t-lg bg-gradient-to-t from-purple-600 to-pink-600 transition-all duration-300 group-hover:opacity-80"
                                                style={{ height: `${Math.max(10, height)}%` }}
                                            />
                                            <div className="text-xs text-gray-500 mt-2">
                                                {new Date(h.date).toLocaleDateString('en-US', { month: 'short' })}
                                            </div>
                                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-gray-700">
                                                {h.totalPoints} pts
                                            </div>
                                        </div>
                                    );
                                })}
                                {history.length < 5 && Array(5 - history.length).fill(0).map((_, i) => (
                                    <div key={`empty-${i}`} className="flex flex-col items-center flex-1">
                                        <div className="w-full h-2 bg-gray-800 rounded-t-lg" />
                                        <div className="text-xs text-gray-600 mt-2">-</div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="border-gray-800 bg-gray-900/50 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                                    <Trophy className="w-5 h-5 text-amber-400" />
                                </div>
                                <div className="text-right">
                                    <Badge variant="secondary" className="bg-amber-500/20 text-amber-400">
                                        +12%
                                    </Badge>
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-1">{totalPoints}</h3>
                            <p className="text-sm text-gray-400">Total Points</p>
                        </CardContent>
                    </Card>

                    <Card className="border-gray-800 bg-gray-900/50 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/20">
                                    <Gamepad2 className="w-5 h-5 text-blue-400" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-1">{gamesPlayed}</h3>
                            <p className="text-sm text-gray-400">Games Played</p>
                        </CardContent>
                    </Card>

                    <Card className="border-gray-800 bg-gray-900/50 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
                                    <BarChart3 className="w-5 h-5 text-emerald-400" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-1">{averageScore}</h3>
                            <p className="text-sm text-gray-400">Average Score</p>
                        </CardContent>
                    </Card>

                    <Card className="border-gray-800 bg-gray-900/50 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-rose-500/20 to-pink-500/20">
                                    <Flame className="w-5 h-5 text-rose-400" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-1">{winRate}%</h3>
                            <p className="text-sm text-gray-400">Win Rate</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Quiz Categories */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2">Choose Your Category</h2>
                            <p className="text-gray-400">Select a subject and start your learning race</p>
                        </div>
                        <Button variant="ghost" size="sm" className="text-purple-400">
                            View all <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {categories.map((category) => {
                            const icon = categoryIcons[category];
                            const name = categoryNames[category];

                            return (
                                <Card
                                    key={category}
                                    className="border-gray-800 bg-gray-900/50 backdrop-blur-sm hover:border-purple-500/50 transition-all duration-300 cursor-pointer group"
                                    onClick={() => handleStartTryout(category)}
                                >
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 group-hover:scale-110 transition-transform">
                                                <div className="text-2xl">{icon}</div>
                                            </div>
                                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                                                5 Questions
                                            </Badge>
                                        </div>

                                        <h3 className="text-xl font-semibold text-white mb-2">{name}</h3>
                                        <p className="text-gray-400 text-sm mb-4">
                                            Test your knowledge in {name.toLowerCase()} while racing against time
                                        </p>

                                        <div className="flex items-center justify-between mt-6">
                                            <div className="flex items-center gap-2">
                                                <Star className="w-4 h-4 text-amber-400" />
                                                <span className="text-sm text-gray-300">+100 pts per correct</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-purple-400">
                                                <span className="text-sm font-medium">Start Race</span>
                                                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>

                {/* Recent Game History */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2">Recent Game History</h2>
                            <p className="text-gray-400">Track your performance and improvements</p>
                        </div>
                        {history.length > 0 && (
                            <Button variant="ghost" size="sm" className="text-purple-400">
                                View All <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        )}
                    </div>

                    {history.length === 0 ? (
                        <Card className="border-gray-800 bg-gray-900/50 backdrop-blur-sm">
                            <CardContent className="p-12 text-center">
                                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 mb-6">
                                    <Trophy className="w-10 h-10 text-purple-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">No Game History Yet</h3>
                                <p className="text-gray-400 mb-6">Start your first race to see your results here!</p>
                                <Button
                                    onClick={() => handleStartTryout('umum')}
                                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
                                >
                                    <Zap className="w-4 h-4 mr-2" />
                                    Start Your First Race
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {history.slice(0, 5).map((game) => {
                                const icon = categoryIcons[game.category];
                                const name = categoryNames[game.category];

                                return (
                                    <Card key={game.id} className="border-gray-800 bg-gray-900/50 backdrop-blur-sm hover:bg-gray-800/50 transition-all duration-300">
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                                                        <div className="text-xl">{icon}</div>
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-white">{name}</h3>
                                                        <p className="text-sm text-gray-400">
                                                            {new Date(game.date).toLocaleDateString('en-US', {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-8">
                                                    <div className="text-right">
                                                        <div className="flex items-center gap-2 justify-end">
                                                            <Award className="w-4 h-4 text-amber-400" />
                                                            <span className="text-xl font-bold text-amber-300">{game.totalPoints}</span>
                                                        </div>
                                                        <p className="text-sm text-gray-400">Points</p>
                                                    </div>

                                                    <div className="text-right">
                                                        <div className="flex items-center gap-2 justify-end">
                                                            <Target className="w-4 h-4 text-emerald-400" />
                                                            <span className="text-xl font-bold text-white">
                                                                {game.correctAnswers}/{game.totalQuestions}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-400">Correct</p>
                                                    </div>

                                                    <div>
                                                        <Badge className={
                                                            game.finalPosition === 1
                                                                ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30"
                                                                : game.finalPosition <= 3
                                                                    ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30"
                                                                    : "bg-gray-800 text-gray-400"
                                                        }>
                                                            #{game.finalPosition}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}