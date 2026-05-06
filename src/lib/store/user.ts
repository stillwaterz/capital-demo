"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type GoalEntry = {
  label: string;
  targetNgwee: number;
  currentNgwee: number;
};

type UserState = {
  name: string;
  phone: string;
  riskProfile: string;
  goals: GoalEntry[];
  isLoggedIn: boolean;
  hasCompletedOnboarding: boolean;
};

type UserActions = {
  setName: (name: string) => void;
  setPhone: (phone: string) => void;
  setRiskProfile: (profile: string) => void;
  setGoals: (goals: GoalEntry[]) => void;
  login: (phone: string) => void;
  completeOnboarding: () => void;
  logout: () => void;
};

const DEFAULT_STATE: UserState = {
  name: "",
  phone: "",
  riskProfile: "balanced",
  goals: [],
  isLoggedIn: false,
  hasCompletedOnboarding: false,
};

export const useUserStore = create<UserState & UserActions>()(
  persist(
    (set) => ({
      ...DEFAULT_STATE,
      setName: (name) => set({ name }),
      setPhone: (phone) => set({ phone }),
      setRiskProfile: (riskProfile) => set({ riskProfile }),
      setGoals: (goals) => set({ goals }),
      login: (phone) => set({ phone, isLoggedIn: true }),
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
      logout: () => set(DEFAULT_STATE),
    }),
    { name: "ml-user" }
  )
);
