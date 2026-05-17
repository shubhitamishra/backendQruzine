import React, { useState, useEffect } from 'react';
import Image from 'next/image';

const SplashScreen = ({ onComplete }) => {
  const [animationPhase, setAnimationPhase] = useState('initial');

  useEffect(() => {
    // Phase 1: Initial entrance animations (0-0.8s)
    const phase1Timer = setTimeout(() => {
      setAnimationPhase('active');
    }, 100);

    // Phase 2: Dynamic animations (0.8-1.8s)
    const phase2Timer = setTimeout(() => {
      setAnimationPhase('transition');
    }, 1200);

    // Phase 3: Complete and callback (2.2s total)
    const completeTimer = setTimeout(() => {
      setAnimationPhase('complete');
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 300);
    }, 1900);

    return () => {
      clearTimeout(phase1Timer);
      clearTimeout(phase2Timer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center overflow-hidden">
      
      {/* Dynamic Background Particles */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${
        animationPhase === 'complete' ? 'opacity-0' : 'opacity-100'
      }`}>
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-gradient-to-r from-green-400 to-blue-500 rounded-full"
            style={{
              left: `${20 + (i * 7)}%`,
              top: `${15 + (i * 6)}%`,
              animation: `float-${i % 4} ${1.5 + (i % 2) * 0.5}s ease-in-out infinite`,
              animationDelay: `${i * 0.05}s`
            }}
          />
        ))}
      </div>

      {/* Morphing Geometric Shapes */}
      <div className={`absolute transition-all duration-500 ${
        animationPhase === 'complete' ? 'opacity-0 scale-150' : 'opacity-100 scale-100'
      }`}>
        {/* Morphing Triangle */}
        <div 
          className="absolute w-64 h-64 border-2 border-green-400/60"
          style={{
            clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
            animation: 'morph-triangle 1.8s ease-in-out infinite',
            transform: 'translate(-50%, -50%)'
          }}
        />
        
        {/* Pulsing Hexagon */}
        <div 
          className="absolute w-48 h-48 border-2 border-blue-500/40"
          style={{
            clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)',
            animation: 'pulse-hex 1.5s ease-in-out infinite',
            transform: 'translate(-50%, -50%)',
            animationDelay: '0.2s'
          }}
        />

        {/* Wobbling Square */}
        <div 
          className="absolute w-32 h-32 border-2 border-purple-500/50"
          style={{
            animation: 'wobble-square 1.3s ease-in-out infinite',
            transform: 'translate(-50%, -50%)',
            animationDelay: '0.4s'
          }}
        />
      </div>

      {/* Orbiting Elements */}
      <div className={`absolute w-96 h-96 transition-all duration-500 ${
        animationPhase === 'complete' ? 'opacity-0' : 'opacity-100'
      }`}>
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
            style={{
              animation: `orbit-${i % 3} ${1.8 + (i * 0.2)}s linear infinite`,
              animationDelay: `${i * 0.1}s`,
              transformOrigin: '192px 192px'
            }}
          />
        ))}
      </div>

      {/* Central Logo with Dynamic Entrance */}
      <div className={`relative z-10 transition-all duration-500 ease-out transform ${
        animationPhase === 'initial' 
          ? 'scale-0 rotate-180 opacity-0' 
          : animationPhase === 'active'
          ? 'scale-100 rotate-0 opacity-100'
          : animationPhase === 'transition'
          ? 'scale-110 rotate-0 opacity-100'
          : 'scale-75 -translate-x-[calc(50vw-6rem)] -translate-y-[calc(50vh-6rem)] opacity-0'
      }`}>
        <div className="w-40 h-40 relative">
          <div className={`absolute inset-0 rounded-full bg-gradient-to-r from-green-400/20 to-blue-500/20 blur-xl transition-all duration-500 ${
            animationPhase === 'active' ? 'scale-150 opacity-100' : 'scale-100 opacity-0'
          }`} />
          <Image
            src="/images/logo.png"
            alt="Logo"
            fill
            className="object-contain filter drop-shadow-2xl relative z-10"
            priority
          />
        </div>
      </div>

      {/* Energy Waves */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${
        animationPhase === 'complete' ? 'opacity-0' : 'opacity-100'
      }`}>
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="absolute inset-0 border-2 border-white/10 rounded-full"
            style={{
              animation: `energy-wave ${1.2 + i * 0.3}s ease-out infinite`,
              animationDelay: `${i * 0.3}s`
            }}
          />
        ))}
      </div>

      {/* Final positioned logo (top-left) */}
      <div className={`fixed top-6 left-6 z-20 transition-all duration-500 ease-out ${
        animationPhase === 'complete' ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
      }`}>
        <div className="w-14 h-14 relative">
          <Image
            src="/images/logo.png"
            alt="Logo"
            fill
            className="object-contain filter drop-shadow-lg"
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes float-0 {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          25% { transform: translateY(-15px) translateX(8px); }
          50% { transform: translateY(-8px) translateX(-12px); }
          75% { transform: translateY(-20px) translateX(4px); }
        }
        
        @keyframes float-1 {
          0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
          33% { transform: translateY(-12px) translateX(-15px) rotate(120deg); }
          66% { transform: translateY(-25px) translateX(12px) rotate(240deg); }
        }
        
        @keyframes float-2 {
          0%, 100% { transform: translateY(0px) translateX(0px) scale(1); }
          50% { transform: translateY(-30px) translateX(20px) scale(1.15); }
        }
        
        @keyframes float-3 {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          20% { transform: translateY(-8px) translateX(-8px); }
          40% { transform: translateY(-22px) translateX(15px); }
          60% { transform: translateY(-4px) translateX(-20px); }
          80% { transform: translateY(-16px) translateX(12px); }
        }

        @keyframes morph-triangle {
          0%, 100% { 
            clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
            transform: translate(-50%, -50%) rotate(0deg) scale(1);
          }
          25% { 
            clip-path: polygon(50% 20%, 20% 80%, 80% 80%);
            transform: translate(-50%, -50%) rotate(90deg) scale(1.1);
          }
          50% { 
            clip-path: polygon(50% 10%, 10% 90%, 90% 90%);
            transform: translate(-50%, -50%) rotate(180deg) scale(0.9);
          }
          75% { 
            clip-path: polygon(50% 30%, 30% 70%, 70% 70%);
            transform: translate(-50%, -50%) rotate(270deg) scale(1.2);
          }
        }

        @keyframes pulse-hex {
          0%, 100% { 
            transform: translate(-50%, -50%) scale(1) rotate(0deg);
            border-color: rgba(59, 130, 246, 0.4);
          }
          50% { 
            transform: translate(-50%, -50%) scale(1.25) rotate(180deg);
            border-color: rgba(34, 197, 94, 0.6);
          }
        }

        @keyframes wobble-square {
          0%, 100% { 
            transform: translate(-50%, -50%) rotate(0deg) skew(0deg);
          }
          25% { 
            transform: translate(-50%, -50%) rotate(4deg) skew(2deg);
          }
          50% { 
            transform: translate(-50%, -50%) rotate(-2deg) skew(-1deg);
          }
          75% { 
            transform: translate(-50%, -50%) rotate(1deg) skew(1deg);
          }
        }

        @keyframes orbit-0 {
          0% { 
            transform: rotate(0deg) translateX(150px) rotate(0deg);
            opacity: 0.3;
          }
          50% { 
            opacity: 1;
          }
          100% { 
            transform: rotate(360deg) translateX(150px) rotate(-360deg);
            opacity: 0.3;
          }
        }

        @keyframes orbit-1 {
          0% { 
            transform: rotate(0deg) translateX(120px) rotate(0deg) scale(0.8);
          }
          100% { 
            transform: rotate(-360deg) translateX(120px) rotate(360deg) scale(0.8);
          }
        }

        @keyframes orbit-2 {
          0% { 
            transform: rotate(0deg) translateX(180px) rotate(0deg);
          }
          100% { 
            transform: rotate(360deg) translateX(180px) rotate(-360deg);
          }
        }

        @keyframes energy-wave {
          0% {
            transform: scale(0.5);
            opacity: 1;
          }
          100% {
            transform: scale(2.2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;