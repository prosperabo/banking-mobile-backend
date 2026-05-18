-- CreateTable
CREATE TABLE `DefindexWallet` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `crossmintWalletId` VARCHAR(255) NOT NULL,
    `walletAddress` VARCHAR(255) NOT NULL,
    `chainType` ENUM('STELLAR') NOT NULL DEFAULT 'STELLAR',
    `status` ENUM('ACTIVE', 'PENDING') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `DefindexWallet_userId_key`(`userId`),
    UNIQUE INDEX `DefindexWallet_crossmintWalletId_key`(`crossmintWalletId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `DefindexWallet` ADD CONSTRAINT `DefindexWallet_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
