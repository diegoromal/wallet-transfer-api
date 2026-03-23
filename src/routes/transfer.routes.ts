import { FastifyInstance } from "fastify";
import { transferController } from "../controllers/transfer.controller.js";

export async function transferRoutes(app: FastifyInstance) {
  app.post("/transfer", transferController);
}