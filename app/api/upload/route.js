import { NextResponse } from 'next/server';
import { validateRequest } from '../auth-check';
import prisma from '@/src/lib/prisma';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request) {
    try {
        const auth = await validateRequest(request);
        if (!auth.authorized) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Generate a unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const filename = `${uniqueSuffix}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const uploadDir = join(process.cwd(), 'public', 'uploads');
        const filepath = join(uploadDir, filename);

        await writeFile(filepath, buffer);
        const url = `/uploads/${filename}`;

        let assetRecord = null;
        if (auth.method === 'session' && auth.user) {
            assetRecord = await prisma.asset.create({
                data: {
                    userId: auth.user.id,
                    type: file.type.startsWith('video') ? 'video' : (file.type.startsWith('audio') ? 'audio' : 'image'),
                    url: url,
                    metadata: JSON.stringify({ filename: file.name, size: file.size, mimeType: file.type })
                }
            });
        }

        return NextResponse.json({ url: url, assetId: assetRecord?.id });
    } catch (error) {
        console.error("Upload API Error:", error);
        return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
    }
}
