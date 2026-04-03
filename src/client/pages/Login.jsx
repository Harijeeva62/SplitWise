import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5 relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Ambient blobs */}
      <div className="fixed top-[-15%] right-[-10%] w-[420px] h-[420px] rounded-full blur-[100px] pointer-events-none animate-blob" style={{ background: 'rgba(99,102,241,0.08)' }} />
      <div className="fixed bottom-[-15%] left-[-10%] w-[350px] h-[350px] rounded-full blur-[100px] pointer-events-none animate-blob" style={{ background: 'rgba(139,92,246,0.06)', animationDelay: '2s' }} />

      <div className="card p-8 w-full max-w-[420px] animate-scale-in relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 animate-float avatar" style={{ boxShadow: '0 4px 24px rgba(99,102,241,0.3)' }}>
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>Welcome back</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>Sign in to your SplitApp account</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl mb-5 text-sm animate-slide-down flex items-center gap-2" style={{ background: 'var(--danger-muted)', border: '1px solid rgba(251,113,133,0.15)', color: 'var(--danger)' }}>
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" /></svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="section-label block mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-dark w-full px-4 py-3.5 text-sm"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="section-label block mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-dark w-full px-4 py-3.5 text-sm"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3.5 text-sm disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </span>
            ) : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm mt-7" style={{ color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold transition-colors" style={{ color: 'var(--accent-bright)' }}>
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
