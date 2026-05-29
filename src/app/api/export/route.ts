import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { folderName, files } = body;

    if (!folderName || !files) {
      return NextResponse.json(
        { error: 'Missing folderName or files' },
        { status: 400 }
      );
    }

    // Server-side fallback for large exports
    // In production, this would use JSZip on the server
    return NextResponse.json({
      message: 'Export initiated',
      folderName,
      fileCount: files.length,
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to process export request' },
      { status: 500 }
    );
  }
}
