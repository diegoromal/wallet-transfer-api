import { FastifyRequest, FastifyReply } from "fastify";
import { TransferDTO } from "../dtos/transfer.dto.js";
import { TransferService } from "../services/transfer.service.js";
import { UserRepository } from "../repositories/user.repository.js";
import { WalletRepository } from "../repositories/wallet.repository.js";
import { TransferRepository } from "../repositories/transfer.repository.js";
import { AuthorizationGateway } from "../gateways/authorization.gateway.js";
import { NotificationGateway } from "../gateways/notification.gateway.js";
import { AppError } from "../errors/app-error.js";

export async function transferController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const body = request.body as TransferDTO;

    const { value, payer, payee } = body;

    if (value === undefined || payer === undefined || payee === undefined) {
      return reply.status(400).send({
        message: "Campos obrigatórios: value, payer, payee",
      });
    }

    const transferService = new TransferService(
      new UserRepository(),
      new WalletRepository(),
      new TransferRepository(),
      new AuthorizationGateway(),
      new NotificationGateway()
    );

    const result = await transferService.execute({
      value,
      payer,
      payee,
    });

    return reply.status(200).send(result);
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        message: error.message,
      });
    }

    console.error(error);

    return reply.status(500).send({
      message: "Erro interno do servidor.",
    });
  }
}