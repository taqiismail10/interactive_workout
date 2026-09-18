CREATE TABLE "SiteSetting" (
    "id" VARCHAR(64) NOT NULL,
    "showWaitlistCount" BOOLEAN NOT NULL DEFAULT true,
    "socialLinks" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EmailCampaign" (
    "id" UUID NOT NULL,
    "subject" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "targetAudience" VARCHAR(32) NOT NULL,
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(32) NOT NULL,
    "sentAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailCampaign_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EmailCampaign_sentAt_idx" ON "EmailCampaign"("sentAt");

INSERT INTO "SiteSetting" ("id", "showWaitlistCount", "socialLinks", "updatedAt")
VALUES (
    'default',
    true,
    '{"twitter":{"enabled":false,"url":""},"instagram":{"enabled":false,"url":""},"youtube":{"enabled":false,"url":""},"discord":{"enabled":false,"url":""},"tiktok":{"enabled":false,"url":""},"github":{"enabled":false,"url":""},"linkedin":{"enabled":false,"url":""}}'::jsonb,
    CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;
