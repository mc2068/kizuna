// The decorative "photo" band of the lead header, after Ramotion's Carbon Solutions: a coastal
// hotel for the beach cities, a desert ksar for Tozeur. Pure SVG, hidden from screen readers.
import type { City } from '@/lib/engine';

function Palm({ x, y, s, c }: { x: number; y: number; s: number; c: string }) {
  const fronds = [-160, -125, -90, -55, -20, 15];
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill={c}>
      <path d="M0 0 C 4 -40, 10 -80, 6 -120 L 11 -120 C 16 -80, 9 -40, 6 0 Z" />
      <g transform="translate(8 -120)">
        <g className="lead-sway">
          {fronds.map((a, i) => (
            <path key={a} transform={`rotate(${a})`} d={`M0 0 C 14 -8, 34 -6, ${46 - (i % 2) * 8} 6 C 30 -2, 14 -2, 0 4 Z`} />
          ))}
        </g>
      </g>
    </g>
  );
}

function Desert() {
  return (
    <>
      <defs>
        <linearGradient id="lead-sky-desert" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f4c78f" />
          <stop offset="1" stopColor="#fbe9d0" />
        </linearGradient>
      </defs>
      <rect width="1200" height="250" fill="url(#lead-sky-desert)" />
      <circle cx="930" cy="96" r="44" fill="#fff4e0" />
      <path d="M0 170 C 200 130, 380 150, 560 165 S 900 135, 1200 160 V250 H0Z" fill="#e7b57c" />
      <g fill="#c98f58">
        <rect x="600" y="118" width="190" height="54" />
        <rect x="640" y="96" width="70" height="30" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <rect key={i} x={612 + i * 30} y="134" width="10" height="16" rx="5" fill="#a8703f" />
        ))}
      </g>
      <path d="M0 200 C 240 170, 420 205, 700 195 S 1000 180, 1200 205 V250 H0Z" fill="#d59c62" />
      <Palm x={480} y={200} s={0.9} c="#5d4a2c" />
      <Palm x={520} y={205} s={0.7} c="#6d5934" />
      <Palm x={860} y={198} s={1} c="#5d4a2c" />
      <Palm x={1080} y={210} s={0.8} c="#6d5934" />
      <Palm x={140} y={215} s={0.85} c="#5d4a2c" />
    </>
  );
}

function Coast() {
  const glints: [number, number, number][] = [
    [80, 168, 60], [300, 182, 90], [520, 172, 50], [760, 188, 80], [980, 170, 70], [1180, 184, 60],
  ];
  return (
    <>
      <defs>
        <linearGradient id="lead-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9ed3ea" />
          <stop offset="1" stopColor="#e6f4f8" />
        </linearGradient>
        <linearGradient id="lead-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2c9fc1" />
          <stop offset="1" stopColor="#6fcbe0" />
        </linearGradient>
      </defs>
      <rect width="1200" height="250" fill="url(#lead-sky)" />
      <circle cx="960" cy="70" r="34" fill="#fffbea" opacity=".9" />
      <rect y="150" width="1200" height="60" fill="url(#lead-sea)" />
      <g className="lead-glint" stroke="#fff" strokeOpacity=".55" strokeWidth="2" strokeLinecap="round">
        {glints.map(([x, y, w]) => (
          <path key={x} d={`M${x} ${y}h${w}`} />
        ))}
      </g>
      <g fill="#fbfaf6">
        <rect x="560" y="104" width="210" height="50" />
        <rect x="600" y="84" width="120" height="22" />
        <rect x="780" y="116" width="140" height="38" />
        <rect x="460" y="122" width="110" height="32" />
        <path d="M640 84 a20 20 0 0 1 40 0z" />
      </g>
      <g fill="#9fc6d3">
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={`a${i}`} x={572 + i * 25} y="116" width="9" height="13" rx="4.5" />
        ))}
        {Array.from({ length: 5 }, (_, i) => (
          <rect key={`b${i}`} x={792 + i * 26} y="126" width="9" height="12" rx="4.5" />
        ))}
      </g>
      <path d="M0 205 C 300 190, 600 215, 1200 196 V250 H0Z" fill="#efe1c2" />
      <Palm x={420} y={214} s={0.95} c="#2f5d4a" />
      <Palm x={455} y={220} s={0.7} c="#3c6e57" />
      <Palm x={1000} y={212} s={1.05} c="#2f5d4a" />
      <Palm x={1050} y={222} s={0.75} c="#3c6e57" />
      <Palm x={160} y={222} s={0.9} c="#2f5d4a" />
    </>
  );
}

// Gentle palm sway and sea glint; still under prefers-reduced-motion.
const SCENE_CSS = `
        .lead-sway{transform-box:fill-box;transform-origin:0% 50%;animation:lead-sway 5.5s ease-in-out infinite alternate}
        .lead-glint{animation:lead-drift 14s linear infinite alternate}
        @keyframes lead-sway{from{transform:rotate(-2.5deg)}to{transform:rotate(2.5deg)}}
        @keyframes lead-drift{from{transform:translateX(0)}to{transform:translateX(-120px)}}
        @media (prefers-reduced-motion: reduce){.lead-sway,.lead-glint{animation:none}}
`;

export function CoastScene({ city }: { city: City }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 1200 250"
      preserveAspectRatio="xMidYMid slice"
    >
      <style>{SCENE_CSS}</style>
      {city === 'tozeur' ? <Desert /> : <Coast />}
    </svg>
  );
}
