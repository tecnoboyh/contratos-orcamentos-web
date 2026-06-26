import { create } from 'zustand';

const storageKey = '@contratos:auth';
const storedAuth = localStorage.getItem(storageKey);
const initialAuth = storedAuth ? JSON.parse(storedAuth) : null;

export const useAuthStore = create((set) => ({
  user: initialAuth?.user || null,
  company: initialAuth?.company || null,
  token: initialAuth?.token || null,

  signIn: ({ user, company, token }) => {
    const data = { user, company, token };
    localStorage.setItem(storageKey, JSON.stringify(data));
    set(data);
  },

  signOut: () => {
    localStorage.removeItem(storageKey);
    set({
      user: null,
      company: null,
      token: null
    });
  }
}));
