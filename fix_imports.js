const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function (file) {
    if (file === 'node_modules' || file === '.next') return;
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.js') || file.endsWith('.jsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(path.join(__dirname, 'app')).concat(
  walk(path.join(__dirname, 'components')),
  walk(path.join(__dirname, 'src'))
);

let changedCount = 0;
files.forEach((file) => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Replace missing imports
  content = content.replace(/@\/lib\/prisma/g, '@/src/lib/prisma');
  content = content.replace(/@\/lib\/env/g, '@/src/lib/env');
  content = content.replace(/@\/lib\/apiHandler/g, '@/src/lib/apiHandler');
  content = content.replace(/@\/lib\/billingService/g, '@/src/lib/services/billingService');
  content = content.replace(/@\/lib\/workflowService/g, '@/src/lib/services/workflowService');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    changedCount++;
    console.log('Fixed imports in', file);
  }
});

console.log('Total files fixed:', changedCount);
