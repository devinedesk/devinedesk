'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

// Dynamically import Joyride to avoid SSR issues
const Joyride = dynamic(() => import('react-joyride'), { ssr: false });

export function OnboardingTour() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [run, setRun] = useState(false);

  useEffect(() => {
    // Only run on the main dashboard for authenticated users
    if (session && pathname === '/dashboard') {
      const hasSeenTour = localStorage.getItem('devinedesk_tour_seen');
      if (!hasSeenTour) {
        // Slight delay to ensure DOM is fully rendered
        setTimeout(() => setRun(true), 1500);
      }
    }
  }, [pathname, session]);

  const handleJoyrideCallback = (data) => {
    const { status } = data;
    const finishedStatuses = ['finished', 'skipped'];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.setItem('devinedesk_tour_seen', 'true');
    }
  };

  const steps = [
    {
      target: 'body',
      content: (
        <div className="text-left">
          <h3 className="text-xl font-bold mb-2 text-primary">Welcome to DevineDesk! 🚀</h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            Let's take a quick tour of your new AI master platform. We'll show you where everything
            is.
          </p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '[data-tour="sidebar-workflows"]',
      content:
        'This is where your AI Workflows live. You can build, monitor, and deploy agentic networks from here.',
      placement: 'right',
    },
    {
      target: '[data-tour="sidebar-explore"]',
      content:
        'Browse the Community Marketplace! Here you can clone powerful templates built by other developers directly into your workspace.',
      placement: 'right',
    },
    {
      target: '[data-tour="sidebar-billing"]',
      content:
        'Keep track of your API usage and credit balances. You earn credits by referring friends!',
      placement: 'right',
    },
    {
      target: '[data-tour="omnibar"]',
      content: (
        <div>
          <span className="font-bold text-primary block mb-2">Pro Tip ⌨️</span>
          Press{' '}
          <kbd className="bg-neutral-800 text-white px-1 py-0.5 rounded text-xs mx-1">
            Cmd + K
          </kbd>{' '}
          anywhere to open the Global Omnibar and navigate instantly!
        </div>
      ),
      placement: 'bottom',
    },
  ];

  if (!run) return null;

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
          primaryColor: '#00e5ff',
          backgroundColor: '#111',
          textColor: '#fff',
          overlayColor: 'rgba(0, 0, 0, 0.7)',
          arrowColor: '#111',
        },
        tooltipContainer: {
          textAlign: 'left',
          border: '1px solid rgba(0, 229, 255, 0.2)',
          borderRadius: '12px',
        },
        buttonNext: {
          backgroundColor: '#00e5ff',
          color: '#000',
          fontWeight: 'bold',
          borderRadius: '8px',
        },
        buttonSkip: {
          color: '#888',
        },
        buttonBack: {
          color: '#00e5ff',
        },
      }}
    />
  );
}
