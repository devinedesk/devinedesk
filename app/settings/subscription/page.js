import { getServerSession } from 'next-auth/next';
import UpgradeButton from './UpgradeButton';
import prisma from '@/src/lib/prisma';
import { Card } from '@/components/ui/Card';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Zap,
  Shield,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { redirect } from 'next/navigation';
import { format } from 'date-fns';

export default async function SubscriptionSettings() {
  const session = await getServerSession();
  if (!session?.user?.id) redirect('/auth/signin');

  // Fetch real subscription from database
  const subscription = await prisma.subscription.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  });

  const isPro = subscription?.status === 'active' || subscription?.status === 'trialing';
  const planName = isPro ? 'Pro Plan' : 'Free Plan';

  return (
    <div className="space-y-8 max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-cyan-500" /> Subscription & Billing
        </h2>
        <p className="text-neutral-400 mt-1">
          Manage your active plan, billing cycles, and payment methods.
        </p>
      </div>

      {/* Current Plan Status */}
      <Card className="p-0 border-zinc-800 bg-zinc-900/50 overflow-hidden">
        <div
          className={`p-6 border-b ${isPro ? 'border-cyan-500/20 bg-cyan-500/5' : 'border-zinc-800 bg-zinc-950/50'}`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-bold text-white">{planName}</h3>
                {isPro ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
                    Basic
                  </span>
                )}
              </div>
              <p className="text-sm text-zinc-400">
                {isPro
                  ? 'You have full access to all premium AI models, priority generation queues, and unlimited workflows.'
                  : 'You are on the free tier. Upgrade to Pro to unlock advanced AI models and remove rate limits.'}
              </p>
            </div>

            <div className="shrink-0 text-left md:text-right">
              {isPro ? (
                <>
                  <div className="text-3xl font-bold text-white">
                    $29<span className="text-lg text-zinc-500 font-normal">/mo</span>
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">
                    Renews on{' '}
                    {subscription?.currentPeriodEnd
                      ? format(new Date(subscription.currentPeriodEnd), 'MMMM d, yyyy')
                      : 'N/A'}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-3xl font-bold text-white">
                    $0<span className="text-lg text-zinc-500 font-normal">/mo</span>
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">Free forever</div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 bg-zinc-900">
          {isPro ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p className="text-sm text-zinc-400">
                Need to update your payment method or download invoices?
              </p>
              <UpgradeButton isPro={isPro} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-zinc-200">Pro Plan Features</h4>
                <ul className="space-y-3">
                  {[
                    'Access to GPT-4o & Claude 3.5 Sonnet',
                    'Priority GPU generation queue',
                    'Unlimited custom workflows',
                    'Priority email support',
                  ].map((feat, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-zinc-400">
                      <CheckCircle2 className="h-5 w-5 text-cyan-500 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col justify-center items-start md:items-end p-6 bg-zinc-950 rounded-2xl border border-zinc-800">
                <p className="text-sm text-zinc-400 text-left md:text-right mb-4">
                  Take your AI automations to the next level with DevineDesk Pro.
                </p>
                <UpgradeButton isPro={isPro} />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Usage Limits */}
      <Card className="p-6 border-zinc-800 bg-zinc-900/50">
        <h3 className="text-lg font-medium text-white mb-6">Usage Limits</h3>
        <div className="space-y-6">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-zinc-300 font-medium">Generation Credits</span>
              <span className="text-zinc-500">850 / {isPro ? 'Unlimited' : '1,000'}</span>
            </div>
            <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-500 rounded-full" style={{ width: '85%' }}></div>
            </div>
            <p className="text-xs text-zinc-500 mt-2">Credits refresh on the 1st of every month.</p>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-zinc-300 font-medium">Active Workflows</span>
              <span className="text-zinc-500">2 / {isPro ? 'Unlimited' : '3'}</span>
            </div>
            <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: '66%' }}></div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
