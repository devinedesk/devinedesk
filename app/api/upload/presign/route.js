import { checkRateLimit } from '@/src/lib/rateLimit';
import { NextResponse } from 'next/server';
import { withApiAuth } from '@/src/lib/apiHandler';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import env from '@/src/lib/env';
import { z } from 'zod';

let s3Client = null;
const isS3Configured = env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY && env.S3_BUCKET_NAME;

if (isS3Configured) {
  s3Client = new S3Client({
    region: env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
    ...(env.S3_ENDPOINT ? { endpoint: env.S3_ENDPOINT, forcePathStyle: true } : {}),
  });
}

const presignSchema = z.object({
  filename: z.string().min(1),
  contentType: z
    .string()
    .regex(/^(image|video|audio)\/.*$/, 'Only images, videos, and audio are allowed.'),
});

export const POST = withApiAuth({
  schema: presignSchema,
  handler: async (request, { auth, body }) => {
    if (!isS3Configured) {
      return NextResponse.json(
        { error: 'S3 Storage is not configured on the server.' },
        { status: 500 }
      );
    }

    const { filename, contentType } = body;
    const userId = auth.user?.id || 'anonymous';

    // Generate a secure unique object key
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `uploads/${userId}/${uniqueSuffix}-${safeFilename}`;

    const command = new PutObjectCommand({
      Bucket: env.S3_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    try {
      // Create a presigned URL valid for 5 minutes
      const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

      // Calculate the final public URL
      const publicUrl = env.S3_ENDPOINT
        ? `${env.S3_ENDPOINT}/${env.S3_BUCKET_NAME}/${key}`
        : `https://${env.S3_BUCKET_NAME}.s3.${env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;

      return NextResponse.json({
        uploadUrl: presignedUrl,
        publicUrl: publicUrl,
        key: key,
      });
    } catch (error) {
      console.error('Error generating presigned URL', error);
      return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 });
    }
  },
});
