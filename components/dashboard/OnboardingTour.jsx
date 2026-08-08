'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';

// Dynamically import Joyride to avoid SSR issues
const Joyride = dynamic(() => import('react-joyride'), { ssr: false });

export function OnboardingTour() {
  const [run, setRun] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Only run the tour if the user is on the main dashboard and hasn't seen it yet
    const hasSeenTour = localStorage.getItem('devinedesk_tour_completed');
    if (!hasSeenTour && pathname === '/dashboard') {
      // Slight delay to allow the page to render fully
      const timer = setTimeout(() => setRun(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  const steps = [
    {
      target: 'body',
      placement: 'center',
      title: 'Welcome to DevineDesk! 🚀',
      content: 'This quick tour will show you around your new AI automation studio.',
      disableBeacon: true,
    },
    {
      target: '.tour-step-overview',
      title: 'Your Overview',
      content:
        'Here you can track your generation activity, usage, and available credits in real-time.',
    },
    {
      target: '.tour-step-actions',
      title: 'Quick Actions',
      content:
        'Jump straight into creating stunning images or videos, or manage your workspace from this menu.',
    },
    {
      target: '.tour-step-sidebar',
      title: 'Navigation Menu',
      content:
        'Access your full generation history, billing settings, API keys, and team members from the sidebar.',
    },
  ];

  const handleJoyrideCallback = (data) => {
    const { status } = data;
    const finishedStatuses = ['finished', 'skipped'];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.setItem('devinedesk_tour_completed', 'true');
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous={true}
      scrollToFirstStep={true}
      showProgress={true}
      showSkipButton={true}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#ffffff',
          textColor: '#333333',
          backgroundColor: '#ffffff',
          overlayColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 9999,
        },
        buttonNext: {
          backgroundColor: '#000000',
          color: '#ffffff',
          borderRadius: '6px',
        },
        buttonBack: {
          marginRight: 10,
        },
      }}
    />
  );
}
