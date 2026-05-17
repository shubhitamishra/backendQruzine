"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import SplashScreen from '../components/splash_screen';

export default function Page() {
  const router = useRouter();

  const handleSplashComplete = () => {
    router.push('/login');
  };

  return <SplashScreen onComplete={handleSplashComplete} />;
}