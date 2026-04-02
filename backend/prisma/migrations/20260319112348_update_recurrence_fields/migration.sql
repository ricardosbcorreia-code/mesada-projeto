/*
  Warnings:

  - You are about to drop the column `recurrence` on the `tasks` table. All the data in the column will be lost.
  - Added the required column `recurrence_type` to the `tasks` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RecurrenceType" AS ENUM ('daily', 'weekly', 'monthly', 'yearly');

-- AlterTable
ALTER TABLE "tasks" DROP COLUMN "recurrence",
ADD COLUMN     "recurrence_days" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "recurrence_interval" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "recurrence_month" INTEGER,
ADD COLUMN     "recurrence_type" "RecurrenceType" NOT NULL;

-- DropEnum
DROP TYPE "Recurrence";
