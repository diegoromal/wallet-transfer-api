import { FastifyRequest, FastifyReply } from "fastify";
import { TransferDTO } from "../dtos/transfer.dto";
import { TransferService } from "../services/transfer.service";
import { UserRepository } from "../repositories/user.repository";
import { AppError } from "../errors/app-error";

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

    const userRepository = new UserRepository();
    const transferService = new TransferService(userRepository);

    const result = await transferService.execute({
      value,
      payer,
      payee,
    });

    return reply.status(200).send(result);
  } catch (error) {
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