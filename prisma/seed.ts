import "dotenv/config";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

type SeedOptions = {
  count: number;
  password: string;
  emailPrefix: string;
};

function parseOptions(): SeedOptions {
  const countRaw = process.env.SEED_USERS_COUNT ?? "20";
  const password = process.env.SEED_USERS_PASSWORD ?? "Test@123456";
  const emailPrefix = process.env.SEED_USERS_PREFIX ?? "demo.user";

  const count = Number.parseInt(countRaw, 10);

  if (!Number.isFinite(count) || count <= 0) {
    throw new Error("SEED_USERS_COUNT must be a positive number");
  }

  if (password.length < 8) {
    throw new Error("SEED_USERS_PASSWORD must be at least 8 characters");
  }

  return {
    count,
    password,
    emailPrefix,
  };
}

async function seedUsers() {
  const options = parseOptions();
  const successCount = { value: 0 };

  for (let i = 1; i <= options.count; i += 1) {
    const padded = String(i).padStart(4, "0");
    const email = `${options.emailPrefix}${padded}@mailinator.com`;
    const name = `Demo User ${padded}`;

    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });

      if (existingUser) {
        console.log(`✓ User ${email} already exists`);
        successCount.value += 1;
        continue;
      }

      // Use Better Auth's signup API with proper password hashing
      await auth.api.signUpEmail({
        body: {
          email,
          password: options.password,
          name,
        },
      });

      // Mark as verified (seed users should be ready immediately)
      await prisma.user.update({
        where: { email },
        data: {
          emailVerified: true,
          role: "CUSTOMER",
        },
      });

      successCount.value += 1;
      console.log(`✓ Created user ${i}/${options.count}: ${email}`);
    } catch (error) {
      // If user already exists via unique constraint, that's fine
      if (error instanceof Error && error.message.includes("Unique constraint")) {
        successCount.value += 1;
        console.log(`✓ User ${email} already exists`);
        continue;
      }
      console.error(`✗ Failed to create user ${email}:`, error instanceof Error ? error.message : error);
    }
  }

  console.log(`\n✓ Successfully seeded ${successCount.value}/${options.count} users.`);
  console.log(`📧 Email pattern: ${options.emailPrefix}0001@mailinator.com ...`);
  console.log(`🔑 Common password: ${options.password}`);
  console.log(`\n✅ Users are ready to login!`);
}

seedUsers()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
