'use client';

import posthog from 'posthog-js';

// Ensure this only runs on the client
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
    loaded: (posthog) => {
      if (process.env.NODE_ENV === 'development') posthog.debug();
    },
    capture_pageview: false, // We'll handle this manually in Next.js router
  });
}

/**
 * Universal PostHog Analytics Wrapper
 */
export const Analytics = {
  /**
   * Identifies a user in PostHog
   */
  identify: (userId, traits = {}) => {
    if (typeof window !== 'undefined') {
      posthog.identify(userId, traits);
    }
  },

  /**
   * Tracks a custom event
   */
  track: (eventName, properties = {}) => {
    if (typeof window !== 'undefined') {
      posthog.capture(eventName, {
        timestamp: new Date().toISOString(),
        ...properties,
      });
    }
  },

  /**
   * Explicitly track page views for SPA transitions
   */
  pageView: (url) => {
    if (typeof window !== 'undefined') {
      posthog.capture('$pageview', {
        $current_url: url,
      });
    }
  },

  /**
   * Resets the user session (e.g. on logout)
   */
  reset: () => {
    if (typeof window !== 'undefined') {
      posthog.reset();
    }
  },
};
