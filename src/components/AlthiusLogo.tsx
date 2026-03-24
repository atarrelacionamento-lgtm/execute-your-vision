import { useId } from "react";

interface AlthiusLogoProps {
  className?: string;
}

export function AlthiusLogo({ className = "h-7 w-7" }: AlthiusLogoProps) {
  const uid = useId().replace(/:/g, "");
  const gId = `al-g-${uid}`;
  const dId = `al-d-${uid}`;

  return (
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Althius"
      fill="none"
    >
      <defs>
        <linearGradient id={gId} x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#d4d4dc" />
          <stop offset="52%" stopColor="#707080" />
          <stop offset="100%" stopColor="#1c1c24" stopOpacity="0.35" />
        </linearGradient>
        <radialGradient id={dId} cx="36%" cy="32%" r="60%">
          <stop offset="0%" stopColor="#b8b8c8" />
          <stop offset="62%" stopColor="#484858" />
          <stop offset="100%" stopColor="#141418" />
        </radialGradient>
      </defs>
      {/* Left leg — wide angle */}
      <polygon points="43,8 56,8 24,88 11,88" fill={`url(#${gId})`} />
      {/* Right leg — steeper, shorter */}
      <polygon points="56,8 69,8 77,75 64,75" fill={`url(#${gId})`} />
      {/* Sphere dot */}
      <circle cx="79" cy="21" r="9" fill={`url(#${dId})`} />
    </svg>
  );
}
