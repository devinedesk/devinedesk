'use client';

import { Card } from '@/components/ui/Card';
import { Zap, ExternalLink, Loader2, CreditCard } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

export default function BillingDashboard() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [processingAction, setProcessingAction] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [profileRes, subRes] = await Promise.all([
        fetch('/api/user/me'),
        fetch('/api/billing/subscription'),
      ]);

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData);
      }

      if (subRes.ok) {
        const subData = await subRes.json();
        setSubscription(subData);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load billing data');
    } finally {
      setLoading(false);
    }
  };

  const handleTopUp = async () => {
    setProcessingAction(true);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: 'pkg_500' }), // Standardizing to pkg_500 for now
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || 'Checkout failed');
      }
    } catch (err) {
      toast.error('Failed to initiate checkout');
    } finally {
      setProcessingAction(false);
    }
  };

  const handlePortal = async () => {
    setProcessingAction(true);
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || 'No active billing profile');
      }
    } catch (err) {
      toast.error('Failed to open portal');
    } finally {
      setProcessingAction(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing & Credits</h1>
        <p className="text-neutral-secondary mt-2">
          Manage your subscription, top up credits, and view payment history.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 border-primary/20 bg-primary/5 backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-white">Current Balance</h2>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold text-white">{profile?.credits || 0}</span>
              <span className="text-neutral-secondary">credits</span>
            </div>
            <p className="text-sm text-neutral-secondary mt-2">
              Will not expire on active subscription.
            </p>
          </div>
          <div className="mt-6">
            <button
              onClick={handleTopUp}
              disabled={processingAction}
              className="w-full bg-primary hover:bg-primary-hover text-black font-semibold rounded-xl py-3 transition-colors flex items-center justify-center gap-2"
            >
              {processingAction && <Loader2 className="h-4 w-4 animate-spin" />}
              Top Up Credits
            </button>
          </div>
        </Card>

        <Card className="p-6 border-neutral-border-glass bg-neutral-card-bg/50 backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">
                {subscription?.plan || 'Free'} Plan
              </h2>
              {subscription?.isActive ? (
                <span className="px-3 py-1 rounded-full bg-white/10 text-xs font-medium text-white border border-white/10">
                  Active
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-neutral-800 text-xs font-medium text-neutral-400 border border-neutral-700">
                  Inactive
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">
                {subscription?.isActive ? '$49' : '$0'}
              </span>
              <span className="text-neutral-secondary">/ month</span>
            </div>

            {subscription?.isActive ? (
              <ul className="mt-4 space-y-2 text-sm text-neutral-secondary">
                <li className="flex items-center gap-2">✓ 1000 included credits per month</li>
                <li className="flex items-center gap-2">✓ Priority generation queue</li>
                <li className="flex items-center gap-2">✓ Commercial usage rights</li>
                <li className="flex items-center gap-2">✓ Up to 5 team members</li>
                {subscription?.cancelAtPeriodEnd && (
                  <li className="text-yellow-500 mt-2 text-xs">
                    Cancels on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </li>
                )}
              </ul>
            ) : (
              <ul className="mt-4 space-y-2 text-sm text-neutral-secondary">
                <li className="flex items-center gap-2">✓ 50 included credits per month</li>
                <li className="flex items-center gap-2">✓ Standard generation queue</li>
                <li className="flex items-center gap-2">✓ Personal usage rights</li>
              </ul>
            )}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={handlePortal}
              disabled={processingAction}
              className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl py-2.5 transition-colors border border-neutral-border-glass flex items-center justify-center gap-2"
            >
              {subscription?.isActive ? 'Manage in Stripe' : 'Upgrade to Pro'}{' '}
              <ExternalLink className="h-4 w-4" />
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
