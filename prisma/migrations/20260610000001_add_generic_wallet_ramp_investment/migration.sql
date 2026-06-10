-- Replace DefindexWallet with UserWallet (data-preserving migration)

-- Step 1: Rename table
RENAME TABLE `DefindexWallet` TO `UserWallet`;

-- Step 2: Alter columns -- expand chainType enum to chain, providerWalletId, add new columns
ALTER TABLE `UserWallet`
  CHANGE COLUMN `crossmintWalletId` `providerWalletId` VARCHAR(255) NOT NULL,
  CHANGE COLUMN `chainType` `chain` ENUM('STELLAR', 'POLYGON', 'BASE', 'ETHEREUM', 'SOLANA') NOT NULL DEFAULT 'STELLAR',
  MODIFY COLUMN `status` ENUM('ACTIVE', 'PENDING', 'DISABLED') NOT NULL DEFAULT 'ACTIVE',
  MODIFY COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  ADD COLUMN `provider` ENUM('CROSSMINT', 'PRIVY', 'FIREBLOCKS') NOT NULL DEFAULT 'CROSSMINT',
  ADD COLUMN `custodyType` ENUM('CUSTODIAL', 'NON_CUSTODIAL', 'MPC') NOT NULL DEFAULT 'NON_CUSTODIAL',
  ADD COLUMN `metadata` JSON NULL AFTER `status`;

-- Step 3: Add new indexes (userId index already exists from unique constraint)
CREATE INDEX `UserWallet_provider_idx` ON `UserWallet`(`provider`);
CREATE INDEX `UserWallet_walletAddress_idx` ON `UserWallet`(`walletAddress`);

-- Step 4: Create RampOrder table
CREATE TABLE `RampOrder` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `walletId` INTEGER NULL,
    `provider` ENUM('CROSSMINT', 'ETHERFUSE') NOT NULL,
    `type` ENUM('ONRAMP', 'OFFRAMP') NOT NULL,
    `providerOrderId` VARCHAR(255) NULL,
    `idempotencyKey` VARCHAR(100) NOT NULL,
    `fiatAmount` DECIMAL(14, 2) NULL,
    `fiatCurrency` CHAR(3) NOT NULL DEFAULT 'MXN',
    `cryptoAmount` DECIMAL(18, 6) NULL,
    `cryptoAsset` VARCHAR(20) NULL,
    `chain` ENUM('STELLAR', 'POLYGON', 'BASE', 'ETHEREUM', 'SOLANA') NULL,
    `paymentMethod` VARCHAR(50) NULL,
    `bankName` VARCHAR(255) NULL,
    `accountSuffix` VARCHAR(4) NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `failureReason` TEXT NULL,
    `requestPayload` JSON NULL,
    `responsePayload` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `RampOrder_providerOrderId_key`(`providerOrderId`),
    UNIQUE INDEX `RampOrder_idempotencyKey_key`(`idempotencyKey`),
    INDEX `RampOrder_userId_idx`(`userId`),
    INDEX `RampOrder_provider_idx`(`provider`),
    INDEX `RampOrder_type_idx`(`type`),
    INDEX `RampOrder_status_idx`(`status`),
    INDEX `RampOrder_providerOrderId_idx`(`providerOrderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Step 5: Create InvestmentOperation table
CREATE TABLE `InvestmentOperation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `walletId` INTEGER NOT NULL,
    `provider` ENUM('DEFINDEX', 'OTHER') NOT NULL,
    `type` ENUM('DEPOSIT', 'WITHDRAW') NOT NULL,
    `externalProductId` VARCHAR(255) NULL,
    `externalOperationId` VARCHAR(255) NULL,
    `asset` VARCHAR(20) NOT NULL,
    `amount` DECIMAL(18, 6) NOT NULL,
    `chain` ENUM('STELLAR', 'POLYGON', 'BASE', 'ETHEREUM', 'SOLANA') NOT NULL,
    `status` ENUM('PENDING', 'SIGNING', 'SUBMITTED', 'COMPLETED', 'FAILED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `txHash` VARCHAR(255) NULL,
    `providerTxId` VARCHAR(255) NULL,
    `requestPayload` JSON NULL,
    `responsePayload` JSON NULL,
    `failureReason` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `InvestmentOperation_userId_idx`(`userId`),
    INDEX `InvestmentOperation_provider_idx`(`provider`),
    INDEX `InvestmentOperation_type_idx`(`type`),
    INDEX `InvestmentOperation_status_idx`(`status`),
    INDEX `InvestmentOperation_txHash_idx`(`txHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Step 6: Add foreign keys
ALTER TABLE `UserWallet` ADD CONSTRAINT `UserWallet_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `RampOrder` ADD CONSTRAINT `RampOrder_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `RampOrder` ADD CONSTRAINT `RampOrder_walletId_fkey` FOREIGN KEY (`walletId`) REFERENCES `UserWallet`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `InvestmentOperation` ADD CONSTRAINT `InvestmentOperation_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `InvestmentOperation` ADD CONSTRAINT `InvestmentOperation_walletId_fkey` FOREIGN KEY (`walletId`) REFERENCES `UserWallet`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
