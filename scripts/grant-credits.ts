/**
 * One-off script: grant credits to a user by email.
 *
 * Usage (run inside the backend container on the production VM):
 *   bun /app/scripts/grant-credits.ts <email> <amount> [description]
 *
 * Example:
 *   bun /app/scripts/grant-credits.ts vinayakok@gmail.com 500 "Tester access credits"
 *
 * Records a BONUS CreditTransaction ledger row so the audit trail stays
 * consistent with the User.credits balance.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  const amount = parseInt(process.argv[3] ?? "0", 10);
  const description = process.argv[4] ?? "Manual credit grant";

  if (!email || !amount || amount <= 0) {
    console.error("Usage: bun grant-credits.ts <email> <amount> [description]");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, credits: true, email: true, name: true },
  });

  if (!user) {
    console.error(`✗ User not found: ${email}`);
    console.error(`  They must sign up at https://devinedesk.com first.`);
    process.exit(2);
  }

  console.log(`Found user: ${user.email} (id=${user.id}), current balance=${user.credits}`);

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { credits: { increment: amount } },
    select: { credits: true },
  });

  await prisma.creditTransaction.create({
    data: {
      userId: user.id,
      type: "BONUS",
      amount,
      balanceAfter: updated.credits,
      description,
    },
  });

  console.log(`✓ Granted ${amount} credits to ${email}. New balance: ${updated.credits}`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
