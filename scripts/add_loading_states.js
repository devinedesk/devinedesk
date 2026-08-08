const fs = require('fs');
const path = require('path');

const sections = [
  {
    basePath: 'app/dashboard',
    skeleton: `import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";\n\nexport default function Loading() {\n  return <DashboardSkeleton />;\n}\n`,
  },
  {
    basePath: 'app/settings',
    skeleton: `import { SettingsSkeleton } from "@/components/settings/SettingsSkeleton";\n\nexport default function Loading() {\n  return <SettingsSkeleton />;\n}\n`,
  },
  {
    basePath: 'app/admin',
    skeleton: `import { AdminSkeleton } from "@/components/admin/AdminSkeleton";\n\nexport default function Loading() {\n  // Assuming a generic fallback if AdminSkeleton doesn't exist yet\n  return (\n    <div className="space-y-6 animate-pulse">\n      <div className="h-8 bg-white/10 rounded w-1/4"></div>\n      <div className="h-64 bg-white/5 rounded-2xl w-full"></div>\n      <div className="h-64 bg-white/5 rounded-2xl w-full"></div>\n    </div>\n  );\n}\n`,
  },
];

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach((f) => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      callback(path.join(dir, f));
    }
  });
}

sections.forEach((section) => {
  const dirsWithPages = new Set();

  walkDir(section.basePath, (filePath) => {
    if (filePath.endsWith('page.js') || filePath.endsWith('page.jsx')) {
      dirsWithPages.add(path.dirname(filePath));
    }
  });

  dirsWithPages.forEach((dir) => {
    const loadingPathJs = path.join(dir, 'loading.js');
    const loadingPathJsx = path.join(dir, 'loading.jsx');

    // Check if loading state already exists
    if (!fs.existsSync(loadingPathJs) && !fs.existsSync(loadingPathJsx)) {
      console.log(`Adding loading.js to ${dir}`);
      fs.writeFileSync(loadingPathJs, section.skeleton);
    }
  });
});
console.log('Done adding loading states.');
