'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

// --- Utility Functions ---
const Util = {
    toInt: (obj: any, def: number): number => { if (obj !== null) { const x = parseInt(obj, 10); if (!isNaN(x)) return x; } return Util.toInt(def, 0); },
    toFloat: (obj: any, def: number): number => { if (obj !== null) { const x = parseFloat(obj); if (!isNaN(x)) return x; } return Util.toFloat(def, 0.0); },
    limit: (value: number, min: number, max: number) => Math.max(min, Math.min(value, max)),
    randomInt: (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min,
    randomChoice: (options: any[]) => options[Util.randomInt(0, options.length - 1)],
    percentRemaining: (n: number, total: number) => (n % total) / total,
    accelerate: (v: number, accel: number, dt: number) => v + (accel * dt),
    interpolate: (a: number, b: number, percent: number) => a + (b - a) * percent,
    easeIn: (a: number, b: number, percent: number) => a + (b - a) * Math.pow(percent, 2),
    easeInOut: (a: number, b: number, percent: number) => a + (b - a) * ((-Math.cos(percent * Math.PI) / 2) + 0.5),
    exponentialFog: (distance: number, density: number) => 1 / (Math.pow(Math.E, (distance * distance * density))),
    increase: (start: number, increment: number, max: number) => {
        let result = start + increment;
        while (result >= max) result -= max;
        while (result < 0) result += max;
        return result;
    },
    project: (p: Point, cameraX: number, cameraY: number, cameraZ: number, cameraDepth: number, width: number, height: number, roadWidth: number) => {
        p.camera.x = (p.world.x || 0) - cameraX;
        p.camera.y = (p.world.y || 0) - cameraY;
        p.camera.z = (p.world.z || 0) - cameraZ;
        p.screen.scale = cameraDepth / p.camera.z;
        p.screen.x = Math.round((width / 2) + (p.screen.scale * p.camera.x * width / 2));
        p.screen.y = Math.round((height / 2) - (p.screen.scale * p.camera.y * height / 2));
        p.screen.w = Math.round(p.screen.scale * roadWidth * width / 2);
    },
    overlap: (x1: number, w1: number, x2: number, w2: number, percent: number = 1) => {
        const half1 = (percent || 1) * w1 / 2;
        const half2 = (percent || 1) * w2 / 2;
        return !(x1 - half1 > x2 + half2 || x1 + half1 < x2 - half2);
    }
};

// --- Types ---
interface Point {
    world: { x: number; y: number; z: number };
    camera: { x: number; y: number; z: number };
    screen: { scale: number; x: number; y: number; w: number };
}

interface Sprite {
    source: any;
    offset: number;
}

interface Car {
    offset: number;
    z: number;
    sprite: any;
    speed: number;
    percent: number;
    isRival?: boolean;
}

interface Segment {
    index: number;
    p1: Point;
    p2: Point;
    color: { road: string; grass: string; rumble: string; strip: string };
    curve: number;
    fog: number;
    clip: number;
    looped: boolean;
    sprites: Sprite[];
    cars: Car[];
    zebra?: boolean;
}

// --- Constants ---
const FPS = 60;
const STEP = 1 / FPS;
const ROAD_WIDTH = 2000;
const SEGMENT_LENGTH = 200;
const RUMBLE_LENGTH = 3;
const LANES = 4;
const FIELD_OF_VIEW = 100;
const CAMERA_HEIGHT = 1000;
const DRAW_DISTANCE = 300;
const FOG_DENSITY = 5;
const MAX_SPEED = SEGMENT_LENGTH / STEP;
const ACCEL = MAX_SPEED / 5;
const BREAKING = -MAX_SPEED;
const DECEL = -MAX_SPEED / 5;
const OFF_ROAD_DECEL = -MAX_SPEED / 2;
const OFF_ROAD_LIMIT = MAX_SPEED / 4;

const COLORS = {
    SKY: '#020617', // Deep Midnight Blue/Black
    TREE: '#064e3b',
    FOG: '#020617',
    LIGHT: { road: '#1e293b', grass: '#1a120b', rumble: '#334155', strip: '#64748b', sidewalk: '#64748b', curb: '#94a3b8' },
    DARK: { road: '#0f172a', grass: '#0f0905', rumble: '#1e293b', strip: '', sidewalk: '#475569', curb: '#64748b' },
    START: { road: '#ffffff', grass: '#1e40af', rumble: '#ffffff', strip: '', sidewalk: '#ffffff', curb: '#ffffff' },
    FINISH: { road: '#000000', grass: '#000000', rumble: '#000000', strip: '', sidewalk: '#000000', curb: '#000000' }
};

export default function GameSpeedPage() {
    const router = useRouter();
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Game State
    const [gameState, setGameState] = useState<'countdown' | 'playing' | 'finished' | 'gameover'>('countdown');
    const [countdown, setCountdown] = useState(3);
    const [stats, setStats] = useState({ speed: 0, nos: 100, lap: 1, totalLaps: 1 });
    const [viewMode, setViewMode] = useState<'first' | 'third'>('third');
    const [assetsLoaded, setAssetsLoaded] = useState(false);

    // Refs for game loop
    const state = useRef({
        segments: [] as Segment[],
        cars: [] as Car[],
        position: 0,
        playerX: 0,
        playerZ: 0,
        speed: 0,
        trackLength: 0,
        sprites: { car: null, bg: null, obstacle: null } as any,
        keyLeft: false,
        keyRight: false,
        keyFaster: false,
        keySlower: false,
        keyBoost: false,
        nos: 100,
        currentLap: 1,
        totalLaps: 1,
        cameraDepth: 1 / Math.tan((FIELD_OF_VIEW / 2) * Math.PI / 180),
        viewMode: 'third' as 'first' | 'third'
    });

    const animationFrameRef = useRef<number>(0);
    const miniMapRef = useRef<HTMLCanvasElement>(null);

    // --- Loading Assets ---
    useEffect(() => {
        const loadAssets = async () => {
            let character = null;
            try {
                const stored = localStorage.getItem('edurace_selected_character');
                if (stored) {
                    character = JSON.parse(stored);
                }
            } catch (e) {
                console.error("Failed to load character", e);
            }

            const assetList = [
                { name: 'car', src: '/assets/vehicles/foward-sonic.png' },
                { name: 'car_diag_left', src: '/assets/vehicles/diag-left-sonic.png' },
                { name: 'car_diag_right', src: '/assets/vehicles/diag-right-sonic.png' },
                { name: 'bg', src: '/assets/backgorund/citynight.png' },
                { name: 'obstacle', src: '/assets/obstacles/obstacle_barrel.png' },
                { name: 'npc_car', src: '/assets/vehicles/car_ai_blue.jpg' },
                { name: 'construction', src: '/assets/obstacles/construction_barrier.png' },
                { name: 'traffic_light', src: '/assets/material/lampulalulintas.png' },
                { name: 'kaffe1', src: '/assets/material/kaffe1.png' },
                { name: 'restoran1', src: '/assets/material/restoran1png.png' },
                { name: 'seven_eleven', src: '/assets/material/7-11.png' },
                { name: 'car_rival', src: '/assets/vehicles/foward-opponent.png' },
                { name: 'truck1', src: '/assets/vehicles/truck1.png' },
                { name: 'truck2', src: '/assets/vehicles/truck2.png' },
                { name: 'car_1st', src: '/assets/vehicles/1rd-pov/1rd-sonic-foward-v2.png' },
            ];

            const promises = assetList.map(item => new Promise<void>((resolve) => {
                const img = new Image();
                img.onload = () => {
                    (img as any).assetName = item.name;
                    state.current.sprites[item.name] = img;
                    resolve();
                };
                img.onerror = () => {
                    const cvs = document.createElement('canvas');
                    cvs.width = 128; cvs.height = 128;
                    const ctx = cvs.getContext('2d');
                    if (ctx) {
                        if (item.name === 'traffic_light') {
                            ctx.fillStyle = '#334155';
                            ctx.fillRect(50, 20, 20, 108); // Pole
                            ctx.fillStyle = '#ef4444'; // Red light
                            ctx.fillRect(40, 0, 48, 50);
                            ctx.fillStyle = '#fef08a';
                            ctx.beginPath(); ctx.arc(64, 25, 10, 0, Math.PI * 2); ctx.fill();
                        } else {
                            if (item.name === 'npc_car') ctx.fillStyle = '#3b82f6';
                            else if (item.name === 'construction') ctx.fillStyle = '#f97316';
                            else if (item.name === 'car') ctx.fillStyle = '#ef4444';
                            else ctx.fillStyle = '#444';
                            ctx.fillRect(0, 0, 128, 128);
                        }
                        const finalCvs = cvs as any;
                        finalCvs.assetName = item.name;
                        state.current.sprites[item.name] = finalCvs;
                    }
                    resolve();
                };
                img.src = item.src;
            }));

            await Promise.all(promises);
            setAssetsLoaded(true);
        };
        loadAssets();
    }, []);

    // --- Game Logic functions ---
    const findSegment = (z: number) => {
        if (!state.current.segments || state.current.segments.length === 0) {
            return { index: 0, p1: { world: { x: 0, y: 0, z: 0 }, camera: { x: 0, y: 0, z: 0 }, screen: { scale: 0, x: 0, y: 0, w: 0 } } } as Segment;
        }
        return state.current.segments[Math.floor(z / SEGMENT_LENGTH) % state.current.segments.length];
    };

    const addSegment = (curve: number, y: number) => {
        const n = state.current.segments.length;
        const lastY = n === 0 ? 0 : state.current.segments[n - 1].p2.world.y;

        state.current.segments.push({
            index: n,
            p1: { world: { x: 0, y: lastY, z: n * SEGMENT_LENGTH }, camera: { x: 0, y: 0, z: 0 }, screen: { scale: 0, x: 0, y: 0, w: 0 } },
            p2: { world: { x: 0, y: y, z: (n + 1) * SEGMENT_LENGTH }, camera: { x: 0, y: 0, z: 0 }, screen: { scale: 0, x: 0, y: 0, w: 0 } },
            curve: curve,
            sprites: [],
            cars: [],
            color: Math.floor(n / RUMBLE_LENGTH) % 2 ? COLORS.DARK : COLORS.LIGHT,
            fog: 0,
            clip: 0,
            looped: false
        });
    };

    const addRoad = (enter: number, hold: number, leave: number, curve: number, y: number) => {
        const startY = state.current.segments.length === 0 ? 0 : state.current.segments[state.current.segments.length - 1].p2.world.y;
        const endY = startY + (Util.toInt(y, 0) * SEGMENT_LENGTH);
        const total = enter + hold + leave;
        for (let n = 0; n < enter; n++) addSegment(Util.easeIn(0, curve, n / enter), Util.easeInOut(startY, endY, n / total));
        for (let n = 0; n < hold; n++) addSegment(curve, Util.easeInOut(startY, endY, (enter + n) / total));
        for (let n = 0; n < leave; n++) addSegment(Util.easeInOut(curve, 0, n / leave), Util.easeInOut(startY, endY, (enter + hold + n) / total));
    };

    const ROAD_CONF = {
        LENGTH: { NONE: 0, SHORT: 25, MEDIUM: 50, LONG: 100 },
        HILL: { NONE: 0, LOW: 20, MEDIUM: 40, HIGH: 60 },
        CURVE: { NONE: 0, EASY: 2, MEDIUM: 4, HARD: 6 }
    };

    const addStraight = (num?: number) => {
        num = num || ROAD_CONF.LENGTH.MEDIUM;
        addRoad(num, num, num, 0, 0);
    };

    const addCurve = (num?: number, curve?: number, height?: number) => {
        num = num || ROAD_CONF.LENGTH.MEDIUM;
        curve = curve || ROAD_CONF.CURVE.MEDIUM;
        height = height || ROAD_CONF.HILL.NONE;
        addRoad(num, num, num, curve, height);
    };

    const addSCurves = () => {
        addRoad(ROAD_CONF.LENGTH.MEDIUM, ROAD_CONF.LENGTH.MEDIUM, ROAD_CONF.LENGTH.MEDIUM, -ROAD_CONF.CURVE.EASY, ROAD_CONF.HILL.NONE);
        addRoad(ROAD_CONF.LENGTH.MEDIUM, ROAD_CONF.LENGTH.MEDIUM, ROAD_CONF.LENGTH.MEDIUM, ROAD_CONF.CURVE.MEDIUM, ROAD_CONF.HILL.MEDIUM);
        addRoad(ROAD_CONF.LENGTH.MEDIUM, ROAD_CONF.LENGTH.MEDIUM, ROAD_CONF.LENGTH.MEDIUM, ROAD_CONF.CURVE.EASY, -ROAD_CONF.HILL.LOW);
        addRoad(ROAD_CONF.LENGTH.MEDIUM, ROAD_CONF.LENGTH.MEDIUM, ROAD_CONF.LENGTH.MEDIUM, -ROAD_CONF.CURVE.EASY, ROAD_CONF.HILL.MEDIUM);
        addRoad(ROAD_CONF.LENGTH.MEDIUM, ROAD_CONF.LENGTH.MEDIUM, ROAD_CONF.LENGTH.MEDIUM, -ROAD_CONF.CURVE.MEDIUM, -ROAD_CONF.HILL.MEDIUM);
    };

    const addBumps = () => {
        addRoad(10, 10, 10, 0, 5);
        addRoad(10, 10, 10, 0, -2);
        addRoad(10, 10, 10, 0, -5);
        addRoad(10, 10, 10, 0, 8);
        addRoad(10, 10, 10, 0, 5);
        addRoad(10, 10, 10, 0, -7);
        addRoad(10, 10, 10, 0, 5);
        addRoad(10, 10, 10, 0, -2);
    };

    const addDownhillToEnd = (num: number) => {
        num = num || 200;
        const lastY = state.current.segments.length === 0 ? 0 : state.current.segments[state.current.segments.length - 1].p2.world.y;
        addRoad(num, num, num, -ROAD_CONF.CURVE.EASY, -lastY / SEGMENT_LENGTH);
    };

    const resetRoad = () => {
        state.current.segments = [];
        // A cleaner, less "messy" track layout (Simplified Circuit)
        addStraight(ROAD_CONF.LENGTH.SHORT);
        addCurve(ROAD_CONF.LENGTH.MEDIUM, ROAD_CONF.CURVE.MEDIUM, ROAD_CONF.HILL.LOW);
        addStraight(ROAD_CONF.LENGTH.LONG);
        addCurve(ROAD_CONF.LENGTH.MEDIUM, -ROAD_CONF.CURVE.MEDIUM, ROAD_CONF.HILL.NONE);
        addStraight(ROAD_CONF.LENGTH.MEDIUM);
        addCurve(ROAD_CONF.LENGTH.LONG, ROAD_CONF.CURVE.EASY, ROAD_CONF.HILL.MEDIUM);
        addStraight(ROAD_CONF.LENGTH.LONG);
        addCurve(ROAD_CONF.LENGTH.MEDIUM, ROAD_CONF.CURVE.MEDIUM, -ROAD_CONF.HILL.LOW);
        addStraight(ROAD_CONF.LENGTH.SHORT);
        addDownhillToEnd(200);

        const len = state.current.segments.length;
        state.current.cars = [];

        // Initial NPCs Spawning (Now using Trucks)
        for (let n = 0; n < 20; n++) {
            const z = (n + 1) * (len * SEGMENT_LENGTH / 20);
            const offset = Util.randomChoice([-0.8, -0.4, 0.4, 0.8]);
            const speed = MAX_SPEED / 4 + Math.random() * (MAX_SPEED / 2);
            const car: Car = {
                offset: offset,
                z: z,
                sprite: Math.random() > 0.5 ? state.current.sprites.truck1 : state.current.sprites.truck2,
                speed: speed,
                percent: 0
            };
            state.current.cars.push(car);
            findSegment(z).cars.push(car);
        }

        // Spawn Rival Opponent
        const rivalCar: Car = {
            offset: -0.4,
            z: 200 * SEGMENT_LENGTH, // Start ahead of player bit
            sprite: state.current.sprites.car_rival || state.current.sprites.npc_car,
            speed: MAX_SPEED * 0.7, // Stable speed, like a normal NPC
            percent: 0,
            isRival: true
        };
        state.current.cars.push(rivalCar);
        findSegment(rivalCar.z).cars.push(rivalCar);

        // Static Obstacles, Zebra Cross & Traffic Lights
        for (let n = 100; n < len - 100; n += 50) {
            const rand = Math.random();
            const zebraFreq = 1000;

            if (n % zebraFreq === 0) {
                // Zebra Cross
                for (let j = 0; j < 10; j++) {
                    if (state.current.segments[n + j]) {
                        state.current.segments[n + j].zebra = true;
                    }
                }
                const lightSeg = state.current.segments[n];
                if (lightSeg) {
                    lightSeg.sprites.push({ source: state.current.sprites.traffic_light, offset: -1.8 });
                }
            } else if (rand > 0.4) {
                const offset = Math.random() > 0.5 ? 1.8 : -1.8;
                let source;
                if (offset < 0) {
                    source = Math.random() > 0.5 ? state.current.sprites.kaffe1 : state.current.sprites.restoran1;
                } else {
                    source = state.current.sprites.seven_eleven;
                }
                if (source) {
                    state.current.segments[n].sprites.push({ source, offset });
                }
            }
        }

        // Color start and finish
        const playerSegIdx = findSegment(state.current.playerZ).index;
        if (state.current.segments.length > playerSegIdx + 3) {
            state.current.segments[playerSegIdx + 2].color = COLORS.START;
            state.current.segments[playerSegIdx + 3].color = COLORS.START;
        }

        for (let n = 0; n < RUMBLE_LENGTH; n++) {
            if (len - 1 - n >= 0) state.current.segments[len - 1 - n].color = COLORS.FINISH;
        }

        state.current.trackLength = len * SEGMENT_LENGTH;
    };

    // --- Rendering Helpers ---
    const renderSegment = (ctx: CanvasRenderingContext2D, width: number, lanes: number, x1: number, y1: number, w1: number, x2: number, y2: number, w2: number, fog: number, color: any, zebra: boolean = false) => {
        const r1 = w1 / Math.max(6, 2 * lanes);
        const r2 = w2 / Math.max(6, 2 * lanes);

        ctx.fillStyle = color.grass;
        ctx.fillRect(0, y2, width, y1 - y2);

        // Add some "Dirt/Soil" noise texture
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        for (let i = 0; i < 20; i++) {
            const rx = Math.random() * width;
            const ry = y2 + Math.random() * (y1 - y2);
            const rw = 1 + Math.random() * 3;
            ctx.fillRect(rx, ry, rw, 1);
        }

        // Rumble
        ctx.fillStyle = color.rumble;
        ctx.beginPath();
        ctx.moveTo(x1 - w1 - r1, y1);
        ctx.lineTo(x1 - w1, y1);
        ctx.lineTo(x2 - w2, y2);
        ctx.lineTo(x2 - w2 - r2, y2);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(x1 + w1 + r1, y1);
        ctx.lineTo(x1 + w1, y1);
        ctx.lineTo(x2 + w2, y2);
        ctx.lineTo(x2 + w2 + r2, y2);
        ctx.closePath();
        ctx.fill();

        // Sidewalk (Detailed gray tiles)
        const sw1 = w1 * 0.5; // Sidewalk width relative to road
        const sw2 = w2 * 0.5;
        const cw1 = w1 * 0.05; // Curb width
        const cw2 = w2 * 0.05;

        // Draw Left Sidewalk (Base)
        ctx.fillStyle = color.sidewalk;
        ctx.beginPath();
        ctx.moveTo(x1 - w1 - r1 - sw1, y1);
        ctx.lineTo(x1 - w1 - r1, y1);
        ctx.lineTo(x2 - w2 - r2, y2);
        ctx.lineTo(x2 - w2 - r2 - sw2, y2);
        ctx.closePath();
        ctx.fill();

        // Draw Right Sidewalk (Base)
        ctx.beginPath();
        ctx.moveTo(x1 + w1 + r1 + sw1, y1);
        ctx.lineTo(x1 + w1 + r1, y1);
        ctx.lineTo(x2 + w2 + r2, y2);
        ctx.lineTo(x2 + w2 + r2 + sw2, y2);
        ctx.closePath();
        ctx.fill();

        // Curb (Edge of sidewalk)
        ctx.fillStyle = color.curb;
        // Left Curb
        ctx.beginPath();
        ctx.moveTo(x1 - w1 - r1 - cw1, y1);
        ctx.lineTo(x1 - w1 - r1, y1);
        ctx.lineTo(x2 - w2 - r2, y2);
        ctx.lineTo(x2 - w2 - r2 - cw2, y2);
        ctx.closePath();
        ctx.fill();
        // Right Curb
        ctx.beginPath();
        ctx.moveTo(x1 + w1 + r1 + cw1, y1);
        ctx.lineTo(x1 + w1 + r1, y1);
        ctx.lineTo(x2 + w2 + r2, y2);
        ctx.lineTo(x2 + w2 + r2 + cw2, y2);
        ctx.closePath();
        ctx.fill();

        // Road
        ctx.fillStyle = color.road;
        // Road Area (Drawn after fog to stay sharp)
        ctx.fillStyle = color.road;
        ctx.beginPath();
        ctx.moveTo(x1 - w1, y1);
        ctx.lineTo(x2 - w2, y2);
        ctx.lineTo(x2 + w2, y2);
        ctx.lineTo(x1 + w1, y1);
        ctx.closePath();
        ctx.fill();

        // Zebra Cross
        if (zebra) {
            ctx.fillStyle = '#ffffff';
            const stripes = 10;
            const stripeW1 = (w1 * 2) / stripes;
            const stripeW2 = (w2 * 2) / stripes;
            for (let i = 0; i < stripes; i++) {
                if (i % 2 === 0) {
                    ctx.beginPath();
                    ctx.moveTo(x1 - w1 + i * stripeW1, y1);
                    ctx.lineTo(x1 - w1 + (i + 1) * stripeW1, y1);
                    ctx.lineTo(x2 - w2 + (i + 1) * stripeW2, y2);
                    ctx.lineTo(x2 - w2 + i * stripeW2, y2);
                    ctx.fill();
                }
            }
        }

        // Lane
        if (color.strip) {
            ctx.fillStyle = color.strip;
            const laneW1 = w1 * 2 / lanes;
            const laneW2 = w2 * 2 / lanes;
            const laneX1 = x1 - w1 + laneW1;
            const laneX2 = x2 - w2 + laneW2;
            for (let i = 1; i < lanes; i++) {
                ctx.beginPath();
                ctx.moveTo(x1 - w1 + i * laneW1 - w1 / 30, y1);
                ctx.lineTo(x1 - w1 + i * laneW1 + w1 / 30, y1);
                ctx.lineTo(x2 - w2 + i * laneW2 + w2 / 30, y2);
                ctx.lineTo(x2 - w2 + i * laneW2 - w2 / 30, y2);
                ctx.fill();
            }
        }
    };

    const renderSprite = (ctx: CanvasRenderingContext2D, width: number, height: number, resolution: number, roadWidth: number, sprite: any, scale: number, destX: number, destY: number, offsetX: number, offsetY: number, clipY: number) => {
        if (!sprite) return;

        // Scaling based on world-width (relative to ROAD_WIDTH 2000)
        const name = (sprite as any).assetName;
        let worldWidth = 1100; // NPC cars & Rival (Increased)
        if (name === 'traffic_light') worldWidth = 1000;
        else if (name === 'truck1' || name === 'truck2') worldWidth = 1700; // Trucks (Increased)
        else if (name === 'kaffe1' || name === 'restoran1' || name === 'seven_eleven') worldWidth = 6500; // Buildings

        const destW = scale * worldWidth * (width / 2);
        const destH = destW * (sprite.height / sprite.width);

        destX = destX + (destW * (offsetX || 0));
        destY = destY + (destH * (offsetY || 0));

        const clipH = clipY ? Math.max(0, destY + destH - clipY) : 0;
        if (clipH < destH) {
            ctx.drawImage(sprite, 0, 0, sprite.width, sprite.height - (sprite.height * clipH / destH), destX, destY, destW, destH - clipH);
        }
    };

    const renderPlayer = (ctx: CanvasRenderingContext2D, width: number, height: number, resolution: number, roadWidth: number, speedPercent: number, scale: number, destX: number, destY: number, steer: number, updown: number, viewMode: 'first' | 'third') => {
        const { keyLeft, keyRight, sprites } = state.current;

        if (viewMode === 'first') {
            const sprite = sprites.car_1st;
            if (!sprite) return;

            // 1st Person POV: Cockpit/Hands
            const bounce = (2.0 * Math.random() * speedPercent * resolution) * Util.randomChoice([1, -1]);

            // "Full Screen" scaling: Scale to fit width
            const destW = width;
            const destH = destW * (sprite.height / sprite.width);

            // Centered horizontally, pushed lower to show more road
            const x = (steer * -30);
            const y = height - (destH * 0.8) + bounce; // Only show top 80% of the sprite, or just push it down 20%

            // Apply slight tilt when steering for more immersive feel
            if (keyLeft || keyRight) {
                ctx.save();
                ctx.translate(width / 2, height);
                ctx.rotate((keyLeft ? -0.02 : 0.02));
                ctx.translate(-width / 2, -height);
                ctx.drawImage(sprite, x, y, destW, destH);
                ctx.restore();
            } else {
                ctx.drawImage(sprite, x, y, destW, destH);
            }
            return;
        }

        // Sprite Selection Logic (Steering)
        let sprite = sprites.car;
        if (keyLeft) {
            sprite = sprites.car_diag_left || sprites.car;
        } else if (keyRight) {
            sprite = sprites.car_diag_right || sprites.car;
        }

        if (!sprite) return;

        const bounce = (1.2 * Math.random() * speedPercent * resolution) * Util.randomChoice([1, -1]);

        // Fixed scale for visibility (adjusted for wider road)
        const playerScale = (width / 1920) * 1.5;
        const destW = sprite.width * playerScale;
        const destH = sprite.height * playerScale;

        destX = width / 2 - destW / 2 + (steer * 80);
        destY = height - destH - 35 + bounce;

        // --- Boost Effect (Draw BEFORE car to be behind it) ---
        if (state.current.keyBoost && state.current.nos > 0) {
            ctx.save();
            const flameW = destW * 0.15;
            const flameH = destH * 0.4;
            const exhaustY = destY + destH * 0.85;
            const leftExhX = destX + destW * 0.25;
            const rightExhX = destX + destW * 0.75;

            [leftExhX, rightExhX].forEach(exX => {
                const flicker = Math.random() * 1.5;
                const gradient = ctx.createRadialGradient(exX, exhaustY, 0, exX, exhaustY + (flameH * flicker), flameW);
                gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
                gradient.addColorStop(0.2, 'rgba(0, 255, 255, 0.8)');
                gradient.addColorStop(0.6, 'rgba(0, 100, 255, 0.4)');
                gradient.addColorStop(1, 'rgba(0, 0, 255, 0)');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.ellipse(exX, exhaustY + (flameH * 0.5), flameW * 0.8, flameH * flicker, 0, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.restore();
        }

        // --- Braking Smoke (Draw BEFORE car) ---
        if (state.current.keySlower && state.current.speed > 500) {
            ctx.save();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.arc(destX + (Math.random() * destW), destY + destH - Math.random() * 10, 5 + Math.random() * 10, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        // Apply a slight tilt if it's the base sprite (pseudo-turning)
        const needsPseudoTilt = sprite === sprites.car && (keyLeft || keyRight);
        if (needsPseudoTilt) {
            ctx.save();
            ctx.translate(destX + destW / 2, destY + destH);
            ctx.rotate((keyLeft ? -0.05 : 0.05));
            ctx.translate(-(destX + destW / 2), -(destY + destH));
            ctx.drawImage(sprite, destX, destY, destW, destH);
            ctx.restore();
        } else {
            ctx.drawImage(sprite, destX, destY, destW, destH);
        }

        // --- Brake Lights (Draw AFTER car to be on top) ---
        if (state.current.keySlower) {
            ctx.save();
            const lightW = destW * 0.18;
            const lightH = destH * 0.08;
            const lightY = destY + destH * 0.55; // Position based on typical car rear

            ctx.shadowBlur = 15;
            ctx.shadowColor = 'red';
            ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';

            // Left Brake Light
            ctx.fillRect(destX + destW * 0.15, lightY, lightW, lightH);
            // Right Brake Light
            ctx.fillRect(destX + destW * 0.67, lightY, lightW, lightH);

            // Extra corona glow
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.arc(destX + destW * 0.24, lightY + lightH / 2, lightW, 0, Math.PI * 2);
            ctx.arc(destX + destW * 0.76, lightY + lightH / 2, lightW, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    };

    // --- Core Updates ---
    const update = (dt: number) => {
        const { keyLeft, keyRight, keyFaster, keySlower, keyBoost, segments, playerX, speed, trackLength } = state.current;
        let { position, playerZ } = state.current;

        const playerSegment = findSegment(position + playerZ);
        const speedPercent = speed / MAX_SPEED;
        const dx = dt * 2 * speedPercent;

        // Move
        position = Util.increase(position, dt * speed, trackLength);
        state.current.position = position;

        // Steer
        let nextPlayerX = playerX;
        if (keyLeft) nextPlayerX = playerX - dx;
        else if (keyRight) nextPlayerX = playerX + dx;

        // Centrifugal
        nextPlayerX = nextPlayerX - (dx * speedPercent * playerSegment.curve * 0.3);

        // Speed & NOS Logic
        let nextSpeed = speed;
        let nextNos = state.current.nos;

        const GAS_LIMIT = MAX_SPEED * 0.9;    // ~180 KPH
        const BOOST_LIMIT = MAX_SPEED * 1.1;  // ~220 KPH

        if (keyBoost && nextNos > 0) {
            // NOS BOOSTING
            nextSpeed = Util.accelerate(speed, ACCEL * 2.5, dt);
            nextNos = Math.max(0, nextNos - dt * 25); // Faster consumption

            // Jitter effect at top speed (220 KPH region)
            if (nextSpeed >= BOOST_LIMIT - 300) {
                const jitter = (Math.random() - 0.5) * 500;
                nextSpeed = Util.limit(nextSpeed + jitter, 0, BOOST_LIMIT);
            }
        } else if (keyFaster) {
            // NORMAL GAS
            nextSpeed = Util.accelerate(speed, ACCEL, dt);
            if (nextSpeed > GAS_LIMIT) {
                nextSpeed = Util.accelerate(nextSpeed, DECEL, dt);
                nextSpeed = Math.max(nextSpeed, GAS_LIMIT);
            }
            nextNos = Math.min(100, nextNos + dt * 2); // Slow recovery while driving
        } else {
            if (keySlower) nextSpeed = Util.accelerate(speed, BREAKING, dt);
            else nextSpeed = Util.accelerate(speed, DECEL, dt);
            nextNos = Math.min(100, nextNos + dt * 8); // Recovery
        }

        state.current.nos = nextNos;

        // Check offroad
        if ((nextPlayerX < -1) || (nextPlayerX > 1)) {
            if (nextSpeed > OFF_ROAD_LIMIT) {
                nextSpeed = Util.accelerate(nextSpeed, OFF_ROAD_DECEL, dt);
            }

            for (let n = 0; n < playerSegment.sprites.length; n++) {
                const sprite = playerSegment.sprites[n];
                const spriteW = 0.1;
                if (Util.overlap(nextPlayerX, 0.1, sprite.offset, spriteW)) {
                    nextSpeed = MAX_SPEED / 5;
                    position = Util.increase(playerSegment.p1.world.z, -playerZ, trackLength);
                    break;
                }
            }
        }

        // Limit
        nextPlayerX = Util.limit(nextPlayerX, -3, 3);
        nextSpeed = Util.limit(nextSpeed, 0, MAX_SPEED);

        state.current.playerX = nextPlayerX;
        state.current.speed = nextSpeed;

        // Move NPCs
        state.current.cars.forEach(car => {
            const oldSeg = findSegment(car.z);
            car.z = Util.increase(car.z, dt * car.speed, trackLength);
            car.percent = Util.percentRemaining(car.z, SEGMENT_LENGTH);
            const newSeg = findSegment(car.z);

            if (oldSeg !== newSeg) {
                const index = oldSeg.cars.indexOf(car);
                if (index !== -1) oldSeg.cars.splice(index, 1);
                newSeg.cars.push(car);
            }

            // NPC-Player Collision
            if (newSeg.index === playerSegment.index) {
                if (Util.overlap(nextPlayerX, 0.4, car.offset, 0.4)) {
                    if (nextSpeed > car.speed) {
                        nextSpeed = car.speed;
                        position = Util.increase(car.z, -playerZ, trackLength);
                    }
                }
            }

            // Re-spawn far behind cars to ahead
            if (car.z < position && (position - car.z) > trackLength / 2) {
                car.z = Util.increase(car.z, trackLength, trackLength);
            }
        });

        // Use the updated position and speed
        state.current.position = position;
        state.current.playerX = nextPlayerX;
        state.current.speed = nextSpeed;

        // HUD update
        setStats({
            speed: Math.floor((speed / MAX_SPEED) * 200),
            nos: Math.floor(nextNos),
            lap: state.current.currentLap,
            totalLaps: state.current.totalLaps
        });

        // Lap & Finish line check
        if (position > trackLength - playerZ) {
            if (state.current.currentLap >= state.current.totalLaps) {
                setGameState('finished');
                state.current.speed = 0;
            } else {
                state.current.currentLap++;
                state.current.position = 0;
                position = 0;
            }
        }
    };

    const render = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;
        const { segments, position, playerZ, playerX, speed, sprites } = state.current;

        // Clear and Sky
        ctx.fillStyle = COLORS.SKY;
        ctx.fillRect(0, 0, width, height);

        const baseSegment = findSegment(position);
        const basePercent = Util.percentRemaining(position, SEGMENT_LENGTH);
        const playerSegment = findSegment(position + playerZ);
        const playerPercent = Util.percentRemaining(position + playerZ, SEGMENT_LENGTH);
        const playerY = Util.interpolate(playerSegment.p1.world.y, playerSegment.p2.world.y, playerPercent);
        const speedPercent = speed / MAX_SPEED;

        // Background (Parallax Scrolling)
        if (sprites.bg) {
            const bg = sprites.bg;
            const bgW = bg.width;
            const bgH = bg.height;

            // Calculate parallax offset based on road curve
            const curveRotation = (playerSegment.curve * basePercent) * 400; // Increased factor for more noticeable shift
            state.current.bgOffset = (state.current.bgOffset || 0) + (curveRotation * speedPercent * 0.002);

            // Use full height or at least more than half to ensure no gaps at horizon
            // Drawing at full height and letting segments cover the bottom part is safer
            const destH = height;
            const scale = destH / bgH;
            const scaledW = bgW * scale;

            // Seamless tiling for the background width
            let scrollX = (state.current.bgOffset % scaledW);
            if (scrollX > 0) scrollX -= scaledW;

            // Loop to fill the entire screen width
            for (let x = scrollX; x < width; x += scaledW) {
                ctx.drawImage(bg, x, 0, scaledW, destH);
            }
        }

        let maxy = height;
        let x = 0;
        let dx = - (baseSegment.curve * basePercent);

        // Camera Height based on POV
        // Higher camera (850) for 1st person to see over the dashboard
        const currentCameraHeight = state.current.viewMode === 'first' ? 850 : CAMERA_HEIGHT;

        // Render Segments
        for (let n = 0; n < DRAW_DISTANCE; n++) {
            const segment = segments[(baseSegment.index + n) % segments.length];
            segment.looped = segment.index < baseSegment.index;
            segment.fog = Util.exponentialFog(n / DRAW_DISTANCE, FOG_DENSITY);
            segment.clip = maxy;

            Util.project(segment.p1, (playerX * ROAD_WIDTH) - x, playerY + currentCameraHeight, position - (segment.looped ? state.current.trackLength : 0), state.current.cameraDepth, width, height, ROAD_WIDTH);
            Util.project(segment.p2, (playerX * ROAD_WIDTH) - x - dx, playerY + currentCameraHeight, position - (segment.looped ? state.current.trackLength : 0), state.current.cameraDepth, width, height, ROAD_WIDTH);

            x = x + dx;
            dx = dx + segment.curve;

            if ((segment.p1.camera.z <= state.current.cameraDepth) ||
                (segment.p2.screen.y >= segment.p1.screen.y) ||
                (segment.p2.screen.y >= maxy)) continue;

            renderSegment(ctx, width, LANES,
                segment.p1.screen.x, segment.p1.screen.y, segment.p1.screen.w,
                segment.p2.screen.x, segment.p2.screen.y, segment.p2.screen.w,
                segment.fog, segment.color, segment.zebra || false);

            maxy = segment.p1.screen.y;
        }

        // Render Sprites & Player
        for (let n = (DRAW_DISTANCE - 1); n > 0; n--) {
            const segment = segments[(baseSegment.index + n) % segments.length];

            for (let i = 0; i < segment.sprites.length; i++) {
                const sprite = segment.sprites[i];
                const spriteScale = segment.p1.screen.scale;
                const spriteX = segment.p1.screen.x + (spriteScale * sprite.offset * ROAD_WIDTH * width / 2);
                const spriteY = segment.p1.screen.y;
                if (segment.p1.screen.scale > 0.00001) {
                    renderSprite(ctx, width, height, height / 480, ROAD_WIDTH, sprite.source, spriteScale, spriteX, spriteY, (sprite.offset < 0 ? -1 : 0), -1, segment.clip);
                }
            }

            for (let i = 0; i < segment.cars.length; i++) {
                const car = segment.cars[i];
                const spriteScale = Util.interpolate(segment.p1.screen.scale, segment.p2.screen.scale, car.percent);
                const spriteX = Util.interpolate(segment.p1.screen.x, segment.p2.screen.x, car.percent) + (spriteScale * car.offset * ROAD_WIDTH * width / 2);
                const spriteY = Util.interpolate(segment.p1.screen.y, segment.p2.screen.y, car.percent);
                if (spriteScale > 0.00001) {
                    renderSprite(ctx, width, height, height / 480, ROAD_WIDTH, car.sprite, spriteScale, spriteX, spriteY, (car.offset < 0 ? -1 : 0), -1, segment.clip);
                }
            }

            if (segment == playerSegment && state.current.viewMode === 'third') {
                renderPlayer(ctx, width, height, height / 480, ROAD_WIDTH, speed / MAX_SPEED,
                    state.current.cameraDepth / playerZ,
                    width / 2, height / 2,
                    (state.current.keyLeft ? -1 : state.current.keyRight ? 1 : 0),
                    playerSegment.p2.world.y - playerSegment.p1.world.y,
                    'third');
            }
        }

        // Render 1st person POV as an overlay (drawn last to be on top)
        if (state.current.viewMode === 'first') {
            renderPlayer(ctx, width, height, height / 480, ROAD_WIDTH, speed / MAX_SPEED,
                1, width / 2, height / 2,
                (state.current.keyLeft ? -1 : state.current.keyRight ? 1 : 0),
                0, 'first');
        }
    };

    // --- Effects ---
    useEffect(() => {
        if (!assetsLoaded) return;

        state.current.playerZ = (CAMERA_HEIGHT * state.current.cameraDepth);
        resetRoad();

        // Start game loop
        let lastTime = performance.now();
        let miniMapUpdateTime = 0;

        const loop = (time: number) => {
            if (gameState === 'playing') {
                const dt = Math.min(1, (time - lastTime) / 1000);
                update(dt);
            }

            render();

            // Update mini map at 10 FPS
            if (time - miniMapUpdateTime > 100) {
                drawMiniMap();
                miniMapUpdateTime = time;
            }

            lastTime = time;
            animationFrameRef.current = requestAnimationFrame(loop);
        };

        animationFrameRef.current = requestAnimationFrame(loop);

        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, [assetsLoaded, gameState]);

    // Countdown logic
    useEffect(() => {
        if (assetsLoaded && gameState === 'countdown') {
            const timer = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        setGameState('playing');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [assetsLoaded, gameState]);

    // Event Listeners
    useEffect(() => {
        const togglePOV = () => {
            const next = state.current.viewMode === 'first' ? 'third' : 'first';
            console.log("Toggling POV to:", next);
            state.current.viewMode = next;
            setViewMode(next);
        };

        const handleDown = (e: KeyboardEvent) => {
            switch (e.key.toLowerCase()) {
                case 'arrowleft': case 'a': state.current.keyLeft = true; break;
                case 'arrowright': case 'd': state.current.keyRight = true; break;
                case 'arrowup': case 'w': state.current.keyFaster = true; break;
                case 'arrowdown': case 's': state.current.keySlower = true; break;
                case ' ': state.current.keyBoost = true; break;
                case 't': togglePOV(); break;
            }
        };
        const handleUp = (e: KeyboardEvent) => {
            switch (e.key.toLowerCase()) {
                case 'arrowleft': case 'a': state.current.keyLeft = false; break;
                case 'arrowright': case 'd': state.current.keyRight = false; break;
                case 'arrowup': case 'w': state.current.keyFaster = false; break;
                case 'arrowdown': case 's': state.current.keySlower = false; break;
                case ' ': state.current.keyBoost = false; break;
            }
        };

        window.addEventListener('keydown', handleDown);
        window.addEventListener('keyup', handleUp);
        return () => {
            window.removeEventListener('keydown', handleDown);
            window.removeEventListener('keyup', handleUp);
        };
    }, []);

    // Resize handling
    useEffect(() => {
        const setSize = () => {
            if (canvasRef.current) {
                canvasRef.current.width = window.innerWidth;
                canvasRef.current.height = window.innerHeight;
            }
        };
        window.addEventListener('resize', setSize);
        setSize();
        return () => window.removeEventListener('resize', setSize);
    }, []);

    const drawMiniMap = () => {
        const canvas = miniMapRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { segments, position, trackLength } = state.current;

        // DPR Scaling
        const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
        const logicalSize = 220; // Slightly larger for Moto GP feel
        const padding = 50;

        if (canvas.width !== logicalSize * dpr) {
            canvas.width = logicalSize * dpr;
            canvas.height = logicalSize * dpr;
            canvas.style.width = `${logicalSize}px`;
            canvas.style.height = `${logicalSize}px`;
        }

        ctx.save();
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, logicalSize, logicalSize);

        // 1. Pro Racing Background (Dark Matte)
        ctx.fillStyle = 'rgba(10, 15, 25, 0.98)';
        ctx.beginPath();
        if ((ctx as any).roundRect) {
            (ctx as any).roundRect(0, 0, logicalSize, logicalSize, 30);
        } else {
            ctx.rect(0, 0, logicalSize, logicalSize);
        }
        ctx.fill();

        // Subtle Grid Background
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1;
        for (let i = 0; i < logicalSize; i += 20) {
            ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, logicalSize); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(logicalSize, i); ctx.stroke();
        }

        // Perimeter Glow
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();

        if (!segments || segments.length < 10) {
            ctx.restore();
            return;
        }

        // 2. Data Processing - Angular Projection for Circuit Look
        const points: { x: number, z: number }[] = [];
        let xPos = 0, zPos = 0, heading = -Math.PI / 2;

        // We use a simplified projection for the mini-map to make it look like a circuit layout
        for (let i = 0; i < segments.length; i += 4) {
            const s = segments[i];
            heading += (s.curve * 0.012); // Reduced sensitivity to prevent "knotting"
            xPos += Math.cos(heading) * 12;
            zPos += Math.sin(heading) * 12;
            points.push({ x: xPos, z: zPos });
        }

        let minX = Infinity, maxX = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;
        points.forEach(p => {
            if (p.x < minX) minX = p.x;
            if (p.x > maxX) maxX = p.x;
            if (p.z < minZ) minZ = p.z;
            if (p.z > maxZ) maxZ = p.z;
        });

        const trackW = maxX - minX || 1;
        const trackH = maxZ - minZ || 1;
        const scale = Math.min((logicalSize - padding * 2) / trackW, (logicalSize - padding * 2) / trackH);

        const tx = (px: number) => logicalSize / 2 + (px - (minX + maxX) / 2) * scale;
        const ty = (pz: number) => logicalSize / 2 + (pz - (minZ + maxZ) / 2) * scale;

        // 3. Draw Track Base (The "Asphalt")
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(30, 41, 59, 0.8)';
        ctx.lineWidth = 14;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.moveTo(tx(points[0].x), ty(points[0].z));
        for (let i = 1; i < points.length; i++) ctx.lineTo(tx(points[i].x), ty(points[i].z));
        ctx.stroke();

        // 4. Draw Racing Line (Neon Blue)
        ctx.beginPath();
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 4;
        ctx.setLineDash([]); // Ensure no dash
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#3b82f6';
        ctx.moveTo(tx(points[0].x), ty(points[0].z));
        for (let i = 1; i < points.length; i++) ctx.lineTo(tx(points[i].x), ty(points[i].z));
        ctx.stroke();
        ctx.shadowBlur = 0;

        // 5. Clear Start & Finish Markers
        const startP = points[0];
        const endP = points[points.length - 1];

        // Start Marker (Green Line)
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(tx(startP.x) - 10, ty(startP.z));
        ctx.lineTo(tx(startP.x) + 10, ty(startP.z));
        ctx.stroke();

        // Finish Marker (Checkered Red/White feel)
        ctx.strokeStyle = '#ef4444';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(tx(endP.x) - 15, ty(endP.z));
        ctx.lineTo(tx(endP.x) + 15, ty(endP.z));
        ctx.stroke();
        ctx.setLineDash([]);

        // Text Labels for Start/Finish
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText('START', tx(startP.x) + 15, ty(startP.z) + 5);
        ctx.fillText('FINISH', tx(endP.x) + 20, ty(endP.z) + 5);

        // 6. Player Position
        const playerIdx = Math.floor((position / trackLength) * points.length);
        const pPoint = points[Math.min(playerIdx, points.length - 1)] || points[0];
        const px = tx(pPoint.x);
        const py = ty(pPoint.z);

        // Rivals/NPC Positions on Minimap
        state.current.cars.forEach(car => {
            if (car.isRival) {
                const rivalIdx = Math.floor((car.z / trackLength) * points.length);
                const rPoint = points[rivalIdx % points.length];
                const rx = tx(rPoint.x);
                const ry = ty(rPoint.z);

                // Rival Icon (Blue Circle)
                ctx.shadowBlur = 15;
                ctx.shadowColor = '#3b82f6';
                ctx.fillStyle = '#3b82f6';
                ctx.beginPath();
                ctx.arc(rx, ry, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        });

        // Pulsing Aura for Player
        const pulse = (Date.now() % 1000) / 1000;
        ctx.beginPath();
        ctx.arc(px, py, 10 + pulse * 12, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(239, 68, 68, ${0.4 - pulse * 0.4})`;
        ctx.fill();

        // Player Dot
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ef4444';
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(px, py, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.restore();
    };

    const endGame = () => {
        router.push('/select-character');
    };

    return (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: '#020617', overflow: 'hidden' }}>
            {/* Main Game Canvas */}
            <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />

            {/* UI Overlay - Using explicitly inline styles to bypass Tailwind generation issues */}
            <div
                style={{
                    position: 'fixed',
                    inset: 0,
                    pointerEvents: 'none',
                    zIndex: 200,
                    padding: '2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    fontFamily: 'sans-serif',
                    color: 'white'
                }}
            >

                {/* Header: Stats & Map */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', width: '100%' }}>
                    {/* Velocity & Points */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(24px)', padding: '1.5rem', borderRadius: '2.5rem', border: '1px solid rgba(255, 255, 255, 0.15)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)' }}>
                                <div style={{ fontSize: '10px', color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.4em', fontWeight: 900, marginBottom: '0.25rem' }}>Telemetry / Speed</div>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '4.5rem', fontWeight: 900, fontFamily: 'monospace', color: '#fbbf24', fontStyle: 'italic' }}>
                                        {stats.speed}
                                    </span>
                                    <span style={{ fontSize: '1rem', color: 'rgba(255, 255, 255, 0.4)', fontWeight: 800, textTransform: 'uppercase' }}>KPH</span>
                                </div>
                            </div>

                            {/* POV Toggle Button */}
                            <button
                                onClick={() => {
                                    const next = state.current.viewMode === 'first' ? 'third' : 'first';
                                    state.current.viewMode = next;
                                    setViewMode(next);
                                }}
                                style={{
                                    pointerEvents: 'auto',
                                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                    backdropFilter: 'blur(12px)',
                                    padding: '1rem',
                                    borderRadius: '1.5rem',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    color: 'white',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    minWidth: '6rem'
                                }}
                            >
                                <span style={{ fontSize: '1.5rem' }}>{viewMode === 'first' ? '🎥' : '👤'}</span>
                                <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>{viewMode === 'first' ? '1st POV' : '3rd POV'}</span>
                            </button>
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(16px)', padding: '0.875rem 1.5rem', borderRadius: '1.25rem', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', gap: '0.75rem', boxShadow: '0 10px 15px rgba(0,0,0,0.3)' }}>
                                <span style={{ color: '#60a5fa', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em' }}>NOS</span>
                                <div style={{ width: '80px', height: '12px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '6px', overflow: 'hidden', position: 'relative' }}>
                                    <div style={{ width: `${stats.nos}%`, height: '100%', background: 'linear-gradient(90deg, #3b82f6, #60a5fa)', transition: 'width 0.1s linear' }} />
                                </div>
                                <span style={{ fontFamily: 'monospace', fontSize: '1.25rem', fontWeight: 900 }}>{stats.nos}%</span>
                            </div>
                            <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(16px)', padding: '0.875rem 1.5rem', borderRadius: '1.25rem', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', gap: '0.75rem', boxShadow: '0 10px 15px rgba(0,0,0,0.3)' }}>
                                <span style={{ color: '#4ade80', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em' }}>LAP</span>
                                <span style={{ fontFamily: 'monospace', fontSize: '1.75rem', fontWeight: 900 }}>{stats.lap}/{stats.totalLaps}</span>
                            </div>
                        </div>
                    </div>

                    {/* Moto GP Style Mini Map */}
                    <div style={{ position: 'relative', pointerEvents: 'auto' }}>
                        <div style={{ position: 'absolute', inset: '-0.75rem', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, transparent 75%)', filter: 'blur(25px)' }} />
                        <div style={{ position: 'relative', padding: '0.5rem', backgroundColor: 'rgba(5, 10, 20, 0.85)', backdropFilter: 'blur(40px)', borderRadius: '3.5rem', border: '2px solid rgba(255, 255, 255, 0.2)', boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.8)', overflow: 'hidden' }}>
                            <canvas
                                ref={miniMapRef}
                                style={{ borderRadius: '3rem', display: 'block' }}
                            />
                            {/* Pro Overlay Labels */}
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '0.75rem 0', textAlign: 'center', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                <span style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '0.5em', color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase', fontStyle: 'italic' }}>Live Circuit Data</span>
                            </div>
                            <div style={{ position: 'absolute', bottom: '1.5rem', right: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', opacity: 0.6 }}>
                                <span style={{ fontSize: '8px', fontWeight: 900, color: '#3b82f6' }}>GPS SIGNAL</span>
                                <span style={{ fontSize: '8px', fontWeight: 900, color: '#ffffff' }}>TRACK: ACTIVE</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer: Mobile Controls - Enhanced and Simplified */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', pointerEvents: 'none' }}>
                    <div style={{ display: 'flex', gap: '1.5rem', pointerEvents: 'auto' }}>
                        <button
                            style={{
                                width: '5.5rem', height: '5.5rem',
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                backdropFilter: 'blur(16px)',
                                borderRadius: '1.75rem',
                                border: '2px solid rgba(255, 255, 255, 0.1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', outline: 'none',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                                transition: 'all 0.2s'
                            }}
                            onTouchStart={() => state.current.keyLeft = true}
                            onTouchEnd={() => state.current.keyLeft = false}
                        >
                            <div style={{ width: '0', height: '0', borderTop: '15px solid transparent', borderBottom: '15px solid transparent', borderRight: '22px solid white' }} />
                        </button>
                        <button
                            style={{
                                width: '5.5rem', height: '5.5rem',
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                backdropFilter: 'blur(16px)',
                                borderRadius: '1.75rem',
                                border: '2px solid rgba(255, 255, 255, 0.1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', outline: 'none',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                                transition: 'all 0.2s'
                            }}
                            onTouchStart={() => state.current.keyRight = true}
                            onTouchEnd={() => state.current.keyRight = false}
                        >
                            <div style={{ width: '0', height: '0', borderTop: '15px solid transparent', borderBottom: '15px solid transparent', borderLeft: '22px solid white' }} />
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-end', pointerEvents: 'auto' }}>
                        <button
                            style={{
                                width: '5rem', height: '5rem',
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                backdropFilter: 'blur(16px)',
                                borderRadius: '1.5rem',
                                border: '2px solid rgba(255, 255, 255, 0.1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', outline: 'none',
                                transition: 'all 0.2s'
                            }}
                            onTouchStart={() => state.current.keySlower = true}
                            onTouchEnd={() => state.current.keySlower = false}
                        >
                            <div style={{ width: '20px', height: '20px', backgroundColor: 'rgba(255, 255, 255, 0.4)', borderRadius: '4px' }} />
                        </button>
                        <button
                            style={{
                                width: '7rem', height: '7rem',
                                background: 'linear-gradient(135deg, #ef4444 0%, #7f1d1d 100%)',
                                backdropFilter: 'blur(24px)',
                                borderRadius: '2rem',
                                border: 'none',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', outline: 'none',
                                boxShadow: '0 12px 40px rgba(239, 68, 68, 0.4)',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                            onTouchStart={() => state.current.keyBoost = true}
                            onTouchEnd={() => state.current.keyBoost = false}
                        >
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(45deg, transparent, rgba(255,255,255,0.2), transparent)', animation: 'shimmer 2s infinite' }} />
                            <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white', letterSpacing: '0.1em' }}>NOS</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Countdown Overlay */}
            {gameState === 'countdown' && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(2, 6, 23, 0.8)', backdropFilter: 'blur(12px)', color: 'white', fontFamily: 'sans-serif' }}>
                    <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', inset: '-8rem', background: 'radial-gradient(circle, rgba(37, 99, 235, 0.2) 0%, transparent 70%)', filter: 'blur(120px)', borderRadius: '9999px' }} />
                        <div style={{ fontSize: '20rem', fontWeight: 900, fontStyle: 'italic', color: 'transparent', background: 'linear-gradient(to bottom, #fff, rgba(255, 255, 255, 0.1))', WebkitBackgroundClip: 'text', lineHeight: 1, filter: 'drop-shadow(0 20px 50px rgba(0,0,0,0.5))' }}>
                            {countdown > 0 ? countdown : 'GO'}
                        </div>
                    </div>
                </div>
            )}

            {/* Victory Overlay */}
            {gameState === 'finished' && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(2, 6, 23, 0.95)', backdropFilter: 'blur(40px)', color: 'white', fontFamily: 'sans-serif' }}>
                    <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '4rem', borderRadius: '4rem', border: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', maxWidth: '36rem', width: '100%' }}>
                        <div style={{ fontSize: '8rem', marginBottom: '2rem' }}>🏆</div>
                        <h1 style={{ fontSize: '4.5rem', fontWeight: 900, marginBottom: '0.75rem', background: 'linear-gradient(to r, #fcd34d, #fb923c, #ef4444)', WebkitBackgroundClip: 'text', color: 'transparent' }}>VICTORY!</h1>
                        <p style={{ color: 'rgba(255, 255, 255, 0.3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4em', marginBottom: '3rem' }}>Race Completed</p>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
                            <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)', padding: '2rem', borderRadius: '2rem', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.2)', textTransform: 'uppercase', fontWeight: 900, letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Total Score</div>
                                <div style={{ fontSize: '2.25rem', fontFamily: 'monospace', color: '#fbbf24' }}>1000</div>
                            </div>
                            <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)', padding: '2rem', borderRadius: '2rem', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.2)', textTransform: 'uppercase', fontWeight: 900, letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Race Time</div>
                                <div style={{ fontSize: '2.25rem', fontFamily: 'monospace', color: '#60a5fa' }}>01:24</div>
                            </div>
                        </div>

                        <button
                            onClick={endGame}
                            style={{ width: '100%', padding: '1.5rem 0', backgroundColor: 'white', color: 'black', borderRadius: '2rem', fontWeight: 900, fontSize: '1.5rem', cursor: 'pointer', border: 'none', boxShadow: '0 0 60px rgba(255, 255, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', outline: 'none' }}
                        >
                            <span>CONTINUE</span>
                            <span style={{ fontSize: '1.25rem' }}>→</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}