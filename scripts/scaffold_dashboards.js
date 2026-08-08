const fs = require('fs');
const path = require('path');

const DASHBOARD_PAGES = [
  'workspace',
  'organization',
  'user',
  'developer',
  'finance',
  'operations',
  'infrastructure',
  'monitoring',
  'api',
  'system-health',
  'queue',
  'storage',
  'audit',
  'logs',
  'metrics',
  'performance',
  'cost',
  'usage',
  'deployment',
  'feature-flag',
];

const DASHBOARD_DIR = path.join(__dirname, '../app/dashboard');

if (!fs.existsSync(DASHBOARD_DIR)) {
  fs.mkdirSync(DASHBOARD_DIR, { recursive: true });
}

DASHBOARD_PAGES.forEach((page) => {
  const pageDir = path.join(DASHBOARD_DIR, page);
  if (!fs.existsSync(pageDir)) {
    fs.mkdirSync(pageDir, { recursive: true });
  }

  const pagePath = path.join(pageDir, 'page.js');

  const formattedTitle = page
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  const componentName = formattedTitle.replace(/\s+/g, '') + 'Dashboard';

  const content = `import { Card } from "@/components/ui/Card";
import { getServerSession } from "next-auth/next";
import { EmptyState } from "@/components/ui/EmptyState";
import { Activity } from "lucide-react";

export default async function ${componentName}() {
  const session = await getServerSession();
  
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-white">${formattedTitle} Dashboard</h2>
        <p className="text-neutral-secondary mt-1">Monitor and manage ${formattedTitle.toLowerCase()} metrics.</p>
      </div>

      <Card className="p-6 border-neutral-border-glass bg-neutral-card-bg/50 backdrop-blur-md">
        <EmptyState 
          icon={Activity} 
          title="${formattedTitle} Overview" 
          description="Dashboard components and metrics are currently being provisioned."
        />
      </Card>
    </div>
  );
}
`;

  if (!fs.existsSync(pagePath)) {
    fs.writeFileSync(pagePath, content);
    console.log(`Created: ${pagePath}`);
  }
});

console.log('Done generating dashboard stubs.');
