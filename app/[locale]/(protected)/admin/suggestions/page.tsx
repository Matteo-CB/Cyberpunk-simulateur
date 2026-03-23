'use client';

import { useState, useEffect } from 'react';
import CyberBackground from '@/components/CyberBackground';
import { Link } from '@/lib/i18n/navigation';

interface Suggestion {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  submittedBy: string;
  createdAt: string;
}

const STATUS_OPTIONS = ['backlog', 'planned', 'in_progress', 'done_published', 'rejected'];
const STATUS_COLORS: Record<string, string> = {
  backlog: '#7a8a9a',
  planned: '#00f0ff',
  in_progress: '#fcee09',
  done_published: '#22c55e',
  rejected: '#ff003c',
};

const CATEGORY_COLORS: Record<string, string> = {
  gameplay: '#00f0ff',
  ui: '#A855F7',
  cards: '#fcee09',
  balance: '#ff003c',
  social: '#22c55e',
  other: '#7a8a9a',
};

export default function AdminSuggestionsPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/suggestions')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        setSuggestions(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch('/api/admin/suggestions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      setSuggestions((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
    }
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
              Back
            </span>
          </Link>
          <h1
            className="font-refinery"
            style={{ fontSize: 32, letterSpacing: '0.1em', color: '#22c55e', textShadow: '0 0 20px rgba(34,197,94,0.15)' }}
          >
            SUGGESTIONS
          </h1>
        </div>

        {loading ? (
          <div className="font-blender" style={{ color: '#7a8a9a', fontSize: 13, textAlign: 'center', padding: 48 }}>
            Loading...
          </div>
        ) : suggestions.length === 0 ? (
          <div className="font-blender" style={{ color: '#444', fontSize: 13, textAlign: 'center', padding: 48 }}>
            No suggestions found
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {suggestions.map((sug) => (
              <div
                key={sug.id}
                style={{
                  padding: 20,
                  borderRadius: 8,
                  background: '#111119',
                  border: `1px solid ${STATUS_COLORS[sug.status] || '#1e2030'}30`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span className="font-blender" style={{ fontSize: 14, color: '#e0e8f0', fontWeight: 600 }}>
                        {sug.title}
                      </span>
                      <span
                        className="font-blender"
                        style={{
                          fontSize: 9,
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                          padding: '2px 8px',
                          borderRadius: 3,
                          background: `${CATEGORY_COLORS[sug.category] || '#7a8a9a'}15`,
                          color: CATEGORY_COLORS[sug.category] || '#7a8a9a',
                          border: `1px solid ${CATEGORY_COLORS[sug.category] || '#7a8a9a'}30`,
                        }}
                      >
                        {sug.category}
                      </span>
                    </div>
                    <div className="font-blender" style={{ fontSize: 12, color: '#7a8a9a', marginBottom: 8, lineHeight: 1.5 }}>
                      {sug.description}
                    </div>
                    <div className="font-blender" style={{ fontSize: 10, color: '#3a3a4a' }}>
                      By {sug.submittedBy} on {new Date(sug.createdAt).toLocaleDateString()} | Priority: {sug.priority}
                    </div>
                  </div>
                  <select
                    className="font-blender"
                    value={sug.status}
                    onChange={(e) => updateStatus(sug.id, e.target.value)}
                    style={{
                      fontSize: 11,
                      padding: '6px 12px',
                      borderRadius: 4,
                      background: '#0a0a12',
                      border: `1px solid ${STATUS_COLORS[sug.status] || '#1e2030'}`,
                      color: STATUS_COLORS[sug.status] || '#7a8a9a',
                      cursor: 'pointer',
                      outline: 'none',
                      flexShrink: 0,
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
