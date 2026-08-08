import { DollarSign, Share2, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export const metadata = {
  title: 'Affiliate Program | DevineDesk',
  description: 'Earn 30% recurring commission by referring customers to DevineDesk.',
};

export default function AffiliatesPage() {
  return (
    <div className="min-h-screen pt-24 pb-12 bg-[#050505]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="mx-auto w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mb-6 border border-emerald-500/20">
            <DollarSign size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">
            Partner with DevineDesk
          </h1>
          <p className="text-xl text-neutral-400 mb-8">
            Earn a recurring 30% commission for every customer you refer. No caps, no limits.
          </p>
          <div className="flex justify-center gap-4">
            <Button variant="primary" className="py-6 px-8 rounded-xl text-lg font-bold">
              Apply Now
            </Button>
            <Link href="/auth/login">
              <Button
                variant="outline"
                className="py-6 px-8 rounded-xl text-lg font-bold bg-white/5 text-white border-white/10 hover:bg-white/10"
              >
                Partner Login
              </Button>
            </Link>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-24">
          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
              <TrendingUp size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">30% Recurring</h3>
            <p className="text-neutral-400 text-sm">
              You earn 30% of every payment your referral makes, for as long as they stay a
              customer.
            </p>
          </div>

          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 text-center">
            <div className="mx-auto w-12 h-12 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center mb-6">
              <Share2 size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">60-Day Cookie</h3>
            <p className="text-neutral-400 text-sm">
              Our tracking cookies last for 60 days. If they click today and buy next month, you
              still get paid.
            </p>
          </div>

          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 text-center">
            <div className="mx-auto w-12 h-12 bg-purple-500/10 text-purple-400 rounded-xl flex items-center justify-center mb-6">
              <DollarSign size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Monthly Payouts</h3>
            <p className="text-neutral-400 text-sm">
              Get paid out automatically every month via Stripe Connect or PayPal once you hit $50.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
