'use client';

import Image from 'next/image';

interface CardBackProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  isSpent?: boolean;
}

export default function CardBack({ size = 'md', className = '', isSpent }: CardBackProps) {
  const sizes = { sm: { w: 80, h: 112 }, md: { w: 140, h: 196 }, lg: { w: 200, h: 280 } };
  const { w, h } = sizes[size];

  return (
    <div
      className={`relative ${isSpent ? 'rotate-90' : ''} ${className}`}
      style={{ width: w, height: h, borderRadius: 8, overflow: 'hidden', border: '2px solid #1e2030' }}
    >
      <Image src="/images/card-back.webp" alt="Card back" fill className="object-cover" sizes={`${w}px`} />
    </div>
  );
}
