'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Save } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { AvatarUpload } from '@/components/dashboard/AvatarUpload';

export default function AccountSettings() {
  const { data: session, update } = useSession();
  const [name, setName] = useState(session?.user?.name || '');
  const [image, setImage] = useState(session?.user?.image || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session?.user?.name) setName(session.user.name);
    if (session?.user?.image) setImage(session.user.image);
  }, [session]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/user/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        await update({ name });
        toast.success('Account updated successfully');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to update account');
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-white">Account Settings</h2>
        <p className="text-neutral-secondary mt-1">Manage your personal profile and appearance.</p>
      </div>

      <Card className="p-6 border-neutral-border-glass bg-neutral-card-bg/50">
        <div className="flex flex-col items-center justify-center pb-6 border-b border-neutral-border-glass mb-6">
          <AvatarUpload currentImage={image} onImageUpdate={setImage} />
          <p className="text-xs text-neutral-400 mt-3">
            Click to upload a new profile picture (Max 5MB)
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-200">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-200">Email</label>
            <Input defaultValue={session?.user?.email || ''} disabled className="opacity-50" />
            <p className="text-xs text-neutral-500">Email cannot be changed.</p>
          </div>

          <div className="pt-4 border-t border-neutral-border-glass flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? (
                <div className="h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
