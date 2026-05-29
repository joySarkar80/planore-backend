-- CreateTable
CREATE TABLE "host_bans" (
    "id" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "liftedAt" TIMESTAMP(3),

    CONSTRAINT "host_bans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "host_bans_hostId_idx" ON "host_bans"("hostId");

-- CreateIndex
CREATE INDEX "host_bans_userId_idx" ON "host_bans"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "host_bans_hostId_userId_key" ON "host_bans"("hostId", "userId");

-- AddForeignKey
ALTER TABLE "host_bans" ADD CONSTRAINT "host_bans_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "host_bans" ADD CONSTRAINT "host_bans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
