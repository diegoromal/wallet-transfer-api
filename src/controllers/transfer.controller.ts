import { FastifyRequest, FastifyReply } from "fastify";
import { TransferDTO } from "../dtos/transfer.dto";

export async function transferController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const body = request.body as TransferDTO;

  const { value, payer, payee } = body;

  // validação básica
  if (!value || !payer || !payee) {
    return reply.status(400).send({
      message: "Campos obrigatórios: value, payer, payee",
    });
  }

  return reply.status(200).send({
    message: "Transfer endpoint funcionando 🚀",
    data: {
      value,
      payer,
      payee,
    },
  });
}