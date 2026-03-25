-- CreateTable
CREATE TABLE `transfer_receipts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `type` ENUM('INTERNAL_TRANSFER', 'SPEI_CASHOUT') NOT NULL,
    `transfer_data` JSON NOT NULL,
    `generated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_transfer_receipts_user`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `transfer_receipts`
    ADD CONSTRAINT `transfer_receipts_user_id_fkey`
    FOREIGN KEY (`user_id`) REFERENCES `Users`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;
