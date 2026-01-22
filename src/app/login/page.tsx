'use client';

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from 'next/navigation';
import { saveUser } from '@/lib/storage';
import { User } from '@/types';
import { useState, useEffect } from 'react';

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Loader2,
    Eye,
    EyeOff,
    User as UserIcon,
    Mail,
    Lock,
    Trophy,
    Zap,
    Users,
    Target,
    Star
} from "lucide-react";

// Schema untuk login
const loginSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

// Schema untuk register
const registerSchema = z.object({
    username: z.string()
        .min(3, "Username must be at least 3 characters")
        .max(20, "Username must be less than 20 characters")
        .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
    email: z.string().email("Invalid email address"),
    password: z.string()
        .min(6, "Password must be at least 6 characters")
        .regex(/^(?=.*[A-Za-z])(?=.*\d)/, "Password must contain at least one letter and one number"),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export default function LoginPage() {
    const router = useRouter();
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [isGuestLoading, setIsGuestLoading] = useState(false);

    // Login form
    const {
        register: registerLogin,
        handleSubmit: handleSubmitLogin,
        formState: { errors: loginErrors, isSubmitting: isLoginSubmitting },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    // Register form
    const {
        register: registerRegister,
        handleSubmit: handleSubmitRegister,
        formState: { errors: registerErrors, isSubmitting: isRegisterSubmitting },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    });

    const onLoginSubmit = async (data: LoginFormData) => {
        setServerError(null);

        try {
            await new Promise(resolve => setTimeout(resolve, 1000));

            const user: User = {
                id: `user-${Date.now()}`,
                username: data.username,
                email: `${data.username.toLowerCase()}@nitroquiz.com`,
                totalPoints: 0,
                gamesPlayed: 0,
                createdAt: new Date().toISOString(),
            };

            saveUser(user);
            router.push('/home');
        } catch (error) {
            setServerError("Login failed. Please try again.");
        }
    };

    const onRegisterSubmit = async (data: RegisterFormData) => {
        setServerError(null);

        try {
            await new Promise(resolve => setTimeout(resolve, 1000));

            const user: User = {
                id: `user-${Date.now()}`,
                username: data.username,
                email: data.email,
                totalPoints: 0,
                gamesPlayed: 0,
                createdAt: new Date().toISOString(),
            };

            saveUser(user);
            router.push('/home');
        } catch (error) {
            setServerError("Registration failed. Please try again.");
        }
    };

    const handleGuestLogin = async () => {
        setIsGuestLoading(true);
        try {
            const guestUser: User = {
                id: `guest-${Date.now()}`,
                username: `Guest_${Math.floor(Math.random() * 10000)}`,
                email: "guest@nitroquiz.com",
                totalPoints: 0,
                gamesPlayed: 0,
                createdAt: new Date().toISOString(),
            };

            saveUser(guestUser);
            router.push('/home');
        } catch (error) {
            setServerError("Failed to login as guest.");
        } finally {
            setIsGuestLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Simple Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0f172a]" />

            {/* Minimal Content */}
            <div className="relative w-full max-w-sm z-10">

                {/* Compact Header */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#EC4899] mb-4 shadow-lg">
                        <Trophy className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold mb-2">
                        <span className="bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                            NitroQuiz
                        </span>
                    </h1>
                    <p className="text-gray-400 text-sm">
                        {isLogin ? "Welcome back!" : "Start your journey"}
                    </p>
                </div>

                {/* Compact Card */}
                <Card className="border border-white/10 bg-white/5 backdrop-blur-sm">
                    <CardContent className="pt-6 pb-4">

                        {/* Simple Tab Switcher */}
                        <div className="flex mb-6 bg-white/5 rounded-lg p-1">
                            <button
                                onClick={() => setIsLogin(true)}
                                className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all ${isLogin
                                    ? "bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white"
                                    : "text-gray-400 hover:text-white"
                                    }`}
                            >
                                Sign In
                            </button>
                            <button
                                onClick={() => setIsLogin(false)}
                                className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all ${!isLogin
                                    ? "bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white"
                                    : "text-gray-400 hover:text-white"
                                    }`}
                            >
                                Register
                            </button>
                        </div>

                        {/* Login Form */}
                        {isLogin && (
                            <form onSubmit={handleSubmitLogin(onLoginSubmit)} className="space-y-4">
                                {serverError && (
                                    <Alert className="bg-red-500/10 border-red-500/20 p-3 mb-4">
                                        <AlertDescription className="text-red-400 text-sm">
                                            {serverError}
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <div className="space-y-3">
                                    <div className="relative">
                                        <Input
                                            type="text"
                                            placeholder="Username"
                                            className="h-10 pl-10 bg-white/5 border-white/10 text-white text-sm"
                                            {...registerLogin("username")}
                                        />
                                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    </div>
                                    {loginErrors.username && (
                                        <p className="text-xs text-red-400">{loginErrors.username.message}</p>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <div className="relative">
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Password"
                                            className="h-10 pl-10 pr-10 bg-white/5 border-white/10 text-white text-sm"
                                            {...registerLogin("password")}
                                        />
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <button
                                            type="button"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="w-4 h-4" />
                                            ) : (
                                                <Eye className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                    {loginErrors.password && (
                                        <p className="text-xs text-red-400">{loginErrors.password.message}</p>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-10 bg-gradient-to-r from-[#7C3AED] to-[#EC4899] hover:from-[#6d28d9] hover:to-[#db2777] text-white text-sm font-medium"
                                    disabled={isLoginSubmitting}
                                >
                                    {isLoginSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                            Signing in...
                                        </>
                                    ) : (
                                        <>
                                            <Zap className="mr-2 h-3 w-3" />
                                            Sign In
                                        </>
                                    )}
                                </Button>
                            </form>
                        )}

                        {/* Register Form */}
                        {!isLogin && (
                            <form onSubmit={handleSubmitRegister(onRegisterSubmit)} className="space-y-4">
                                {serverError && (
                                    <Alert className="bg-red-500/10 border-red-500/20 p-3 mb-4">
                                        <AlertDescription className="text-red-400 text-sm">
                                            {serverError}
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <div className="space-y-3">
                                    <div className="relative">
                                        <Input
                                            type="text"
                                            placeholder="Username"
                                            className="h-10 pl-10 bg-white/5 border-white/10 text-white text-sm"
                                            {...registerRegister("username")}
                                        />
                                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    </div>
                                    {registerErrors.username && (
                                        <p className="text-xs text-red-400">{registerErrors.username.message}</p>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <div className="relative">
                                        <Input
                                            type="email"
                                            placeholder="Email"
                                            className="h-10 pl-10 bg-white/5 border-white/10 text-white text-sm"
                                            {...registerRegister("email")}
                                        />
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    </div>
                                    {registerErrors.email && (
                                        <p className="text-xs text-red-400">{registerErrors.email.message}</p>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <div className="relative">
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Password"
                                            className="h-10 pl-10 pr-10 bg-white/5 border-white/10 text-white text-sm"
                                            {...registerRegister("password")}
                                        />
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <button
                                            type="button"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="w-4 h-4" />
                                            ) : (
                                                <Eye className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                    {registerErrors.password && (
                                        <p className="text-xs text-red-400">{registerErrors.password.message}</p>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <div className="relative">
                                        <Input
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder="Confirm Password"
                                            className="h-10 pl-10 pr-10 bg-white/5 border-white/10 text-white text-sm"
                                            {...registerRegister("confirmPassword")}
                                        />
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <button
                                            type="button"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        >
                                            {showConfirmPassword ? (
                                                <EyeOff className="w-4 h-4" />
                                            ) : (
                                                <Eye className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                    {registerErrors.confirmPassword && (
                                        <p className="text-xs text-red-400">{registerErrors.confirmPassword.message}</p>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-10 bg-gradient-to-r from-[#7C3AED] to-[#EC4899] hover:from-[#6d28d9] hover:to-[#db2777] text-white text-sm font-medium"
                                    disabled={isRegisterSubmitting}
                                >
                                    {isRegisterSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                            Creating account...
                                        </>
                                    ) : (
                                        <>
                                            <Trophy className="mr-2 h-3 w-3" />
                                            Join Now
                                        </>
                                    )}
                                </Button>
                            </form>
                        )}

                        {/* Simple Divider */}
                        <div className="relative my-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/10" />
                            </div>
                            <div className="relative flex justify-center">
                                <span className="px-2 bg-white/5 text-gray-400 text-xs">
                                    OR
                                </span>
                            </div>
                        </div>

                        {/* Guest Button */}
                        <Button
                            variant="outline"
                            className="w-full h-10 border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 text-sm"
                            onClick={handleGuestLogin}
                            disabled={isGuestLoading}
                        >
                            {isGuestLoading ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                                "Continue as Guest"
                            )}
                        </Button>
                    </CardContent>

                    {/* Compact Footer */}
                    <CardFooter className="flex flex-col items-center border-t border-white/10 pt-4 pb-4">
                        <p className="text-center text-xs text-gray-500">
                            By continuing, you agree to our{" "}
                            <a href="#" className="text-purple-400 hover:underline">Terms</a>{" "}
                            and{" "}
                            <a href="#" className="text-purple-400 hover:underline">Privacy</a>
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}