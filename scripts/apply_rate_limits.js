const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach((f) => {
    const dirPath = path.join(dir, f);
    if (fs.statSync(dirPath).isDirectory()) {
      walkDir(dirPath, callback);
    } else {
      callback(dirPath);
    }
  });
}

const targetMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

walkDir('app/api', (filePath) => {
  if (!filePath.endsWith('route.js')) return;

  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Add the imports if missing
  if (!content.includes('import { checkRateLimit } from')) {
    const depth = filePath.split(path.sep).length - 2; // Subtract base 'app/api' depth offset loosely
    // Simpler relative import logic: just use alias
    content = `import { checkRateLimit } from '@/src/lib/rateLimit';\n` + content;
    changed = true;
  }

  if (!content.includes('NextResponse')) {
    content = `import { NextResponse } from 'next/server';\n` + content;
    changed = true;
  }

  // Regex to find exported functions
  targetMethods.forEach((method) => {
    // Matches: export async function GET(req, { params }) {
    const regex = new RegExp(
      `export\\s+async\\s+function\\s+${method}\\s*\\(([^)]*)\\)\\s*\\{`,
      'g'
    );

    content = content.replace(regex, (match, args) => {
      // If it already has rate limiting, skip
      if (content.includes('const rateLimit = await checkRateLimit')) return match;
      changed = true;

      const reqArg = args.split(',')[0].trim() || 'req';

      return `${match}
  const ip = ${reqArg}?.headers?.get("x-forwarded-for") ?? "127.0.0.1";
  const rateLimit = await checkRateLimit(\`\${ip}_api\`, 'FREE'); // Default to free tier globally
  if (!rateLimit.success) {
    return NextResponse.json({ error: 'Too Many Requests' }, { 
      status: 429,
      headers: {
        'X-RateLimit-Limit': rateLimit.limit.toString(),
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.reset.toString()
      }
    });
  }
`;
    });
  });

  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`Injected rate limiting into: ${filePath}`);
  }
});

console.log('Finished applying rate limits.');
