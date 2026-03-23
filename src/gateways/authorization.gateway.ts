export class AuthorizationGateway {
  async authorize(): Promise<boolean> {
    try {
      const response = await fetch("https://util.devi.tools/api/v2/authorize");

      if (!response.ok) {
        return false;
      }

      const data = await response.json();

      return data?.status === "success" && data?.data?.authorization === true;
    } catch {
      return false;
    }
  }
}