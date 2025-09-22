import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { connectDB } from '@/lib/db'
import { authConfig } from '@/lib/auth-config'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig)
    if (!session || session.user.role !== 'admin') {
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
        if (!row.name || !row.sku) {
          results.errors.push({
            row: rowNumber,
            error: 'Missing required fields: name and sku are required',
            data: row
          })
          results.failed++
          continue
        }

        // Validate data types
        const stock = parseInt(row.stock) || 0
        const price = parseFloat(row.price) || 0

        if (stock < 0) {
          results.errors.push({
            row: rowNumber,
            error: 'Stock must be a non-negative number',
            data: row
          })
          results.failed++
          continue
        }

        if (price < 0) {
          results.errors.push({
            row: rowNumber,
            error: 'Price must be a non-negative number',
            data: row
          })
          results.failed++
          continue
        }

        const category = row.category?.toLowerCase()
        if (category && !['materials', 'refreshments'].includes(category)) {
          results.errors.push({
            row: rowNumber,
            error: 'Category must be either "materials" or "refreshments"',
            data: row
          })
          results.failed++
          continue
        }

        // Check if SKU already exists
        const existingProduct = await db.collection('products').findOne({ sku: row.sku })
        if (existingProduct) {
          // Update existing product
          await db.collection('products').updateOne(
            { sku: row.sku },
            {
              $set: {
                name: row.name,
                stock,
                price,
                category: category || 'materials',
                notes: row.notes || '',
                updatedAt: new Date().toISOString()
              }
            }
          )
        } else {
          // Create new product
          await db.collection('products').insertOne({
            name: row.name,
            sku: row.sku,
            stock,
            price,
            category: category || 'materials',
            notes: row.notes || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
        }

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