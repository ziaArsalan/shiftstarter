/*
  Warnings:

  - Added the required column `fileName` to the `Credential` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mimeType` to the `Credential` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sizeBytes` to the `Credential` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Credential" ADD COLUMN     "fileName" TEXT NOT NULL,
ADD COLUMN     "mimeType" TEXT NOT NULL,
ADD COLUMN     "sizeBytes" INTEGER NOT NULL;
