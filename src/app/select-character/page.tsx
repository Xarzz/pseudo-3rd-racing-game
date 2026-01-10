'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { characters } from '@/lib/characters';
import { saveSelectedCharacter } from '@/lib/storage';
import { Character } from '@/types';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ArrowRight, Star } from "lucide-react";

function CharacterSelectionContent() {
    const router = useRouter();

    const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);

    const handleSelect = (character: Character) => {
        setSelectedCharacter(character);
    };

    const handleConfirm = () => {
        if (!selectedCharacter) return;

        setIsAnimating(true);
        saveSelectedCharacter(selectedCharacter);

        setTimeout(() => {
            router.push('/gamespeed');
        }, 800);
    };

    return (
        <div className="min-h-screen bg-[#F0F4F8] text-[#333] font-sans overflow-hidden relative selection:bg-yellow-300">

            {/* Retro Pattern Background */}
            <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(#888 2px, transparent 2px)',
                    backgroundSize: '30px 30px'
                }}
            />

            {/* Header */}
            <header className="relative z-10 pt-6 px-6 flex items-center justify-between">
                <Button
                    onClick={() => router.back()}
                    className="bg-white border-4 border-black text-black hover:bg-yellow-300 rounded-full w-12 h-12 flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-x-1 active:translate-y-1 active:shadow-none"
                >
                    <ChevronLeft className="w-8 h-8 stroke-[3]" />
                </Button>

                <div className="bg-yellow-300 border-4 border-black px-8 py-3 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] -rotate-2 transform hover:rotate-0 transition-transform cursor-default">
                    <h1 className="text-2xl md:text-3xl font-black uppercase tracking-widest text-black">
                        Select Driver
                    </h1>
                </div>

                <div className="w-12 h-12" /> {/* Spacer */}
            </header>

            <main className="container mx-auto px-4 py-8 relative z-10 h-[calc(100vh-100px)] flex flex-col justify-center items-center">

                {/* Character Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-8 max-w-5xl mx-auto w-full px-4">
                    {characters.map((character) => {
                        const isSelected = selectedCharacter?.id === character.id;

                        return (
                            <div
                                key={character.id}
                                onClick={() => handleSelect(character)}
                                className="relative cursor-pointer"
                            >
                                {/* Card Body */}
                                <div className={`retro-card p-4 flex flex-col items-center ${isSelected ? 'selected ring-4 ring-yellow-400 ring-offset-4 ring-offset-[#F0F4F8]' : ''}`}>

                                    {/* Selection Badge */}
                                    {isSelected && (
                                        <div className="absolute -top-4 -right-4 bg-green-500 border-4 border-black text-white w-12 h-12 flex items-center justify-center rounded-full shadow-lg z-20 animate-[bounce_1s_infinite]">
                                            <Star className="w-7 h-7 fill-current" />
                                        </div>
                                    )}

                                    {/* Avatar Area */}
                                    <div className={`
                                        w-full aspect-square rounded-2xl mb-4 flex items-center justify-center border-2 border-black overflow-hidden relative
                                        bg-gradient-to-br transition-colors duration-300
                                        ${character.color === 'red' ? 'from-red-100 to-red-50' :
                                            character.color === 'blue' ? 'from-blue-100 to-blue-50' :
                                                'from-purple-100 to-purple-50'}
                                    `}>
                                        <span className="text-7xl filter drop-shadow-md transform transition-transform duration-300 hover:scale-110">
                                            🏎️
                                        </span>
                                    </div>

                                    {/* Name */}
                                    <h3 className="retro-heading text-lg md:text-xl text-center mb-3">
                                        {character.name}
                                    </h3>

                                    {/* Stats */}
                                    <div className="w-full space-y-3 px-1">
                                        {/* Speed */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black w-10 uppercase tracking-wider text-gray-500">Spd</span>
                                            <div className="flex-1 h-4 bg-gray-200 rounded-full border-2 border-black overflow-hidden relative">
                                                <div
                                                    className="h-full bg-yellow-400 absolute top-0 left-0 border-r-2 border-black"
                                                    style={{ width: `${character.stats.speed * 10}%` }}
                                                />
                                            </div>
                                        </div>
                                        {/* Handling */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black w-10 uppercase tracking-wider text-gray-500">Trn</span>
                                            <div className="flex-1 h-4 bg-gray-200 rounded-full border-2 border-black overflow-hidden relative">
                                                <div
                                                    className="h-full bg-blue-400 absolute top-0 left-0 border-r-2 border-black"
                                                    style={{ width: `${character.stats.handling * 10}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Confirm Button */}
                <div className="mt-12 w-full flex justify-center pb-8">
                    <button
                        onClick={handleConfirm}
                        disabled={!selectedCharacter || isAnimating}
                        className={`retro-btn px-16 py-6 text-2xl md:text-3xl text-white rounded-full ${!selectedCharacter ? '' : 'bg-green-500'}`}
                    >
                        <span className="relative z-10 flex items-center gap-4">
                            {isAnimating ? 'Starting...' : 'Start Race!'}
                            {!isAnimating && selectedCharacter && <ArrowRight className="w-8 h-8 stroke-[4] animate-pulse" />}
                        </span>
                    </button>
                </div>

            </main>
        </div>
    );
}

export default function SelectCharacterPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#F0F4F8]">
                <div className="font-black text-4xl animate-bounce">LOADING...</div>
            </div>
        }>
            <CharacterSelectionContent />
        </Suspense>
    );
}
