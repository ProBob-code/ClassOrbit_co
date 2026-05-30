export default function Logo({ className = '' }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 400 120" 
      className={className} 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Dynamic Glow Filter */}
      <defs>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Tilted Orbit Swoosh */}
      <ellipse 
        cx="200" cy="60" 
        rx="160" ry="25" 
        transform="rotate(-8 200 60)" 
        stroke="url(#orbitGradient)" 
        strokeWidth="3"
        strokeDasharray="800"
        strokeDashoffset="0"
        fill="transparent"
      />
      
      {/* Gradient for Orbit */}
      <defs>
        <linearGradient id="orbitGradient" x1="0" y1="0" x2="400" y2="120">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
        </linearGradient>
      </defs>

      {/* 4-Pointed Sparkles / Stars */}
      {/* Left Star */}
      <path d="M 40 70 Q 55 70 55 55 Q 55 70 70 70 Q 55 70 55 85 Q 55 70 40 70 Z" fill="white" filter="url(#glow)" />
      {/* Top Center Star */}
      <path d="M 220 20 Q 230 20 230 10 Q 230 20 240 20 Q 230 20 230 30 Q 230 20 220 20 Z" fill="white" />
      {/* Right Bottom Star */}
      <path d="M 330 90 Q 338 90 338 82 Q 338 90 346 90 Q 338 90 338 98 Q 338 90 330 90 Z" fill="#F59E0B" filter="url(#glow)" />

      {/* ClassOrbit Text */}
      <text 
        x="200" y="78" 
        fontFamily="Outfit, system-ui, sans-serif" 
        fontSize="56" 
        fontWeight="800" 
        textAnchor="middle" 
        letterSpacing="-2"
      >
        <tspan fill="white">Class</tspan>
        <tspan fill="#F59E0B">Orbit</tspan>
      </text>
    </svg>
  );
}
