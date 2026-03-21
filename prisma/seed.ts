import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient, UserType } from "../src/generated/prisma/client";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});

const prisma = new PrismaClient({ adapter });

async function main() {
  // limpar dados anteriores
  await prisma.transfer.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.user.deleteMany();

  // usuário comum 1
  const user1 = await prisma.user.create({
    data: {
      fullName: "João Silva",
      document: "12345678900",
      email: "joao@email.com",
      password: "123456",
      type: UserType.COMMON,
      wallet: {
        create: {
          balance: 1000,
        },
      },
    },
  });

  // usuário comum 2
  const user2 = await prisma.user.create({
    data: {
      fullName: "Maria Souza",
      document: "98765432100",
      email: "maria@email.com",
      password: "123456",
      type: UserType.COMMON,
      wallet: {
        create: {
          balance: 500,
        },
      },
    },
  });

  // lojista
  const merchant = await prisma.user.create({
    data: {
      fullName: "Loja XPTO",
      document: "11223344556677",
      email: "loja@email.com",
      password: "123456",
      type: UserType.MERCHANT,
      wallet: {
        create: {
          balance: 0,
        },
      },
    },
  });

  console.log("Seed executado com sucesso 🚀");
}

main()
  .then(() => {
    console.log("Finalizado");
  })
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });