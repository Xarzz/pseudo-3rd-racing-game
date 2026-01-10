import { Character } from '@/types';

export const characters: Character[] = [
    {
        id: 'racer-1',
        name: 'Speed Racer',
        avatar: '/assets/characters/racer-1.png',
        vehicle: '/assets/vehicles/car-1.png',
        stats: {
            speed: 9,
            handling: 7,
            acceleration: 8,
        },
    },
    {
        id: 'racer-2',
        name: 'Turbo Max',
        avatar: '/assets/characters/racer-2.png',
        vehicle: '/assets/vehicles/car-2.png',
        stats: {
            speed: 8,
            handling: 9,
            acceleration: 7,
        },
    },
    {
        id: 'racer-3',
        name: 'Flash Runner',
        avatar: '/assets/characters/racer-3.png',
        vehicle: '/assets/vehicles/car-3.png',
        stats: {
            speed: 7,
            handling: 8,
            acceleration: 9,
        },
    },
    {
        id: 'racer-4',
        name: 'Storm Driver',
        avatar: '/assets/characters/racer-4.png',
        vehicle: '/assets/vehicles/car-4.png',
        stats: {
            speed: 8,
            handling: 8,
            acceleration: 8,
        },
    },
    {
        id: 'racer-5',
        name: 'Nitro Blaze',
        avatar: '/assets/characters/racer-5.png',
        vehicle: '/assets/vehicles/car-5.png',
        stats: {
            speed: 10,
            handling: 6,
            acceleration: 7,
        },
    },
    {
        id: 'racer-6',
        name: 'Drift King',
        avatar: '/assets/characters/racer-6.png',
        vehicle: '/assets/vehicles/car-6.png',
        stats: {
            speed: 7,
            handling: 10,
            acceleration: 6,
        },
    },
];

export const getCharacterById = (id: string): Character | undefined => {
    return characters.find(c => c.id === id);
};

// Bot characters for opponents
export const botNames = [
    'AI Racer',
    'Bot Speed',
    'Cyber Driver',
    'RoboRacer',
    'AutoPilot',
    'MachineX',
];

export const generateBotPlayers = (count: number = 3) => {
    const shuffledBots = [...botNames].sort(() => Math.random() - 0.5);
    const shuffledCharacters = [...characters].sort(() => Math.random() - 0.5);

    return shuffledBots.slice(0, count).map((name, index) => ({
        id: `bot-${index}`,
        name,
        character: shuffledCharacters[index % shuffledCharacters.length],
        position: index + 2,
        lap: 1,
        points: Math.floor(Math.random() * 50),
        isPlayer: false,
        trackPosition: { x: 0, y: 0 },
    }));
};
