'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send reset email.');

      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
    }
  };

  if (status === 'success') {
    return (
      <div className="w-full max-w-md mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mb-4 border border-emerald-500/20">
            <CheckCircle2 size={24} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Check your email</h1>
          <p className="text-neutral-secondary text-sm mt-2">
            Didn&apos;t receive the email? Check spam or{' '}
            <button onClick={() => setStatus('idle')} className="text-primary hover:underline">
              try again
            </button>
          </p>
        </div>

        <div className="pt-4 text-center">
          <Link
            href="/auth/login"
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-white">Reset Password</h1>
        <p className="text-neutral-secondary text-sm">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <div className="bg-neutral-card-bg/50 backdrop-blur-xl border border-neutral-border-glass rounded-2xl p-6 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-neutral-300">
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-5 w-5 text-neutral-500" />
              <input
                id="email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white/5 border border-neutral-border-glass rounded-xl py-2.5 pl-10 pr-4 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
          </div>

          {status === 'error' && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
              {errorMsg}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full py-2.5 rounded-xl font-medium"
            disabled={status === 'loading' || !email}
          >
            {status === 'loading' ? 'Sending link...' : 'Send reset link'}
          </Button>
        </form>
      </div>

      <div className="text-center">
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} /> Back to login
        </Link>
      </div>
    </div>
  );
}
