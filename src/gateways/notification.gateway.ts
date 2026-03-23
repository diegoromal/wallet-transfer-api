export class NotificationGateway {
  async send(): Promise<void> {
    try {
      await fetch("https://util.devi.tools/api/v1/notify", {
        method: "POST",
      });
    } catch (error) {
      console.error("Erro ao enviar notificação (ignorado)");
    }
  }
}