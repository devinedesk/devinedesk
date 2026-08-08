'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CreditCard, ExternalLink, Loader2, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

export default function BillingSettings() {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [profile, setProfile] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [subRes, profRes] = await Promise.all([
        fetch('/api/billing/subscription'),
        fetch('/api/user/me'),
      ]);
      if (subRes.ok) {
        setSubscription(await subRes.json());
      }
      if (profRes.ok) {
        setProfile(await profRes.json());
      }
    } catch (err) {
      toast.error('Failed to load billing data');
    } finally {
      setLoading(false);
    }
  };

  const handlePortal = async () => {
    setProcessing(true);
    try {
      const endpoint = subscription?.isActive
        ? '/api/billing/portal'
        : '/api/billing/subscription/checkout';
      const res = await fetch(endpoint, { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || 'Failed to process billing request');
      }
    } catch (err) {
      toast.error('Failed to open portal');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-white">Billing & Usage</h2>
        <p className="text-neutral-secondary mt-1">
          Manage your subscription, invoices, and credit usage.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 border-neutral-border-glass bg-neutral-card-bg/50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-xl text-green-500">
                <CreditCard className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-white">Subscription Plan</h3>
                <p className="text-sm text-neutral-400">
                  You are currently on the {subscription?.plan || 'Free'} plan.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-border-glass">
            <Button
              onClick={handlePortal}
              disabled={processing}
              variant="default"
              className="w-full sm:w-auto gap-2"
            >
              {processing && <Loader2 className="h-4 w-4 animate-spin" />}
              {subscription?.isActive ? 'Manage Subscription' : 'Upgrade to Pro'}{' '}
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        <Card className="p-6 border-neutral-border-glass bg-neutral-card-bg/50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl text-primary">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-white">Credit Balance</h3>
                <div className="text-2xl font-bold text-white mt-1">
                  {profile?.credits || 0}{' '}
                  <span className="text-sm font-normal text-neutral-400">credits</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-border-glass">
            <Button as="a" href="/dashboard/billing" variant="outline" className="w-full sm:w-auto">
              Top Up Credits
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
