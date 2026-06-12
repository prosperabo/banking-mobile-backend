-- Add nullable lastLogin to track the latest successful user authentication.

ALTER TABLE `Users`
  ADD COLUMN `lastLogin` DATETIME(3) NULL AFTER `createdAt`;
