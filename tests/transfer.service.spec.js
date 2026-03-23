"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const transfer_service_1 = require("../src/services/transfer.service");
const app_error_1 = require("../src/errors/app-error");
const enums_1 = require("../src/generated/prisma/enums");
vitest_1.vi.mock("../src/lib/prisma", () => {
    return {
        prisma: {
            $transaction: vitest_1.vi.fn(async (callback) => {
                return callback({});
            }),
        },
    };
});
(0, vitest_1.describe)("TransferService", () => {
    let userRepository;
    let walletRepository;
    let transferRepository;
    let authorizationGateway;
    let notificationGateway;
    let transferService;
    (0, vitest_1.beforeEach)(() => {
        userRepository = {
            findByIdWithWallet: vitest_1.vi.fn(),
        };
        walletRepository = {
            updateBalance: vitest_1.vi.fn(),
        };
        transferRepository = {
            create: vitest_1.vi.fn(),
        };
        authorizationGateway = {
            authorize: vitest_1.vi.fn(),
        };
        notificationGateway = {
            send: vitest_1.vi.fn(),
        };
        transferService = new transfer_service_1.TransferService(userRepository, walletRepository, transferRepository, authorizationGateway, notificationGateway);
    });
    (0, vitest_1.it)("deve realizar uma transferência válida", async () => {
        userRepository.findByIdWithWallet
            .mockResolvedValueOnce({
            id: 1,
            type: enums_1.UserType.COMMON,
            wallet: { balance: 1000 },
        })
            .mockResolvedValueOnce({
            id: 2,
            type: enums_1.UserType.COMMON,
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
        (0, vitest_1.expect)(walletRepository.updateBalance).toHaveBeenCalledTimes(2);
        (0, vitest_1.expect)(transferRepository.create).toHaveBeenCalled();
        (0, vitest_1.expect)(notificationGateway.send).toHaveBeenCalled();
        (0, vitest_1.expect)(result.message).toBe("Transferência realizada com sucesso.");
    });
    (0, vitest_1.it)("deve falhar se o pagador não existir", async () => {
        userRepository.findByIdWithWallet
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce({
            id: 2,
            type: enums_1.UserType.COMMON,
            wallet: { balance: 500 },
        });
        await (0, vitest_1.expect)(transferService.execute({
            value: 100,
            payer: 1,
            payee: 2,
        })).rejects.toBeInstanceOf(app_error_1.AppError);
    });
    (0, vitest_1.it)("deve falhar se o recebedor não existir", async () => {
        userRepository.findByIdWithWallet
            .mockResolvedValueOnce({
            id: 1,
            type: enums_1.UserType.COMMON,
            wallet: { balance: 1000 },
        })
            .mockResolvedValueOnce(null);
        await (0, vitest_1.expect)(transferService.execute({
            value: 100,
            payer: 1,
            payee: 2,
        })).rejects.toBeInstanceOf(app_error_1.AppError);
    });
    (0, vitest_1.it)("deve falhar se o pagador for lojista", async () => {
        userRepository.findByIdWithWallet
            .mockResolvedValueOnce({
            id: 1,
            type: enums_1.UserType.MERCHANT,
            wallet: { balance: 1000 },
        })
            .mockResolvedValueOnce({
            id: 2,
            type: enums_1.UserType.COMMON,
            wallet: { balance: 500 },
        });
        await (0, vitest_1.expect)(transferService.execute({
            value: 100,
            payer: 1,
            payee: 2,
        })).rejects.toBeInstanceOf(app_error_1.AppError);
    });
    (0, vitest_1.it)("deve falhar se o saldo for insuficiente", async () => {
        userRepository.findByIdWithWallet
            .mockResolvedValueOnce({
            id: 1,
            type: enums_1.UserType.COMMON,
            wallet: { balance: 50 },
        })
            .mockResolvedValueOnce({
            id: 2,
            type: enums_1.UserType.COMMON,
            wallet: { balance: 500 },
        });
        await (0, vitest_1.expect)(transferService.execute({
            value: 100,
            payer: 1,
            payee: 2,
        })).rejects.toBeInstanceOf(app_error_1.AppError);
    });
    (0, vitest_1.it)("deve falhar se a transferência não for autorizada", async () => {
        userRepository.findByIdWithWallet
            .mockResolvedValueOnce({
            id: 1,
            type: enums_1.UserType.COMMON,
            wallet: { balance: 1000 },
        })
            .mockResolvedValueOnce({
            id: 2,
            type: enums_1.UserType.COMMON,
            wallet: { balance: 500 },
        });
        authorizationGateway.authorize.mockResolvedValue(false);
        await (0, vitest_1.expect)(transferService.execute({
            value: 100,
            payer: 1,
            payee: 2,
        })).rejects.toBeInstanceOf(app_error_1.AppError);
    });
});
