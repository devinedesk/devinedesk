'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowLeft, MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { signIn } from 'next-auth/react';

export default function MagicLinkPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await signIn('email', { email, redirect: false });
      if (res?.error) {
        throw new Error(res.error);
      }
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMsg(
        err.message || 'Failed to send magic link. Please check your email and try again.'
      );
    }
  };

  if (status === 'success') {
    return (
      <div className="w-full max-w-md mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4 border border-primary/20">
            <MailCheck size={24} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Check your email</h1>
          <p className="text-neutral-secondary text-sm mt-2">
            Didn&apos;t receive it? Check spam or{' '}
            <button onClick={() => setStatus('idle')} className="text-primary hover:underline">
              try again
            </button>
            . We&apos;ve sent a magic link to{' '}
            <span className="text-white font-medium">{email}</span>. Click the link in the email to
            sign in instantly.
          </p>
        </div>

        <div className="pt-4 text-center space-y-4">
          <Button
            onClick={() => setStatus('idle')}
            className="bg-white/5 hover:bg-white/10 text-white w-full rounded-xl py-2.5"
          >
            Try a different email
          </Button>
          <Link
            href="/auth/login"
            className="block text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Return to regular sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
          <Sparkles className="text-primary h-6 w-6" /> Magic Link
        </h1>
        <p className="text-neutral-secondary text-sm">
          Sign in instantly without a password. We'll send a secure login link directly to your
          inbox.
        </p>
      </div>

      <div className="bg-neutral-card-bg/50 backdrop-blur-xl border border-neutral-border-glass rounded-2xl p-6 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-neutral-300">
              Email address
            </label>
            <input
              id="email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-white/5 border border-neutral-border-glass rounded-xl py-2.5 px-4 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

          {status === 'error' && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
              {errorMsg}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full py-2.5 rounded-xl font-medium mt-2 group relative overflow-hidden"
            disabled={status === 'loading' || !email}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-purple-500 to-primary opacity-0 group-hover:opacity-20 transition-opacity" />
            <span className="relative flex items-center justify-center gap-2">
              {status === 'loading' ? 'Sending...' : 'Send Magic Link'}
            </span>
          </Button>
        </form>
      </div>

      <p className="text-center text-sm text-neutral-500 mt-6">
        Don&apos;t want to use magic links?{' '}
        <Link href="/auth/login" className="text-primary hover:underline">
          Sign in with password
        </Link>
      </p>
    </div>
  );
}
