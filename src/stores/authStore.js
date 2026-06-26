import { create } from 'zustand';

const storageKey = '@contratos:auth';
const storedAuth = localStorage.getItem(storageKey);
const initialAuth = storedAuth ? JSON.parse(storedAuth) : null;

function persistAuth(data) {
  localStorage.setItem(storageKey, JSON.stringify(data));
}

export const useAuthStore = create((set, get) => ({
  user: initialAuth?.user || null,
  company: initialAuth?.company || null,
  token: initialAuth?.token || null,

  signIn: ({ user, company, token }) => {
    const data = { user, company, token };
    persistAuth(data);
    set(data);
  },

  setCompany: (company) => {
    const current = get();
    const data = {
      user: current.user,
      token: current.token,
      company
    };

    persistAuth(data);
    set({ company });
  },

  signOut: () => {
    localStorage.removeItem(storageKey);
    set({ user: null, company: null, token: null });
  }
}));
