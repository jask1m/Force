import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('documents') as File[];

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No documents provided' },
        { status: 400 }
      );
    }

    // Create documents directory if it doesn't exist
    // TODO: change this to use MongoDB instead of local file system
    const documentsDir = join(process.cwd(), '..', 'backend', 'data', 'documents');

    if (!existsSync(documentsDir)) {
      await mkdir(documentsDir, { recursive: true });
    }

    const savedDocuments = await Promise.all(
      files.map(async (file) => {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create a filename with the original name but with a UUID prefix
        const fileName = `${file.name}`;
        const filePath = join(documentsDir, fileName);

        await writeFile(filePath, buffer);

        return {
          name: file.name,
          size: file.size,
          path: filePath
        };
      })
    );

    return NextResponse.json({
      success: true,
      documents: savedDocuments
    });

  } catch (error) {
    console.error('Error uploading documents:', error);
    return NextResponse.json(
      { error: 'Failed to upload documents' },
      { status: 500 }
    );
  }
}

