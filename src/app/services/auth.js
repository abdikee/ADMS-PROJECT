const TOKEN_KEY = 'token';
const USER_KEY = 'sams_user';
const AUTH_EVENT = 'sams:unauthorized';

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
  },

  clearSession() {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
  },

  isLoggedIn() {
    return Boolean(this.getToken() && this.getUser());
  },

  handleUnauthorized() {
    this.clearSession();

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(AUTH_EVENT));
    }
  },

  unauthorizedEvent: AUTH_EVENT,
};

export default auth;
