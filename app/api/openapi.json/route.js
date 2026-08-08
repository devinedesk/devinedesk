import { NextResponse } from 'next/server';
import { generateOpenAPI } from '@/src/lib/openapi-registry';

export async function GET() {
  try {
    const openapi = generateOpenAPI();
    return NextResponse.json(openapi);
  } catch (error) {
    console.error('Failed to generate OpenAPI spec:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
