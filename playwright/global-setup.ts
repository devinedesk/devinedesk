import { chromium, FullConfig } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function globalSetup(config: FullConfig) {
  const { baseURL, storageState } = config.projects[0].use;
  
  // 1. Seed the database with an Admin User
  const email = 'admin_e2e@example.com';
  const password = 'SecurePass123!';
  const hashedPassword = await bcrypt.hash(password, 10);
  
  await prisma.user.upsert({
    where: { email },
    update: { password: hashedPassword, role: 'ADMIN' },
    create: {
      email,
      name: 'E2E Admin',
      password: hashedPassword,
      role: 'ADMIN',
    }
  });

  // 2. Perform login via UI to get the session cookie
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Wait for the server to be ready before navigating
  let isReady = false;
  for (let i = 0; i < 10; i++) {
    try {
      const res = await page.goto(`${baseURL}/auth/login`, { timeout: 5000 });
      if (res && res.ok()) {
        isReady = true;
        break;
      }
    } catch (e) {
      // Ignore and retry
    }
    await new Promise((r) => setTimeout(r, 2000));
  }

  if (!isReady) {
    console.error('Could not reach the server at', baseURL);
    await browser.close();
    return;
  }

  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');

  await page.waitForURL(baseURL + '/dashboard');

  await page.context().storageState({ path: storageState as string });
  await browser.close();
}

export default globalSetup;
