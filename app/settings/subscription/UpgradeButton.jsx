'use client';
import { useState } from 'react';
import { Loader2, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

export default function UpgradeButton({ isPro = false }) {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/billing/subscription/checkout', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || 'Failed to initiate checkout');
        setLoading(false);
      }
    } catch (err) {
      toast.error('Failed to initiate checkout');
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleUpgrade}
      disabled={loading}
      className={
        isPro
          ? 'bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors border border-zinc-700 flex items-center gap-2'
          : 'w-full bg-cyan-500 hover:bg-cyan-600 text-black px-6 py-3 rounded-xl font-medium transition-all hover:scale-105 flex items-center justify-center gap-2'
      }
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {!isPro && !loading && <Zap className="h-4 w-4" />}
      {isPro ? 'Manage Billing via Stripe' : 'Upgrade to Pro'}
    </button>
  );
}
