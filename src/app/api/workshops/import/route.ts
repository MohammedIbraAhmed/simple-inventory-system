import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { connectDB } from '@/lib/db'
import { authConfig } from '@/lib/auth-config'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    let data: any[] = []

    // Parse file based on extension
    if (fileExtension === 'csv') {
      const text = await file.text()
      const parseResult = Papa.parse(text, { header: true, skipEmptyLines: true })
      data = parseResult.data
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      data = XLSX.utils.sheet_to_json(worksheet)
    } else {
      return NextResponse.json(
        { error: 'Unsupported file format. Please use CSV or Excel files.' },
        { status: 400 }
      )
    }

    const db = await connectDB()
    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ row: number; error: string; data?: any }>
    }

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      const rowNumber = i + 2 // +2 because Excel/CSV rows start at 1 and we skip header

      try {
        // Validate required fields
        if (!row.title || !row.date || !row.startTime || !row.endTime || !row.location) {
          results.errors.push({
            row: rowNumber,
            error: 'Missing required fields: title, date, startTime, endTime, and location are required',
            data: row
          })
          results.failed++
          continue
        }

        // Validate date format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/
        if (!dateRegex.test(row.date)) {
          results.errors.push({
            row: rowNumber,
            error: 'Date must be in YYYY-MM-DD format',
            data: row
          })
          results.failed++
          continue
        }

        // Validate time format
        const timeRegex = /^\d{2}:\d{2}$/
        if (!timeRegex.test(row.startTime) || !timeRegex.test(row.endTime)) {
          results.errors.push({
            row: rowNumber,
            error: 'Time must be in HH:MM format',
            data: row
          })
          results.failed++
          continue
        }

        // Validate expected participants
        const expectedParticipants = parseInt(row.expectedParticipants) || 0
        if (expectedParticipants < 0) {
          results.errors.push({
            row: rowNumber,
            error: 'Expected participants must be a non-negative number',
            data: row
          })
          results.failed++
          continue
        }

        // Create workshop
        await db.collection('workshops').insertOne({
          title: row.title,
          description: row.description || '',
          date: row.date,
          startTime: row.startTime,
          endTime: row.endTime,
          location: row.location,
          conductedBy: session.user.id,
          status: 'planned',
          expectedParticipants,
          actualParticipants: 0,
          materialsUsed: [],
          createdAt: new Date().toISOString(),
          notes: row.notes || ''
        })

        results.success++

      } catch (error) {
        console.error(`Error processing row ${rowNumber}:`, error)
        results.errors.push({
          row: rowNumber,
          error: `Processing error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          data: row
        })
        results.failed++
      }
    }

    return NextResponse.json(results)

  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: 'Import failed' },
      { status: 500 }
    )
  }
}