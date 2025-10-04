"use client";

import { useState, useEffect } from "react";

export default function Hero() {
  // Calculate grid size - adjusted for better screen fit
  const cols = 48;
  const rows = 24;
  const totalDots = cols * rows;

  // Initialize pattern - "ROOM" text (like in the reference image)
  const getInitialPattern = () => {
    const pattern = new Array(totalDots).fill(false);
    
    // Create "ROOM" pattern centered in the grid (large, bold letters)
    const letterPattern = [
      // R (cols 8-13)
      [5, 8], [6, 8], [7, 8], [8, 8], [9, 8], [10, 8], [11, 8], [12, 8],
      [5, 9], [5, 10], [5, 11],
      [6, 12], [7, 12],
      [8, 9], [8, 10], [8, 11],
      [9, 12],
      [10, 11], [11, 12], [12, 13],
      
      // First O (cols 15-20)
      [5, 16], [5, 17], [5, 18], [5, 19],
      [6, 15], [6, 20],
      [7, 15], [7, 20],
      [8, 15], [8, 20],
      [9, 15], [9, 20],
      [10, 15], [10, 20],
      [11, 15], [11, 20],
      [12, 16], [12, 17], [12, 18], [12, 19],
      
      // Second O (cols 22-27)
      [5, 23], [5, 24], [5, 25], [5, 26],
      [6, 22], [6, 27],
      [7, 22], [7, 27],
      [8, 22], [8, 27],
      [9, 22], [9, 27],
      [10, 22], [10, 27],
      [11, 22], [11, 27],
      [12, 23], [12, 24], [12, 25], [12, 26],
      
      // M (cols 29-36)
      [5, 29], [6, 29], [7, 29], [8, 29], [9, 29], [10, 29], [11, 29], [12, 29],
      [5, 30], [6, 30],
      [5, 31], [6, 31], [7, 31],
      [5, 32], [6, 32], [7, 32], [8, 32],
      [5, 33], [6, 33], [7, 33],
      [5, 34], [6, 34],
      [5, 35], [6, 35], [7, 35], [8, 35], [9, 35], [10, 35], [11, 35], [12, 35],
    ];

    letterPattern.forEach(([row, col]) => {
      const index = row * cols + col;
      if (index < totalDots && index >= 0) {
        pattern[index] = true;
      }
    });

    return pattern;
  };

  const [dots, setDots] = useState<boolean[]>(new Array(totalDots).fill(false));
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredDot, setHoveredDot] = useState<number | null>(null);

  // Loading animation - reveal pattern dot by dot
  useEffect(() => {
    const targetPattern = getInitialPattern();
    const dotsToAnimate = targetPattern
      .map((isActive, index) => (isActive ? index : -1))
      .filter((index) => index !== -1);

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < dotsToAnimate.length) {
        setDots((prev) => {
          const newDots = [...prev];
          newDots[dotsToAnimate[currentIndex]] = true;
          return newDots;
        });
        currentIndex++;
      } else {
        setIsLoading(false);
        clearInterval(interval);
      }
    }, 30);

    return () => clearInterval(interval);
  }, []);

  const toggleDot = (index: number) => {
    const newDots = [...dots];
    newDots[index] = !newDots[index];
    setDots(newDots);
  };

  return (
    <section
      id="hero"
      className="w-screen h-screen bg-black flex flex-col"
      style={{ margin: 0, padding: 0 }}
    >
      {/* Full Screen Interactive Flip-Dot Display */}
      <div className="flex-1 flex items-center justify-center" style={{ minHeight: 0 }}>
        <div
          className="grid w-full"
          style={{
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gridTemplateRows: `repeat(${rows}, 1fr)`,
            gap: "0.2rem",
            padding: "0.5rem",
            boxSizing: "border-box",
            aspectRatio: `${cols} / ${rows}`,
            maxWidth: "100%",
            maxHeight: "100%",
          }}
        >
          {Array.from({ length: totalDots }).map((_, index) => (
            <div
              key={index}
              onMouseEnter={() => setHoveredDot(index)}
              onMouseLeave={() => setHoveredDot(null)}
              onClick={() => toggleDot(index)}
              className={`rounded-full cursor-pointer transition-all ${
                hoveredDot === index && !dots[index]
                  ? "animate-flip-preview"
                  : ""
              } ${
                dots[index]
                  ? "bg-white shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                  : "bg-white/10 hover:bg-white/25"
              }`}
              style={{
                width: "100%",
                height: "100%",
                transitionDuration: hoveredDot === index ? "150ms" : "300ms",
                transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            />
          ))}
        </div>
      </div>

      {/* Text Content Below Grid */}
      <div className="pb-8 px-8 text-white flex justify-between items-end" style={{ minHeight: "120px" }}>
        {/* Left Text */}
        <div className="max-w-2xl">
          <p className="font-body text-lg sm:text-xl lg:text-2xl leading-relaxed">
            Explore our 3D room —{" "}
            <br className="hidden sm:block" />
            our{" "}
            <span className="text-primary">
              unique and exciting visual interaction
            </span>{" "}
            with flip-dot technology.
          </p>
        </div>

        {/* Right Section - CTA Button + OWOW x Fontys */}
        <div className="text-right flex flex-col items-end gap-4">
          {/* Call to Action Button */}
          <button className="bg-primary text-white px-6 py-3 rounded-lg font-heading font-semibold text-sm sm:text-base hover:bg-primary/90 transition-colors duration-200 shadow-lg hover:shadow-xl">
            Explore the Room
          </button>
          
          <p className="font-heading text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">
            OWOW <span className="text-white/60">x</span>{" "}
            <span style={{ color: "#662483" }}>Fontys</span>
          </p>
        </div>
      </div>
    </section>
  );
}