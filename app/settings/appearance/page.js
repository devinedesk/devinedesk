import { getServerSession } from 'next-auth/next';
import prisma from '@/src/lib/prisma';
import { Card } from '@/components/ui/Card';
import { Save } from 'lucide-react';
import { redirect } from 'next/navigation';

export default async function AppearanceSettings() {
  const session = await getServerSession();
  if (!session?.user?.id) redirect('/auth/signin');

  const setting = await prisma.setting.findUnique({
    where: { userId_key: { userId: session.user.id, key: 'appearance_mode' } },
  });

  const mode = setting?.value || 'dark';

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white capitalize">Appearance</h2>
        <p className="text-neutral-secondary mt-1">
          Customize the visual appearance of DevineDesk.
        </p>
      </div>

      <Card className="p-6 border-neutral-border-glass bg-neutral-card-bg/50">
        <form
          action={async (formData) => {
            'use server';
            const session = await getServerSession();
            if (!session) return;

            const val = formData.get('mode');
            if (val) {
              await prisma.setting.upsert({
                where: { userId_key: { userId: session.user.id, key: 'appearance_mode' } },
                update: { value: val },
                create: { userId: session.user.id, key: 'appearance_mode', value: val },
              });
            }
          }}
        >
          <div className="flex flex-col gap-4">
            <h3 className="font-medium text-white">Color Mode</h3>
            <div className="grid grid-cols-3 gap-4">
              <label
                className={`cursor-pointer rounded-xl border-2 p-4 flex flex-col items-center gap-3 transition-all ${mode === 'light' ? 'border-primary bg-primary/5' : 'border-neutral-800 hover:border-neutral-700 bg-neutral-900/50'}`}
              >
                <input
                  type="radio"
                  name="mode"
                  value="light"
                  defaultChecked={mode === 'light'}
                  className="sr-only"
                />
                <div className="w-16 h-12 bg-white rounded-md shadow-sm border border-neutral-200" />
                <span className="text-sm font-medium text-white">Light</span>
              </label>

              <label
                className={`cursor-pointer rounded-xl border-2 p-4 flex flex-col items-center gap-3 transition-all ${mode === 'dark' ? 'border-primary bg-primary/5' : 'border-neutral-800 hover:border-neutral-700 bg-neutral-900/50'}`}
              >
                <input
                  type="radio"
                  name="mode"
                  value="dark"
                  defaultChecked={mode === 'dark'}
                  className="sr-only"
                />
                <div className="w-16 h-12 bg-neutral-950 rounded-md shadow-sm border border-neutral-800" />
                <span className="text-sm font-medium text-white">Dark</span>
              </label>

              <label
                className={`cursor-pointer rounded-xl border-2 p-4 flex flex-col items-center gap-3 transition-all ${mode === 'system' ? 'border-primary bg-primary/5' : 'border-neutral-800 hover:border-neutral-700 bg-neutral-900/50'}`}
              >
                <input
                  type="radio"
                  name="mode"
                  value="system"
                  defaultChecked={mode === 'system'}
                  className="sr-only"
                />
                <div className="w-16 h-12 bg-gradient-to-r from-white to-neutral-950 rounded-md shadow-sm border border-neutral-700" />
                <span className="text-sm font-medium text-white">System</span>
              </label>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-neutral-border-glass flex justify-end">
            <button
              type="submit"
              className="bg-primary hover:bg-primary-hover text-black px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <Save size={16} /> Save Changes
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
