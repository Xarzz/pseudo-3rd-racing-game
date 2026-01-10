// User types
export interface User {
    id: string;
    username: string;
    email: string;
    avatar?: string;
    totalPoints: number;
    gamesPlayed: number;
    createdAt: string;
}

// Quiz types
export interface Question {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    category: QuizCategory;
    difficulty: 'easy' | 'medium' | 'hard';
}

export type QuizCategory =
    | 'matematika'
    | 'sejarah'
    | 'ipa'
    | 'bahasa-indonesia'
    | 'bahasa-inggris'
    | 'umum';

export interface QuizSession {
    id: string;
    category: QuizCategory;
    questions: Question[];
    currentQuestionIndex: number;
    answers: UserAnswer[];
    startTime: string;
    endTime?: string;
    totalPoints: number;
    status: 'in-progress' | 'completed';
}

export interface UserAnswer {
    questionId: string;
    selectedAnswer: number;
    isCorrect: boolean;
    timeSpent: number;
    bonusPoints: number;
}

// Character types
export interface Character {
    id: string;
    name: string;
    avatar: string;
    vehicle: string;
    color: string;
    stats: {
        speed: number;
        handling: number;
        acceleration: number;
    };
}

// Game types
export interface GameSettings {
    timeLimit: number; // in seconds
    selectedCharacter: Character | null;
    difficulty: 'easy' | 'medium' | 'hard';
}

export interface GameState {
    isPlaying: boolean;
    currentLap: number;
    totalLaps: number;
    position: number;
    points: number;
    timeRemaining: number;
    isGameOver: boolean;
    isFinished: boolean;
}

export interface Player {
    id: string;
    name: string;
    character: Character;
    position: number;
    lap: number;
    points: number;
    isPlayer: boolean;
    trackPosition: { x: number; y: number };
}

// History types
export interface GameHistory {
    id: string;
    date: string;
    category: QuizCategory;
    totalQuestions: number;
    correctAnswers: number;
    totalPoints: number;
    finalPosition: number;
    timeSpent: number;
    character: string;
}

// Leaderboard types
export interface LeaderboardEntry {
    rank: number;
    playerName: string;
    points: number;
    avatar?: string;
    isCurrentPlayer: boolean;
}
