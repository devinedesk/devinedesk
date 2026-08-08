'use client';
import Image from 'next/image';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import {
  Shield,
  ShieldAlert,
  Key,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function SecuritySettings() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [enrolling, setEnrolling] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/user/me');
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (err) {
      toast.error('Failed to load security settings');
    } finally {
      setLoading(false);
    }
  };

  const startEnrollment = async () => {
    setEnrolling(true);
    setIsEnrollModalOpen(true);
    setCode(['', '', '', '', '', '']);

    try {
      const res = await fetch('/api/auth/2fa/generate', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setQrCodeUrl(data.qrCodeUrl);
      setTotpSecret(data.secret);

      // Auto-focus first input after a short delay to allow modal render
      setTimeout(() => {
        if (inputRefs.current[0]) inputRefs.current[0].focus();
      }, 300);
    } catch (err) {
      toast.error(err.message || 'Failed to start 2FA enrollment');
      setIsEnrollModalOpen(false);
    } finally {
      setEnrolling(false);
    }
  };

  const verifyAndEnable = async (e) => {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length !== 6) return;

    setVerifying(true);
    try {
      const res = await fetch('/api/auth/2fa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: fullCode }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid code');

      toast.success('Two-Factor Authentication enabled!');
      setIsEnrollModalOpen(false);
      setProfile((prev) => ({ ...prev, twoFactorEnabled: true }));
    } catch (err) {
      toast.error(err.message);
      setCode(['', '', '', '', '', '']);
      if (inputRefs.current[0]) inputRefs.current[0].focus();
    } finally {
      setVerifying(false);
    }
  };

  const disable2FA = async () => {
    if (!confirm('Are you sure you want to disable 2FA? This will make your account less secure.'))
      return;

    try {
      const res = await fetch('/api/auth/2fa/disable', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to disable 2FA');

      toast.success('Two-Factor Authentication disabled');
      setProfile((prev) => ({ ...prev, twoFactorEnabled: false }));
    } catch (err) {
      toast.error(err.message);
    }
  };

  const deleteAccount = async () => {
    if (
      !confirm(
        'DANGER: Are you absolutely sure you want to permanently delete your account? This cannot be undone.'
      )
    )
      return;

    try {
      const res = await fetch('/api/user/me', { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success('Account deleted. Redirecting...');
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleChange = (index, value) => {
    if (value && !/^\d+$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1].focus();
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-white">Security & Privacy</h2>
        <p className="text-neutral-secondary mt-1">
          Manage your passwords, 2FA, and active sessions.
        </p>
      </div>

      <Card className="p-6 border-neutral-border-glass bg-neutral-card-bg/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`p-3 rounded-xl ${profile?.twoFactorEnabled ? 'bg-green-500/10 text-green-500' : 'bg-primary/10 text-primary'}`}
            >
              {profile?.twoFactorEnabled ? (
                <ShieldCheck className="h-6 w-6" />
              ) : (
                <Shield className="h-6 w-6" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-medium text-white flex items-center gap-2">
                Two-Factor Authentication
                {profile?.twoFactorEnabled && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-500/10 text-green-400">
                    Enabled
                  </span>
                )}
              </h3>
              <p className="text-sm text-neutral-400">
                Add an extra layer of security to your account.
              </p>
            </div>
          </div>
          {profile?.twoFactorEnabled ? (
            <Button
              variant="outline"
              onClick={disable2FA}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-500/20"
            >
              Disable 2FA
            </Button>
          ) : (
            <Button variant="primary" onClick={startEnrollment} disabled={enrolling}>
              {enrolling ? 'Starting...' : 'Enable 2FA'}
            </Button>
          )}
        </div>
      </Card>

      <Card className="p-6 border-red-500/20 bg-red-500/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-500/20 rounded-xl text-red-500">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-red-400">Danger Zone</h3>
              <p className="text-sm text-red-400/80">
                Permanently delete your account and all associated data.
              </p>
            </div>
          </div>
          <Button variant="destructive" onClick={deleteAccount}>
            Delete Account
          </Button>
        </div>
      </Card>

      <Modal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        title="Set up Two-Factor Auth"
        maxWidth="max-w-md"
      >
        <div className="space-y-6">
          <div className="space-y-2 text-center">
            <p className="text-sm text-neutral-300">
              Scan the QR code below with your authenticator app (like Google Authenticator or
              Authy).
            </p>
          </div>

          {qrCodeUrl ? (
            <div className="flex justify-center p-4 bg-white rounded-xl mx-auto w-fit">
              <Image
                src={qrCodeUrl}
                alt="2FA QR Code"
                width={192}
                height={192}
                className="w-48 h-48"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 w-48 mx-auto bg-neutral-800 rounded-xl animate-pulse" />
          )}

          <div className="text-center space-y-2">
            <p className="text-xs text-neutral-500">Or enter this setup key manually:</p>
            <code className="px-3 py-1 bg-black/40 border border-white/10 rounded text-sm text-primary tracking-wider font-mono">
              {totpSecret || 'Loading...'}
            </code>
          </div>

          <form onSubmit={verifyAndEnable} className="space-y-4 pt-4 border-t border-white/10">
            <label className="block text-sm font-medium text-center text-neutral-300">
              Enter the 6-digit code from your app
            </label>
            <div className="flex justify-center gap-2">
              {code.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="w-12 h-14 text-center text-xl font-bold bg-white/5 border border-neutral-border-glass rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  disabled={verifying}
                />
              ))}
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-4 py-2.5 rounded-xl font-medium"
              disabled={verifying || code.join('').length !== 6}
            >
              {verifying ? 'Verifying...' : 'Verify & Enable'}
            </Button>
          </form>
        </div>
      </Modal>
    </div>
  );
}
