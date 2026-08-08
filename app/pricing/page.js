import Link from 'next/link';
import { Check, Info } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const metadata = {
  title: 'Pricing | DevineDesk',
  description:
    'Simple, transparent pricing for DevineDesk. Start for free and upgrade as you grow.',
};

export const revalidate = 86400; // Cache at the Edge for 24 hours

const tiers = [
  {
    name: 'Hobby',
    price: '$0',
    description: 'Perfect for individuals and small side projects.',
    features: [
      'Up to 3 Workspaces',
      'Community Support',
      '1GB Storage',
      'Basic Analytics',
      'Standard API Rate Limits',
    ],
    cta: 'Start for free',
    href: '/auth/register',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$29',
    interval: '/mo',
    description: 'Ideal for growing teams and startups.',
    features: [
      'Unlimited Workspaces',
      'Priority Email Support',
      '50GB Storage',
      'Advanced Analytics',
      'Increased API Limits',
      'Custom Domains',
      'Team Collaboration',
    ],
    cta: 'Upgrade to Pro',
    href: '/auth/register',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For large organizations with complex needs.',
    features: [
      'Everything in Pro',
      '24/7 Phone Support',
      'Unlimited Storage',
      'Custom SLA',
      'Dedicated Account Manager',
      'SSO & Advanced Security',
      'On-Premise Deployment Options',
    ],
    cta: 'Contact Sales',
    href: '/support',
    popular: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen pt-24 pb-12 bg-[#050505]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-neutral-400">
            No hidden fees. No surprise charges. Choose the plan that best fits your needs.
          </p>
        </div>

        {/* Pricing Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {tiers.map((tier, index) => (
            <div
              key={tier.name}
              className={`relative flex flex-col p-8 rounded-3xl backdrop-blur-xl border \${
                tier.popular 
                  ? 'bg-primary/5 border-primary/50 shadow-2xl shadow-primary/10 scale-105 z-10' 
                  : 'bg-white/[0.02] border-white/10'
              } animate-in fade-in zoom-in-95 duration-500 delay-\${index * 100}`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                  <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-xl font-semibold text-white mb-2">{tier.name}</h3>
                <p className="text-neutral-400 text-sm h-10">{tier.description}</p>
                <div className="mt-4 flex items-baseline text-white">
                  <span className="text-5xl font-bold tracking-tight">{tier.price}</span>
                  {tier.interval && (
                    <span className="text-xl text-neutral-500 ml-1">{tier.interval}</span>
                  )}
                </div>
              </div>

              <ul className="flex-1 space-y-4 mb-8">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start text-neutral-300">
                    <Check
                      className={`h-5 w-5 shrink-0 mr-3 \${tier.popular ? 'text-primary' : 'text-emerald-500'}`}
                    />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link href={tier.href} className="mt-auto">
                <Button
                  variant={tier.popular ? 'primary' : 'outline'}
                  className={`w-full py-6 rounded-xl text-md font-semibold \${
                    !tier.popular && "bg-white/5 hover:bg-white/10 border-white/10 text-white"
                  }`}
                >
                  {tier.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>

        {/* FAQ Preview */}
        <div className="max-w-3xl mx-auto mt-24 text-center animate-in fade-in duration-1000 delay-300">
          <h2 className="text-2xl font-bold text-white mb-4">Have questions?</h2>
          <p className="text-neutral-400 mb-8">
            Check out our detailed{' '}
            <Link href="/docs" className="text-primary hover:underline">
              documentation
            </Link>{' '}
            or reach out to our{' '}
            <Link href="/support" className="text-primary hover:underline">
              support team
            </Link>
            . We're here to help you get the most out of DevineDesk.
          </p>
        </div>
      </div>
    </div>
  );
}
