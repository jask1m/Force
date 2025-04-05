import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('documents') as File[];
    const documentType = formData.get('documentType') as 'application' | 'supporting';

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No documents provided' },
        { status: 400 }
      );
    }

    // Create base documents directory if it doesn't exist
    const baseDocumentsDir = join(process.cwd(), '..', 'backend', 'data', 'documents');
    if (!existsSync(baseDocumentsDir)) {
      await mkdir(baseDocumentsDir, { recursive: true });
    }

    // Determine the target directory based on document type
    const targetDir = documentType === 'application'
      ? join(baseDocumentsDir, 'applications')
      : join(baseDocumentsDir, 'supporting');

    // Create the target directory if it doesn't exist
    if (!existsSync(targetDir)) {
      await mkdir(targetDir, { recursive: true });
    }

    const savedDocuments = await Promise.all(
      files.map(async (file) => {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const fileName = `${file.name}`;
        const filePath = join(targetDir, fileName);

        await writeFile(filePath, buffer);

        return {
          name: file.name,
          size: file.size,
          path: filePath,
          type: documentType
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
