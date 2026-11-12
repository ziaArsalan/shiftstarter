import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

/**
 * Seeds an initial ADMIN account from ADMIN_EMAIL / ADMIN_PASSWORD.
 * Idempotent: re-running updates the password/role but never duplicates.
 * There is no public admin registration — admins are created only here.
 */
const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error("[seed] ADMIN_EMAIL and ADMIN_PASSWORD must be set in server/.env");
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("[seed] ADMIN_PASSWORD must be at least 8 characters");
    process.exit(1);
  }

  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

  const admin = await prisma.user.upsert({
    where: { email },
    update: { role: "ADMIN", status: "ACTIVE", passwordHash, emailVerified: true },
    create: { email, role: "ADMIN", status: "ACTIVE", passwordHash, emailVerified: true },
  });

  console.log(`[seed] Admin ready: ${admin.email} (${admin.id})`);
}

main()
  .catch((err) => {
    console.error("[seed] Failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
