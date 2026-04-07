import pool from '../config/database.js';

export const unlockAccount = async (req, res) => {
  try {
    const { username } = req.params;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Check if user exists
    const [users] = await pool.query(
      'SELECT id, username, permanent_lock FROM users WHERE username = $1',
      [username]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Reset lock status
    await pool.query(
      'UPDATE users SET failed_login_count = 0, account_locked_until = NULL, permanent_lock = FALSE WHERE username = $1',
      [username]
    );

    res.json({ 
      message: 'Account unlocked successfully',
      username: users[0].username
    });
  } catch (error) {
    console.error('Error unlocking account:', error);
    res.status(500).json({ error: 'Failed to unlock account' });
  }
};

export const getLockedAccounts = async (req, res) => {
  try {
    const [accounts] = await pool.query(
      `SELECT 
        u.id,
        u.username,
        u.role,
        u.failed_login_count,
        u.account_locked_until,
        u.permanent_lock,
        CASE 
          WHEN u.role = 'student' THEN CONCAT(s.first_name, ' ', s.last_name)
          WHEN u.role = 'teacher' THEN CONCAT(t.first_name, ' ', t.last_name)
          ELSE 'Administrator'
        END as name
      FROM users u
      LEFT JOIN students s ON u.id = s.user_id AND u.role = 'student'
      LEFT JOIN teachers t ON u.id = t.user_id AND u.role = 'teacher'
      WHERE u.permanent_lock = TRUE 
         OR (u.account_locked_until IS NOT NULL AND u.account_locked_until > NOW())
      ORDER BY u.permanent_lock DESC, u.account_locked_until DESC`
    );

    res.json(accounts);
  } catch (error) {
    console.error('Error fetching locked accounts:', error);
    res.status(500).json({ error: 'Failed to fetch locked accounts' });
  }
};

export const getLoginAttempts = async (req, res) => {
  try {
    const { username } = req.params;
    const limit = parseInt(req.query.limit) || 20;

    const [attempts] = await pool.query(
      'SELECT username, ip_address, attempt_time, success FROM login_attempts WHERE username = $1 ORDER BY attempt_time DESC LIMIT $2',
      [username, limit]
    );

    res.json(attempts);
  } catch (error) {
    console.error('Error fetching login attempts:', error);
    res.status(500).json({ error: 'Failed to fetch login attempts' });
  }
};
