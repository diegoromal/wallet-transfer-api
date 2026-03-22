import { TransferDTO } from "../dtos/transfer.dto";
import { AppError } from "../errors/app-error";
import { UserType } from "../generated/prisma/enums";
import { UserRepository } from "../repositories/user.repository";

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

    if (!payerUser.wallet) {
      throw new AppError("Carteira do pagador não encontrada.", 500);
    }

    if (!payeeUser.wallet) {
      throw new AppError("Carteira do recebedor não encontrada.", 500);
    }

    if (Number(payerUser.wallet.balance) < value) {
      throw new AppError("Saldo insuficiente.", 422);
    }

    return {
      message: "Validações da transferência realizadas com sucesso.",
      transfer: {
        value,
        payer: payerUser.id,
        payee: payeeUser.id,
      },
    };
  }
}