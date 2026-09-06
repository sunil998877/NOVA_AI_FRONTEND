import React, { useMemo } from "react";

function AnimatedParticles({ count = 28 }) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: 2 + Math.random() * 4,
        delay: Math.random() * 6,
        duration: 8 + Math.random() * 10,
      })),
    [count]
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-24 top-10 size-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -right-16 bottom-10 size-80 rounded-full bg-primary/5 blur-3xl" />
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full bg-primary/40"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            animation: `float ${p.duration}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

export default AnimatedParticles;
