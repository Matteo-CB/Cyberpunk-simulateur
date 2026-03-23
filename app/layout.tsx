import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Cyberpunk TCG Simulator',
  description: 'Fan-made Cyberpunk Trading Card Game Simulator — Play the Cyberpunk TCG online. Built by HiddenLab.',
  authors: [{ name: 'HiddenLab', url: 'https://hiddenlab.fr' }],
  icons: {
    icon: [
      { url: '/icons/favicon.ico', sizes: 'any' },
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/icons/apple-touch-icon.png',
  },
  openGraph: {
    title: 'Cyberpunk TCG Simulator',
    description: 'Play the Cyberpunk Trading Card Game online. Build decks, fight rivals, steal Gigs, climb the ranks.',
    images: ['/images/og-image.webp'],
    type: 'website',
    siteName: 'Cyberpunk TCG Simulator',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cyberpunk TCG Simulator',
    description: 'Play the Cyberpunk Trading Card Game online.',
    images: ['/images/og-image.webp'],
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://cyberpunktcgsimulator.com'),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
