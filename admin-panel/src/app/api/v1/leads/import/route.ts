import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { validateAuth } from '@/lib/auth-guard'
import Papa from 'papaparse'

export async function POST(req: NextRequest) {
  const { error, context } = await validateAuth(req, 'leads.create')
  if (error) return error

  try {
    const contentType = req.headers.get('content-type') || ''
    let rawData: any[] = []

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      const file = formData.get('file') as File
      if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
      const text = await file.text()
      const { data } = Papa.parse(text, { header: true, skipEmptyLines: true })
      rawData = data
    } else {
      const body = await req.json()
      rawData = Array.isArray(body.leads) ? body.leads : []
    }

    if (rawData.length === 0) {
      return NextResponse.json({ error: 'No data found to import' }, { status: 400 })
    }

    // 1. Data Validation & Sanitization
    const validLeads: any[] = []
    const errorRows: any[] = []
    const vehicleNumbers = new Set<string>()

    // Fetch existing vehicle numbers to prevent duplicates across the whole system
    const existingLeads = await prisma.lead.findMany({
      select: { vehicleNo: true }
    })
    const existingVehicles = new Set(existingLeads.map(l => l.vehicleNo).filter(Boolean))

    rawData.forEach((row, index) => {
      const vehicleNo = row['Vehicle No'] || row['vehicleNo'] || row['vehicle_no']
      const ownerName = row['Owner Name'] || row['clientName'] || row['owner_name']
      const contactNo = row['Contact Number'] || row['clientPhone'] || row['contact_number']
      const expiryDateStr = row['Insurance Expiry Date'] || row['expiryDate'] || row['expiry_date']

      if (!vehicleNo || !ownerName || !contactNo || !expiryDateStr) {
        errorRows.push({ row: index + 1, error: 'Missing mandatory fields (Vehicle No, Owner Name, Contact, or Expiry)' })
        return
      }

      if (vehicleNumbers.has(vehicleNo) || existingVehicles.has(vehicleNo)) {
        errorRows.push({ row: index + 1, error: `Duplicate Vehicle No: ${vehicleNo}` })
        return
      }

      vehicleNumbers.add(vehicleNo)
      
      validLeads.push({
        vehicleNo,
        clientName: ownerName,
        clientPhone: String(contactNo),
        clientEmail: row['Email'] || null,
        expiryDate: new Date(expiryDateStr),
        registrationDate: row['Registration Date'] ? new Date(row['Registration Date']) : null,
        gvw: row['GVW'] ? String(row['GVW']) : null,
        address: row['Address'] || null,
        messageTemplate: row['Message Template'] || null,
        existingAgent: row['Existing Agent'] || null,
        status: 'New'
      })
    })

    // 2. Fetch Active Employees (Standard Users)
    const employees = await prisma.user.findMany({
      where: {
        isActive: true,
        role: {
          name: {
            notIn: ['Super Admin', 'Admin', 'Viewer']
          }
        }
      },
      select: { id: true }
    })

    if (employees.length === 0) {
      return NextResponse.json({ 
        error: 'No active employees found for assignment', 
        stats: { total: rawData.length, valid: validLeads.length, errors: errorRows.length }
      }, { status: 400 })
    }

    // 3. Round Robin Assignment
    const leadsWithAssignment = validLeads.map((lead, index) => {
      const assignee = employees[index % employees.length]
      return {
        ...lead,
        assignedTo: assignee.id
      }
    })

    // 4. Batch Create Leads
    const result = await prisma.$transaction(async (tx) => {
      const createdCount = await tx.lead.createMany({
        data: leadsWithAssignment,
        skipDuplicates: true
      })
      
      return createdCount
    })

    return NextResponse.json({
      success: true,
      stats: {
        total: rawData.length,
        valid: validLeads.length,
        duplicates: rawData.length - validLeads.length - errorRows.length,
        errors: errorRows.length,
        assignedCount: result.count
      },
      errorDetails: errorRows.slice(0, 10) // Return first 10 errors for preview
    })

  } catch (error: any) {
    console.error('Lead Import Error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
