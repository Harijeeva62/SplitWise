import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function GroupDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('expenses');

  // Add member
  const [memberSearch, setMemberSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [addingMember, setAddingMember] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Add expense
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expPaidBy, setExpPaidBy] = useState('');
  const [expSplitBetween, setExpSplitBetween] = useState([]);
  const [addingExpense, setAddingExpense] = useState(false);

  // Join requests (admin)
  const [joinRequests, setJoinRequests] = useState([]);
  const [handlingRequest, setHandlingRequest] = useState(null);

  const isAdmin = group?.created_by === user?.id;

  const fetchAll = async () => {
    try {
      const [gRes, eRes, bRes, sRes] = await Promise.all([
        api.get(`/groups/${id}`),
        api.get(`/expenses/${id}`),
        api.get(`/expenses/${id}/balances`),
        api.get(`/settle/${id}`),
      ]);
      setGroup(gRes.data);
      setExpenses(eRes.data);
      setBalances(bRes.data);
      setSettlements(sRes.data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const fetchJoinRequests = async () => {
    try {
      const res = await api.get(`/groups/${id}/join-requests`);
      setJoinRequests(res.data);
    } catch {}
  };

  useEffect(() => {
    fetchAll();
  }, [id]);

  useEffect(() => {
    if (isAdmin) fetchJoinRequests();
  }, [isAdmin, id]);

  const handleSearchUsers = async (query) => {
    setMemberSearch(query);
    setSelectedUser(null);
    if (query.trim().length < 1) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    try {
      const res = await api.get(`/groups/search-users?q=${encodeURIComponent(query.trim())}`);
      const existingIds = group?.members?.map((m) => m.id) || [];
      setSearchResults(res.data.filter((u) => !existingIds.includes(u.id)));
      setShowDropdown(true);
    } catch {
      setSearchResults([]);
    }
  };

  const handleSelectUser = (u) => {
    setSelectedUser(u);
    setMemberSearch(u.name);
    setShowDropdown(false);
    setSearchResults([]);
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setAddingMember(true);
    try {
      await api.post(`/groups/${id}/members`, { email: selectedUser.email });
      setMemberSearch('');
      setSelectedUser(null);
      setSearchResults([]);
      fetchAll();
    } catch {
    } finally {
      setAddingMember(false);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    setAddingExpense(true);
    try {
      await api.post('/expenses', {
        group_id: id,
        title: expTitle,
        amount: parseFloat(expAmount),
        paid_by: expPaidBy || user.id,
        split_between: expSplitBetween.length > 0 ? expSplitBetween : group.members.map((m) => m.id),
      });
      setExpTitle('');
      setExpAmount('');
      setExpPaidBy('');
      setExpSplitBetween([]);
      setShowAddExpense(false);
      fetchAll();
    } catch {
    } finally {
      setAddingExpense(false);
    }
  };

  const handleSettle = async (fromUser, toUser, amount) => {
    try {
      await api.post('/settle', { group_id: id, from_user: fromUser, to_user: toUser, amount });
      fetchAll();
    } catch {}
  };

  const handleMarkComplete = async (settlementId) => {
    try {
      await api.patch(`/settle/${settlementId}/complete`);
      fetchAll();
    } catch {}
  };

  const handleJoinAction = async (requestId, action) => {
    setHandlingRequest(requestId);
    try {
      await api.post(`/groups/${id}/join-requests/${requestId}`, { action });
      fetchJoinRequests();
      if (action === 'accept') fetchAll();
    } catch {} finally {
      setHandlingRequest(null);
    }
  };

  const toggleSplitUser = (userId) => {
    setExpSplitBetween((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--bg-elevated)', borderTopColor: 'var(--accent)' }} />
      </div>
    );
  }

  if (!group) {
    return <p className="text-center py-10" style={{ color: 'var(--text-muted)' }}>Group not found.</p>;
  }

  // Calculate simplified debts from balances
  const debts = [];
  const debtors = balances.filter((b) => b.balance < 0).map((b) => ({ ...b, amount: -b.balance }));
  const creditors = balances.filter((b) => b.balance > 0).map((b) => ({ ...b, amount: b.balance }));

  let i = 0,
    j = 0;
  const d = debtors.map((x) => ({ ...x }));
  const c = creditors.map((x) => ({ ...x }));
  while (i < d.length && j < c.length) {
    const min = Math.min(d[i].amount, c[j].amount);
    if (min > 0.01) {
      debts.push({
        from: d[i].user,
        to: c[j].user,
        amount: parseFloat(min.toFixed(2)),
      });
    }
    d[i].amount -= min;
    c[j].amount -= min;
    if (d[i].amount < 0.01) i++;
    if (c[j].amount < 0.01) j++;
  }

  const tabs = [
    { key: 'expenses', label: 'Expenses', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg> },
    { key: 'balances', label: 'Balances', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg> },
    { key: 'settle', label: 'Settle', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { key: 'members', label: 'Members', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg> },
  ];

  const pendingCount = joinRequests.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Group Header — Hero Card */}
      <div className="card-hero p-6 animate-fade-in-up">
        <div className="flex items-center gap-3.5 relative z-10">
          <div className="avatar w-13 h-13 rounded-xl text-xl font-bold">
            {group.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>{group.name}</h2>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-dim)' }}>
              {group.members?.length || 0} members{isAdmin && <span className="badge-accent ml-2 text-[10px]">Admin</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-2xl p-1.5" style={{ background: 'var(--bg-elevated)' }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer`}
            style={tab === t.key
              ? { background: 'var(--bg-card)', color: 'var(--accent-bright)', boxShadow: '0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)' }
              : { color: 'var(--text-dim)' }}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
            {t.key === 'members' && isAdmin && pendingCount > 0 && (
              <span className="badge-danger text-[9px] px-1.5 py-0.5 ml-0.5">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Expenses Tab */}
      {tab === 'expenses' && (
        <div className="space-y-3">
          <button
            onClick={() => setShowAddExpense(!showAddExpense)}
            className={`w-full py-3 rounded-2xl font-semibold text-sm transition-all duration-200 cursor-pointer ${
              showAddExpense ? 'btn-ghost' : 'btn-primary'
            }`}
          >
            {showAddExpense ? 'Cancel' : '+ Add Expense'}
          </button>

          {showAddExpense && (
            <form onSubmit={handleAddExpense} className="card p-5 space-y-3.5 animate-slide-down">
              <div>
                <label className="section-label block mb-2">Title</label>
                <input
                  type="text"
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  placeholder="Expense title"
                  className="input-dark w-full px-4 py-3 text-sm"
                  required
                />
              </div>
              <div>
                <label className="section-label block mb-2">Amount</label>
                <input
                  type="number"
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
                  placeholder="Amount (₹)"
                  className="input-dark w-full px-4 py-3 text-sm"
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label className="section-label block mb-2">Paid by</label>
                <select
                  value={expPaidBy}
                  onChange={(e) => setExpPaidBy(e.target.value)}
                  className="input-dark w-full px-4 py-3 text-sm"
                >
                  <option value="">You</option>
                  {group.members?.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="section-label block mb-2">Split between</label>
                <div className="space-y-1.5">
                  {group.members?.map((m) => (
                    <label key={m.id} className="flex items-center gap-3 text-sm p-2.5 rounded-xl cursor-pointer transition-colors" style={{ color: 'var(--text-secondary)' }}
                      onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-elevated)'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <input
                        type="checkbox"
                        checked={
                          expSplitBetween.length === 0 || expSplitBetween.includes(m.id)
                        }
                        onChange={() => {
                          if (expSplitBetween.length === 0) {
                            setExpSplitBetween(
                              group.members.filter((x) => x.id !== m.id).map((x) => x.id)
                            );
                          } else {
                            toggleSplitUser(m.id);
                          }
                        }}
                        className="w-4 h-4 rounded"
                        style={{ accentColor: 'var(--accent)' }}
                      />
                      {m.name}
                    </label>
                  ))}
                </div>
              </div>
              <button
                type="submit"
                disabled={addingExpense}
                className="btn-primary w-full py-3 disabled:opacity-50 cursor-pointer"
              >
                {addingExpense ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Adding...
                  </span>
                ) : 'Add Expense'}
              </button>
            </form>
          )}

          {expenses.length === 0 ? (
            <div className="card p-10 text-center animate-fade-in-up">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--bg-elevated)' }}>
                <svg className="w-7 h-7" style={{ color: 'var(--text-dim)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>No expenses yet</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Tap + Add Expense to get started</p>
            </div>
          ) : (
            <div className="space-y-2.5 stagger">
              {expenses.map((exp) => (
                <div key={exp.id} className="card p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3.5">
                      <div className="avatar w-10 h-10 rounded-xl flex-shrink-0 mt-0.5">
                        <svg className="w-[18px] h-[18px] text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
                      </div>
                      <div>
                        <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{exp.title}</p>
                        <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-dim)' }}>
                          Paid by {exp.payer?.name || 'Unknown'}
                        </p>
                      </div>
                    </div>
                    <p className="font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>₹{parseFloat(exp.amount).toFixed(2)}</p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {exp.splits?.map((s) => (
                      <span key={s.user_id} className="badge text-[11px]">
                        {s.user_name}: ₹{parseFloat(s.amount).toFixed(2)}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Balances Tab */}
      {tab === 'balances' && (
        <div className="space-y-2.5 stagger">
          {balances.length === 0 ? (
            <div className="card p-10 text-center animate-fade-in-up">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No balances to show.</p>
            </div>
          ) : (
            balances.map((b) => (
              <div key={b.user.id} className="card p-4 flex justify-between items-center">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{
                      background: b.balance > 0
                        ? 'linear-gradient(135deg, rgba(52,211,153,0.5), rgba(16,185,129,0.4))'
                        : b.balance < 0
                          ? 'linear-gradient(135deg, rgba(251,113,133,0.5), rgba(239,68,68,0.4))'
                          : 'var(--bg-elevated)',
                      boxShadow: b.balance > 0
                        ? '0 4px 12px rgba(52,211,153,0.15)'
                        : b.balance < 0
                          ? '0 4px 12px rgba(251,113,133,0.15)'
                          : 'none'
                    }}>
                    {b.user.name.charAt(0).toUpperCase()}
                  </div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{b.user.name}</p>
                </div>
                <p className="font-bold tabular-nums" style={{
                  color: b.balance > 0 ? 'var(--success)' : b.balance < 0 ? 'var(--danger)' : 'var(--text-muted)'
                }}>
                  {b.balance > 0 ? '+' : ''}₹{b.balance.toFixed(2)}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Settle Tab */}
      {tab === 'settle' && (
        <div className="space-y-3">
          <h3 className="section-label text-xs">Who owes whom</h3>
          {debts.length === 0 ? (
            <div className="card p-10 text-center animate-fade-in-up">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--success-muted)' }}>
                <svg className="w-7 h-7" style={{ color: 'var(--success)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>All settled up!</p>
            </div>
          ) : (
            <div className="space-y-2.5 stagger">
              {debts.map((dt, idx) => (
                <div key={idx} className="card p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{dt.from.name}</span>
                        <span className="mx-2" style={{ color: 'var(--text-dim)' }}>→</span>
                        <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{dt.to.name}</span>
                      </p>
                      <p className="text-lg font-bold mt-0.5" style={{ color: 'var(--danger)' }}>₹{dt.amount.toFixed(2)}</p>
                    </div>
                    <button
                      onClick={() => handleSettle(dt.from.id, dt.to.id, dt.amount)}
                      className="btn-primary px-4 py-2 text-xs cursor-pointer"
                    >
                      Settle Up
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pending Settlements */}
          {settlements.filter((s) => !s.completed).length > 0 && (
            <>
              <h3 className="section-label text-xs mt-4">Pending</h3>
              <div className="space-y-2.5 stagger">
                {settlements
                  .filter((s) => !s.completed)
                  .map((s) => (
                    <div key={s.id} className="rounded-2xl p-4" style={{ background: 'var(--warning-muted)', border: '1px solid rgba(251,191,36,0.12)' }}>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {s.from_user_name} <span style={{ color: 'var(--text-dim)' }}>→</span> {s.to_user_name}
                          </p>
                          <p className="font-bold" style={{ color: 'var(--warning)' }}>₹{parseFloat(s.amount).toFixed(2)}</p>
                        </div>
                        <button
                          onClick={() => handleMarkComplete(s.id)}
                          className="btn-primary px-4 py-2 text-xs cursor-pointer"
                        >
                          Mark Paid
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </>
          )}

          {/* Completed */}
          {settlements.filter((s) => s.completed).length > 0 && (
            <>
              <h3 className="section-label text-xs mt-4">Completed</h3>
              <div className="space-y-2">
                {settlements
                  .filter((s) => s.completed)
                  .map((s) => (
                    <div key={s.id} className="rounded-2xl p-4 opacity-60" style={{ background: 'var(--success-muted)', border: '1px solid rgba(52,211,153,0.1)' }}>
                      <div className="flex items-center gap-2.5">
                        <svg className="w-4 h-4" style={{ color: 'var(--success)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {s.from_user_name} → {s.to_user_name} — ₹{parseFloat(s.amount).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Members Tab */}
      {tab === 'members' && (
        <div className="space-y-4">
          {/* Join Request Admin Panel */}
          {isAdmin && joinRequests.filter(r => r.status === 'pending').length > 0 && (
            <div className="animate-slide-down">
              <h3 className="section-label text-xs mb-2.5">Join Requests</h3>
              <div className="space-y-2.5 stagger">
                {joinRequests.filter(r => r.status === 'pending').map((req) => (
                  <div key={req.id} className="rounded-2xl p-4 flex justify-between items-center" style={{ background: 'var(--warning-muted)', border: '1px solid rgba(251,191,36,0.12)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm" style={{ background: 'rgba(251,191,36,0.15)', color: 'var(--warning)' }}>
                        {req.user_name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{req.user_name}</p>
                        <p className="text-[11px]" style={{ color: 'var(--text-dim)' }}>{req.user_email}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleJoinAction(req.id, 'accept')}
                        disabled={handlingRequest === req.id}
                        className="btn-primary px-3 py-1.5 text-xs disabled:opacity-50 cursor-pointer"
                      >
                        {handlingRequest === req.id ? '...' : 'Accept'}
                      </button>
                      <button
                        onClick={() => handleJoinAction(req.id, 'reject')}
                        disabled={handlingRequest === req.id}
                        className="btn-ghost px-3 py-1.5 text-xs disabled:opacity-50 cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search and add member */}
          {isAdmin && (
            <form onSubmit={handleAddMember} className="relative">
              <h3 className="section-label text-xs mb-2.5">Add Member</h3>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={(e) => handleSearchUsers(e.target.value)}
                    onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                    placeholder="Search by name or email..."
                    className="input-dark w-full px-4 py-3 text-sm"
                  />
                  {showDropdown && searchResults.length > 0 && (
                    <div className="absolute z-10 top-full left-0 right-0 mt-1 rounded-xl max-h-48 overflow-y-auto animate-slide-down" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', backdropFilter: 'blur(16px)', boxShadow: '0 12px 32px rgba(0,0,0,0.4)' }}>
                      {searchResults.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onMouseDown={() => handleSelectUser(u)}
                          className="w-full text-left px-4 py-3 transition flex items-center gap-3 cursor-pointer"
                          style={{ borderBottom: '1px solid var(--border)' }}
                          onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-elevated)'}
                          onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[11px]" style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--accent-bright)' }}>
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{u.name}</p>
                            <p className="text-[11px]" style={{ color: 'var(--text-dim)' }}>{u.email}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {showDropdown && memberSearch.trim().length > 0 && searchResults.length === 0 && (
                    <div className="absolute z-10 top-full left-0 right-0 mt-1 rounded-xl p-3 animate-slide-down" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                      <p className="text-sm text-center" style={{ color: 'var(--text-muted)' }}>No users found</p>
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={addingMember || !selectedUser}
                  className="btn-primary px-5 py-3 text-sm disabled:opacity-50 cursor-pointer"
                >
                  {addingMember ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                  ) : 'Add'}
                </button>
              </div>
            </form>
          )}

          {/* Member list */}
          <div>
            <h3 className="section-label text-xs mb-2.5">Members</h3>
            <div className="space-y-2.5 stagger">
              {group.members?.map((m) => (
                <div key={m.id} className="card p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3.5">
                    <div className="avatar w-10 h-10 rounded-xl text-white font-bold text-sm flex-shrink-0">
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{m.name}</p>
                      <p className="text-[11px]" style={{ color: 'var(--text-dim)' }}>{m.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    {m.id === group.created_by && (
                      <span className="badge-accent text-[10px]">Admin</span>
                    )}
                    {m.id === user.id && (
                      <span className="badge-success text-[10px]">You</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
