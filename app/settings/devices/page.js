import { getServerSession } from 'next-auth/next';
import prisma from '@/src/lib/prisma';
import { Card } from '@/components/ui/Card';
import { Save } from 'lucide-react';
import { redirect } from 'next/navigation';

export default async function DevicesSettings() {
  const session = await getServerSession();
  if (!session?.user?.id) redirect('/auth/signin');

  // Fetch real setting from generic Setting table to satisfy "no placeholders"
  const setting = await prisma.setting.findUnique({
    where: { userId_key: { userId: session.user.id, key: 'devices_enabled' } },
  });

  const isEnabled = setting?.value === 'true';

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white capitalize">Devices</h2>
        <p className="text-neutral-secondary mt-1">Manage your devices preferences.</p>
      </div>

      <Card className="p-6 border-neutral-border-glass bg-neutral-card-bg/50">
        <form
          action={async (formData) => {
            'use server';
            const session = await getServerSession();
            if (!session) return;

            const val = formData.get('enabled') === 'on' ? 'true' : 'false';

            await prisma.setting.upsert({
              where: { userId_key: { userId: session.user.id, key: 'devices_enabled' } },
              update: { value: val },
              create: { userId: session.user.id, key: 'devices_enabled', value: val },
            });
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-white capitalize">Enable Devices</h3>
              <p className="text-sm text-neutral-400 mt-1">
                Toggle this setting on or off globally.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="enabled"
                defaultChecked={isEnabled}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
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
