'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MailCheck, XCircle } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMsg('No verification token found.');
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Verification failed');

        setStatus('success');
      } catch (err) {
        setStatus('error');
        setErrorMsg('The verification link has expired or is invalid.');
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="w-full max-w-md mx-auto space-y-6 text-center animate-in fade-in zoom-in-95 duration-500">
      <div className="bg-neutral-card-bg/50 backdrop-blur-xl border border-neutral-border-glass rounded-2xl p-8 shadow-2xl">
        {status === 'verifying' && (
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 flex items-center justify-center text-primary">
              <Spinner size="lg" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">Verifying your email...</h1>
            <p className="text-neutral-secondary text-sm">
              Please wait while we validate your secure link.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mx-auto w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center border border-emerald-500/20">
              <MailCheck size={32} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Email Verified!</h1>
            <p className="text-neutral-secondary text-sm">
              Your account has been successfully verified. You can now access all DevineDesk
              features.
            </p>
            <div className="pt-4">
              <Button
                onClick={() => router.push('/dashboard')}
                variant="primary"
                className="w-full"
              >
                Continue to Dashboard
              </Button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mx-auto w-16 h-16 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center border border-red-500/20">
              <XCircle size={32} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">Verification Failed</h1>
            <p className="text-red-400/80 text-sm font-medium">{errorMsg}</p>
            <div className="pt-4">
              <Button
                onClick={() => router.push('/auth/login')}
                className="w-full bg-white/5 hover:bg-white/10 text-white"
              >
                Back to Login
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
