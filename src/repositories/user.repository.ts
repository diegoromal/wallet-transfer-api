import { prisma } from "../lib/prisma";

export class UserRepository {
  async findByIdWithWallet(id: number) {
    return prisma.user.findUnique({
      where: { id },
      include: { wallet: true },
    });
  }
}