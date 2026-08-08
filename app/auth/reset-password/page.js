'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setStatus('error');
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setStatus('error');
      setErrorMsg('Password must be at least 8 characters.');
      return;
    }

    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password.');

      setStatus('success');
      setTimeout(() => router.push('/auth/login'), 2000);
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message || 'Failed to reset password. The link may have expired.');
    }
  };

  if (!token) {
    return (
      <div className="w-full max-w-md mx-auto text-center animate-in fade-in zoom-in-95 duration-500 bg-red-500/10 border border-red-500/20 p-6 rounded-2xl">
        <h1 className="text-xl font-bold text-red-400 mb-2">Invalid Request</h1>
        <p className="text-neutral-300 text-sm">
          No reset token was found in the URL. Please ensure you clicked the exact link sent to your
          email.
        </p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="w-full max-w-md mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-500 text-center">
        <div className="mx-auto w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mb-4 border border-emerald-500/20">
          <CheckCircle2 size={24} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Password Updated</h1>
        <p className="text-neutral-secondary text-sm">
          Your password has been successfully reset. Redirecting to login...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-white">Set New Password</h1>
        <p className="text-neutral-secondary text-sm">
          Enter a strong, secure password that you haven't used before.
        </p>
      </div>

      <div className="bg-neutral-card-bg/50 backdrop-blur-xl border border-neutral-border-glass rounded-2xl p-6 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-5 w-5 text-neutral-500" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-white/5 border border-neutral-border-glass rounded-xl py-2.5 pl-10 pr-4 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-5 w-5 text-neutral-500" />
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
            className="w-full py-2.5 rounded-xl font-medium mt-2"
            disabled={status === 'loading' || !password || !confirmPassword}
          >
            {status === 'loading' ? 'Updating...' : 'Update password'}
          </Button>
        </form>
      </div>
    </div>
  );
}
