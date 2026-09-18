CREATE TABLE "WaitlistSignup" (
    "id" UUID NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "interest" VARCHAR(16),
    "referralCode" VARCHAR(24) NOT NULL,
    "referredBy" VARCHAR(24),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WaitlistSignup_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "WaitlistSignup_email_normalized" CHECK ("email" = lower(btrim("email")) AND char_length("email") BETWEEN 3 AND 254),
    CONSTRAINT "WaitlistSignup_interest_check" CHECK ("interest" IS NULL OR "interest" IN ('game', 'fitness', 'curious')),
    CONSTRAINT "WaitlistSignup_referralCode_format" CHECK ("referralCode" ~ '^[A-Za-z0-9_-]{24}$'),
    CONSTRAINT "WaitlistSignup_no_self_referral" CHECK ("referredBy" IS NULL OR "referredBy" <> "referralCode")
);

CREATE UNIQUE INDEX "WaitlistSignup_email_key" ON "WaitlistSignup"("email");
CREATE UNIQUE INDEX "WaitlistSignup_referralCode_key" ON "WaitlistSignup"("referralCode");
CREATE INDEX "WaitlistSignup_referredBy_idx" ON "WaitlistSignup"("referredBy");
CREATE INDEX "WaitlistSignup_createdAt_id_idx" ON "WaitlistSignup"("createdAt", "id");

ALTER TABLE "WaitlistSignup" ADD CONSTRAINT "WaitlistSignup_referredBy_fkey" FOREIGN KEY ("referredBy") REFERENCES "WaitlistSignup"("referralCode") ON DELETE RESTRICT ON UPDATE RESTRICT;
