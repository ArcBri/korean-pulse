"use client";

import { LearnerProvider } from "@/components/learner-provider";
import { NotificationScheduler } from "@/components/notification-scheduler";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LearnerProvider>
      <NotificationScheduler />
      {children}
    </LearnerProvider>
  );
}
