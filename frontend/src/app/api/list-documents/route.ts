import { NextResponse } from 'next/server';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET() {
  try {
    // Path to documents directory
    const documentsDir = join(process.cwd(), '..', 'backend', 'data', 'documents');

    // Check if directory exists
    if (!existsSync(documentsDir)) {
      return NextResponse.json({ documents: [] });
    }

    // Read directory contents
    const files = await readdir(documentsDir);

    // Get file details
    const documentPromises = files.map(async (fileName) => {
      const filePath = join(documentsDir, fileName);
      const fileStats = await stat(filePath);

      return {
        id: `doc-${fileName.replace(/\s+/g, '-')}`,
        name: fileName,
        size: fileStats.size,
        date: new Date(fileStats.mtime).toLocaleDateString(),
        path: filePath
      };
    });

    const documents = await Promise.all(documentPromises);

    return NextResponse.json({
      documents
    });

  } catch (error) {
    console.error('Error listing documents:', error);
    return NextResponse.json(
      { error: 'Failed to list documents' },
      { status: 500 }
    );
  }
}