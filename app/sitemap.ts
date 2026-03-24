import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cyberpunktcgsimulator.com';
  const locales = ['en', 'fr'];
  const now = new Date();

  const pages = [
    { path: '', priority: 1.0, changeFrequency: 'weekly' as const },
    { path: '/play', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/collection', priority: 0.8, changeFrequency: 'monthly' as const },
    { path: '/deck-builder', priority: 0.8, changeFrequency: 'weekly' as const },
    { path: '/leaderboard', priority: 0.8, changeFrequency: 'daily' as const },
    { path: '/learn', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/login', priority: 0.5, changeFrequency: 'yearly' as const },
    { path: '/register', priority: 0.5, changeFrequency: 'yearly' as const },
    { path: '/legal', priority: 0.3, changeFrequency: 'yearly' as const },
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const page of pages) {
      entries.push({
        url: `${baseUrl}/${locale}${page.path}`,
        lastModified: now,
        changeFrequency: page.changeFrequency,
        priority: page.priority,
      });
    }
  }

  return entries;
}
