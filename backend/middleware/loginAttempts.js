import pool from '../config/database.js';

const ATTEMPT_LIMITS = {
  TEMP_LOCK_1: { attempts: 3, duration: 60 * 60 * 1000 }, // 3 attempts = 1 hour lock
  TEMP_LOCK_2: { attempts: 6, duration: 24 * 60 * 60 * 1000 }, // 6 attempts = 1 day lock
  PERMANENT_LOCK: { attempts: 10 } // 10 attempts = permanent lock
};

export const loginAttemptsMiddleware = {
  async checkAccountLock(username) {
    try {
      const [users] = await pool.query(
        'SELECT failed_login_count, account_locked_until, permanent_lock FROM users WHERE username = $1',
        [username]
      );

      if (users.length === 0) {
        return { locked: false };
      }

      const user = users[0];

      // Check permanent lock
      if (user.permanent_lock) {
        return {
          locked: true,
          permanent: true,
          message: 'Account permanently locked due to excessive failed login attempts. Contact administrator.'
        };
      }

      // Check temporary lock
      if (user.account_locked_until) {
        const lockExpiry = new Date(user.account_locked_until);
        const now = new Date();

        if (now < lockExpiry) {
          const minutesLeft = Math.ceil((lockExpiry - now) / (60 * 1000));
          const hoursLeft = Math.floor(minutesLeft / 60);
          
          let timeMessage;
          if (hoursLeft > 0) {
            timeMessage = `${hoursLeft} hour${hoursLeft > 1 ? 's' : ''}`;
          } else {
            timeMessage = `${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}`;
          }

          return {
            locked: true,
            temporary: true,
            expiresAt: lockExpiry,
            message: `Account temporarily locked. Try again in ${timeMessage}.`
          };
        } else {
          // Lock expired, reset
          await pool.query(
            'UPDATE users SET account_locked_until = NULL, failed_login_count = 0 WHERE username = $1',
            [username]
          );
        }
      }

      return { locked: false, failedCount: user.failed_login_count };
    } catch (error) {
      console.error('Error checking account lock:', error);
      throw error;
    }
  },

  async recordFailedAttempt(username, ipAddress) {
    try {
      // Record the attempt
      await pool.query(
        'INSERT INTO login_attempts (username, ip_address, success) VALUES ($1, $2, FALSE)',
        [username, ipAddress]
      );

      // Get current failed count
      const [users] = await pool.query(
        'SELECT failed_login_count FROM users WHERE username = $1',
        [username]
      );

      if (users.length === 0) {
        return { locked: false };
      }

      const newFailedCount = users[0].failed_login_count + 1;

      // Determine lock action based on failed attempts
      if (newFailedCount >= ATTEMPT_LIMITS.PERMANENT_LOCK.attempts) {
        // Permanent lock after 10 attempts
        await pool.query(
          'UPDATE users SET failed_login_count = $1, permanent_lock = TRUE WHERE username = $2',
          [newFailedCount, username]
        );

        return {
          locked: true,
          permanent: true,
          message: 'Account permanently locked due to excessive failed login attempts. Contact administrator.'
        };
      } else if (newFailedCount >= ATTEMPT_LIMITS.TEMP_LOCK_2.attempts) {
        // 1 day lock after 6 attempts
        const lockUntil = new Date(Date.now() + ATTEMPT_LIMITS.TEMP_LOCK_2.duration);
        await pool.query(
          'UPDATE users SET failed_login_count = $1, account_locked_until = $2 WHERE username = $3',
          [newFailedCount, lockUntil, username]
        );

        return {
          locked: true,
          temporary: true,
          expiresAt: lockUntil,
          message: 'Account locked for 24 hours due to multiple failed login attempts.'
        };
      } else if (newFailedCount >= ATTEMPT_LIMITS.TEMP_LOCK_1.attempts) {
        // 1 hour lock after 3 attempts
        const lockUntil = new Date(Date.now() + ATTEMPT_LIMITS.TEMP_LOCK_1.duration);
        await pool.query(
          'UPDATE users SET failed_login_count = $1, account_locked_until = $2 WHERE username = $3',
          [newFailedCount, lockUntil, username]
        );

        return {
          locked: true,
          temporary: true,
          expiresAt: lockUntil,
          message: 'Account locked for 1 hour due to multiple failed login attempts.'
        };
      } else {
        // Just increment the counter
        await pool.query(
          'UPDATE users SET failed_login_count = $1 WHERE username = $2',
          [newFailedCount, username]
        );

        const attemptsLeft = ATTEMPT_LIMITS.TEMP_LOCK_1.attempts - newFailedCount;
        return {
          locked: false,
          failedCount: newFailedCount,
          attemptsLeft,
          message: `Invalid credentials. ${attemptsLeft} attempt${attemptsLeft > 1 ? 's' : ''} remaining before temporary lock.`
        };
      }
    } catch (error) {
      console.error('Error recording failed attempt:', error);
      throw error;
    }
  },

  async recordSuccessfulLogin(username, ipAddress) {
    try {
      // Record successful attempt
      await pool.query(
        'INSERT INTO login_attempts (username, ip_address, success) VALUES ($1, $2, TRUE)',
        [username, ipAddress]
      );

      // Reset failed login count
      await pool.query(
        'UPDATE users SET failed_login_count = 0, account_locked_until = NULL WHERE username = $1',
        [username]
      );
    } catch (error) {
      console.error('Error recording successful login:', error);
      throw error;
    }
  },

  async getLoginHistory(username, limit = 10) {
    try {
      const [attempts] = await pool.query(
        'SELECT ip_address, attempt_time, success FROM login_attempts WHERE username = $1 ORDER BY attempt_time DESC LIMIT $2',
        [username, limit]
      );
      return attempts;
    } catch (error) {
      console.error('Error fetching login history:', error);
      throw error;
    }
  }
};

export default loginAttemptsMiddleware;
