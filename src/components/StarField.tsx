import { useId, useMemo } from "react";

function seededLcg(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function StarField() {
  const uid = useId().replace(/:/g, "");

  const stars = useMemo(() => {
    const rand = seededLcg(2025);
    return Array.from({ length: 210 }, (_, i) => ({
      x: rand() * 100,
      y: rand() * 100,
      r: rand() < 0.82 ? 0.1 : rand() < 0.97 ? 0.18 : 0.28,
      o: 0.06 + rand() * 0.28,
      twinkle: i % 13 === 0,
      dur: 4 + rand() * 10,
      delay: rand() * 8,
    }));
  }, []);

  return (
    <svg
      className="fixed inset-0 w-full h-full pointer-events-none select-none"
      style={{ zIndex: 0 }}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
      viewBox="0 0 100 100"
      aria-hidden="true"
    >
      <defs>
        {/* Nebula glow — top-right, cool blue */}
        <radialGradient id={`sf-n1-${uid}`} cx="87%" cy="10%" r="28%">
          <stop offset="0%" stopColor="#1a1ac8" stopOpacity="0.07" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        {/* Nebula glow — bottom-left, deep violet */}
        <radialGradient id={`sf-n2-${uid}`} cx="7%" cy="88%" r="30%">
          <stop offset="0%" stopColor="#3010a8" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        {/* Faint horizon glow — center-bottom */}
        <radialGradient id={`sf-n3-${uid}`} cx="50%" cy="100%" r="45%">
          <stop offset="0%" stopColor="#101040" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Nebula layers */}
      <rect width="100" height="100" fill={`url(#sf-n1-${uid})`} />
      <rect width="100" height="100" fill={`url(#sf-n2-${uid})`} />
      <rect width="100" height="100" fill={`url(#sf-n3-${uid})`} />

      {/* Stars */}
      {stars.map((s, i) =>
        s.twinkle ? (
          <circle
            key={i}
            cx={s.x}
            cy={s.y}
            r={s.r + 0.04}
            fill="white"
            opacity={s.o}
            style={{
              animation: `twinkle ${s.dur}s ease-in-out infinite`,
              animationDelay: `${s.delay}s`,
            }}
          />
        ) : (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="white" opacity={s.o} />
        )
      )}
    </svg>
  );
}
