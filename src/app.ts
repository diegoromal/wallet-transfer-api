import Fastify from "fastify"
import { transferRoutes } from "./routes/transfer.routes.js";

export function buildApp() {
    const app = Fastify()

    app.get("/health", async () => {
        return { status: "ok" }
    })

    app.register(transferRoutes);

    return app
}
