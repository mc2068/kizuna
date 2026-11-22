/** Placeholder "photo" for the Djerba case study: sea, sand, a white hotel and palms, in SVG. */
export function HotelIllustration({ label, className }: { label: string; className?: string }) {
  return (
    <svg viewBox="0 0 1200 520" role="img" aria-label={label} className={className} preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8fd3f4" />
          <stop offset="1" stopColor="#e9f6fb" />
        </linearGradient>
        <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1f9fd0" />
          <stop offset="1" stopColor="#0b6f9a" />
        </linearGradient>
      </defs>
      <rect width="1200" height="520" fill="url(#sky)" />
      <circle cx="980" cy="110" r="56" fill="#ffd27a" />
      <rect y="300" width="1200" height="110" fill="url(#sea)" />
      <path d="M0 410 Q300 380 600 405 T1200 400 V520 H0 Z" fill="#f2dfbd" />
      <g fill="#ffffff" stroke="#d7d2c8" strokeWidth="2">
        <rect x="250" y="190" width="520" height="140" rx="6" />
        <rect x="330" y="140" width="360" height="60" rx="6" />
        <rect x="470" y="105" width="80" height="40" rx="20" />
      </g>
      <g fill="#8ac4dc">
        {Array.from({ length: 8 }).map((_, i) => (
          <rect key={`a${i}`} x={275 + i * 62} y={215} width="38" height="22" rx="3" />
        ))}
        {Array.from({ length: 8 }).map((_, i) => (
          <rect key={`b${i}`} x={275 + i * 62} y={262} width="38" height="22" rx="3" />
        ))}
        {Array.from({ length: 5 }).map((_, i) => (
          <rect key={`c${i}`} x={352 + i * 64} y={158} width="38" height="22" rx="3" />
        ))}
      </g>
      <rect x="820" y="350" width="220" height="40" rx="20" fill="#5cc6e8" stroke="#ffffff" strokeWidth="4" />
      <g stroke="#7a5a33" strokeWidth="9" strokeLinecap="round" fill="none">
        <path d="M150 420 Q160 330 140 250" />
        <path d="M1090 430 Q1080 340 1100 270" />
      </g>
      <g fill="#2f8f4e">
        <path d="M140 250 q-70 -10 -110 30 q60 -10 110 -20 z" />
        <path d="M140 250 q70 -15 110 25 q-60 -12 -110 -15 z" />
        <path d="M140 250 q-20 -60 -70 -70 q40 30 70 70 z" />
        <path d="M140 250 q30 -55 80 -60 q-45 25 -80 60 z" />
        <path d="M1100 270 q-70 -10 -110 30 q60 -10 110 -20 z" />
        <path d="M1100 270 q70 -15 110 25 q-60 -12 -110 -15 z" />
        <path d="M1100 270 q-20 -60 -70 -70 q40 30 70 70 z" />
        <path d="M1100 270 q30 -55 80 -60 q-45 25 -80 60 z" />
      </g>
    </svg>
  );
}
