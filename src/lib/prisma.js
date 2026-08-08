import { PrismaClient } from '@prisma/client';
import { env } from './env.js';

const modelsWithSoftDelete = [
  'User', 'Transaction', 'Account', 'Session', 'VerificationToken', 'Setting',
  'Generation', 'Workflow', 'WorkflowRun', 'Agent', 'Conversation', 'Message',
  'Asset', 'Notification', 'AppInterest', 'Organization', 'Workspace', 'APIKey',
  'Webhook', 'AuditLog', 'SupportTicket', 'SupportMessage', 'Subscription',
  'PromptTemplate', 'ModelUsage', 'FeatureFlag'
];

const prismaClientSingleton = () => {
  const client = new PrismaClient();
  
  return client.$extends({
    query: {
      $allModels: {
        async delete({ model, args, query }) {
          if (modelsWithSoftDelete.includes(model)) {
            return client[model].update({
              ...args,
              data: { deletedAt: new Date() },
            });
          }
          return query(args);
        },
        async deleteMany({ model, args, query }) {
          if (modelsWithSoftDelete.includes(model)) {
            return client[model].updateMany({
              ...args,
              data: { deletedAt: new Date() },
            });
          }
          return query(args);
        },
        async findMany({ model, args, query }) {
          if (modelsWithSoftDelete.includes(model)) {
            args.where = { deletedAt: null, ...args.where };
          }
          return query(args);
        },
        async findFirst({ model, args, query }) {
          if (modelsWithSoftDelete.includes(model)) {
            args.where = { deletedAt: null, ...args.where };
          }
          return query(args);
        },
        async findFirstOrThrow({ model, args, query }) {
          if (modelsWithSoftDelete.includes(model)) {
            args.where = { deletedAt: null, ...args.where };
          }
          return query(args);
        },
      }
    }
  });
};

const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

export default prisma;

if (env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
