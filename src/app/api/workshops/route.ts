import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Workshop } from '@/types/product'

export async function GET() {
  try {
    const db = await connectDB()
    const workshops = await db.collection('workshops').find({}).toArray()
    return NextResponse.json(workshops)
  } catch (error) {
    console.error('Fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch workshops' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await connectDB()
    const workshop: Workshop = await request.json()

    // Validate required fields
    if (!workshop.title || !workshop.date) {
      return NextResponse.json({ error: 'Title and date are required' }, { status: 400 })
    }

    // Ensure numeric fields are numbers
    workshop.participants = Number(workshop.participants) || 0

    const result = await db.collection('workshops').insertOne(workshop)
    return NextResponse.json({ _id: result.insertedId, ...workshop })
  } catch (error) {
    console.error('Create error:', error)
    return NextResponse.json({ error: 'Failed to create workshop' }, { status: 500 })
  }
}