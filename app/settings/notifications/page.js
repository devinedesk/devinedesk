export const dynamic = "force-dynamic";

import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { SettingsService } from '@/src/lib/services/settingsService';
import { DynamicSettingsForm } from '@/components/settings/DynamicSettingsForm';

export default async function NotificationsSettings() {
  const session = await getServerSession();
  if (!session?.user?.id) redirect('/auth/signin');

  const settingsMap = await SettingsService.getSettings(session.user.id);

  const schema = [
    {
      key: 'notifications_email_marketing',
      label: 'Marketing Emails',
      description: 'Receive product updates, newsletters, and promotional offers.',
      type: 'toggle',
    },
    {
      key: 'notifications_email_billing',
      label: 'Billing & Account Alerts',
      description: 'Critical notifications about your subscription and limits.',
      type: 'toggle',
    },
    {
      key: 'notifications_workflow_success',
      label: 'Workflow Success',
      description: 'Get notified when a long-running generation completes successfully.',
      type: 'toggle',
    },
    {
      key: 'notifications_workflow_failure',
      label: 'Workflow Failure',
      description: 'Get notified immediately if a generation fails.',
      type: 'toggle',
    },
    {
      key: 'notifications_push_enabled',
      label: 'Push Notifications',
      description: 'Receive push notifications in your browser.',
      type: 'toggle',
    }
  ];

  return (
    <DynamicSettingsForm 
      title="Notifications"
      description="Manage how you receive alerts and communications from the platform."
      schema={schema}
      initialData={settingsMap}
    />
  );
}
