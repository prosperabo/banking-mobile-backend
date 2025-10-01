-- CreateTable
CREATE TABLE `Users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `completeName` VARCHAR(191) NOT NULL,
    `gender` ENUM('MASCULINO', 'FEMENINO') NOT NULL,
    `birthDate` DATETIME(3) NOT NULL,
    `birthCountry` VARCHAR(191) NOT NULL,
    `curp` VARCHAR(191) NOT NULL,
    `postalCode` VARCHAR(191) NOT NULL,
    `state` VARCHAR(191) NOT NULL,
    `country` VARCHAR(191) NOT NULL,
    `municipality` VARCHAR(191) NOT NULL,
    `street` VARCHAR(191) NOT NULL,
    `colony` VARCHAR(191) NOT NULL,
    `externalNumber` VARCHAR(191) NOT NULL,
    `internalNumber` VARCHAR(191) NOT NULL,
    `contractLink` VARCHAR(191) NULL,
    `pin` VARCHAR(191) NULL,
    `cardType` VARCHAR(191) NULL,
    `creditLinePreference` VARCHAR(191) NULL,
    `cardUsage` VARCHAR(191) NULL,
    `occupation` VARCHAR(191) NULL,
    `sector` VARCHAR(191) NULL,
    `mainActivity` VARCHAR(191) NULL,
    `monthlyIncome` DOUBLE NULL,
    `monthlyOutcome` DOUBLE NULL,
    `hasOtherCreditCards` BOOLEAN NULL,
    `documentScan` VARCHAR(191) NULL,
    `universityRegistration` INTEGER NULL,
    `creditLimit` DOUBLE NULL,
    `interestRate` DOUBLE NULL,
    `paymentDates` VARCHAR(191) NULL,
    `initialDeposit` DOUBLE NULL,
    `depositReceipt` VARCHAR(191) NULL,
    `universityProfilePhotoLink` VARCHAR(191) NULL,
    `rfc` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VerifiedEmails` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `verifiedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `VerifiedEmails_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
