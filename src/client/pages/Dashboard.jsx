import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/expenses/dashboard/me')
      .then((res) => setData(res.data))
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

  const bal = data?.total_balance || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Balance Card — hero gradient */}
      <div className="card-hero p-7 animate-fade-in-up">
        <div className="flex items-center gap-3 mb-6 relative z-10">
          <div className="avatar w-11 h-11 rounded-xl animate-pulse-glow">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" /></svg>
          </div>
          <p className="text-sm font-semibold tracking-wide relative z-10" style={{ color: 'var(--text-secondary)' }}>Your Balance</p>
        </div>
        <p className="text-4xl font-extrabold tracking-tight relative z-10" style={{ color: bal >= 0 ? 'var(--success)' : 'var(--danger)' }}>
          {bal >= 0 ? '+' : ''}₹{bal.toFixed(2)}
        </p>
        <div className="divider my-5" />
        <div className="flex justify-between relative z-10">
          <div>
            <p className="section-label mb-1">You paid</p>
            <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>₹{data?.total_paid?.toFixed(2) || '0.00'}</p>
          </div>
          <div className="text-right">
            <p className="section-label mb-1">Your share</p>
            <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>₹{data?.total_owed?.toFixed(2) || '0.00'}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3.5 stagger">
        <Link to="/groups" className="card p-5 text-center hover:-translate-y-1 transition-all duration-300 group">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto avatar" style={{ boxShadow: '0 4px 16px rgba(99,102,241,0.2)' }}>
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </div>
          <p className="text-sm font-semibold mt-3" style={{ color: 'var(--text-primary)' }}>My Groups</p>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-dim)' }}>View &amp; manage</p>
        </Link>
        <Link to="/explore" className="card p-5 text-center hover:-translate-y-1 transition-all duration-300 group">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.45), rgba(168,85,247,0.35))', boxShadow: '0 4px 16px rgba(139,92,246,0.2)' }}>
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <p className="text-sm font-semibold mt-3" style={{ color: 'var(--text-primary)' }}>Explore</p>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-dim)' }}>Find groups</p>
        </Link>
      </div>

      {/* Recent Expenses */}
      <div>
        <h2 className="section-label text-xs mb-3">Recent Expenses</h2>
        {data?.recent_expenses?.length === 0 ? (
          <div className="card p-10 text-center animate-fade-in-up">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--bg-elevated)' }}>
              <svg className="w-8 h-8" style={{ color: 'var(--text-dim)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.3} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>No expenses yet</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Create a group and start splitting!</p>
          </div>
        ) : (
          <div className="space-y-2.5 stagger">
            {data?.recent_expenses?.map((exp) => (
              <div key={exp.id} className="card p-4 flex justify-between items-center">
                <div className="flex items-center gap-3.5">
                  <div className="avatar w-10 h-10 rounded-xl flex-shrink-0">
                    <svg className="w-[18px] h-[18px] text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{exp.title}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-dim)' }}>{exp.group_name}</p>
                  </div>
                </div>
                <p className="font-bold text-base tabular-nums" style={{ color: 'var(--text-primary)' }}>₹{parseFloat(exp.amount).toFixed(2)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
