import { TransferDTO } from "../dtos/transfer.dto";
import { AppError } from "../errors/app-error";
import { UserType } from "../generated/prisma/enums";
import { prisma } from "../lib/prisma";
import { TransferRepository } from "../repositories/transfer.repository";
import { UserRepository } from "../repositories/user.repository";
import { WalletRepository } from "../repositories/wallet.repository";

export class TransferService {
  constructor(private userRepository: UserRepository) {}

  async execute(data: TransferDTO) {
  const { value, payer, payee } = data;

  if (value <= 0) {
    throw new AppError("O valor da transferência deve ser maior que zero.", 400);
  }

  if (payer === payee) {
    throw new AppError("O pagador e o recebedor não podem ser a mesma pessoa.", 400);
  }

  const payerUser = await this.userRepository.findByIdWithWallet(payer);
  const payeeUser = await this.userRepository.findByIdWithWallet(payee);

  if (!payerUser) {
    throw new AppError("Pagador não encontrado.", 404);
  }

  if (!payeeUser) {
    throw new AppError("Recebedor não encontrado.", 404);
  }

  if (payerUser.type === UserType.MERCHANT) {
    throw new AppError("Lojistas não podem realizar transferências.", 403);
  }

  if (!payerUser.wallet || !payeeUser.wallet) {
    throw new AppError("Carteira não encontrada.", 500);
  }

  if (Number(payerUser.wallet.balance) < value) {
    throw new AppError("Saldo insuficiente.", 422);
  }

  const walletRepository = new WalletRepository();
  const transferRepository = new TransferRepository();

  const result = await prisma.$transaction(async (tx) => {
    const newPayerBalance = Number(payerUser.wallet!.balance) - value;
    const newPayeeBalance = Number(payeeUser.wallet!.balance) + value;

    await walletRepository.updateBalance(payer, newPayerBalance, tx);
    await walletRepository.updateBalance(payee, newPayeeBalance, tx);

    const transfer = await transferRepository.create(
      {
        payerId: payer,
        payeeId: payee,
        amount: value,
      },
      tx
    );

    return transfer;
  });

  return {
    message: "Transferência realizada com sucesso.",
    transfer: result,
  };
}
}