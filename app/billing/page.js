"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { apiClient } from "@/src/lib/apiClient";

const PACKAGES = [
  { id: 'pkg_500', name: '500 Credits', credits: 500, price: '$5.00', icon: '💎' },
  { id: 'pkg_2000', name: '2000 Credits', credits: 2000, price: '$15.00', icon: '🚀', popular: true },
  { id: 'pkg_5000', name: '5000 Credits', credits: 5000, price: '$35.00', icon: '👑' },
];

export default function BillingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState('');

  const handleCheckout = async (packageId) => {
    if (!session) {
      router.push('/auth/login?callbackUrl=/billing');
      return;
    }

    setLoading(packageId);
    setError('');

    try {
      const data = await apiClient.post('/billing/checkout', { packageId });

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned from server');
      }
    } catch (err) {
      setError(err.message || 'Failed to initialize checkout');
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-app-bg text-white p-8 font-sans pt-24">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600 mb-4">
            Credits & Billing
          </h1>
          <p className="text-secondary text-lg max-w-2xl mx-auto">
            Top up your account to generate more AI images, videos, and workflows. Credits never expire.
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-900/30 border border-red-500/50 rounded-xl text-red-200 text-center font-medium">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {PACKAGES.map((pkg) => (
            <Card 
              key={pkg.id}
              hover
              padding="lg"
              className={`relative flex flex-col items-center text-center ${
                pkg.popular 
                  ? 'border-primary/50 shadow-glow' 
                  : ''
              }`}
            >
              {pkg.popular && (
                <div className="absolute top-0 right-0 left-0 bg-primary text-black text-xs font-bold py-1 px-3 text-center uppercase tracking-wider">
                  Most Popular
                </div>
              )}
              
              <div className="text-4xl mb-4 mt-2">{pkg.icon}</div>
              <h3 className="text-2xl font-bold mb-2 text-white">{pkg.name}</h3>
              <div className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-6">
                {pkg.price}
              </div>
              
              <ul className="text-secondary space-y-3 mb-8 flex-1">
                <li>~{Math.floor(pkg.credits / 10)} Image Generations</li>
                <li>~{Math.floor(pkg.credits / 50)} Video Generations</li>
                <li>Priority API Queue</li>
              </ul>

              <Button
                variant={pkg.popular ? "primary" : "secondary"}
                onClick={() => handleCheckout(pkg.id)}
                isLoading={loading === pkg.id}
                className="w-full"
                size="lg"
              >
                Purchase Credits
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
