'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import CyberBackground from '@/components/CyberBackground';
import { Link } from '@/lib/i18n/navigation';

export default function FriendsPage() {
  const [friends, setFriends] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [tab, setTab] = useState<'friends' | 'requests'>('friends');

  useEffect(() => {
    fetch('/api/friends').then((r) => r.json()).then((d) => setFriends(d.friends || [])).catch(() => {});
    fetch('/api/friends/requests').then((r) => r.json()).then((d) => setRequests(d.requests || [])).catch(() => {});
  }, []);

  const searchUsers = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    const res = await fetch(`/api/users/search?q=${q}`);
    const data = await res.json();
    setSearchResults(data.users || []);
  };

  const tabLabels: Record<string, string> = {
    friends: 'Friends',
    requests: 'Requests',
  };

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: '#0a0a12' }}>
      <CyberBackground />

      <div
        className="relative z-10 flex flex-col min-h-screen"
        style={{ padding: '32px 24px', maxWidth: 680, width: '100%', margin: '0 auto' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
          <Link href="/">
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
            style={{
              fontSize: 32,
              letterSpacing: '0.1em',
              color: '#00f0ff',
              textShadow: '0 0 20px rgba(0,240,255,0.15)',
            }}
          >
            FRIENDS
          </h1>
        </div>

        {/* Search */}
        <input
          className="font-blender"
          style={{
            width: '100%',
            height: 44,
            paddingLeft: 18,
            paddingRight: 18,
            fontSize: 13,
            background: '#111119',
            border: '1px solid #1e2030',
            borderRadius: 6,
            color: '#e0e8f0',
            outline: 'none',
            marginBottom: 16,
            transition: 'border-color 0.2s ease',
          }}
          placeholder="Search users to add..."
          value={searchQuery}
          onChange={(e) => searchUsers(e.target.value)}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#00f0ff40'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = '#1e2030'; }}
        />

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div
            style={{
              marginBottom: 16,
              borderRadius: 8,
              overflow: 'hidden',
              background: '#111119',
              border: '1px solid #1e2030',
            }}
          >
            {searchResults.map((user: any) => (
              <div
                key={user.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 18px',
                  borderBottom: '1px solid #0a0a12',
                }}
              >
                <span className="font-blender" style={{ fontSize: 13, color: '#e0e8f0' }}>{user.username}</span>
                <button
                  className="font-blender"
                  style={{
                    fontSize: 11,
                    padding: '5px 14px',
                    borderRadius: 4,
                    cursor: 'pointer',
                    border: '1px solid #00f0ff',
                    color: '#00f0ff',
                    background: 'transparent',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={async () => {
                    await fetch('/api/friends/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ receiverId: user.id }) });
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,240,255,0.08)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  Add Friend
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {(['friends', 'requests'] as const).map((tabKey) => (
            <button
              key={tabKey}
              className="font-blender"
              style={{
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                padding: '9px 20px',
                borderRadius: 6,
                cursor: 'pointer',
                background: tab === tabKey ? '#1a1a25' : '#111119',
                border: `1px solid ${tab === tabKey ? '#00f0ff' : '#1e2030'}`,
                color: tab === tabKey ? '#00f0ff' : '#7a8a9a',
                transition: 'all 0.2s ease',
              }}
              onClick={() => setTab(tabKey)}
            >
              {tabLabels[tabKey]} {tabKey === 'requests' && requests.length > 0 ? `(${requests.length})` : ''}
            </button>
          ))}
        </div>

        {/* List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tab === 'friends' && friends.map((f: any, i: number) => (
            <motion.div
              key={f.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderRadius: 8,
                background: '#111119',
                border: '1px solid #1e2030',
              }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <span className="font-blender" style={{ fontSize: 13, color: '#e0e8f0' }}>{f.username}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="font-blender"
                  style={{
                    fontSize: 11,
                    padding: '5px 14px',
                    borderRadius: 4,
                    cursor: 'pointer',
                    border: '1px solid #22c55e',
                    color: '#22c55e',
                    background: 'transparent',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(34,197,94,0.08)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  Invite
                </button>
                <button
                  className="font-blender"
                  style={{
                    fontSize: 11,
                    padding: '5px 14px',
                    borderRadius: 4,
                    cursor: 'pointer',
                    border: '1px solid rgba(255,0,60,0.25)',
                    color: 'rgba(255,0,60,0.6)',
                    background: 'transparent',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={async () => {
                    await fetch(`/api/friends/${f.friendshipId}`, { method: 'DELETE' });
                    setFriends(friends.filter((x: any) => x.friendshipId !== f.friendshipId));
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,0,60,0.06)'; e.currentTarget.style.color = '#ff003c'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,0,60,0.6)'; }}
                >
                  Remove
                </button>
              </div>
            </motion.div>
          ))}

          {tab === 'requests' && requests.map((r: any, i: number) => (
            <motion.div
              key={r.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderRadius: 8,
                background: '#111119',
                border: '1px solid #1e2030',
              }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <span className="font-blender" style={{ fontSize: 13, color: '#e0e8f0' }}>{r.senderUsername}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="font-blender"
                  style={{
                    fontSize: 11,
                    padding: '5px 14px',
                    borderRadius: 4,
                    cursor: 'pointer',
                    border: '1px solid #22c55e',
                    color: '#22c55e',
                    background: 'transparent',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={async () => {
                    await fetch('/api/friends/accept', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ friendshipId: r.id }) });
                    setRequests(requests.filter((x: any) => x.id !== r.id));
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(34,197,94,0.08)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  Accept
                </button>
                <button
                  className="font-blender"
                  style={{
                    fontSize: 11,
                    padding: '5px 14px',
                    borderRadius: 4,
                    cursor: 'pointer',
                    border: '1px solid rgba(255,0,60,0.25)',
                    color: '#ff003c',
                    background: 'transparent',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={async () => {
                    await fetch('/api/friends/decline', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ friendshipId: r.id }) });
                    setRequests(requests.filter((x: any) => x.id !== r.id));
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,0,60,0.06)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  Decline
                </button>
              </div>
            </motion.div>
          ))}

          {((tab === 'friends' && friends.length === 0) || (tab === 'requests' && requests.length === 0)) && (
            <div
              className="font-blender"
              style={{ fontSize: 13, textAlign: 'center', padding: '48px 0', color: '#3a3a4a' }}
            >
              {tab === 'friends' ? 'No friends yet. Search and add some!' : 'No pending requests.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
