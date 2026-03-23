import { prisma } from "../lib/prisma";

export class WalletRepository {
  async updateBalance(userId: number, newBalance: number, tx?: any) {
    const db = tx ?? prisma;

    return db.wallet.update({
      where: { userId },
      data: { balance: newBalance },
    });
  }
}