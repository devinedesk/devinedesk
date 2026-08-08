import test from 'node:test';
import assert from 'node:assert/strict';
import { userUpdateSchema, orgUpdateSchema, webhookCreateSchema } from '../lib/validators.js';

test('Zod Schemas - User Update', () => {
  const validData = {
    name: 'John Doe',
    image: 'https://example.com/image.jpg',
  };

  const result = userUpdateSchema.safeParse(validData);
  assert.strictEqual(result.success, true);

  const invalidData = {
    name: 'Jo', // too short
    image: 'not-a-url',
  };

  const badResult = userUpdateSchema.safeParse(invalidData);
  assert.strictEqual(badResult.success, false);
});

test('Zod Schemas - Org Update', () => {
  const validData = {
    name: 'Acme Corp',
    billingEmail: 'billing@acme.com',
  };

  const result = orgUpdateSchema.safeParse(validData);
  assert.strictEqual(result.success, true);
});

test('Zod Schemas - Webhook Create', () => {
  const validData = {
    url: 'https://webhook.site/12345',
    events: ['workflow.completed'],
  };

  const result = webhookCreateSchema.safeParse(validData);
  assert.strictEqual(result.success, true);

  const invalidData = {
    url: 'http://localhost:3000', // not https
    events: [], // empty array
  };

  const badResult = webhookCreateSchema.safeParse(invalidData);
  assert.strictEqual(badResult.success, false);
});
