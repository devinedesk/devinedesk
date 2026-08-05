import { NextResponse } from 'next/server';
import { validateRequest } from '../../../auth-check';

const LOCAL_API_BASE = process.env.BACKEND_API_URL || 'http://localhost:3000';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || process.env.LOCAL_API_KEY || process.env.OPENROUTER_API_KEY || '';

function cleanHeaders(request) {
    const headers = new Headers(request.headers);
    headers.delete('host');
    headers.delete('connection');
    headers.delete('cookie');
    headers.delete('Authorization');
    headers.delete('x-api-key'); // Prevent client injection
    return headers;
}

export async function GET(request, { params }) {
    const auth = await validateRequest(request);
    if (!auth.authorized) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });

    const slug = await params;
    const pathSegments = slug.path || [];
    const path = pathSegments.join('/');
    
    const { search } = new URL(request.url);
    const targetUrl = `${LOCAL_API_BASE}/api/v1/creative-agent/${path}${search}`;

    const headers = cleanHeaders(request);
    if (INTERNAL_API_KEY) headers.set('x-api-key', INTERNAL_API_KEY);

    try {
        const response = await fetch(targetUrl, { headers, method: 'GET' });
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error(`[creative-agent proxy GET ERROR] ${targetUrl}:`, error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request, { params }) {
    const auth = await validateRequest(request);
    if (!auth.authorized) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });

    const slug = await params;
    const pathSegments = slug.path || [];
    const path = pathSegments.join('/');
    
    const { search } = new URL(request.url);
    const targetUrl = `${LOCAL_API_BASE}/api/v1/creative-agent/${path}${search}`;

    const headers = cleanHeaders(request);
    if (INTERNAL_API_KEY) headers.set('x-api-key', INTERNAL_API_KEY);

    try {
        const body = await request.arrayBuffer();
        const response = await fetch(targetUrl, { method: 'POST', headers, body });
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error(`[creative-agent proxy POST ERROR] ${targetUrl}:`, error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(request, { params }) {
    const auth = await validateRequest(request);
    if (!auth.authorized) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });

    const slug = await params;
    const pathSegments = slug.path || [];
    const path = pathSegments.join('/');
    
    const { search } = new URL(request.url);
    const targetUrl = `${LOCAL_API_BASE}/api/v1/creative-agent/${path}${search}`;

    const headers = cleanHeaders(request);
    if (INTERNAL_API_KEY) headers.set('x-api-key', INTERNAL_API_KEY);

    try {
        const body = await request.arrayBuffer();
        const response = await fetch(targetUrl, { method: 'PATCH', headers, body });
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error(`[creative-agent proxy PATCH ERROR] ${targetUrl}:`, error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    const auth = await validateRequest(request);
    if (!auth.authorized) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });

    const slug = await params;
    const pathSegments = slug.path || [];
    const path = pathSegments.join('/');
    
    const { search } = new URL(request.url);
    const targetUrl = `${LOCAL_API_BASE}/api/v1/creative-agent/${path}${search}`;

    const headers = cleanHeaders(request);
    if (INTERNAL_API_KEY) headers.set('x-api-key', INTERNAL_API_KEY);

    try {
        const response = await fetch(targetUrl, { method: 'DELETE', headers });
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error(`[creative-agent proxy DELETE ERROR] ${targetUrl}:`, error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
