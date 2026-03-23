import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { UserType } from "../src/generated/prisma/enums.js";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});

const prisma = new PrismaClient({ adapter });

async function upsertUserWithWallet(data: {
  fullName: string;
  document: string;
  email: string;
  password: string;
  type: UserType;
  balance: number;
}) {
  const user = await prisma.user.upsert({
    where: { email: data.email },
    update: {
      fullName: data.fullName,
      document: data.document,
      password: data.password,
      type: data.type,
    },
    create: {
      fullName: data.fullName,
      document: data.document,
      email: data.email,
      password: data.password,
      type: data.type,
    },
  });

  await prisma.wallet.upsert({
    where: { userId: user.id },
    update: {
      balance: data.balance,
    },
    create: {
      userId: user.id,
      balance: data.balance,
    },
  });

  return user;
}

async function main() {
  const user1 = await upsertUserWithWallet({
    fullName: "João Silva",
    document: "12345678900",
    email: "joao@email.com",
    password: "123456",
    type: UserType.COMMON,
    balance: 1000,
  });

  const user2 = await upsertUserWithWallet({
    fullName: "Maria Souza",
    document: "98765432100",
    email: "maria@email.com",
    password: "123456",
    type: UserType.COMMON,
    balance: 500,
  });

  const merchant = await upsertUserWithWallet({
    fullName: "Loja XPTO",
    document: "11223344556677",
    email: "loja@email.com",
    password: "123456",
    type: UserType.MERCHANT,
    balance: 0,
  });

  console.log("Seed executado com sucesso 🚀");
  console.log({
    user1: { id: user1.id, email: user1.email },
    user2: { id: user2.id, email: user2.email },
    merchant: { id: merchant.id, email: merchant.email },
  });
}

main()
  .catch((error) => {
    console.error("Erro ao executar seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });