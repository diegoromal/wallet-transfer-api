import { TransferDTO } from "../dtos/transfer.dto";
import { AppError } from "../errors/app-error";
import { AuthorizationGateway } from "../gateways/authorization.gateway";
import { NotificationGateway } from "../gateways/notification.gateway";
import { UserType } from "../generated/prisma/enums";
import { prisma } from "../lib/prisma";
import { TransferRepository } from "../repositories/transfer.repository";
import { UserRepository } from "../repositories/user.repository";
import { WalletRepository } from "../repositories/wallet.repository";

export class TransferService {
  constructor(
    private userRepository: UserRepository,
    private walletRepository: WalletRepository,
    private transferRepository: TransferRepository,
    private authorizationGateway: AuthorizationGateway,
    private notificationGateway: NotificationGateway
  ) {}

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

    const payerWallet = payerUser.wallet;
    const payeeWallet = payeeUser.wallet;

    if (!payerWallet) {
      throw new AppError("Carteira do pagador não encontrada.", 500);
    }

    if (!payeeWallet) {
      throw new AppError("Carteira do recebedor não encontrada.", 500);
    }

    if (Number(payerWallet.balance) < value) {
      throw new AppError("Saldo insuficiente.", 422);
    }

    const isAuthorized = await this.authorizationGateway.authorize();

    if (!isAuthorized) {
      throw new AppError("Transferência não autorizada.", 403);
    }

    const result = await prisma.$transaction(async (tx) => {
      const newPayerBalance = Number(payerWallet.balance) - value;
      const newPayeeBalance = Number(payeeWallet.balance) + value;

      await this.walletRepository.updateBalance(payer, newPayerBalance, tx);
      await this.walletRepository.updateBalance(payee, newPayeeBalance, tx);

      const transfer = await this.transferRepository.create(
        {
          payerId: payer,
          payeeId: payee,
          amount: value,
        },
        tx
      );

      return transfer;
    });

    await this.notificationGateway.send();

    return {
      message: "Transferência realizada com sucesso.",
      transfer: result,
    };
  }
}