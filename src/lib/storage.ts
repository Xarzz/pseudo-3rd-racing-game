'use client';

import { User, QuizSession, GameHistory, GameSettings, Character } from '@/types';

const STORAGE_KEYS = {
    USER: 'edurace_user',
    QUIZ_SESSION: 'edurace_quiz_session',
    GAME_HISTORY: 'edurace_game_history',
    GAME_SETTINGS: 'edurace_game_settings',
    SELECTED_CHARACTER: 'edurace_selected_character',
} as const;

// User Storage
export const saveUser = (user: User): void => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    }
};

export const getUser = (): User | null => {
    if (typeof window !== 'undefined') {
        const data = localStorage.getItem(STORAGE_KEYS.USER);
        return data ? JSON.parse(data) : null;
    }
    return null;
};

export const removeUser = (): void => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEYS.USER);
    }
};

// Quiz Session Storage
export const saveQuizSession = (session: QuizSession): void => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.QUIZ_SESSION, JSON.stringify(session));
    }
};

export const getQuizSession = (): QuizSession | null => {
    if (typeof window !== 'undefined') {
        const data = localStorage.getItem(STORAGE_KEYS.QUIZ_SESSION);
        return data ? JSON.parse(data) : null;
    }
    return null;
};

export const removeQuizSession = (): void => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEYS.QUIZ_SESSION);
    }
};

// Game History Storage
export const saveGameHistory = (history: GameHistory): void => {
    if (typeof window !== 'undefined') {
        const existingHistory = getGameHistories();
        existingHistory.unshift(history);
        // Keep only last 50 entries
        const trimmedHistory = existingHistory.slice(0, 50);
        localStorage.setItem(STORAGE_KEYS.GAME_HISTORY, JSON.stringify(trimmedHistory));
    }
};

export const getGameHistories = (): GameHistory[] => {
    if (typeof window !== 'undefined') {
        const data = localStorage.getItem(STORAGE_KEYS.GAME_HISTORY);
        return data ? JSON.parse(data) : [];
    }
    return [];
};

export const clearGameHistory = (): void => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEYS.GAME_HISTORY);
    }
};

// Game Settings Storage
export const saveGameSettings = (settings: GameSettings): void => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.GAME_SETTINGS, JSON.stringify(settings));
    }
};

export const getGameSettings = (): GameSettings | null => {
    if (typeof window !== 'undefined') {
        const data = localStorage.getItem(STORAGE_KEYS.GAME_SETTINGS);
        return data ? JSON.parse(data) : null;
    }
    return null;
};

// Selected Character Storage
export const saveSelectedCharacter = (character: Character): void => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.SELECTED_CHARACTER, JSON.stringify(character));
    }
};

export const getSelectedCharacter = (): Character | null => {
    if (typeof window !== 'undefined') {
        const data = localStorage.getItem(STORAGE_KEYS.SELECTED_CHARACTER);
        return data ? JSON.parse(data) : null;
    }
    return null;
};

// Clear all storage
export const clearAllStorage = (): void => {
    if (typeof window !== 'undefined') {
        Object.values(STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
    }
};
