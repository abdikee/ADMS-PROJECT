const TOKEN_KEY = 'token';
const USER_KEY = 'sams_user';
const LAST_ACTIVITY_KEY = 'sams_last_activity';
const AUTH_EVENT = 'sams:unauthorized';
const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds

export const auth = {
  getUser() {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      this.clearSession();
      return null;
    }
  },

  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  setSession(user, token) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.setItem(TOKEN_KEY, token);
    this.updateActivity();
  },

  clearSession() {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(LAST_ACTIVITY_KEY);
  },

  isLoggedIn() {
    return Boolean(this.getToken() && this.getUser());
  },

  updateActivity() {
    if (this.isLoggedIn()) {
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    }
  },

  getLastActivity() {
    const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
    return lastActivity ? parseInt(lastActivity, 10) : null;
  },

  checkInactivity() {
    if (!this.isLoggedIn()) {
      return false;
    }

    const lastActivity = this.getLastActivity();
    if (!lastActivity) {
      this.updateActivity();
      return false;
    }

    const timeSinceLastActivity = Date.now() - lastActivity;
    
    if (timeSinceLastActivity > INACTIVITY_TIMEOUT) {
      this.handleUnauthorized();
      return true;
    }

    return false;
  },

  handleUnauthorized() {
    this.clearSession();

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(AUTH_EVENT));
    }
  },

  unauthorizedEvent: AUTH_EVENT,
  inactivityTimeout: INACTIVITY_TIMEOUT,
};

export default auth;
