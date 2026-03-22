'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/lib/i18n/navigation';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    fetch('/api/user/me')
      .then((r) => {
        if (r.ok) {
          setAuthenticated(true);
        } else {
          router.push('/login');
        }
        setChecked(true);
      })
      .catch(() => {
        router.push('/login');
        setChecked(true);
      });
  }, [router]);

  if (!checked) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: '#0a0a12',
        }}
      >
        <div className="font-blender animate-pulse" style={{ fontSize: 13, color: '#00f0ff' }}>
          Loading...
        </div>
      </div>
    );
  }

  if (!authenticated) return null;

  return <>{children}</>;
}
