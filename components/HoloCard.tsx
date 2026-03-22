'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';

interface HoloCardProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export default function HoloCard({ src, alt, width = 280, height = 391 }: HoloCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [interacting, setInteracting] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [style, setStyle] = useState<React.CSSProperties>({});

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const px = (x / rect.width) * 100;
    const py = (y / rect.height) * 100;
    const rx = -(py - 50) * 0.3;
    const ry = (px - 50) * 0.3;
    const hyp = Math.sqrt((px - 50) ** 2 + (py - 50) ** 2) / 50;

    setStyle({
      '--card-rx': `${rx}deg`,
      '--card-ry': `${ry}deg`,
      '--card-mx': `${px}%`,
      '--card-my': `${py}%`,
      '--card-hyp': hyp,
      '--card-posx': `${px}%`,
      '--card-posy': `${py}%`,
    } as React.CSSProperties);
  }, []);

  const handleMouseEnter = () => setInteracting(true);
  const handleMouseLeave = () => {
    setInteracting(false);
    setStyle({});
  };

  return (
    <div
      ref={cardRef}
      className="relative cursor-pointer"
      style={{
        width,
        height,
        perspective: '800px',
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => setFlipped(!flipped)}
    >
      <div
        className="relative w-full h-full transition-transform duration-500"
        style={{
          transformStyle: 'preserve-3d',
          transform: interacting
            ? `rotateX(var(--card-rx, 0deg)) rotateY(var(--card-ry, 0deg)) ${flipped ? 'rotateY(180deg)' : ''}`
            : flipped ? 'rotateY(180deg)' : 'rotateX(0) rotateY(0)',
          transition: interacting ? 'none' : 'transform 0.5s ease',
          ...style,
        }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 rounded-xl overflow-hidden"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover rounded-xl"
            sizes="280px"
            priority
          />
          {/* Holo shimmer overlay */}
          <div
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{
              opacity: interacting ? 0.6 : 0,
              transition: 'opacity 0.3s ease',
              background: `linear-gradient(
                115deg,
                transparent 20%,
                rgba(0, 240, 255, 0.15) 36%,
                rgba(255, 0, 60, 0.12) 42%,
                rgba(252, 238, 9, 0.1) 48%,
                rgba(0, 240, 255, 0.15) 54%,
                transparent 72%
              )`,
              backgroundSize: '200% 200%',
              backgroundPosition: `var(--card-posx, 50%) var(--card-posy, 50%)`,
              mixBlendMode: 'color-dodge',
            }}
          />
          {/* Glare */}
          <div
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{
              opacity: interacting ? 0.25 : 0,
              transition: 'opacity 0.3s ease',
              background: `radial-gradient(
                circle at var(--card-mx, 50%) var(--card-my, 50%),
                rgba(255, 255, 255, 0.3) 0%,
                transparent 60%
              )`,
            }}
          />
          {/* Neon border glow */}
          <div
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{
              boxShadow: interacting
                ? '0 0 15px rgba(0, 240, 255, 0.4), inset 0 0 15px rgba(0, 240, 255, 0.1)'
                : '0 0 8px rgba(0, 240, 255, 0.15)',
              transition: 'box-shadow 0.3s ease',
            }}
          />
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 rounded-xl overflow-hidden"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <Image
            src="/images/card-back.webp"
            alt="Card back"
            fill
            className="object-cover rounded-xl"
            sizes="320px"
          />
        </div>
      </div>
    </div>
  );
}
