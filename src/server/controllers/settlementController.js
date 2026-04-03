const supabase = require('../config/supabase');

exports.settle = async (req, res) => {
  try {
    const { group_id, from_user, to_user, amount } = req.body;

    const { data: settlement, error } = await supabase
      .from('settlements')
      .insert({ group_id, from_user, to_user, amount, completed: false })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(settlement);
  } catch (err) {
    console.error('Settle error:', err);
    res.status(500).json({ error: 'Failed to record settlement.' });
  }
};

exports.markCompleted = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('settlements')
      .update({ completed: true })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error('Mark completed error:', err);
    res.status(500).json({ error: 'Failed to mark settlement as completed.' });
  }
};

exports.getSettlements = async (req, res) => {
  try {
    const { groupId } = req.params;

    const { data: settlements, error } = await supabase
      .from('settlements')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Enrich with user names
    const userIds = new Set();
    settlements.forEach(s => {
      userIds.add(s.from_user);
      userIds.add(s.to_user);
    });

    const { data: users } = await supabase
      .from('users')
      .select('id, name')
      .in('id', Array.from(userIds));

    const userMap = {};
    if (users) users.forEach(u => { userMap[u.id] = u.name; });

    const enriched = settlements.map(s => ({
      ...s,
      from_user_name: userMap[s.from_user] || 'Unknown',
      to_user_name: userMap[s.to_user] || 'Unknown',
    }));

    res.json(enriched);
  } catch (err) {
    console.error('Get settlements error:', err);
    res.status(500).json({ error: 'Failed to fetch settlements.' });
  }
};
