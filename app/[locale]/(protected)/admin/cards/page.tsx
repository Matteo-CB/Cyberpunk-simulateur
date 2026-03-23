'use client';

import { useState, useEffect } from 'react';
import CyberBackground from '@/components/CyberBackground';
import { Link } from '@/lib/i18n/navigation';
import { useTranslations } from 'next-intl';

interface CardIssue {
  id: string;
  cardIds: string[];
  cardNames: string[];
  description: string;
  status: string;
  reportedBy: string;
  createdAt: string;
}

const STATUS_OPTIONS = ['to_fix', 'fixed_unpublished', 'fixed_published', 'verified'];
const STATUS_COLORS: Record<string, string> = {
  to_fix: '#ff003c',
  fixed_unpublished: '#fcee09',
  fixed_published: '#00f0ff',
  verified: '#22c55e',
};

export default function AdminCardsPage() {
  const t = useTranslations();
  const [issues, setIssues] = useState<CardIssue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/card-tracker')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        setIssues(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const updateStatus = async (id: string, status: string) => {
    await fetch('/api/admin/card-tracker', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    setIssues((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
  };

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: '#0a0a12' }}>
      <CyberBackground />
      <div
        className="relative z-10 flex flex-col min-h-screen"
        style={{ padding: '32px 24px', maxWidth: 1000, width: '100%', margin: '0 auto' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 36 }}>
          <Link href="/admin">
            <span
              className="font-blender"
              style={{ fontSize: 11, cursor: 'pointer', color: '#3a3a4a', transition: 'color 0.2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#7a8a9a'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#3a3a4a'; }}
            >
              {t('common.back')}
            </span>
          </Link>
          <h1
            className="font-refinery"
            style={{ fontSize: 32, letterSpacing: '0.1em', color: '#00f0ff', textShadow: '0 0 20px rgba(0,240,255,0.15)' }}
          >
            {t('admin.cardManagement')}
          </h1>
        </div>

        {loading ? (
          <div className="font-blender" style={{ color: '#7a8a9a', fontSize: 13, textAlign: 'center', padding: 48 }}>
            {t('common.loading')}
          </div>
        ) : issues.length === 0 ? (
          <div className="font-blender" style={{ color: '#444', fontSize: 13, textAlign: 'center', padding: 48 }}>
            {t('admin.noIssues')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {issues.map((issue) => (
              <div
                key={issue.id}
                style={{
                  padding: 20,
                  borderRadius: 8,
                  background: '#111119',
                  border: `1px solid ${STATUS_COLORS[issue.status] || '#1e2030'}30`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div className="font-blender" style={{ fontSize: 13, color: '#e0e8f0', marginBottom: 6 }}>
                      {issue.cardIds.join(', ')}
                    </div>
                    <div className="font-blender" style={{ fontSize: 11, color: '#7a8a9a', marginBottom: 8 }}>
                      {issue.description}
                    </div>
                    <div className="font-blender" style={{ fontSize: 10, color: '#3a3a4a' }}>
                      {t('admin.reportedBy')} {issue.reportedBy} {t('admin.on')} {new Date(issue.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <select
                    className="font-blender"
                    value={issue.status}
                    onChange={(e) => updateStatus(issue.id, e.target.value)}
                    style={{
                      fontSize: 11,
                      padding: '6px 12px',
                      borderRadius: 4,
                      background: '#0a0a12',
                      border: `1px solid ${STATUS_COLORS[issue.status] || '#1e2030'}`,
                      color: STATUS_COLORS[issue.status] || '#7a8a9a',
                      cursor: 'pointer',
                      outline: 'none',
                    }}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
