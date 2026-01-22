'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '@/lib/storage';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const user = getUser();
    if (user) {
      router.push('/home');
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animated-bg" />
      <div className="text-center">
        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-6 animate-pulse">
          <span className="text-5xl">🏎️</span>
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          NitroQuiz
        </h1>
        <p className="text-gray-400 mt-2">Loading...</p>
        <div className="spinner w-8 h-8 mx-auto mt-6" />
      </div>
    </div>
  );
}
