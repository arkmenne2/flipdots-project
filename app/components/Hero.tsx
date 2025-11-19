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
      [3, 9], [3, 10], [3, 11], [3, 12], [3, 13], [3, 14],
      [4, 10], [4, 11], [4, 12], [4, 13], [4, 14], [4, 15],
      [5, 11], [5, 12], [5, 14], [5, 15],
      [6, 11], [6, 12], [6, 14], [6, 15],
      [7, 11], [7, 12], [7, 13], [7, 14], [7, 15],
      [8, 11], [8, 12], [8, 13], [8, 14], [8, 15],
      [9, 11], [9, 12], [9, 13], [9, 14],
      [10, 11], [10, 12], [10, 13], [10, 14], [10, 15],
      [11, 11], [11, 12], [11, 14], [11, 15],
      [12, 11], [12, 12], [12, 14], [12, 15], 
      [13, 11], [13, 12], [13, 14], [13, 15],
      [14, 11], [14, 12], [14, 14], [14, 15],
      [15, 11], [15, 12], [15, 14],
      [16, 11], [16, 12],
      [17, 11], [17, 12],
      [18, 11],
      [19, 11],  

      
      // First O (cols 15-20)
      [3, 18], [3, 19], [3, 20], 
      [4, 17], [4, 18], [4, 19], [4, 20], [4, 21],
      [5, 17], [5, 18], [5, 20], [5, 21],
      [6, 17], [6, 18], [6, 20], [6, 21],
      [7, 17], [7, 18], [7, 20], [7, 21],
      [8, 17], [8, 18], [8, 20], [8, 21],
      [9, 17], [9, 18], [9, 20], [9, 21],
      [10, 17], [10, 18], [10, 20], [10, 21],
      [11, 17], [11, 18], [11, 20], [11, 21],
      [12, 17], [12, 18], [12, 20], [12, 21],
      [13, 17], [13, 18], [13, 20], [13, 21],
      [14, 17], [14, 18], [14, 20], [14, 21],
      [15, 17], [15, 18],[15, 19], [15, 20], [15, 21],
      [16, 18],[16, 19], [16, 20],
      [17, 19],
      
      
      // Second O (cols 22-27)
      [3, 24], [3, 25], [3, 26], 
      [4, 23], [4, 24], [4, 25], [4, 26], [4, 27],
      [5, 23], [5, 24], [5, 26], [5, 27],
      [6, 23], [6, 24], [6, 26], [6, 27],
      [7, 23], [7, 24], [7, 26], [7, 27],
      [8, 23], [8, 24], [8, 26], [8, 27],
      [9, 23], [9, 24], [9, 26], [9, 27],
      [10, 23], [10, 24], [10, 26], [10, 27],
      [11, 23], [11, 24], [11, 26], [11, 27],
      [12, 23], [12, 24], [12, 26], [12, 27],
      [13, 23], [13, 24], [13, 26], [13, 27],
      [14, 23], [14, 24], [14, 26], [14, 27],
      [15, 23], [15, 24],[15, 25], [15, 26], [15, 27],
      [16, 24],[16, 25], [16, 26],
      [17, 25],
      
      // M (cols 29-36)
      [3, 29], [3, 30], [3, 34], [3, 35], [3, 36], [3, 37], 
      [4, 29], [4, 30], [4, 31], [4, 33], [4, 34], [4, 35], [4, 36],
      [5, 29], [5, 30], [5, 31], [5, 32], [5, 33], [5, 34], [5, 35],
      [6, 29], [6, 30], [6, 31], [6, 32], [6, 33], [6, 34], [6, 35],
      [7, 29], [7, 30], [7, 31], [7, 32], [7, 33], [7, 34], [7, 35],
      [8, 29], [8, 30], [8, 32], [8, 34], [8, 35],
      [9, 29], [9, 30], [9, 32], [9, 34], [9, 35],
      [10, 29], [10, 30], [10, 34], [10, 35],
      [11, 29], [11, 30], [11, 34], [11, 35],
      [12, 29], [12, 30], [12, 34], [12, 35],
      [13, 29], [13, 30], [13, 34], [13, 35],
      [14, 30], [14, 34], [14, 35],
      [15, 34], [15, 35],
      [16, 34], [16, 35],
      [17, 34], [17, 35],
      [18, 34], [18, 35],
      [19,35]
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

  // Animate pattern from left to right
  useEffect(() => {
    const targetPattern = getInitialPattern();
    
    // Get all active dots and sort by column (left to right)
    const activeDots = targetPattern
      .map((isActive, index) => ({ isActive, index, col: index % cols }))
      .filter(({ isActive }) => isActive)
      .sort((a, b) => a.col - b.col); // Sort by column

    // Group dots by column for smoother animation
    const dotsByColumn = new Map<number, number[]>();
    activeDots.forEach(({ index, col }) => {
      if (!dotsByColumn.has(col)) {
        dotsByColumn.set(col, []);
      }
      dotsByColumn.get(col)!.push(index);
    });

    // Animate column by column from left to right
    const sortedColumns = Array.from(dotsByColumn.keys()).sort((a, b) => a - b);
    let currentColumnIndex = 0;

    const interval = setInterval(() => {
      if (currentColumnIndex < sortedColumns.length) {
        const col = sortedColumns[currentColumnIndex];
        const dotsInColumn = dotsByColumn.get(col)!;
        
        setDots((prev) => {
          const newDots = [...prev];
          dotsInColumn.forEach((index) => {
            newDots[index] = true;
          });
          return newDots;
        });
        
        currentColumnIndex++;
      } else {
        setIsLoading(false);
        clearInterval(interval);
      }
    }, 50); // Adjust speed here (lower = faster)

    return () => clearInterval(interval);
  }, [cols]);

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