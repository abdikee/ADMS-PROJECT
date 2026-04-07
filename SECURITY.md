# Security Features

## Session Management

### Automatic Logout on Inactivity
- Users are automatically logged out after **15 minutes** of inactivity
- Activity is tracked through:
  - Mouse movements and clicks
  - Keyboard input
  - Scrolling
  - Touch events
  - API requests
- Warning dialog appears **60 seconds** before automatic logout
- Users can click "Stay Logged In" to reset the timer

### JWT Token Security
- JWT tokens expire after **15 minutes**
- Tokens are validated on every API request
- Expired tokens automatically trigger logout
- Secure token storage in localStorage

## Login Attempt Limitations

### Progressive Account Locking
The system implements escalating security measures based on failed login attempts:

1. **After 3 failed attempts**: Account locked for **1 hour**
2. **After 6 failed attempts**: Account locked for **24 hours** (1 day)
3. **After 10 failed attempts**: Account **permanently locked**

### Features
- Failed attempts are tracked per username
- IP addresses are logged for security auditing
- Lock status is checked before each login attempt
- Clear error messages inform users of:
  - Remaining attempts before lock
  - Lock duration (for temporary locks)
  - Permanent lock status
- Successful login resets the failed attempt counter

### Admin Controls
Administrators can:
- View all locked accounts
- Unlock temporarily locked accounts
- Unlock permanently locked accounts
- View login attempt history for any user

## Database Setup

Run the following command to set up login security tables:

```bash
cd backend
npm run setup-login-security
```

This creates:
- `login_attempts` table for tracking all login attempts
- Additional columns in `users` table:
  - `failed_login_count`: Counter for failed attempts
  - `account_locked_until`: Timestamp for temporary locks
  - `permanent_lock`: Boolean flag for permanent locks

## API Endpoints

### Admin Security Endpoints

#### Get Locked Accounts
```
GET /admin/locked-accounts
Authorization: Bearer <admin-token>
```

Returns list of all currently locked accounts.

#### Unlock Account
```
POST /admin/unlock-account/:username
Authorization: Bearer <admin-token>
```

Unlocks a user account (temporary or permanent lock).

#### Get Login Attempts
```
GET /admin/login-attempts/:username?limit=20
Authorization: Bearer <admin-token>
```

Returns login attempt history for a specific user.

## Security Best Practices

1. **Never share credentials** with anyone
2. **Log out** when leaving your workstation
3. **Use strong passwords** with a mix of characters
4. **Report suspicious activity** to administrators
5. **Keep your browser updated** for security patches

## For Administrators

### Unlocking Accounts
If a legitimate user is locked out:
1. Verify the user's identity
2. Use the admin panel or API to unlock the account
3. Advise the user to reset their password if compromise is suspected

### Monitoring
- Regularly review login attempt logs
- Watch for patterns of failed attempts (potential attacks)
- Investigate permanently locked accounts
- Consider implementing IP-based blocking for repeated attacks

## Technical Implementation

### Frontend (React)
- `src/app/services/auth.js`: Activity tracking and timeout logic
- `src/app/contexts/AuthContext.jsx`: Session management
- `src/app/components/InactivityWarning.jsx`: Warning dialog
- `src/app/pages/LoginPage.jsx`: Lock status display

### Backend (Node.js/Express)
- `backend/middleware/loginAttempts.js`: Login attempt tracking
- `backend/controllers/authController.js`: Login validation with locks
- `backend/controllers/adminController.js`: Admin security endpoints
- `database/add-login-attempts-table.sql`: Database schema

## Configuration

### Adjusting Timeouts
To modify the inactivity timeout, edit `src/app/services/auth.js`:
```javascript
const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds
```

### Adjusting Lock Thresholds
To modify login attempt limits, edit `backend/middleware/loginAttempts.js`:
```javascript
const ATTEMPT_LIMITS = {
  TEMP_LOCK_1: { attempts: 3, duration: 60 * 60 * 1000 }, // 1 hour
  TEMP_LOCK_2: { attempts: 6, duration: 24 * 60 * 60 * 1000 }, // 1 day
  PERMANENT_LOCK: { attempts: 10 } // permanent
};
```

### Adjusting JWT Expiration
To modify JWT token expiration, edit `backend/controllers/authController.js`:
```javascript
const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '15m' });
```

## Compliance Notes

These security features help meet common compliance requirements:
- **FERPA**: Protects student data through automatic session timeout
- **GDPR**: Limits unauthorized access through progressive locking
- **SOC 2**: Provides audit trail through login attempt logging
- **ISO 27001**: Implements access control best practices
