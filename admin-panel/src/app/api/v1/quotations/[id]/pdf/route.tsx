import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { QuotationPDF } from '@/components/pdf/QuotationPDF'
import React from 'react'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 1. Fetch data
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        lead: true,
        creator: true
      }
    })

    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 })
    }

    // 2. Generate PDF using Web APIs (Blob/ArrayBuffer) for maximum compatibility with Next.js 15
    const { pdf } = await import('@react-pdf/renderer')
    
    // Using toBlob() + arrayBuffer() is the most robust way to handle PDF data in Next.js 15
    // as it avoids conflicts between Node.js Streams and Web Streams during the build.
    const blob = await pdf(<QuotationPDF data={quotation} />).toBlob()
    const pdfArrayBuffer = await blob.arrayBuffer()

    // 3. Return PDF
    return new NextResponse(pdfArrayBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="quotation_${id.slice(0, 8)}.pdf"`
      }
    })
  } catch (error: any) {
    console.error('PDF Generation Error:', error)
    return NextResponse.json({ error: 'Internal Server Error', message: error.message }, { status: 500 })
  }
}
