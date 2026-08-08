const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with comprehensive mock data for 25+ models...');

  const hashedPassword = await bcrypt.hash('Password123!', 10);

  // 1. Users
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@devinedesk.com' },
    update: {},
    create: {
      email: 'admin@devinedesk.com',
      name: 'Super Admin',
      password: hashedPassword,
      role: 'ADMIN',
      emailVerified: new Date(),
    },
  });

  const normalUser = await prisma.user.upsert({
    where: { email: 'user@devinedesk.com' },
    update: {},
    create: {
      email: 'user@devinedesk.com',
      name: 'Test User',
      password: hashedPassword,
      role: 'USER',
      emailVerified: new Date(),
    },
  });

  // 2. Organization & Workspaces
  const org = await prisma.organization.upsert({
    where: { slug: 'devinedesk-demo' },
    update: {},
    create: {
      name: 'DevineDesk Demo Org',
      slug: 'devinedesk-demo',
    },
  });

  const workspace = await prisma.workspace.upsert({
    where: { slug: 'demo-workspace' },
    update: {},
    create: {
      name: 'Demo Workspace',
      slug: 'demo-workspace',
      organizationId: org.id,
    },
  });

  // Organization & Workspace Members
  await prisma.organizationMember.createMany({
    data: [
      { organizationId: org.id, userId: normalUser.id, role: 'MEMBER' },
      { organizationId: org.id, userId: adminUser.id, role: 'OWNER' },
    ],
    skipDuplicates: true,
  });

  await prisma.workspaceMember.createMany({
    data: [
      { workspaceId: workspace.id, userId: normalUser.id, role: 'MEMBER' },
      { workspaceId: workspace.id, userId: adminUser.id, role: 'ADMIN' },
    ],
    skipDuplicates: true,
  });

  // 3. API Keys & Webhooks
  await prisma.aPIKey.createMany({
    data: [
      {
        key: 'dev_sk_mock_12345',
        maskedKey: 'dev_sk_...12345',
        name: 'Development Key',
        userId: normalUser.id,
      },
      {
        key: 'prod_sk_mock_98765',
        maskedKey: 'prod_sk_...98765',
        name: 'Production Key',
        workspaceId: workspace.id,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.webhook.createMany({
    data: [
      {
        url: 'https://webhook.site/mock',
        secret: 'whsec_mock',
        events: '["generation.completed"]',
        userId: normalUser.id,
      },
    ],
    skipDuplicates: true,
  });

  // 4. Generations
  await prisma.generation.createMany({
    data: [
      {
        userId: normalUser.id,
        type: 't2i',
        prompt: 'A futuristic city at sunset',
        status: 'COMPLETED',
        resultUrl: 'https://images.unsplash.com/photo-1480796927426-f609979314bd',
      },
      {
        userId: normalUser.id,
        type: 'video',
        prompt: 'Slow pan over cyberpunk landscape',
        status: 'COMPLETED',
        resultUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      },
      { userId: normalUser.id, type: 'lipsync', prompt: 'Hello world', status: 'FAILED' },
    ],
    skipDuplicates: true,
  });

  // 5. Workflows
  const workflow = await prisma.workflow.create({
    data: {
      userId: normalUser.id,
      name: 'Standard Image Pipeline',
      description: 'Generates an image and upscales it.',
      nodes: [
        { id: '1', type: 'prompt' },
        { id: '2', type: 'generate' },
      ],
      edges: [{ source: '1', target: '2' }],
      isPublic: true,
      tags: '["image", "pipeline"]',
    },
  });

  await prisma.workflowRun.createMany({
    data: [
      { workflowId: workflow.id, userId: normalUser.id, status: 'COMPLETED' },
      { workflowId: workflow.id, userId: normalUser.id, status: 'PROCESSING' },
    ],
  });

  // 6. Agents & Conversations
  const agent = await prisma.agent.upsert({
    where: { slug: 'creative-director' },
    update: {},
    create: {
      userId: adminUser.id,
      slug: 'creative-director',
      name: 'Creative Director',
      systemPrompt: 'You are an expert creative director helping users write image prompts.',
      model: 'gpt-4',
      isPublic: true,
    },
  });

  const conversation = await prisma.conversation.create({
    data: { userId: normalUser.id, agentId: agent.id },
  });

  await prisma.message.createMany({
    data: [
      { conversationId: conversation.id, role: 'user', content: 'Help me write a prompt.' },
      {
        conversationId: conversation.id,
        role: 'assistant',
        content: 'I would be happy to help. What is the subject?',
      },
    ],
  });

  // 7. Support Tickets
  const ticket = await prisma.supportTicket.create({
    data: {
      userId: normalUser.id,
      subject: 'Billing Issue',
      category: 'BILLING',
      priority: 'HIGH',
      status: 'OPEN',
    },
  });

  await prisma.supportMessage.createMany({
    data: [
      { ticketId: ticket.id, senderId: normalUser.id, content: 'I was double charged.' },
      {
        ticketId: ticket.id,
        senderId: adminUser.id,
        content: 'We are looking into this.',
        isStaff: true,
      },
    ],
  });

  // 8. Transactions & Subscriptions
  await prisma.transaction.createMany({
    data: [
      { userId: normalUser.id, amount: 100, type: 'purchase', description: 'Bought 100 credits' },
      { userId: normalUser.id, amount: -5, type: 'usage', description: 'Generated 5 images' },
    ],
  });

  await prisma.subscription.upsert({
    where: { stripeSubscriptionId: 'sub_mock123' },
    update: {},
    create: {
      userId: normalUser.id,
      stripeSubscriptionId: 'sub_mock123',
      stripePriceId: 'price_mock456',
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  // 9. Prompt Templates & Assets
  await prisma.promptTemplate.createMany({
    data: [
      {
        userId: normalUser.id,
        name: 'Cyberpunk Portrait',
        content: 'A high quality cyberpunk portrait of {{subject}}',
        isPublic: true,
      },
    ],
  });

  await prisma.asset.createMany({
    data: [
      {
        userId: normalUser.id,
        type: 'image',
        url: 'https://images.unsplash.com/photo-1480796927426-f609979314bd',
      },
    ],
  });

  // 10. Audit Logs
  await prisma.auditLog.createMany({
    data: [
      { action: 'user.login', resource: 'auth', userId: normalUser.id },
      {
        action: 'workspace.created',
        resource: 'workspace',
        workspaceId: workspace.id,
        userId: adminUser.id,
      },
    ],
  });

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
