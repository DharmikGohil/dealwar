ALTER TABLE "Payment" ADD COLUMN "providerRefundId" TEXT;

CREATE UNIQUE INDEX "Payment_providerRefundId_key" ON "Payment"("providerRefundId");
