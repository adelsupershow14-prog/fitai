import { authService } from './authService';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${authService.getToken()}`,
});

export const dbService = {
  async saveUserPlan(arg1, arg2, arg3) {
    let profileData = arg1;
    let weeklyPlan = arg2;
    if (arg3 !== undefined) {
      // Called with (userId, profileData, weeklyPlan)
      profileData = arg2;
      weeklyPlan = arg3;
    }
    const token = authService.getToken();
    if (!token) return null;

    try {
      const res = await fetch(`${API_BASE}/users/${token}/plan`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          name: profileData?.name || profileData?.username || undefined,
          goal: profileData?.goal,
          level: profileData?.level,
          frequency: parseInt(profileData?.frequency) || 3,
          weeklyPlan,
        }),
      });
      const data = await res.json();
      return data;
    } catch (err) {
      console.error('saveUserPlan FastAPI Error:', err);
      return null;
    }
  },

  async generatePlan(goal, level, frequency) {
    try {
      const res = await fetch(`${API_BASE}/plans/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal, level, frequency: parseInt(frequency) || 3 }),
      });
      const data = await res.json();
      return data?.plan || null;
    } catch (err) {
      console.error('generatePlan Error:', err);
      return null;
    }
  },

  async updateProfile(profileData) {
    const token = authService.getToken();
    if (!token) return null;

    try {
      const res = await fetch(`${API_BASE}/users/profile`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(profileData),
      });
      const data = await res.json();
      return data;
    } catch (err) {
      console.error('updateProfile FastAPI Error:', err);
      return null;
    }
  },

  async fetchAllUsers() {
    try {
      const res = await fetch(`${API_BASE}/admin/users`);
      return await res.json();
    } catch (err) {
      console.error('fetchAllUsers Error:', err);
      return { total: 0, users: [] };
    }
  },

  async toggleVoiceSetting(isVoiceEnabled) {
    const token = authService.getToken();
    if (!token) return;

    try {
      await fetch(`${API_BASE}/users/${token}/voice`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ is_voice_enabled: isVoiceEnabled }),
      });
    } catch (err) {
      console.warn('Voice setting save warning:', err);
    }
  },

  async buyAvatar(avatarId, price, currentTokens) {
    if (currentTokens < price) return { success: false, reason: 'Недостаточно токенов' };

    try {
      const res = await fetch(`${API_BASE}/shop/buy`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ avatar_id: avatarId, price }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error || 'Ошибка покупки');
      return { success: true, ...data };
    } catch (err) {
      return { success: false, reason: err.message };
    }
  },

  async setActiveAvatar(avatarId) {
    try {
      await fetch(`${API_BASE}/shop/equip`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ avatar_id: avatarId }),
      });
    } catch (err) {
      console.warn('Active avatar equip warning:', err);
    }
  },

  async recordWorkoutCompletion(exerciseName, repsCount, perfectRepsCount) {
    try {
      const res = await fetch(`${API_BASE}/workouts/record`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          exercise_name: exerciseName,
          reps_count: repsCount,
          perfect_reps_count: perfectRepsCount,
        }),
      });
      const data = await res.json();
      return data;
    } catch (err) {
      console.error('Workout completion record FastAPI Error:', err);
      return { tokensEarned: 50, accuracyPct: 100, streak: 1 };
    }
  },

  async fetchWorkoutHistory() {
    const token = authService.getToken();
    if (!token) return [];

    try {
      const res = await fetch(`${API_BASE}/workouts/history/${token}`, {
        headers: getHeaders(),
      });
      const data = await res.json();
      return data.history || [];
    } catch (err) {
      console.warn('History fetch fallback:', err);
      return [];
    }
  },

  async fetchLeaderboard() {
    try {
      const res = await fetch(`${API_BASE}/leaderboard`, {
        headers: getHeaders(),
      });
      const data = await res.json();
      return data;
    } catch (err) {
      console.error('fetchLeaderboard Error:', err);
      return { leaderboard: [], total: 0, currentUser: null };
    }
  },
};
