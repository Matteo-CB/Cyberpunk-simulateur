import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Cyberpunk TCG Simulator',
  description: 'Fan-made Cyberpunk Trading Card Game Simulator — Play the Cyberpunk TCG online. Built by HiddenLab.',
  authors: [{ name: 'HiddenLab', url: 'https://hiddenlab.fr' }],
  openGraph: {
    title: 'Cyberpunk TCG Simulator',
    description: 'Play the Cyberpunk Trading Card Game online. Build decks, fight rivals, steal Gigs, climb the ranks.',
    images: ['/images/og-image.webp'],
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
