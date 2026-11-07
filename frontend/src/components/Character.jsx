/**
 * Gen-Z animated SVG character.
 *
 * States (prop: state):
 *  Tracker  → 'idle' | 'date' | 'working' | 'typing' | 'done'
 *  Calc     → 'idle' | 'calendar' | 'money' | 'clock' | 'calculating' | 'result'
 *
 * Each state maps to a CSS class on the root <svg> that drives all animations.
 */
import React from 'react';

export default function Character({ state = 'idle', label = '' }) {
  return (
    <div className={`char-wrap char-state-${state}`} aria-hidden="true">
      <svg
        className="char-svg"
        viewBox="0 0 220 340"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* ── Shadow ── */}
        <ellipse cx="110" cy="328" rx="48" ry="8" fill="var(--char-shadow)" className="char-shadow" />

        {/* ── Sneakers ── */}
        <g className="char-feet">
          {/* left shoe */}
          <rect x="72" y="300" width="32" height="14" rx="7" fill="#1e1e2e" />
          <rect x="68" y="306" width="36" height="8" rx="4" fill="#2d2d44" />
          <rect x="68" y="308" width="36" height="3" rx="1.5" fill="#6366f1" />
          {/* right shoe */}
          <rect x="116" y="300" width="32" height="14" rx="7" fill="#1e1e2e" />
          <rect x="112" y="306" width="36" height="8" rx="4" fill="#2d2d44" />
          <rect x="112" y="308" width="36" height="3" rx="1.5" fill="#6366f1" />
        </g>

        {/* ── Pants ── */}
        <g className="char-legs">
          <rect x="76" y="220" width="30" height="86" rx="14" fill="#2d2d44" />
          <rect x="114" y="220" width="30" height="86" rx="14" fill="#2d2d44" />
          {/* cargo pocket */}
          <rect x="116" y="248" width="16" height="14" rx="3" fill="#23233a" />
          <line x1="124" y1="248" x2="124" y2="262" stroke="#6366f1" strokeWidth="1" />
        </g>

        {/* ── Body / Hoodie ── */}
        <g className="char-body">
          {/* hoodie main */}
          <rect x="66" y="148" width="88" height="82" rx="22" fill="#6366f1" />
          {/* hoodie front pocket */}
          <path d="M88 200 Q110 210 132 200 L132 215 Q110 225 88 215 Z" fill="#4f46e5" />
          {/* hoodie strings */}
          <line x1="104" y1="175" x2="100" y2="195" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" />
          <line x1="116" y1="175" x2="120" y2="195" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* ── Left Arm (various states) ── */}
        <g className="char-arm-left">
          {/* upper arm */}
          <rect x="44" y="152" width="26" height="56" rx="13" fill="#6366f1" />
          {/* forearm */}
          <rect x="46" y="196" width="22" height="44" rx="11" fill="#c8a27a" className="char-skin" />
          {/* hand */}
          <ellipse cx="57" cy="244" rx="12" ry="10" fill="#c8a27a" className="char-skin" />
          {/* coffee cup – visible in idle state */}
          <g className="char-coffee">
            <rect x="46" y="246" width="22" height="20" rx="4" fill="#fff8f0" />
            <rect x="46" y="246" width="22" height="7" rx="4" fill="#6366f1" />
            <ellipse cx="57" cy="246" rx="11" ry="3.5" fill="#7c7ff5" />
            {/* steam */}
            <path className="char-steam1" d="M51 242 Q53 238 51 234" stroke="#c4b5fd" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path className="char-steam2" d="M57 240 Q59 236 57 232" stroke="#c4b5fd" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path className="char-steam3" d="M63 242 Q65 238 63 234" stroke="#c4b5fd" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            {/* cup handle */}
            <path d="M68 250 Q74 254 68 260" stroke="#e0d0c0" strokeWidth="2" strokeLinecap="round" fill="none" />
          </g>
        </g>

        {/* ── Right Arm ── */}
        <g className="char-arm-right">
          {/* upper arm */}
          <rect x="150" y="152" width="26" height="56" rx="13" fill="#6366f1" />
          {/* forearm */}
          <rect x="152" y="196" width="22" height="44" rx="11" fill="#c8a27a" className="char-skin" />
          {/* hand */}
          <ellipse cx="163" cy="244" rx="12" ry="10" fill="#c8a27a" className="char-skin" />
        </g>

        {/* ── Laptop (visible when working/typing) ── */}
        <g className="char-laptop">
          {/* base */}
          <rect x="70" y="236" width="80" height="48" rx="6" fill="#1e1e2e" />
          <rect x="74" y="240" width="72" height="38" rx="4" fill="#0f172a" />
          {/* screen content – typing lines */}
          <rect x="78" y="246" width="40" height="2.5" rx="1.2" fill="#6366f1" opacity="0.8" className="char-code1" />
          <rect x="78" y="252" width="28" height="2.5" rx="1.2" fill="#818cf8" opacity="0.6" className="char-code2" />
          <rect x="78" y="258" width="50" height="2.5" rx="1.2" fill="#6366f1" opacity="0.7" className="char-code3" />
          <rect x="78" y="264" width="20" height="2.5" rx="1.2" fill="#34d399" opacity="0.8" className="char-code4" />
          {/* cursor blink */}
          <rect x="100" y="264" width="2" height="8" rx="1" fill="#f0f1ff" className="char-cursor" />
          {/* trackpad */}
          <rect x="96" y="282" width="28" height="16" rx="3" fill="#2d2d44" />
          {/* lid */}
          <rect x="70" y="188" width="80" height="52" rx="6" fill="#1e1e2e" className="char-lid" />
          <rect x="74" y="192" width="72" height="44" rx="4" fill="#0f172a" className="char-lid" />
          <rect x="78" y="196" width="64" height="36" rx="2" fill="#1e293b" className="char-lid" />
          {/* screen glow */}
          <rect x="80" y="198" width="60" height="32" rx="2" fill="#6366f1" opacity="0.08" className="char-lid" />
        </g>

        {/* ── Calendar prop (date / calendar states) ── */}
        <g className="char-calendar">
          <rect x="54" y="216" width="50" height="46" rx="5" fill="#f0f1ff" />
          <rect x="54" y="216" width="50" height="14" rx="5" fill="#6366f1" />
          <rect x="54" y="224" width="50" height="6" fill="#6366f1" />
          {/* rings */}
          <rect x="66" y="211" width="4" height="10" rx="2" fill="#4f46e5" />
          <rect x="80" y="211" width="4" height="10" rx="2" fill="#4f46e5" />
          <rect x="94" y="211" width="4" height="10" rx="2" fill="#4f46e5" />
          {/* grid dots */}
          {[0,1,2,3].map(row =>
            [0,1,2,3,4,5].map(col => (
              <rect key={`${row}-${col}`}
                x={58 + col * 8} y={234 + row * 7}
                width="4" height="4" rx="1"
                fill={row === 0 && col === 3 ? '#6366f1' : '#c7d2fe'}
              />
            ))
          )}
        </g>

        {/* ── Money / cash prop ── */}
        <g className="char-money">
          {/* bills */}
          <rect x="50" y="224" width="54" height="28" rx="4" fill="#d1fae5" transform="rotate(-8 77 238)" />
          <rect x="52" y="226" width="54" height="28" rx="4" fill="#a7f3d0" transform="rotate(-4 79 240)" />
          <rect x="54" y="228" width="54" height="28" rx="4" fill="#6ee7b7" transform="rotate(0 81 242)" />
          <rect x="56" y="230" width="52" height="26" rx="3" fill="#10b981" transform="rotate(0 82 243)" />
          <text x="82" y="246" fontSize="10" fontWeight="bold" fill="#fff" textAnchor="middle">₹</text>
          {/* sparkles */}
          <text className="char-sparkle1" x="46" y="222" fontSize="10">✨</text>
          <text className="char-sparkle2" x="106" y="220" fontSize="10">💸</text>
        </g>

        {/* ── Clock prop ── */}
        <g className="char-clock">
          <circle cx="79" cy="244" r="26" fill="#fef3c7" />
          <circle cx="79" cy="244" r="22" fill="#fef9f0" />
          <circle cx="79" cy="244" r="20" fill="none" stroke="#f59e0b" strokeWidth="2" />
          {/* tick marks */}
          {[0,30,60,90,120,150,180,210,240,270,300,330].map(deg => {
            const r = deg % 90 === 0 ? 14 : 16;
            const R = 18;
            const a = (deg - 90) * Math.PI / 180;
            return <line key={deg}
              x1={79 + Math.cos(a)*r} y1={244 + Math.sin(a)*r}
              x2={79 + Math.cos(a)*R} y2={244 + Math.sin(a)*R}
              stroke="#f59e0b" strokeWidth={deg % 90 === 0 ? 2 : 1} strokeLinecap="round"
            />;
          })}
          {/* hands */}
          <line x1="79" y1="244" x2="79" y2="230" stroke="#1e1e2e" strokeWidth="2.5" strokeLinecap="round" className="char-hour-hand" />
          <line x1="79" y1="244" x2="91" y2="244" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" className="char-min-hand" />
          <circle cx="79" cy="244" r="3" fill="#ef4444" />
        </g>

        {/* ── Calculator prop ── */}
        <g className="char-calcprop">
          <rect x="50" y="216" width="48" height="64" rx="6" fill="#e8eaff" />
          <rect x="50" y="216" width="48" height="22" rx="6" fill="#4f46e5" />
          <rect x="54" y="220" width="40" height="14" rx="3" fill="#1e1b4b" />
          <text x="92" y="231" fontSize="8" fill="#a5b4fc" textAnchor="end" fontFamily="monospace">12.5×</text>
          {/* buttons */}
          {[0,1,2,3].map(row => [0,1,2].map(col => (
            <rect key={`${row}-${col}`}
              x={55 + col * 14} y={243 + row * 13}
              width="10" height="9" rx="2"
              fill={row === 0 ? '#6366f1' : '#c7d2fe'}
            />
          )))}
          <rect x="55" y="269" width="37" height="9" rx="2" fill="#6366f1" />
        </g>

        {/* ── Celebration (result state) ── */}
        <g className="char-celebrate">
          <text className="char-confetti1" x="30"  y="130" fontSize="16">🎉</text>
          <text className="char-confetti2" x="165" y="120" fontSize="14">⭐</text>
          <text className="char-confetti3" x="155" y="155" fontSize="12">✨</text>
          <text className="char-confetti4" x="25"  y="160" fontSize="12">💰</text>
        </g>

        {/* ── Neck ── */}
        <rect x="100" y="124" width="20" height="28" rx="10" fill="#c8a27a" className="char-skin" />

        {/* ── Head ── */}
        <g className="char-head">
          {/* head shape */}
          <ellipse cx="110" cy="100" rx="42" ry="46" fill="#c8a27a" className="char-skin" />

          {/* ── Hair ── */}
          {/* base */}
          <ellipse cx="110" cy="68" rx="42" ry="22" fill="#1a1a2e" />
          {/* fade sides */}
          <ellipse cx="74"  cy="86" rx="10" ry="18" fill="#1a1a2e" />
          <ellipse cx="146" cy="86" rx="10" ry="18" fill="#1a1a2e" />
          {/* top textured swoop */}
          <path d="M78 64 Q88 44 110 52 Q132 44 142 64 Q130 54 110 58 Q90 54 78 64Z" fill="#12122a" />
          {/* highlight strand */}
          <path d="M95 55 Q106 46 118 55" stroke="#7c7ff5" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M100 52 Q110 44 120 52" stroke="#a5b4fc" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.7" />

          {/* ── Ears ── */}
          <ellipse cx="68"  cy="102" rx="8" ry="10" fill="#c8a27a" className="char-skin" />
          <ellipse cx="152" cy="102" rx="8" ry="10" fill="#c8a27a" className="char-skin" />
          <ellipse cx="68"  cy="102" rx="5" ry="7"  fill="#b8926a" className="char-skin-dark" />
          <ellipse cx="152" cy="102" rx="5" ry="7"  fill="#b8926a" className="char-skin-dark" />

          {/* ── Headphones ── */}
          <path d="M68 84 Q68 52 110 52 Q152 52 152 84" stroke="#1a1a2e" strokeWidth="6" strokeLinecap="round" fill="none" />
          <rect x="60" y="84" width="16" height="22" rx="8" fill="#1e1e2e" />
          <rect x="144" y="84" width="16" height="22" rx="8" fill="#1e1e2e" />
          <rect x="63" y="87" width="10" height="16" rx="5" fill="#6366f1" />
          <rect x="147" y="87" width="10" height="16" rx="5" fill="#6366f1" />
          {/* headphone LED */}
          <circle cx="68"  cy="95" r="2" fill="#a5b4fc" className="char-led" />
          <circle cx="152" cy="95" r="2" fill="#a5b4fc" className="char-led" />

          {/* ── Face features ── */}
          {/* eyebrows */}
          <path className="char-brow-l" d="M88 86 Q95 82 100 86" stroke="#1a1a2e" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path className="char-brow-r" d="M120 86 Q125 82 132 86" stroke="#1a1a2e" strokeWidth="2.5" strokeLinecap="round" fill="none" />

          {/* eyes (open default) */}
          <g className="char-eye-l">
            <ellipse cx="93"  cy="96" rx="8" ry="9" fill="#fff" />
            <ellipse cx="94"  cy="97" rx="5" ry="5.5" fill="#3d2b1f" />
            <ellipse cx="95"  cy="96" rx="3" ry="3.5" fill="#1a1a2e" />
            <circle  cx="97"  cy="94" r="1.5" fill="#fff" />
          </g>
          <g className="char-eye-r">
            <ellipse cx="127" cy="96" rx="8" ry="9" fill="#fff" />
            <ellipse cx="128" cy="97" rx="5" ry="5.5" fill="#3d2b1f" />
            <ellipse cx="129" cy="96" rx="3" ry="3.5" fill="#1a1a2e" />
            <circle  cx="131" cy="94" r="1.5" fill="#fff" />
          </g>

          {/* nose */}
          <path d="M107 108 Q110 116 113 108" stroke="#b8926a" strokeWidth="1.5" strokeLinecap="round" fill="none" className="char-skin-dark" />

          {/* mouth – default relaxed smile */}
          <path className="char-mouth" d="M99 120 Q110 128 121 120" stroke="#7a4a30" strokeWidth="2" strokeLinecap="round" fill="none" />

          {/* cheek blush */}
          <ellipse cx="84"  cy="112" rx="7" ry="4" fill="#e8926a" opacity="0.3" className="char-blush" />
          <ellipse cx="136" cy="112" rx="7" ry="4" fill="#e8926a" opacity="0.3" className="char-blush" />
        </g>

        {/* ── Headphone wire to "phone" ── */}
        <path d="M68 106 Q60 130 64 148" stroke="#1a1a2e" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </svg>

      {/* State label bubble */}
      {label && (
        <div className="char-bubble">
          {label}
        </div>
      )}
    </div>
  );
}
