'use client';

import { useState, useEffect } from 'react';

interface FlipdotProps {
  index: number;
}

function Flipdot({ index }: FlipdotProps) {
  const [isActive, setIsActive] = useState(false);
  const [animationDelay] = useState(Math.random() * 2000);
  const [animationType] = useState(Math.floor(Math.random() * 3));

  useEffect(() => {
    let interval: NodeJS.Timeout;

    // Different animation patterns
    switch (animationType) {
      case 0: // Slow random flipping
        interval = setInterval(() => {
          setIsActive(prev => !prev);
        }, 4000 + animationDelay);
        break;
      case 1: // Fast blinking
        interval = setInterval(() => {
          setIsActive(prev => !prev);
        }, 1500 + animationDelay);
        break;
      case 2: // Wave pattern based on position
        const row = Math.floor(index / 10);
        const col = index % 10;
        const waveDelay = (row + col) * 100;
        interval = setInterval(() => {
          setIsActive(prev => !prev);
        }, 2500 + waveDelay);
        break;
    }

    // Initial random state
    setIsActive(Math.random() > 0.5);

    return () => clearInterval(interval);
  }, [animationDelay, animationType, index]);

  return (
    <div 
      className={`
        aspect-square rounded-full transition-all duration-300 ease-in-out
        ${isActive 
          ? 'bg-white shadow-lg shadow-white/30 scale-105' 
          : 'bg-gray-800 shadow-inner scale-100'
        }
        hover:scale-110 hover:shadow-xl
      `}
      style={{
        animationDelay: `${animationDelay}ms`,
      }}
    />
  );
}

export default function About() {
  return (
    <section id="about" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div>
            <h2 className="font-heading text-4xl sm:text-5xl font-bold mb-6">
              ABOUT FLIPDOTS
            </h2>
            <div className="space-y-4 font-body text-foreground/80">
              <p>
                Flip-dot displays combine the nostalgia of mechanical signage with modern digital control systems. Each dot is a physical disc that flips between two colors, creating a unique aesthetic that stands out in our increasingly digital world.
              </p>
              <p>
                Originally developed for transportation signage in the 1950s, flip-dot technology has evolved into a versatile display solution perfect for art installations, retail displays, information boards, and creative projects.
              </p>
              
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mt-8">
              <div>
                <div className="font-heading text-3xl font-bold text-primary">
                6+
                </div>
                <div className="font-body text-sm text-foreground/70">
                  Widgets Available
                </div>
              </div>
              <div>
                <div className="font-heading text-3xl font-bold text-primary">
                  100k+
                </div>
                <div className="font-body text-sm text-foreground/70">
                  Dots Flipped
                </div>
              </div>
              <div>
                <div className="font-heading text-3xl font-bold text-primary">
                  <p>{'<100ms'}</p>
                </div>
                <div className="font-body text-sm text-foreground/70">
                  Latency
                </div>
              </div>
            </div>
          </div>

          {/* Visual Element - Flipdot Display */}
          <div className="relative">
            <div className="aspect-square bg-black rounded-lg flex items-center justify-center p-4 shadow-2xl border-4 border-gray-800">
              <div className="grid grid-cols-10 gap-1 w-full h-full">
                {Array.from({ length: 100 }).map((_, i) => (
                  <Flipdot key={i} index={i} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
