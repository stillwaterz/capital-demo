"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type GoalEntry = {
  label: string;
  targetNgwee: number;
  currentNgwee: number;
};

/** Demo PIN. Real auth uses Supabase; this gates confirms in demo mode only. */
const DEFAULT_PIN = "1234";
const PIN_LENGTH = 4;

type UserState = {
  name: string;
  phone: string;
  riskProfile: string;
  goals: GoalEntry[];
  isLoggedIn: boolean;
  hasCompletedOnboarding: boolean;
  /** Demo transaction PIN. Confirms orders and withdrawals (golden rule 2). */
  pin: string;
  /** Whether a second factor is required at confirm. */
  twoFactorEnabled: boolean;
};

type UserActions = {
  setName: (name: string) => void;
  setPhone: (phone: string) => void;
  setRiskProfile: (profile: string) => void;
  setGoals: (goals: GoalEntry[]) => void;
  login: (phone: string) => void;
  completeOnboarding: () => void;
  setPin: (pin: string) => void;
  verifyPin: (pin: string) => boolean;
  setTwoFactorEnabled: (enabled: boolean) => void;
  logout: () => void;
};

const DEFAULT_STATE: UserState = {
  name: "",
  phone: "",
  riskProfile: "balanced",
  goals: [],
  isLoggedIn: false,
  hasCompletedOnboarding: false,
  pin: DEFAULT_PIN,
  twoFactorEnabled: true,
};

export const useUserStore = create<UserState & UserActions>()(
  persist(
    (set, get) => ({
      ...DEFAULT_STATE,
      setName: (name) => set({ name }),
      setPhone: (phone) => set({ phone }),
      setRiskProfile: (riskProfile) => set({ riskProfile }),
      setGoals: (goals) => set({ goals }),
      login: (phone) => set({ phone, isLoggedIn: true }),
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
      setPin: (pin) => {
        if (pin.length === PIN_LENGTH) set({ pin });
      },
      verifyPin: (pin) => pin === get().pin,
      setTwoFactorEnabled: (twoFactorEnabled) => set({ twoFactorEnabled }),
      logout: () => set(DEFAULT_STATE),
    }),
    { name: "ml-user", version: 2 }
  )
);

export { PIN_LENGTH };
