-- CreateTable
CREATE TABLE "site_config" (
    "id" TEXT NOT NULL,
    "consultationFeePesos" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_config_pkey" PRIMARY KEY ("id")
);

-- Insert default row so we have a singleton config
INSERT INTO "site_config" ("id", "consultationFeePesos", "updatedAt") VALUES ('default', NULL, CURRENT_TIMESTAMP);
