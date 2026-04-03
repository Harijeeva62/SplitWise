import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function Profile() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/auth/profile')
      .then((res) => setProfile(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--bg-elevated)', borderTopColor: 'var(--accent)' }} />
      </div>
    );
  }

  const displayName = profile?.name || user?.name || '';
  const initials = displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Profile Card */}
      <div className="card-hero p-8 text-center animate-scale-in">
        <div className="avatar w-20 h-20 rounded-2xl mx-auto mb-5 animate-pulse-glow" style={{ fontSize: '1.5rem', boxShadow: '0 8px 32px rgba(99,102,241,0.25)' }}>
          <span className="text-2xl font-bold text-white">{initials}</span>
        </div>
        <h2 className="text-xl font-extrabold tracking-tight relative z-10" style={{ color: 'var(--text-primary)' }}>{displayName}</h2>
        <p className="text-sm mt-1 relative z-10" style={{ color: 'var(--text-dim)' }}>{profile?.email || user?.email}</p>
        <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg relative z-10" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}>
          <svg className="w-3.5 h-3.5" style={{ color: 'var(--text-dim)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          <p className="text-[11px]" style={{ color: 'var(--text-dim)' }}>
            Member since {new Date(profile?.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* App Info */}
      <div className="card p-5">
        <div className="flex items-center gap-3.5 mb-3">
          <div className="avatar w-10 h-10 rounded-xl">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>SplitApp</p>
            <p className="text-[11px]" style={{ color: 'var(--text-dim)' }}>Version 1.0.0</p>
          </div>
        </div>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>Split expenses easily with friends and groups. Track balances, settle debts, and keep everything organized.</p>
      </div>

      {/* Sign Out */}
      <button
        onClick={logout}
        className="w-full py-3.5 rounded-2xl font-semibold transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2.5 cursor-pointer"
        style={{ background: 'var(--danger-muted)', border: '1px solid rgba(251,113,133,0.12)', color: 'var(--danger)' }}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
        Sign Out
      </button>
    </div>
  );
}
