import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Workshop } from '@/types/product'
import { createAuthHandler, AuthSession } from '@/lib/auth-middleware'
import { generateUniqueWorkshopCode, getLocationDisplayName } from '@/lib/workshop-utils'
import { ObjectId } from 'mongodb'

async function handleGetWorkshops(request: NextRequest, session: AuthSession) {
  try {
    const db = await connectDB()

    let query = {}
    // Regular users can only see their own workshops, admins see all
    if (session.user.role !== 'admin') {
      query = { conductedBy: session.user.id }
    }

    const workshops = await db.collection('workshops').find(query).toArray()
    return NextResponse.json(workshops)
  } catch (error) {
    console.error('Fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch workshops' }, { status: 500 })
  }
}

async function handleCreateWorkshop(request: NextRequest, session: AuthSession) {
  try {
    const db = await connectDB()
    const workshop: Workshop = await request.json()

    // Validate required fields
    if (!workshop.title || !workshop.date || !workshop.locationId) {
      return NextResponse.json({ error: 'Title, date, and location are required' }, { status: 400 })
    }

    // Get location details for workshop code generation
    const location = await db.collection('locations').findOne({ _id: new ObjectId(workshop.locationId) })
    if (!location) {
      return NextResponse.json({ error: 'Invalid location' }, { status: 400 })
    }

    // Get user details for workshop code generation
    const user = await db.collection('users').findOne({ _id: new ObjectId(session.user.id) })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 400 })
    }

    // Get existing workshop codes for uniqueness check
    const existingWorkshops = await db.collection('workshops')
      .find({}, { projection: { workshopCode: 1 } })
      .toArray()
    const existingCodes = existingWorkshops
      .map(w => w.workshopCode)
      .filter(code => code) // Remove null/undefined codes

    // Generate unique workshop code
    const locationName = getLocationDisplayName(location)
    const workshopCode = await generateUniqueWorkshopCode(
      user.name,
      workshop.date,
      locationName,
      existingCodes
    )

    // Set workshop properties
    workshop.workshopCode = workshopCode
    workshop.conductedBy = session.user.id
    workshop.createdAt = new Date().toISOString()
    workshop.status = 'planned'
    workshop.actualParticipants = 0
    workshop.materialsUsed = []

    // Ensure numeric fields are numbers
    workshop.expectedParticipants = Number(workshop.expectedParticipants) || 0

    const { _id, ...workshopWithoutId } = workshop
    const result = await db.collection('workshops').insertOne(workshopWithoutId)
    return NextResponse.json({ _id: result.insertedId, ...workshop })
  } catch (error) {
    console.error('Create error:', error)
    return NextResponse.json({ error: 'Failed to create workshop' }, { status: 500 })
  }
}

// Authenticated users can access workshops (with role-based filtering)
export const GET = createAuthHandler(handleGetWorkshops, 'any')
export const POST = createAuthHandler(handleCreateWorkshop, 'any')