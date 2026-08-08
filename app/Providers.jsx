'use client';

import { SessionProvider } from 'next-auth/react';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { OnboardingTour } from '@/components/ui/OnboardingTour';

export function Providers({ children }) {
  return (
    <SessionProvider>
      <CommandPalette />
      <OnboardingTour />
      {children}
    </SessionProvider>
  );
}
