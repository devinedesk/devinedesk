import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const REQUESTS_FILE = path.join(DATA_DIR, 'requests.json');

async function readJsonObj(file) {
    try {
        const data = await fs.readFile(file, 'utf-8');
        return JSON.parse(data);
    } catch {
        return {};
    }
}

export async function GET(request, { params }) {
    const slug = await params;
    const pathSegments = slug.path || [];
    const pathUrl = pathSegments.join('/');

    if (pathSegments[0] === 'predictions' && pathSegments[2] === 'result') {
        const requestId = pathSegments[1];
        
        // This is a local request for our custom MVP Engine
        const requests = await readJsonObj(REQUESTS_FILE);
        const req = requests[requestId];
        
        if (req) {
            if (!req.is_complete) {
                return NextResponse.json({ is_complete: false, status: 'processing' });
            }
            if (req.error) {
                return NextResponse.json({ detail: { error: req.error } }, { status: 400 });
            }
            return NextResponse.json(req);
        }
    }

    return NextResponse.json({ error: 'Endpoint not found or not handled by local engine' }, { status: 404 });
}
