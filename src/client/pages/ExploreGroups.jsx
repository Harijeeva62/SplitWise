import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function ExploreGroups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchGroups = () => {
    api.get('/groups/all')
      .then((res) => setGroups(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleJoinRequest = async (groupId) => {
    setActionLoading(groupId);
    try {
      await api.post(`/groups/${groupId}/join`);
      fetchGroups();
    } catch {
    } finally {
      setActionLoading(null);
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
      <div>
        <h2 className="section-label text-xs">Explore Groups</h2>
        <p className="text-[11px] mt-1" style={{ color: 'var(--text-dim)' }}>Discover and join groups</p>
      </div>

      {groups.length === 0 ? (
        <div className="card p-10 text-center animate-fade-in-up">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--bg-elevated)' }}>
            <svg className="w-8 h-8" style={{ color: 'var(--text-dim)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>No groups available yet</p>
        </div>
      ) : (
        <div className="space-y-2.5 stagger">
          {groups.map((group) => (
            <div key={group.id} className="card p-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <div className="avatar w-10 h-10 rounded-xl text-white font-bold text-sm flex-shrink-0">
                    {group.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    {group.is_member ? (
                      <Link to={`/groups/${group.id}`} className="font-semibold text-sm truncate block transition-colors" style={{ color: 'var(--text-primary)' }}>
                        {group.name}
                      </Link>
                    ) : (
                      <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{group.name}</p>
                    )}
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-dim)' }}>
                      by {group.creator_name} · {group.member_count} member{group.member_count !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                <div className="ml-3 flex-shrink-0">
                  {group.is_member ? (
                    <Link to={`/groups/${group.id}`} className="badge-accent text-xs font-semibold">Open</Link>
                  ) : group.join_status === 'pending' ? (
                    <span className="badge-warning text-xs font-semibold">Pending</span>
                  ) : (
                    <button
                      onClick={() => handleJoinRequest(group.id)}
                      disabled={actionLoading === group.id}
                      className="btn-primary text-xs px-4 py-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      {actionLoading === group.id ? '...' : 'Join'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
