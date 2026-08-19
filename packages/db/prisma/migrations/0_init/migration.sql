-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "GenerationStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "RenderBlockPhase" AS ENUM ('QUEUED', 'FACE_SWAP', 'VIDEO_GENERATION', 'RETRYING', 'STITCHING', 'COMPLETED', 'REUSED', 'FELL_BACK', 'FAILED');

-- CreateEnum
CREATE TYPE "CreditTxnType" AS ENUM ('PURCHASE', 'SPEND', 'REFUND', 'BONUS', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('CREATED', 'PAID', 'FAILED');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "credits" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "GenerationStatus" NOT NULL DEFAULT 'PENDING',
    "prompt" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "duration" INTEGER,
    "resolution" TEXT,
    "aspectRatio" TEXT,
    "generateAudio" BOOLEAN,
    "startFrameKey" TEXT,
    "endFrameKey" TEXT,
    "referenceFrameKeys" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "videoKey" TEXT,
    "providerJobId" TEXT,
    "cost" DOUBLE PRECISION,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "image" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "GenerationStatus" NOT NULL DEFAULT 'PENDING',
    "prompt" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "resolution" TEXT,
    "aspectRatio" TEXT,
    "referenceImageKeys" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "imageKey" TEXT,
    "providerJobId" TEXT,
    "cost" DOUBLE PRECISION,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "face_swap" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "GenerationStatus" NOT NULL DEFAULT 'PENDING',
    "sourceKey" TEXT NOT NULL,
    "targetKey" TEXT NOT NULL,
    "outputKey" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "face_swap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avatar" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "GenerationStatus" NOT NULL DEFAULT 'COMPLETED',
    "name" TEXT NOT NULL,
    "sourceImageKeys" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "faceKey" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "avatar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "avatarSlots" INTEGER NOT NULL DEFAULT 1,
    "avatarIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "published" BOOLEAN NOT NULL DEFAULT false,
    "thumbnailPrompt" TEXT,
    "previewVideoKey" TEXT,
    "thumbnailKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_block" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "startSec" DOUBLE PRECISION NOT NULL,
    "endSec" DOUBLE PRECISION NOT NULL,
    "track" INTEGER NOT NULL DEFAULT 0,
    "prompt" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "duration" INTEGER,
    "resolution" TEXT,
    "aspectRatio" TEXT,
    "startImageKey" TEXT,
    "endImageKey" TEXT,
    "swappedStartKey" TEXT,
    "swappedEndKey" TEXT,
    "videoKey" TEXT,
    "sourceVideoKey" TEXT,
    "cropStart" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cropEnd" DOUBLE PRECISION,
    "linkGroupId" TEXT,
    "faceSwapStart" BOOLEAN NOT NULL DEFAULT false,
    "faceSwapEnd" BOOLEAN NOT NULL DEFAULT false,
    "avatarSlot" INTEGER NOT NULL DEFAULT 0,
    "swapContext" TEXT,
    "lipsync" BOOLEAN NOT NULL DEFAULT false,
    "swapModel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "template_block_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_audio_clip" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "startSec" DOUBLE PRECISION NOT NULL,
    "endSec" DOUBLE PRECISION NOT NULL,
    "track" INTEGER NOT NULL DEFAULT 0,
    "audioKey" TEXT NOT NULL,
    "name" TEXT,
    "duration" DOUBLE PRECISION NOT NULL,
    "cropStart" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cropEnd" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "template_audio_clip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_render" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "GenerationStatus" NOT NULL DEFAULT 'PENDING',
    "avatarIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "videoKey" TEXT,
    "thumbnailKey" TEXT,
    "cost" DOUBLE PRECISION,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "template_render_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_render_block" (
    "id" TEXT NOT NULL,
    "renderId" TEXT NOT NULL,
    "blockId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "startSec" DOUBLE PRECISION NOT NULL,
    "endSec" DOUBLE PRECISION NOT NULL,
    "label" TEXT,
    "phase" "RenderBlockPhase" NOT NULL DEFAULT 'QUEUED',
    "attempt" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "videoKey" TEXT,
    "swappedStartKey" TEXT,
    "swappedEndKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "template_render_block_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_transaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "CreditTxnType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "description" TEXT,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'CREATED',
    "packId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "credits" INTEGER NOT NULL,
    "dodoSessionId" TEXT NOT NULL,
    "dodoPaymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AvatarToTemplateRender" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AvatarToTemplateRender_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "video_userId_idx" ON "video"("userId");

-- CreateIndex
CREATE INDEX "image_userId_idx" ON "image"("userId");

-- CreateIndex
CREATE INDEX "face_swap_userId_idx" ON "face_swap"("userId");

-- CreateIndex
CREATE INDEX "avatar_userId_idx" ON "avatar"("userId");

-- CreateIndex
CREATE INDEX "template_creatorId_idx" ON "template"("creatorId");

-- CreateIndex
CREATE INDEX "template_block_templateId_idx" ON "template_block"("templateId");

-- CreateIndex
CREATE INDEX "template_block_linkGroupId_idx" ON "template_block"("linkGroupId");

-- CreateIndex
CREATE INDEX "template_audio_clip_templateId_idx" ON "template_audio_clip"("templateId");

-- CreateIndex
CREATE INDEX "template_render_templateId_idx" ON "template_render"("templateId");

-- CreateIndex
CREATE INDEX "template_render_userId_idx" ON "template_render"("userId");

-- CreateIndex
CREATE INDEX "template_render_block_renderId_idx" ON "template_render_block"("renderId");

-- CreateIndex
CREATE INDEX "credit_transaction_userId_idx" ON "credit_transaction"("userId");

-- CreateIndex
CREATE INDEX "credit_transaction_referenceType_referenceId_idx" ON "credit_transaction"("referenceType", "referenceId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_dodoSessionId_key" ON "payment"("dodoSessionId");

-- CreateIndex
CREATE INDEX "payment_userId_idx" ON "payment"("userId");

-- CreateIndex
CREATE INDEX "_AvatarToTemplateRender_B_index" ON "_AvatarToTemplateRender"("B");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video" ADD CONSTRAINT "video_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image" ADD CONSTRAINT "image_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "face_swap" ADD CONSTRAINT "face_swap_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avatar" ADD CONSTRAINT "avatar_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template" ADD CONSTRAINT "template_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_block" ADD CONSTRAINT "template_block_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_audio_clip" ADD CONSTRAINT "template_audio_clip_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_render" ADD CONSTRAINT "template_render_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_render" ADD CONSTRAINT "template_render_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_render_block" ADD CONSTRAINT "template_render_block_renderId_fkey" FOREIGN KEY ("renderId") REFERENCES "template_render"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_transaction" ADD CONSTRAINT "credit_transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AvatarToTemplateRender" ADD CONSTRAINT "_AvatarToTemplateRender_A_fkey" FOREIGN KEY ("A") REFERENCES "avatar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AvatarToTemplateRender" ADD CONSTRAINT "_AvatarToTemplateRender_B_fkey" FOREIGN KEY ("B") REFERENCES "template_render"("id") ON DELETE CASCADE ON UPDATE CASCADE;
