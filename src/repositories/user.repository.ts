import { prisma } from "../lib/prisma.js";

export class UserRepository {
  async findByIdWithWallet(id: number) {
    return prisma.user.findUnique({
      where: { id },
      include: { wallet: true },
    });
  }
}