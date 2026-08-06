import { NextResponse } from 'next/server';
import { withApiAuth } from '@/src/lib/apiHandler';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import env from '@/src/lib/env';
import { AssetService } from '@/src/lib/services/assetService';

// Initialize S3 Client lazily
let s3Client = null;
const isS3Configured = env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY && env.S3_BUCKET_NAME;

if (isS3Configured) {
    s3Client = new S3Client({
        region: env.AWS_REGION,
        credentials: {
            accessKeyId: env.AWS_ACCESS_KEY_ID,
            secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
        },
        ...(env.S3_ENDPOINT ? { endpoint: env.S3_ENDPOINT, forcePathStyle: true } : {}),
    });
}

export const POST = withApiAuth({
    handler: async (request, { auth }) => {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'audio/mpeg', 'audio/wav'];
        if (!allowedMimeTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Invalid file type. Only images, videos, and audio are allowed.' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Generate a unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const filename = `${uniqueSuffix}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        
        let url = '';

        if (isS3Configured) {
            // Upload to S3 / Cloudflare R2
            const command = new PutObjectCommand({
                Bucket: env.S3_BUCKET_NAME,
                Key: `uploads/${filename}`,
                Body: buffer,
                ContentType: file.type,
            });
            await s3Client.send(command);
            
            // Construct the public URL (Note: this assumes the bucket or endpoint is publicly readable)
            url = env.S3_ENDPOINT 
                ? `${env.S3_ENDPOINT}/${env.S3_BUCKET_NAME}/uploads/${filename}`
                : `https://${env.S3_BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/uploads/${filename}`;
        } else {
            if (env.NODE_ENV === 'production') {
                return NextResponse.json({ error: 'Storage is not properly configured for production environments.' }, { status: 500 });
            }
            // Fallback to local storage for development
            const uploadDir = join(process.cwd(), 'public', 'uploads');
            const filepath = join(uploadDir, filename);
            await writeFile(filepath, buffer);
            url = `/uploads/${filename}`;
        }

        let assetRecord = null;
        if (auth.method === 'session' && auth.user) {
            assetRecord = await AssetService.recordAsset(
                auth.user.id, 
                file.type, 
                url, 
                { filename: file.name, size: file.size, mimeType: file.type }
            );
        }

        return NextResponse.json({ url: url, assetId: assetRecord?.id });
    }
});
