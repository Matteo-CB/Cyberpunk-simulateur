'use client';

import { useState, useEffect } from 'react';
import CyberBackground from '@/components/CyberBackground';
import { Link } from '@/lib/i18n/navigation';
import { useTranslations } from 'next-intl';

interface SiteSettingsData {
  id?: string;
  key: string;
  leaguesEnabled: boolean;
  sealedEnabled: boolean;
  discordRoleIds: Record<string, string> | null;
}

export default function AdminSettingsPage() {
  const t = useTranslations();
  const [settings, setSettings] = useState<SiteSettingsData>({
    key: 'main',
    leaguesEnabled: false,
    sealedEnabled: false,
    discordRoleIds: null,
  });
  const [discordRolesText, setDiscordRolesText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => (r.ok ? r.json() : []))
      .then((data: SiteSettingsData[]) => {
        const main = Array.isArray(data) ? data.find((s) => s.key === 'main') || data[0] : null;
        if (main) {
          setSettings(main);
          setDiscordRolesText(main.discordRoleIds ? JSON.stringify(main.discordRoleIds, null, 2) : '');
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    setMessage('');

    let parsedRoles = null;
    if (discordRolesText.trim()) {
      try {
        parsedRoles = JSON.parse(discordRolesText);
      } catch {
        setMessage(t('admin.invalidJson'));
        setSaving(false);
        return;
      }
    }

    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: settings.key || 'main',
        leaguesEnabled: settings.leaguesEnabled,
        sealedEnabled: settings.sealedEnabled,
        discordRoleIds: parsedRoles,
      }),
    });

    if (res.ok) {
      setMessage(t('admin.settingsSaved'));
    } else {
      setMessage(t('admin.errorSaving'));
    }
    setSaving(false);
  };

  const sectionStyle: React.CSSProperties = {
    padding: 20,
    borderRadius: 8,
    background: '#111119',
    border: '1px solid #1e2030',
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
            style={{ fontSize: 32, letterSpacing: '0.1em', color: '#fcee09', textShadow: '0 0 20px rgba(252,238,9,0.15)' }}
          >
            {t('admin.siteSettings')}
          </h1>
        </div>

        {loading ? (
          <div className="font-blender" style={{ color: '#7a8a9a', fontSize: 13, textAlign: 'center', padding: 48 }}>
            {t('common.loading')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Leagues Toggle */}
            <div style={sectionStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="font-blender" style={{ fontSize: 14, color: '#e0e8f0' }}>
                  {t('admin.leaguesEnabled')}
                </div>
                <button
                  style={{
                    width: 48, height: 26, borderRadius: 13, cursor: 'pointer',
                    transition: 'background 0.2s ease', border: 'none', position: 'relative', flexShrink: 0,
                    background: settings.leaguesEnabled ? '#00f0ff' : '#2a2a3a',
                  }}
                  onClick={() => setSettings((s) => ({ ...s, leaguesEnabled: !s.leaguesEnabled }))}
                >
                  <div
                    style={{
                      position: 'absolute', top: 3, width: 20, height: 20, borderRadius: 10,
                      background: '#ffffff', transition: 'left 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                      left: settings.leaguesEnabled ? 25 : 3,
                    }}
                  />
                </button>
              </div>
            </div>

            {/* Sealed Toggle */}
            <div style={sectionStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="font-blender" style={{ fontSize: 14, color: '#e0e8f0' }}>
                  {t('admin.sealedEnabled')}
                </div>
                <button
                  style={{
                    width: 48, height: 26, borderRadius: 13, cursor: 'pointer',
                    transition: 'background 0.2s ease', border: 'none', position: 'relative', flexShrink: 0,
                    background: settings.sealedEnabled ? '#00f0ff' : '#2a2a3a',
                  }}
                  onClick={() => setSettings((s) => ({ ...s, sealedEnabled: !s.sealedEnabled }))}
                >
                  <div
                    style={{
                      position: 'absolute', top: 3, width: 20, height: 20, borderRadius: 10,
                      background: '#ffffff', transition: 'left 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                      left: settings.sealedEnabled ? 25 : 3,
                    }}
                  />
                </button>
              </div>
            </div>

            {/* Discord Role IDs */}
            <div style={sectionStyle}>
              <div className="font-blender" style={{ fontSize: 14, color: '#e0e8f0', marginBottom: 12 }}>
                {t('admin.discordRoleIds')}
              </div>
              <textarea
                className="font-blender"
                value={discordRolesText}
                onChange={(e) => setDiscordRolesText(e.target.value)}
                placeholder='{"streetkid": "123...", "edgerunner": "456...", ...}'
                style={{
                  width: '100%', minHeight: 140, fontSize: 12, padding: 14, borderRadius: 6,
                  background: '#0a0a12', border: '1px solid #1e2030', color: '#e0e8f0',
                  resize: 'vertical', outline: 'none', fontFamily: 'monospace',
                }}
              />
            </div>

            {/* Save Button */}
            <button
              className="font-blender"
              onClick={save}
              style={{
                fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.15em',
                padding: '14px 0', borderRadius: 6, cursor: 'pointer',
                background: 'linear-gradient(135deg, rgba(0,240,255,0.08), rgba(0,240,255,0.02))',
                border: '1px solid #00f0ff', color: '#00f0ff', transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,240,255,0.12)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(0,240,255,0.15)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0,240,255,0.08), rgba(0,240,255,0.02))'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              {saving ? t('admin.saving') : t('admin.saveSettings')}
            </button>

            {message && (
              <div
                className="font-blender"
                style={{ fontSize: 12, textAlign: 'center', color: message === t('admin.settingsSaved') ? '#22c55e' : '#ff003c' }}
              >
                {message}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
