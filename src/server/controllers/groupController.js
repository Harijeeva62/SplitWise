const supabase = require('../config/supabase');

exports.createGroup = async (req, res) => {
  try {
    const { name, memberEmails } = req.body;
    const userId = req.user.id;

    // Create group
    const { data: group, error } = await supabase
      .from('groups')
      .insert({ name, created_by: userId })
      .select()
      .single();

    if (error) throw error;

    // Add creator as member
    await supabase.from('group_members').insert({ group_id: group.id, user_id: userId });

    // Add other members by email
    if (memberEmails && memberEmails.length > 0) {
      const { data: members } = await supabase
        .from('users')
        .select('id')
        .in('email', memberEmails);

      if (members && members.length > 0) {
        const memberRows = members
          .filter(m => m.id !== userId)
          .map(m => ({ group_id: group.id, user_id: m.id }));

        if (memberRows.length > 0) {
          await supabase.from('group_members').insert(memberRows);
        }
      }
    }

    res.status(201).json(group);
  } catch (err) {
    console.error('Create group error:', err);
    res.status(500).json({ error: 'Failed to create group.' });
  }
};

exports.getGroups = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get group IDs user belongs to
    const { data: memberships, error: memErr } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', userId);

    if (memErr) throw memErr;

    if (!memberships || memberships.length === 0) {
      return res.json([]);
    }

    const groupIds = memberships.map(m => m.group_id);

    const { data: groups, error } = await supabase
      .from('groups')
      .select('*')
      .in('id', groupIds)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // For each group, get member count
    const enriched = await Promise.all(
      groups.map(async (g) => {
        const { count } = await supabase
          .from('group_members')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', g.id);

        return { ...g, member_count: count || 0 };
      })
    );

    res.json(enriched);
  } catch (err) {
    console.error('Get groups error:', err);
    res.status(500).json({ error: 'Failed to fetch groups.' });
  }
};

exports.getGroupById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify membership
    const { data: membership } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', id)
      .eq('user_id', userId)
      .single();

    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this group.' });
    }

    const { data: group, error } = await supabase
      .from('groups')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    // Get members
    const { data: memberLinks } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', id);

    const memberIds = memberLinks.map(m => m.user_id);
    const { data: members } = await supabase
      .from('users')
      .select('id, name, email')
      .in('id', memberIds);

    res.json({ ...group, members: members || [] });
  } catch (err) {
    console.error('Get group error:', err);
    res.status(500).json({ error: 'Failed to fetch group.' });
  }
};

exports.addMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;

    // Find user
    const { data: user } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('email', email)
      .maybeSingle();

    if (!user) {
      return res.status(404).json({ error: 'User not found with that email.' });
    }

    // Check not already member
    const { data: existing } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ error: 'User is already a member.' });
    }

    await supabase.from('group_members').insert({ group_id: id, user_id: user.id });

    res.json({ message: 'Member added.', user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('Add member error:', err);
    res.status(500).json({ error: 'Failed to add member.' });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const { id, userId: removeUserId } = req.params;

    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', id)
      .eq('user_id', removeUserId);

    if (error) throw error;

    res.json({ message: 'Member removed.' });
  } catch (err) {
    console.error('Remove member error:', err);
    res.status(500).json({ error: 'Failed to remove member.' });
  }
};

exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 1) {
      return res.json([]);
    }

    const search = q.trim().toLowerCase();

    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email')
      .or(`name.ilike.%${search}%,email.ilike.%${search}%`)
      .limit(10);

    if (error) throw error;

    res.json(users || []);
  } catch (err) {
    console.error('Search users error:', err);
    res.status(500).json({ error: 'Failed to search users.' });
  }
};

