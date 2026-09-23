"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useLearnerState } from "@/hooks/use-learner-state";

type LearnerContextValue = ReturnType<typeof useLearnerState>;

const LearnerContext = createContext<LearnerContextValue | null>(null);

export function LearnerProvider({ children }: { children: ReactNode }) {
  const value = useLearnerState();
  return (
    <LearnerContext.Provider value={value}>{children}</LearnerContext.Provider>
  );
}

export function useLearner(): LearnerContextValue {
  const value = useContext(LearnerContext);
  if (!value) {
    throw new Error("useLearner must be used within LearnerProvider");
  }
  return value;
}
