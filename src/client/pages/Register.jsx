import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(name, email, password);
    } catch (err) {
      const msg = err.response?.data?.errors
        ? err.response.data.errors.join(' ')
        : err.response?.data?.error || 'Registration failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5 relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <div className="fixed top-[-15%] left-[-10%] w-[420px] h-[420px] rounded-full blur-[100px] pointer-events-none animate-blob" style={{ background: 'rgba(139,92,246,0.08)' }} />
      <div className="fixed bottom-[-15%] right-[-10%] w-[350px] h-[350px] rounded-full blur-[100px] pointer-events-none animate-blob" style={{ background: 'rgba(99,102,241,0.06)', animationDelay: '3s' }} />

      <div className="card p-8 w-full max-w-[420px] animate-scale-in relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 animate-float avatar" style={{ boxShadow: '0 4px 24px rgba(99,102,241,0.3)' }}>
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>Create account</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>Start splitting expenses in seconds</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl mb-5 text-sm animate-slide-down flex items-center gap-2" style={{ background: 'var(--danger-muted)', border: '1px solid rgba(251,113,133,0.15)', color: 'var(--danger)' }}>
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" /></svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="section-label block mb-2">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-dark w-full px-4 py-3.5 text-sm" placeholder="Your name" required />
          </div>
          <div>
            <label className="section-label block mb-2">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-dark w-full px-4 py-3.5 text-sm" placeholder="you@example.com" required />
          </div>
          <div>
            <label className="section-label block mb-2">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-dark w-full px-4 py-3.5 text-sm" placeholder="Min 6 characters" required minLength={6} />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-sm disabled:opacity-50 cursor-pointer">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating account...
              </span>
            ) : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm mt-7" style={{ color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold transition-colors" style={{ color: 'var(--accent-bright)' }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
}
