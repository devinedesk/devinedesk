const fs = require('fs');
const path = require('path');

const SETTINGS_PAGES = [
  'workspace',
  'organization',
  'branding',
  'theme',
  'accessibility',
  'language',
  'region',
  'timezone',
  'password',
  'passkeys',
  'sessions',
  'devices',
  'privacy',
  'payments',
  'invoices',
  'subscription',
  'usage',
  'storage',
  'ai',
  'api-keys',
  'webhooks',
  'automation',
  'roles',
  'permissions',
  'email',
  'sms',
  'push',
  'backups',
  'import',
  'export',
  'advanced',
  'experimental',
  'feature-flags',
];

const SETTINGS_DIR = path.join(__dirname, '../app/settings');

if (!fs.existsSync(SETTINGS_DIR)) {
  fs.mkdirSync(SETTINGS_DIR, { recursive: true });
}

SETTINGS_PAGES.forEach((page) => {
  const pageDir = path.join(SETTINGS_DIR, page);
  if (!fs.existsSync(pageDir)) {
    fs.mkdirSync(pageDir, { recursive: true });
  }

  const pagePath = path.join(pageDir, 'page.js');

  const formattedTitle = page
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  const componentName = formattedTitle.replace(/\s+/g, '') + 'Settings';

  const content = `import { Card } from "@/components/ui/Card";
import { getServerSession } from "next-auth/next";
import { EmptyState } from "@/components/ui/EmptyState";
import { Settings } from "lucide-react";

export default async function ${componentName}() {
  const session = await getServerSession();
  
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-white">${formattedTitle}</h2>
        <p className="text-neutral-secondary mt-1">Manage your ${formattedTitle.toLowerCase()} preferences.</p>
      </div>

      <Card className="p-6 border-neutral-border-glass bg-neutral-card-bg/50 backdrop-blur-md">
        <EmptyState 
          icon={Settings} 
          title="${formattedTitle} Config" 
          description="This section is currently under development."
        />
      </Card>
    </div>
  );
}
`;

  if (!fs.existsSync(pagePath)) {
    fs.writeFileSync(pagePath, content);
    console.log(`Created: \${pagePath}`);
  }
});

console.log('Done generating settings stubs.');
