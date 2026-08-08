export const dynamic = "force-dynamic";

import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { SettingsService } from '@/src/lib/services/settingsService';
import { DynamicSettingsForm } from '@/components/settings/DynamicSettingsForm';

export default async function AccessibilitySettings() {
  const session = await getServerSession();
  if (!session?.user?.id) redirect('/auth/signin');

  const settingsMap = await SettingsService.getSettings(session.user.id);

  const schema = [
    {
      key: 'accessibility_high_contrast',
      label: 'High Contrast Mode',
      description: 'Increases contrast to improve text readability across the platform.',
      type: 'toggle',
    },
    {
      key: 'accessibility_reduce_motion',
      label: 'Reduce Motion',
      description: 'Disables non-essential animations and transitions.',
      type: 'toggle',
    },
    {
      key: 'accessibility_screen_reader',
      label: 'Screen Reader Optimization',
      description: 'Adds extra hidden labels and aria tags for screen readers.',
      type: 'toggle',
    },
    {
      key: 'accessibility_font_size',
      label: 'Base Font Size',
      description: 'Adjust the base font scaling for the UI.',
      type: 'select',
      defaultValue: 'medium',
      options: [
        { label: 'Small', value: 'small' },
        { label: 'Medium (Default)', value: 'medium' },
        { label: 'Large', value: 'large' },
        { label: 'Extra Large', value: 'xlarge' },
      ],
    }
  ];

  return (
    <DynamicSettingsForm 
      title="Accessibility"
      description="Customize the platform to fit your personal accessibility requirements."
      schema={schema}
      initialData={settingsMap}
    />
  );
}
