const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api';

export const authService = {
  getToken() {
    return localStorage.getItem('fitai_jwt_token');
  },

  setToken(token) {
    if (token) {
      localStorage.setItem('fitai_jwt_token', token);
    } else {
      localStorage.removeItem('fitai_jwt_token');
    }
  },

  async register(email, username, password) {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error || 'Ошибка регистрации');

      this.setToken(data.token);
      return { user: data.user, error: null };
    } catch (err) {
      return { user: null, error: err.message };
    }
  },

  async login(email, password) {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error || 'Ошибка входа');

      this.setToken(data.token);
      return { user: data.user, error: null };
    } catch (err) {
      return { user: null, error: err.message };
    }
  },

  async logout() {
    this.setToken(null);
  },

  async getMe() {
    const token = this.getToken();
    if (!token) return null;

    try {
      const res = await fetch(`${API_BASE}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        this.setToken(null);
        return null;
      }
      const data = await res.json();
      return data.user;
    } catch (err) {
      return null;
    }
  },
};
