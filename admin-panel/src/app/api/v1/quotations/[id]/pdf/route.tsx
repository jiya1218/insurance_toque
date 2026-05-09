import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { renderToStream } from '@react-pdf/renderer'
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

    // 2. Generate PDF
    const { pdf } = await import('@react-pdf/renderer')
    const buffer = await pdf(<QuotationPDF data={quotation} />).toBuffer()
    
    // 3. Return PDF
    return new NextResponse(buffer, {
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
