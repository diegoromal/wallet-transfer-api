import { prisma } from "../lib/prisma";

export class TransferRepository {
  async create(data: {
    payerId: number;
    payeeId: number;
    amount: number;
  }, tx?: any) {
    const db = tx ?? prisma;

    return db.transfer.create({
      data,
    });
  }
}