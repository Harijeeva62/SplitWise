const supabase = require('../config/supabase');

exports.addExpense = async (req, res) => {
  try {
    const { group_id, title, amount, paid_by, split_between } = req.body;

    // Verify user is in the group
    const { data: membership } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', group_id)
      .eq('user_id', req.user.id)
      .single();

    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this group.' });
    }

    // Create expense
    const { data: expense, error } = await supabase
      .from('expenses')
      .insert({ group_id, title, amount, paid_by })
      .select()
      .single();

    if (error) throw error;

    // Equal split
    const splitAmount = parseFloat((amount / split_between.length).toFixed(2));
    const splits = split_between.map(userId => ({
      expense_id: expense.id,
      user_id: userId,
      amount: splitAmount,
    }));

    const { error: splitError } = await supabase.from('expense_splits').insert(splits);
    if (splitError) throw splitError;

    res.status(201).json({ expense, splits });
  } catch (err) {
    console.error('Add expense error:', err);
    res.status(500).json({ error: 'Failed to add expense.' });
  }
};

exports.getExpensesByGroup = async (req, res) => {
  try {
    const { groupId } = req.params;

    // Verify membership
    const { data: membership } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', req.user.id)
      .single();

    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this group.' });
    }

    const { data: expenses, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Enrich with payer info and splits
    const enriched = await Promise.all(
      expenses.map(async (exp) => {
        const { data: payer } = await supabase
          .from('users')
          .select('id, name, email')
          .eq('id', exp.paid_by)
          .single();

        const { data: splits } = await supabase
          .from('expense_splits')
          .select('user_id, amount')
          .eq('expense_id', exp.id);

        // Get user names for splits
        const splitUserIds = splits.map(s => s.user_id);
        const { data: splitUsers } = await supabase
          .from('users')
          .select('id, name')
          .in('id', splitUserIds);

        const userMap = {};
        if (splitUsers) splitUsers.forEach(u => { userMap[u.id] = u.name; });

        const enrichedSplits = splits.map(s => ({
          ...s,
          user_name: userMap[s.user_id] || 'Unknown',
        }));

        return { ...exp, payer, splits: enrichedSplits };
      })
    );

    res.json(enriched);
  } catch (err) {
    console.error('Get expenses error:', err);
    res.status(500).json({ error: 'Failed to fetch expenses.' });
  }
};

exports.getBalances = async (req, res) => {
  try {
    const { groupId } = req.params;

    // Get all expenses in group
    const { data: expenses } = await supabase
      .from('expenses')
      .select('id, amount, paid_by')
      .eq('group_id', groupId);

    if (!expenses || expenses.length === 0) {
      return res.json([]);
    }

    // Get all splits for these expenses
    const expenseIds = expenses.map(e => e.id);
    const { data: splits } = await supabase
      .from('expense_splits')
      .select('expense_id, user_id, amount')
      .in('expense_id', expenseIds);

    // Get settled amounts
    const { data: settlements } = await supabase
      .from('settlements')
      .select('from_user, to_user, amount, completed')
      .eq('group_id', groupId)
      .eq('completed', true);

    // Calculate net balances
    const balances = {};

    expenses.forEach(exp => {
      if (!balances[exp.paid_by]) balances[exp.paid_by] = 0;
      balances[exp.paid_by] += parseFloat(exp.amount);
    });

    splits.forEach(split => {
      if (!balances[split.user_id]) balances[split.user_id] = 0;
      balances[split.user_id] -= parseFloat(split.amount);
    });

    // Apply settlements
    if (settlements) {
      settlements.forEach(s => {
        if (!balances[s.from_user]) balances[s.from_user] = 0;
        if (!balances[s.to_user]) balances[s.to_user] = 0;
        balances[s.from_user] += parseFloat(s.amount);
        balances[s.to_user] -= parseFloat(s.amount);
      });
    }

    // Get user info
    const userIds = Object.keys(balances);
    const { data: users } = await supabase
      .from('users')
      .select('id, name, email')
      .in('id', userIds);

    const userMap = {};
    if (users) users.forEach(u => { userMap[u.id] = u; });

    const result = Object.entries(balances).map(([userId, amount]) => ({
      user: userMap[userId] || { id: userId, name: 'Unknown' },
      balance: parseFloat(amount.toFixed(2)),
    }));

    res.json(result);
  } catch (err) {
    console.error('Get balances error:', err);
    res.status(500).json({ error: 'Failed to calculate balances.' });
  }
};

exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all groups user belongs to
    const { data: memberships } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', userId);

    if (!memberships || memberships.length === 0) {
      return res.json({ total_owed: 0, total_owe: 0, recent_expenses: [] });
    }

    const groupIds = memberships.map(m => m.group_id);

    // Get all expenses in those groups
    const { data: expenses } = await supabase
      .from('expenses')
      .select('id, amount, paid_by, group_id, title, created_at')
      .in('group_id', groupIds);

    const expenseIds = expenses ? expenses.map(e => e.id) : [];

    const { data: splits } = expenseIds.length > 0
      ? await supabase.from('expense_splits').select('expense_id, user_id, amount').in('expense_id', expenseIds)
      : { data: [] };

    // Calculate: money user paid vs money user owes
    let totalPaid = 0;
    let totalOwed = 0;

    if (expenses) {
      expenses.forEach(exp => {
        if (exp.paid_by === userId) {
          totalPaid += parseFloat(exp.amount);
        }
      });
    }

    if (splits) {
      splits.forEach(split => {
        if (split.user_id === userId) {
          totalOwed += parseFloat(split.amount);
        }
      });
    }

    // Recent expenses (last 10)
    const recent = expenses
      ? expenses.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10)
      : [];

    // Get group names for recent expenses
    const { data: groups } = await supabase
      .from('groups')
      .select('id, name')
      .in('id', groupIds);

    const groupMap = {};
    if (groups) groups.forEach(g => { groupMap[g.id] = g.name; });

    const recentEnriched = recent.map(e => ({
      ...e,
      group_name: groupMap[e.group_id] || 'Unknown',
    }));

    res.json({
      total_balance: parseFloat((totalPaid - totalOwed).toFixed(2)),
      total_paid: parseFloat(totalPaid.toFixed(2)),
      total_owed: parseFloat(totalOwed.toFixed(2)),
      recent_expenses: recentEnriched,
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Failed to load dashboard.' });
  }
};
