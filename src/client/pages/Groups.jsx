import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchGroups = () => {
    api.get('/groups')
      .then((res) => setGroups(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await api.post('/groups', { name: newName.trim() });
      setNewName('');
      setShowCreate(false);
      setLoading(true);
      fetchGroups();
    } catch {
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--bg-elevated)', borderTopColor: 'var(--accent)' }} />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="section-label text-xs">My Groups</h2>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
            showCreate ? 'btn-ghost' : 'btn-primary'
          }`}
        >
          {showCreate ? 'Cancel' : '+ New Group'}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="card p-5 animate-slide-down">
          <label className="section-label block mb-2">Trip / Group Name</label>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="input-dark w-full px-4 py-3.5 text-sm mb-3"
            placeholder="e.g. Goa Trip 2026"
            required
          />
          <button type="submit" disabled={creating} className="btn-primary w-full py-3 text-sm disabled:opacity-50 cursor-pointer">
            {creating ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating...
              </span>
            ) : 'Create Group'}
          </button>
        </form>
      )}

      {groups.length === 0 ? (
        <div className="card p-10 text-center animate-fade-in-up">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--bg-elevated)' }}>
            <svg className="w-8 h-8" style={{ color: 'var(--text-dim)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.3} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>No groups yet</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Create one to start splitting!</p>
        </div>
      ) : (
        <div className="space-y-2.5 stagger">
          {groups.map((group) => (
            <Link
              key={group.id}
              to={`/groups/${group.id}`}
              className="card block p-4 hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3.5">
                  <div className="avatar w-11 h-11 rounded-xl text-white font-bold text-sm flex-shrink-0">
                    {group.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{group.name}</h3>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-dim)' }}>
                      {group.member_count} member{group.member_count !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <svg className="w-4.5 h-4.5" style={{ color: 'var(--text-dim)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
