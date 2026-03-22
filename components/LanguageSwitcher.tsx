'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/lib/i18n/navigation';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: 'en' | 'fr') => {
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <div className="flex items-center gap-1 font-blender text-sm tracking-wider">
      <button
        onClick={() => switchLocale('en')}
        className="px-2 py-1 transition-all duration-200"
        style={{
          color: locale === 'en' ? '#00f0ff' : '#444',
          borderBottom: locale === 'en' ? '2px solid #00f0ff' : '2px solid transparent',
          textShadow: locale === 'en' ? '0 0 10px rgba(0, 240, 255, 0.5)' : 'none',
        }}
      >
        EN
      </button>
      <span style={{ color: '#333' }}>|</span>
      <button
        onClick={() => switchLocale('fr')}
        className="px-2 py-1 transition-all duration-200"
        style={{
          color: locale === 'fr' ? '#00f0ff' : '#444',
          borderBottom: locale === 'fr' ? '2px solid #00f0ff' : '2px solid transparent',
          textShadow: locale === 'fr' ? '0 0 10px rgba(0, 240, 255, 0.5)' : 'none',
        }}
      >
        FR
      </button>
    </div>
  );
}
