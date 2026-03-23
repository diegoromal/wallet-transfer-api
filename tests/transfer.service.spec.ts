import { describe, it, expect, beforeEach, vi } from "vitest";
import { TransferService } from "../src/services/transfer.service.js";
import { AppError } from "../src/errors/app-error.js";
import { UserType } from "../src/generated/prisma/enums.js";

vi.mock("../src/lib/prisma", () => {
  return {
    prisma: {
      $transaction: vi.fn(async (callback) => {
        return callback({});
      }),
    },
  };
});

describe("TransferService", () => {
  let userRepository: any;
  let walletRepository: any;
  let transferRepository: any;
  let authorizationGateway: any;
  let notificationGateway: any;
  let transferService: TransferService;

  beforeEach(() => {
    userRepository = {
      findByIdWithWallet: vi.fn(),
    };

    walletRepository = {
      updateBalance: vi.fn(),
    };

    transferRepository = {
      create: vi.fn(),
    };

    authorizationGateway = {
      authorize: vi.fn(),
    };

    notificationGateway = {
      send: vi.fn(),
    };

    transferService = new TransferService(
      userRepository,
      walletRepository,
      transferRepository,
      authorizationGateway,
      notificationGateway
    );
  });

  it("deve realizar uma transferência válida", async () => {
    userRepository.findByIdWithWallet
      .mockResolvedValueOnce({
        id: 1,
        type: UserType.COMMON,
        wallet: { balance: 1000 },
      })
      .mockResolvedValueOnce({
        id: 2,
        type: UserType.COMMON,
        wallet: { balance: 500 },
      });

    authorizationGateway.authorize.mockResolvedValue(true);

    transferRepository.create.mockResolvedValue({
      id: 1,
      payerId: 1,
      payeeId: 2,
      amount: 100,
    });

    const result = await transferService.execute({
      value: 100,
      payer: 1,
      payee: 2,
    });

    expect(walletRepository.updateBalance).toHaveBeenCalledTimes(2);
    expect(transferRepository.create).toHaveBeenCalled();
    expect(notificationGateway.send).toHaveBeenCalled();
    expect(result.message).toBe("Transferência realizada com sucesso.");
  });

  it("deve falhar se o pagador não existir", async () => {
    userRepository.findByIdWithWallet
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 2,
        type: UserType.COMMON,
        wallet: { balance: 500 },
      });

    await expect(
      transferService.execute({
        value: 100,
        payer: 1,
        payee: 2,
      })
    ).rejects.toBeInstanceOf(AppError);
  });

  it("deve falhar se o recebedor não existir", async () => {
    userRepository.findByIdWithWallet
      .mockResolvedValueOnce({
        id: 1,
        type: UserType.COMMON,
        wallet: { balance: 1000 },
      })
      .mockResolvedValueOnce(null);

    await expect(
      transferService.execute({
        value: 100,
        payer: 1,
        payee: 2,
      })
    ).rejects.toBeInstanceOf(AppError);
  });

  it("deve falhar se o pagador for lojista", async () => {
    userRepository.findByIdWithWallet
      .mockResolvedValueOnce({
        id: 1,
        type: UserType.MERCHANT,
        wallet: { balance: 1000 },
      })
      .mockResolvedValueOnce({
        id: 2,
        type: UserType.COMMON,
        wallet: { balance: 500 },
      });

    await expect(
      transferService.execute({
        value: 100,
        payer: 1,
        payee: 2,
      })
    ).rejects.toBeInstanceOf(AppError);
  });

  it("deve falhar se o saldo for insuficiente", async () => {
    userRepository.findByIdWithWallet
      .mockResolvedValueOnce({
        id: 1,
        type: UserType.COMMON,
        wallet: { balance: 50 },
      })
      .mockResolvedValueOnce({
        id: 2,
        type: UserType.COMMON,
        wallet: { balance: 500 },
      });

    await expect(
      transferService.execute({
        value: 100,
        payer: 1,
        payee: 2,
      })
    ).rejects.toBeInstanceOf(AppError);
  });

  it("deve falhar se a transferência não for autorizada", async () => {
    userRepository.findByIdWithWallet
      .mockResolvedValueOnce({
        id: 1,
        type: UserType.COMMON,
        wallet: { balance: 1000 },
      })
      .mockResolvedValueOnce({
        id: 2,
        type: UserType.COMMON,
        wallet: { balance: 500 },
      });

    authorizationGateway.authorize.mockResolvedValue(false);

    await expect(
      transferService.execute({
        value: 100,
        payer: 1,
        payee: 2,
      })
    ).rejects.toBeInstanceOf(AppError);
  });

  it("deve realizar a transferência mesmo se a notificação falhar", async () => {
  userRepository.findByIdWithWallet
    .mockResolvedValueOnce({
      id: 1,
      type: UserType.COMMON,
      wallet: { balance: 1000 },
    })
    .mockResolvedValueOnce({
      id: 2,
      type: UserType.COMMON,
      wallet: { balance: 500 },
    });

  authorizationGateway.authorize.mockResolvedValue(true);

  transferRepository.create.mockResolvedValue({
    id: 1,
    payerId: 1,
    payeeId: 2,
    amount: 100,
  });

  notificationGateway.send.mockRejectedValue(new Error("Notification failed"));

  await expect(
    transferService.execute({
      value: 100,
      payer: 1,
      payee: 2,
    })
  ).resolves.toMatchObject({
    message: "Transferência realizada com sucesso.",
  });
});

});