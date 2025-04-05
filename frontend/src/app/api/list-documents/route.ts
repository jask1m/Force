import { NextResponse } from 'next/server';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

export async function GET() {
  try {
    // Path to documents directory
    const baseDocumentsDir = join(process.cwd(), '..', 'backend', 'data', 'documents');
    const applicationDocsDir = join(baseDocumentsDir, 'applications');
    const supportingDocsDir = join(baseDocumentsDir, 'supporting');

    // Create directories if they don't exist
    if (!existsSync(baseDocumentsDir)) {
      mkdirSync(baseDocumentsDir, { recursive: true });
    }
    if (!existsSync(applicationDocsDir)) {
      mkdirSync(applicationDocsDir, { recursive: true });
    }
    if (!existsSync(supportingDocsDir)) {
      mkdirSync(supportingDocsDir, { recursive: true });
    }

    // Read application documents
    const applicationFiles = existsSync(applicationDocsDir) ? await readdir(applicationDocsDir) : [];
    const applicationDocPromises = applicationFiles.map(async (fileName) => {
      const filePath = join(applicationDocsDir, fileName);
      const fileStats = await stat(filePath);

      return {
        id: `doc-${fileName.replace(/\s+/g, '-')}`,
        name: fileName,
        size: fileStats.size,
        date: new Date(fileStats.mtime).toLocaleDateString(),
        path: filePath,
        type: "application"
      };
    });

    // Read supporting documents
    const supportingFiles = existsSync(supportingDocsDir) ? await readdir(supportingDocsDir) : [];
    const supportingDocPromises = supportingFiles.map(async (fileName) => {
      const filePath = join(supportingDocsDir, fileName);
      const fileStats = await stat(filePath);

      return {
        id: `doc-${fileName.replace(/\s+/g, '-')}`,
        name: fileName,
        size: fileStats.size,
        date: new Date(fileStats.mtime).toLocaleDateString(),
        path: filePath,
        type: "supporting"
      };
    });

    // Also check the root documents directory for backward compatibility
    const rootFiles = existsSync(baseDocumentsDir) ? await readdir(baseDocumentsDir) : [];
    const rootDocPromises = rootFiles
      .filter(fileName => !['applications', 'supporting'].includes(fileName)) // Exclude directories
      .map(async (fileName) => {
        const filePath = join(baseDocumentsDir, fileName);
        const fileStats = await stat(filePath);

        if (!fileStats.isFile()) return null;

        return {
          id: `doc-${fileName.replace(/\s+/g, '-')}`,
          name: fileName,
          size: fileStats.size,
          date: new Date(fileStats.mtime).toLocaleDateString(),
          path: filePath,
          type: "supporting" // Default to supporting for legacy files
        };
      });

    // Combine all documents
    const allPromises = [...applicationDocPromises, ...supportingDocPromises, ...rootDocPromises];
    const allDocuments = (await Promise.all(allPromises)).filter(Boolean);

    return NextResponse.json({
      documents: allDocuments
    });

  } catch (error) {
    console.error('Error listing documents:', error);
    return NextResponse.json(
      { error: 'Failed to list documents' },
      { status: 500 }
    );
  }
}