import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  
  if (!url) {
    return NextResponse.json({ error: 'Missing URL parameter' }, { status: 400 });
  }

  try {
    // Get the full backend URL
    const backendUrl = `http://localhost:8000${url}`;
    console.log('Fetching PDF from:', backendUrl);
    
    // Fetch the PDF from the backend
    const response = await fetch(backendUrl);
    
    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}: ${response.statusText}`);
    }
    
    // Get the PDF data
    const pdfData = await response.arrayBuffer();
    
    // Extract the filename from the URL
    const filename = url.split('/').pop() || 'document.pdf';
    
    // Return the PDF data with appropriate headers
    return new NextResponse(pdfData, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error proxying PDF:', error);
    return NextResponse.json(
      { error: 'Failed to fetch PDF from backend' },
      { status: 500 }
    );
  }
} 