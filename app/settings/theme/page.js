'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Palette, Loader2, Save, Monitor, Sun, Moon } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ThemeSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [accent, setAccent] = useState('cyan');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          if (data.theme) setTheme(data.theme);
          if (data.accent) setAccent(data.accent);
        }
      } catch (e) {}
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme, accent }),
      });
      if (res.ok) toast.success('Appearance settings updated');
      else toast.error('Failed to update settings');
    } catch (e) {
      toast.error('Failed to update settings');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-cyan-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Palette className="h-6 w-6 text-cyan-500" /> Appearance
        </h2>
        <p className="text-neutral-400 mt-1">Customize the look and feel of your dashboard.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Theme Mode */}
        <Card className="p-6 border-zinc-800 bg-zinc-900/50">
          <h3 className="text-lg font-medium text-white mb-4">Theme Mode</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Light */}
            <label
              className={`cursor-pointer rounded-xl border-2 transition-all p-1 ${theme === 'light' ? 'border-cyan-500' : 'border-transparent hover:border-zinc-700'}`}
            >
              <div className="bg-zinc-100 rounded-lg p-4 aspect-video flex flex-col items-center justify-center gap-3">
                <Sun className="h-8 w-8 text-orange-500" />
                <span className="text-sm font-medium text-zinc-900">Light</span>
              </div>
              <input
                type="radio"
                name="theme"
                value="light"
                checked={theme === 'light'}
                onChange={() => setTheme('light')}
                className="hidden"
              />
            </label>

            {/* Dark */}
            <label
              className={`cursor-pointer rounded-xl border-2 transition-all p-1 ${theme === 'dark' ? 'border-cyan-500' : 'border-transparent hover:border-zinc-700'}`}
            >
              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 aspect-video flex flex-col items-center justify-center gap-3">
                <Moon className="h-8 w-8 text-cyan-400" />
                <span className="text-sm font-medium text-white">Dark</span>
              </div>
              <input
                type="radio"
                name="theme"
                value="dark"
                checked={theme === 'dark'}
                onChange={() => setTheme('dark')}
                className="hidden"
              />
            </label>

            {/* System */}
            <label
              className={`cursor-pointer rounded-xl border-2 transition-all p-1 ${theme === 'system' ? 'border-cyan-500' : 'border-transparent hover:border-zinc-700'}`}
            >
              <div className="bg-gradient-to-br from-zinc-100 to-zinc-950 rounded-lg p-4 aspect-video flex flex-col items-center justify-center gap-3 border border-zinc-800">
                <Monitor className="h-8 w-8 text-zinc-500" />
                <span className="text-sm font-medium text-white mix-blend-difference">System</span>
              </div>
              <input
                type="radio"
                name="theme"
                value="system"
                checked={theme === 'system'}
                onChange={() => setTheme('system')}
                className="hidden"
              />
            </label>
          </div>
        </Card>

        {/* Accent Color */}
        <Card className="p-6 border-zinc-800 bg-zinc-900/50">
          <h3 className="text-lg font-medium text-white mb-4">Accent Color</h3>
          <div className="flex flex-wrap gap-4">
            {[
              { id: 'cyan', color: 'bg-cyan-500' },
              { id: 'blue', color: 'bg-blue-500' },
              { id: 'violet', color: 'bg-violet-500' },
              { id: 'pink', color: 'bg-pink-500' },
              { id: 'rose', color: 'bg-rose-500' },
              { id: 'orange', color: 'bg-orange-500' },
              { id: 'emerald', color: 'bg-emerald-500' },
            ].map((c) => (
              <label key={c.id} className="cursor-pointer flex flex-col items-center gap-2">
                <div
                  className={`w-12 h-12 rounded-full ${c.color} flex items-center justify-center shadow-lg transition-transform hover:scale-110 ${accent === c.id ? 'ring-4 ring-white/20 ring-offset-2 ring-offset-zinc-900' : ''}`}
                >
                  {accent === c.id && <div className="w-4 h-4 bg-white rounded-full"></div>}
                </div>
                <input
                  type="radio"
                  name="accent"
                  value={c.id}
                  checked={accent === c.id}
                  onChange={() => setAccent(c.id)}
                  className="hidden"
                />
              </label>
            ))}
          </div>
        </Card>

        <div className="flex justify-end pt-4 border-t border-zinc-800">
          <Button
            type="submit"
            disabled={saving || (theme === 'dark' && accent === 'cyan')}
            className="bg-cyan-500 hover:bg-cyan-600 text-black px-6 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </form>
    </div>
  );
}
