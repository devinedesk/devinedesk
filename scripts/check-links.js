const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const allFiles = execSync('find app components -name "*.js" -o -name "*.jsx" -o -name "*.tsx"')
  .toString()
  .split('\n')
  .filter(Boolean);
const existingRoutes = new Set();
const allPages = execSync('find app -name "page.js" -o -name "page.tsx"')
  .toString()
  .split('\n')
  .filter(Boolean);

allPages.forEach((p) => {
  let route = p.replace('app/', '/').replace('/page.js', '').replace('/page.tsx', '');
  if (route === '') route = '/';
  if (route === '//') route = '/';
  existingRoutes.add(route);
});

console.log('Found', existingRoutes.size, 'routes');

let broken = 0;
allFiles.forEach((file) => {
  const content = fs.readFileSync(file, 'utf8');
  const regex = /href=(?:{"|'|`|"|{'|{`)([^"'{`]+)(?:"|'|`|"|'}|`})/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    let href = match[1];
    if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('#')) continue;
    if (href.includes('$')) continue; // Skip dynamic templates

    // exact match
    if (!existingRoutes.has(href)) {
      // try without trailing slash or specific ID mapping
      if (!href.includes('[id]') && !href.includes('[agent_id]')) {
        console.log(`Potential Broken Link: ${href} in ${file}`);
        broken++;
      }
    }
  }
});
console.log(`Total potential broken links: ${broken}`);