// Get ALL groups (public listing) with membership/request status for current user
exports.getAllGroups = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: groups, error } = await supabase
      .from('groups')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get user's memberships
    const { data: memberships } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', userId);

    const memberGroupIds = new Set((memberships || []).map(m => m.group_id));

    // Get user's pending join requests
    const { data: requests } = await supabase
      .from('join_requests')
      .select('group_id, status')
      .eq('user_id', userId);

    const requestMap = {};
    (requests || []).forEach(r => { requestMap[r.group_id] = r.status; });

    // Enrich groups
    const enriched = await Promise.all(
      groups.map(async (g) => {
        const { count } = await supabase
          .from('group_members')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', g.id);

        // Get creator name
        const { data: creator } = await supabase
          .from('users')
          .select('name')
          .eq('id', g.created_by)
          .single();

        return {
          ...g,
          member_count: count || 0,
          creator_name: creator?.name || 'Unknown',
          is_member: memberGroupIds.has(g.id),
          is_admin: g.created_by === userId,
          join_status: requestMap[g.id] || null,
        };
      })
    );

    res.json(enriched);
  } catch (err) {
    console.error('Get all groups error:', err);
    res.status(500).json({ error: 'Failed to fetch groups.' });
  }
};

// Send join request
exports.requestJoin = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check not already member
    const { data: existing } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', id)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ error: 'Already a member of this group.' });
    }

    // Check no pending request
    const { data: pendingReq } = await supabase
      .from('join_requests')
      .select('id, status')
      .eq('group_id', id)
      .eq('user_id', userId)
      .maybeSingle();

    if (pendingReq && pendingReq.status === 'pending') {
      return res.status(400).json({ error: 'Join request already pending.' });
    }

    // Upsert request (in case previously rejected)
    if (pendingReq) {
      await supabase
        .from('join_requests')
        .update({ status: 'pending', created_at: new Date().toISOString() })
        .eq('id', pendingReq.id);
    } else {
      await supabase
        .from('join_requests')
        .insert({ group_id: id, user_id: userId, status: 'pending' });
    }

    res.json({ message: 'Join request sent.' });
  } catch (err) {
    console.error('Request join error:', err);
    res.status(500).json({ error: 'Failed to send join request.' });
  }
};

// Get join requests for a group (admin only)
exports.getJoinRequests = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify admin
    const { data: group } = await supabase
      .from('groups')
      .select('created_by')
      .eq('id', id)
      .single();

    if (!group || group.created_by !== userId) {
      return res.status(403).json({ error: 'Only the group admin can view join requests.' });
    }

    const { data: requests, error } = await supabase
      .from('join_requests')
      .select('*')
      .eq('group_id', id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Enrich with user details
    const userIds = (requests || []).map(r => r.user_id);
    if (userIds.length === 0) return res.json([]);

    const { data: users } = await supabase
      .from('users')
      .select('id, name, email')
      .in('id', userIds);

    const userMap = {};
    (users || []).forEach(u => { userMap[u.id] = u; });

    const enriched = requests.map(r => ({
      ...r,
      user: userMap[r.user_id] || { name: 'Unknown', email: '' },
    }));

    res.json(enriched);
  } catch (err) {
    console.error('Get join requests error:', err);
    res.status(500).json({ error: 'Failed to fetch join requests.' });
  }
};

// Accept or reject join request (admin only)
exports.handleJoinRequest = async (req, res) => {
  try {
    const { id, requestId } = req.params;
    const { action } = req.body; // 'accept' or 'reject'
    const userId = req.user.id;

    // Verify admin
    const { data: group } = await supabase
      .from('groups')
      .select('created_by')
      .eq('id', id)
      .single();

    if (!group || group.created_by !== userId) {
      return res.status(403).json({ error: 'Only the group admin can handle join requests.' });
    }

    const { data: request } = await supabase
      .from('join_requests')
      .select('*')
      .eq('id', requestId)
      .eq('group_id', id)
      .single();

    if (!request) {
      return res.status(404).json({ error: 'Join request not found.' });
    }

    if (action === 'accept') {
      // Add user to group
      await supabase.from('group_members').insert({ group_id: id, user_id: request.user_id });
      await supabase.from('join_requests').update({ status: 'accepted' }).eq('id', requestId);
      res.json({ message: 'Request accepted.' });
    } else {
      await supabase.from('join_requests').update({ status: 'rejected' }).eq('id', requestId);
      res.json({ message: 'Request rejected.' });
    }
  } catch (err) {
    console.error('Handle join request error:', err);
    res.status(500).json({ error: 'Failed to handle join request.' });
  }
};
