export const dynamic = "force-dynamic";

import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { SettingsService } from '@/src/lib/services/settingsService';
import { DynamicSettingsForm } from '@/components/settings/DynamicSettingsForm';

export default async function AutomationSettings() {
  const session = await getServerSession();
  if (!session?.user?.id) redirect('/auth/signin');

  const settingsMap = await SettingsService.getSettings(session.user.id);

  const schema = [
    {
      key: 'automation_auto_retry',
      label: 'Auto-Retry Failed Jobs',
      description: 'Automatically retry failed generation tasks up to 3 times.',
      type: 'toggle',
    },
    {
      key: 'automation_webhook_alerts',
      label: 'Webhook Alerting',
      description: 'Fire configured webhooks on automation errors.',
      type: 'toggle',
    },
    {
      key: 'automation_schedule_timezone',
      label: 'Schedule Timezone',
      description: 'Default timezone for scheduled automation runs.',
      type: 'select',
      defaultValue: 'UTC',
      options: [
        { label: 'UTC', value: 'UTC' },
        { label: 'America/New_York (EST)', value: 'America/New_York' },
        { label: 'America/Los_Angeles (PST)', value: 'America/Los_Angeles' },
        { label: 'Europe/London (GMT)', value: 'Europe/London' },
      ],
    }
  ];

  return (
    <DynamicSettingsForm 
      title="Automation"
      description="Configure global settings for automated workflows and scheduled tasks."
      schema={schema}
      initialData={settingsMap}
    />
  );
}
