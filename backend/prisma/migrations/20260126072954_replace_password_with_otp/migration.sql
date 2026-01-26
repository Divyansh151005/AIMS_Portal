-- AlterTable
ALTER TABLE "User" DROP COLUMN "password",
ADD COLUMN     "otp" TEXT,
ADD COLUMN     "otpExpiry" TIMESTAMP(3);
