import { NextResponse } from 'next/server';
import { withApiAuth } from '@/src/lib/apiHandler';

export const GET = withApiAuth({
  requireAuth: false,
  handler: async (req) => {
    return NextResponse.json({
      openapi: '3.0.0',
      info: {
        title: 'Devinedesk API',
        version: '1.0.0',
        description: 'Enterprise API for Devinedesk Platform.',
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
          apiKey: {
            type: 'apiKey',
            in: 'header',
            name: 'x-api-key',
          },
        },
        schemas: {
          Error: {
            type: 'object',
            properties: {
              error: {
                type: 'string',
              },
              code: {
                type: 'string',
              },
            },
          },
          User: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
              },
              email: {
                type: 'string',
              },
              emailVerified: {
                type: 'string',
                format: 'date-time',
              },
              password: {
                type: 'string',
              },
              name: {
                type: 'string',
              },
              image: {
                type: 'string',
              },
              role: {
                type: 'string',
              },
              credits: {
                type: 'integer',
              },
              stripeCustomerId: {
                type: 'string',
              },
              referralCode: {
                type: 'string',
              },
              referredById: {
                type: 'string',
              },
              twoFactorEnabled: {
                type: 'boolean',
              },
              twoFactorSecret: {
                type: 'string',
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
              },
              updatedAt: {
                type: 'string',
                format: 'date-time',
              },
              deletedAt: {
                type: 'string',
                format: 'date-time',
              },
              accounts: {
                type: 'string',
              },
              sessions: {
                type: 'string',
              },
              settings: {
                type: 'string',
              },
              history: {
                type: 'string',
              },
              workflows: {
                type: 'string',
              },
              workflowRuns: {
                type: 'string',
              },
              agents: {
                type: 'string',
              },
              assets: {
                type: 'string',
              },
              transactions: {
                type: 'string',
              },
              conversations: {
                type: 'string',
              },
              appInterests: {
                type: 'string',
              },
              notifications: {
                type: 'string',
              },
              apiKeys: {
                type: 'string',
              },
              webhooks: {
                type: 'string',
              },
              auditLogs: {
                type: 'string',
              },
              workspaces: {
                type: 'string',
              },
              organizations: {
                type: 'string',
              },
              supportTickets: {
                type: 'string',
              },
              supportMessages: {
                type: 'string',
              },
              subscriptions: {
                type: 'string',
              },
              promptTemplates: {
                type: 'string',
              },
              modelUsages: {
                type: 'string',
              },
            },
          },
          Transaction: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
              },
              userId: {
                type: 'string',
              },
              amount: {
                type: 'integer',
              },
              type: {
                type: 'string',
              },
              description: {
                type: 'string',
              },
              stripePaymentId: {
                type: 'string',
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
              },
              user: {
                type: 'string',
              },
            },
          },
          Account: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
              },
              userId: {
                type: 'string',
              },
              type: {
                type: 'string',
              },
              provider: {
                type: 'string',
              },
              providerAccountId: {
                type: 'string',
              },
              refresh_token: {
                type: 'string',
              },
              access_token: {
                type: 'string',
              },
              expires_at: {
                type: 'integer',
              },
              token_type: {
                type: 'string',
              },
              scope: {
                type: 'string',
              },
              id_token: {
                type: 'string',
              },
              session_state: {
                type: 'string',
              },
              user: {
                type: 'string',
              },
            },
          },
          Session: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
              },
              sessionToken: {
                type: 'string',
              },
              userId: {
                type: 'string',
              },
              expires: {
                type: 'string',
                format: 'date-time',
              },
              user: {
                type: 'string',
              },
            },
          },
          VerificationToken: {
            type: 'object',
            properties: {
              identifier: {
                type: 'string',
              },
              token: {
                type: 'string',
              },
              expires: {
                type: 'string',
                format: 'date-time',
              },
            },
          },
          Setting: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
              },
              userId: {
                type: 'string',
              },
              user: {
                type: 'string',
              },
              key: {
                type: 'string',
              },
              value: {
                type: 'string',
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
              },
              updatedAt: {
                type: 'string',
                format: 'date-time',
              },
            },
          },
          Generation: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
              },
              userId: {
                type: 'string',
              },
              user: {
                type: 'string',
              },
              type: {
                type: 'string',
              },
              prompt: {
                type: 'string',
              },
              model: {
                type: 'string',
              },
              parameters: {
                type: 'string',
              },
              resultUrl: {
                type: 'string',
              },
              status: {
                type: 'string',
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
              },
            },
          },
          Workflow: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
              },
              userId: {
                type: 'string',
              },
              user: {
                type: 'string',
              },
              name: {
                type: 'string',
              },
              description: {
                type: 'string',
              },
              nodes: {
                type: 'string',
              },
              edges: {
                type: 'string',
              },
              viewport: {
                type: 'string',
              },
              isPublic: {
                type: 'boolean',
              },
              tags: {
                type: 'string',
              },
              clonedFromId: {
                type: 'string',
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
              },
              updatedAt: {
                type: 'string',
                format: 'date-time',
              },
              deletedAt: {
                type: 'string',
                format: 'date-time',
              },
              runs: {
                type: 'string',
              },
            },
          },
          WorkflowRun: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
              },
              workflowId: {
                type: 'string',
              },
              userId: {
                type: 'string',
              },
              status: {
                type: 'string',
              },
              nodeOutputs: {
                type: 'string',
              },
              outputs: {
                type: 'string',
              },
              error: {
                type: 'string',
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
              },
              updatedAt: {
                type: 'string',
                format: 'date-time',
              },
              workflow: {
                type: 'string',
              },
              user: {
                type: 'string',
              },
            },
          },
          Agent: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
              },
              userId: {
                type: 'string',
              },
              user: {
                type: 'string',
              },
              slug: {
                type: 'string',
              },
              name: {
                type: 'string',
              },
              description: {
                type: 'string',
              },
              systemPrompt: {
                type: 'string',
              },
              model: {
                type: 'string',
              },
              isPublic: {
                type: 'boolean',
              },
              tags: {
                type: 'string',
              },
              clonedFromId: {
                type: 'string',
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
              },
              updatedAt: {
                type: 'string',
                format: 'date-time',
              },
              deletedAt: {
                type: 'string',
                format: 'date-time',
              },
              conversations: {
                type: 'string',
              },
            },
          },
          Conversation: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
              },
              userId: {
                type: 'string',
              },
              agentId: {
                type: 'string',
              },
              user: {
                type: 'string',
              },
              agent: {
                type: 'string',
              },
              messages: {
                type: 'string',
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
              },
              updatedAt: {
                type: 'string',
                format: 'date-time',
              },
            },
          },
          Message: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
              },
              conversationId: {
                type: 'string',
              },
              conversation: {
                type: 'string',
              },
              role: {
                type: 'string',
              },
              content: {
                type: 'string',
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
              },
            },
          },
          Asset: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
              },
              userId: {
                type: 'string',
              },
              user: {
                type: 'string',
              },
              type: {
                type: 'string',
              },
              url: {
                type: 'string',
              },
              metadata: {
                type: 'string',
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
              },
            },
          },
          Notification: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
              },
              userId: {
                type: 'string',
              },
              user: {
                type: 'string',
              },
              title: {
                type: 'string',
              },
              message: {
                type: 'string',
              },
              type: {
                type: 'string',
              },
              read: {
                type: 'boolean',
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
              },
            },
          },
          AppInterest: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
              },
              userId: {
                type: 'string',
              },
              user: {
                type: 'string',
              },
              appName: {
                type: 'string',
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
              },
            },
          },
          Organization: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
              },
              name: {
                type: 'string',
              },
              slug: {
                type: 'string',
              },
              stripeCustomerId: {
                type: 'string',
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
              },
              updatedAt: {
                type: 'string',
                format: 'date-time',
              },
              deletedAt: {
                type: 'string',
                format: 'date-time',
              },
              members: {
                type: 'string',
              },
              workspaces: {
                type: 'string',
              },
              auditLogs: {
                type: 'string',
              },
              subscriptions: {
                type: 'string',
              },
            },
          },
          OrganizationMember: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
              },
              organizationId: {
                type: 'string',
              },
              userId: {
                type: 'string',
              },
              role: {
                type: 'string',
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
              },
              updatedAt: {
                type: 'string',
                format: 'date-time',
              },
              organization: {
                type: 'string',
              },
              user: {
                type: 'string',
              },
            },
          },
          Workspace: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
              },
              organizationId: {
                type: 'string',
              },
              name: {
                type: 'string',
              },
              slug: {
                type: 'string',
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
              },
              updatedAt: {
                type: 'string',
                format: 'date-time',
              },
              deletedAt: {
                type: 'string',
                format: 'date-time',
              },
              organization: {
                type: 'string',
              },
              members: {
                type: 'string',
              },
              apiKeys: {
                type: 'string',
              },
              webhooks: {
                type: 'string',
              },
              auditLogs: {
                type: 'string',
              },
            },
          },
          WorkspaceMember: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
              },
              workspaceId: {
                type: 'string',
              },
              userId: {
                type: 'string',
              },
              role: {
                type: 'string',
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
              },
              updatedAt: {
                type: 'string',
                format: 'date-time',
              },
              workspace: {
                type: 'string',
              },
              user: {
                type: 'string',
              },
            },
          },
          APIKey: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
              },
              key: {
                type: 'string',
              },
              maskedKey: {
                type: 'string',
              },
              name: {
                type: 'string',
              },
              userId: {
                type: 'string',
              },
              workspaceId: {
                type: 'string',
              },
              lastUsedAt: {
                type: 'string',
                format: 'date-time',
              },
              expiresAt: {
                type: 'string',
                format: 'date-time',
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
              },
              updatedAt: {
                type: 'string',
                format: 'date-time',
              },
              user: {
                type: 'string',
              },
              workspace: {
                type: 'string',
              },
            },
          },
          Webhook: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
              },
              url: {
                type: 'string',
              },
              secret: {
                type: 'string',
              },
              events: {
                type: 'string',
              },
              isActive: {
                type: 'boolean',
              },
              userId: {
                type: 'string',
              },
              workspaceId: {
                type: 'string',
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
              },
              updatedAt: {
                type: 'string',
                format: 'date-time',
              },
              user: {
                type: 'string',
              },
              workspace: {
                type: 'string',
              },
            },
          },
          AuditLog: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
              },
              action: {
                type: 'string',
              },
              resource: {
                type: 'string',
              },
              resourceId: {
                type: 'string',
              },
              metadata: {
                type: 'string',
              },
              userId: {
                type: 'string',
              },
              organizationId: {
                type: 'string',
              },
              workspaceId: {
                type: 'string',
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
              },
              user: {
                type: 'string',
              },
              organization: {
                type: 'string',
              },
              workspace: {
                type: 'string',
              },
            },
          },
          SupportTicket: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
              },
              userId: {
                type: 'string',
              },
              subject: {
                type: 'string',
              },
              status: {
                type: 'string',
              },
              priority: {
                type: 'string',
              },
              category: {
                type: 'string',
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
              },
              updatedAt: {
                type: 'string',
                format: 'date-time',
              },
              user: {
                type: 'string',
              },
              messages: {
                type: 'string',
              },
            },
          },
          SupportMessage: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
              },
              ticketId: {
                type: 'string',
              },
              senderId: {
                type: 'string',
              },
              content: {
                type: 'string',
              },
              isStaff: {
                type: 'boolean',
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
              },
              ticket: {
                type: 'string',
              },
              sender: {
                type: 'string',
              },
            },
          },
          Subscription: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
              },
              userId: {
                type: 'string',
              },
              organizationId: {
                type: 'string',
              },
              stripeSubscriptionId: {
                type: 'string',
              },
              stripePriceId: {
                type: 'string',
              },
              status: {
                type: 'string',
              },
              currentPeriodStart: {
                type: 'string',
                format: 'date-time',
              },
              currentPeriodEnd: {
                type: 'string',
                format: 'date-time',
              },
              cancelAtPeriodEnd: {
                type: 'boolean',
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
              },
              updatedAt: {
                type: 'string',
                format: 'date-time',
              },
              user: {
                type: 'string',
              },
              organization: {
                type: 'string',
              },
            },
          },
          PromptTemplate: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
              },
              userId: {
                type: 'string',
              },
              name: {
                type: 'string',
              },
              description: {
                type: 'string',
              },
              content: {
                type: 'string',
              },
              variables: {
                type: 'string',
              },
              version: {
                type: 'integer',
              },
              isPublic: {
                type: 'boolean',
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
              },
              updatedAt: {
                type: 'string',
                format: 'date-time',
              },
              user: {
                type: 'string',
              },
            },
          },
          ModelUsage: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
              },
              userId: {
                type: 'string',
              },
              generationId: {
                type: 'string',
              },
              model: {
                type: 'string',
              },
              provider: {
                type: 'string',
              },
              promptTokens: {
                type: 'integer',
              },
              completionTokens: {
                type: 'integer',
              },
              totalTokens: {
                type: 'integer',
              },
              costInCents: {
                type: 'number',
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
              },
              user: {
                type: 'string',
              },
            },
          },
        },
      },
      paths: {
        '/users': {
          get: {
            summary: 'List Users',
            security: [
              {
                bearerAuth: [],
              },
              {
                apiKey: [],
              },
            ],
            responses: {
              200: {
                description: 'Successful response',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/User',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        '/transactions': {
          get: {
            summary: 'List Transactions',
            security: [
              {
                bearerAuth: [],
              },
              {
                apiKey: [],
              },
            ],
            responses: {
              200: {
                description: 'Successful response',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/Transaction',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        '/accounts': {
          get: {
            summary: 'List Accounts',
            security: [
              {
                bearerAuth: [],
              },
              {
                apiKey: [],
              },
            ],
            responses: {
              200: {
                description: 'Successful response',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/Account',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        '/sessions': {
          get: {
            summary: 'List Sessions',
            security: [
              {
                bearerAuth: [],
              },
              {
                apiKey: [],
              },
            ],
            responses: {
              200: {
                description: 'Successful response',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/Session',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        '/verificationtokens': {
          get: {
            summary: 'List VerificationTokens',
            security: [
              {
                bearerAuth: [],
              },
              {
                apiKey: [],
              },
            ],
            responses: {
              200: {
                description: 'Successful response',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/VerificationToken',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        '/settings': {
          get: {
            summary: 'List Settings',
            security: [
              {
                bearerAuth: [],
              },
              {
                apiKey: [],
              },
            ],
            responses: {
              200: {
                description: 'Successful response',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/Setting',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        '/generations': {
          get: {
            summary: 'List Generations',
            security: [
              {
                bearerAuth: [],
              },
              {
                apiKey: [],
              },
            ],
            responses: {
              200: {
                description: 'Successful response',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/Generation',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        '/workflows': {
          get: {
            summary: 'List Workflows',
            security: [
              {
                bearerAuth: [],
              },
              {
                apiKey: [],
              },
            ],
            responses: {
              200: {
                description: 'Successful response',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/Workflow',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        '/workflowruns': {
          get: {
            summary: 'List WorkflowRuns',
            security: [
              {
                bearerAuth: [],
              },
              {
                apiKey: [],
              },
            ],
            responses: {
              200: {
                description: 'Successful response',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/WorkflowRun',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        '/agents': {
          get: {
            summary: 'List Agents',
            security: [
              {
                bearerAuth: [],
              },
              {
                apiKey: [],
              },
            ],
            responses: {
              200: {
                description: 'Successful response',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/Agent',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        '/conversations': {
          get: {
            summary: 'List Conversations',
            security: [
              {
                bearerAuth: [],
              },
              {
                apiKey: [],
              },
            ],
            responses: {
              200: {
                description: 'Successful response',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/Conversation',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        '/messages': {
          get: {
            summary: 'List Messages',
            security: [
              {
                bearerAuth: [],
              },
              {
                apiKey: [],
              },
            ],
            responses: {
              200: {
                description: 'Successful response',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/Message',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        '/assets': {
          get: {
            summary: 'List Assets',
            security: [
              {
                bearerAuth: [],
              },
              {
                apiKey: [],
              },
            ],
            responses: {
              200: {
                description: 'Successful response',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/Asset',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        '/notifications': {
          get: {
            summary: 'List Notifications',
            security: [
              {
                bearerAuth: [],
              },
              {
                apiKey: [],
              },
            ],
            responses: {
              200: {
                description: 'Successful response',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/Notification',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        '/appinterests': {
          get: {
            summary: 'List AppInterests',
            security: [
              {
                bearerAuth: [],
              },
              {
                apiKey: [],
              },
            ],
            responses: {
              200: {
                description: 'Successful response',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/AppInterest',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        '/organizations': {
          get: {
            summary: 'List Organizations',
            security: [
              {
                bearerAuth: [],
              },
              {
                apiKey: [],
              },
            ],
            responses: {
              200: {
                description: 'Successful response',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/Organization',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        '/organizationmembers': {
          get: {
            summary: 'List OrganizationMembers',
            security: [
              {
                bearerAuth: [],
              },
              {
                apiKey: [],
              },
            ],
            responses: {
              200: {
                description: 'Successful response',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/OrganizationMember',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        '/workspaces': {
          get: {
            summary: 'List Workspaces',
            security: [
              {
                bearerAuth: [],
              },
              {
                apiKey: [],
              },
            ],
            responses: {
              200: {
                description: 'Successful response',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/Workspace',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        '/workspacemembers': {
          get: {
            summary: 'List WorkspaceMembers',
            security: [
              {
                bearerAuth: [],
              },
              {
                apiKey: [],
              },
            ],
            responses: {
              200: {
                description: 'Successful response',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/WorkspaceMember',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        '/apikeys': {
          get: {
            summary: 'List APIKeys',
            security: [
              {
                bearerAuth: [],
              },
              {
                apiKey: [],
              },
            ],
            responses: {
              200: {
                description: 'Successful response',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/APIKey',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        '/webhooks': {
          get: {
            summary: 'List Webhooks',
            security: [
              {
                bearerAuth: [],
              },
              {
                apiKey: [],
              },
            ],
            responses: {
              200: {
                description: 'Successful response',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/Webhook',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        '/auditlogs': {
          get: {
            summary: 'List AuditLogs',
            security: [
              {
                bearerAuth: [],
              },
              {
                apiKey: [],
              },
            ],
            responses: {
              200: {
                description: 'Successful response',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/AuditLog',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        '/supporttickets': {
          get: {
            summary: 'List SupportTickets',
            security: [
              {
                bearerAuth: [],
              },
              {
                apiKey: [],
              },
            ],
            responses: {
              200: {
                description: 'Successful response',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/SupportTicket',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        '/supportmessages': {
          get: {
            summary: 'List SupportMessages',
            security: [
              {
                bearerAuth: [],
              },
              {
                apiKey: [],
              },
            ],
            responses: {
              200: {
                description: 'Successful response',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/SupportMessage',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        '/subscriptions': {
          get: {
            summary: 'List Subscriptions',
            security: [
              {
                bearerAuth: [],
              },
              {
                apiKey: [],
              },
            ],
            responses: {
              200: {
                description: 'Successful response',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/Subscription',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        '/prompttemplates': {
          get: {
            summary: 'List PromptTemplates',
            security: [
              {
                bearerAuth: [],
              },
              {
                apiKey: [],
              },
            ],
            responses: {
              200: {
                description: 'Successful response',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/PromptTemplate',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        '/modelusages': {
          get: {
            summary: 'List ModelUsages',
            security: [
              {
                bearerAuth: [],
              },
              {
                apiKey: [],
              },
            ],
            responses: {
              200: {
                description: 'Successful response',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/ModelUsage',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  },
});
