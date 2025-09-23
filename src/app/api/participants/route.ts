import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { ObjectId } from 'mongodb'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await connectDB()
    const url = new URL(request.url)
    const workshopId = url.searchParams.get('workshopId')

    let query = {}
    if (workshopId) {
      query = { workshopId }
    }

    // Regular users can only see participants from their own workshops
    if (session.user.role !== 'admin') {
      // Get workshops conducted by this user
      const userWorkshops = await db.collection('workshops').find({ conductedBy: session.user.id }).toArray()
      const workshopIds = userWorkshops.map(w => w._id?.toString())

      if (workshopId && !workshopIds.includes(workshopId)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }

      if (!workshopId) {
        query = { workshopId: { $in: workshopIds } }
      }
    }

    const participants = await db.collection('participants').find(query).toArray()
    return NextResponse.json(participants)
  } catch (error) {
    console.error('Fetch participants error:', error)
    return NextResponse.json({ error: 'Failed to fetch participants' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await connectDB()
    const participantData = await request.json()

    // Validate required fields
    if (!participantData.workshopId || !participantData.name || !participantData.age || !participantData.gender || !participantData.idNumber || !participantData.phoneNumber) {
      return NextResponse.json({ error: 'Workshop ID, name, age, gender, ID number, and phone number are required' }, { status: 400 })
    }

    // Validate gender field
    if (!['male', 'female', 'other'].includes(participantData.gender)) {
      return NextResponse.json({ error: 'Gender must be male, female, or other' }, { status: 400 })
    }

    // Check if workshop exists and user has permission
    const workshop = await db.collection('workshops').findOne({ _id: new ObjectId(participantData.workshopId) })
    if (!workshop) {
      return NextResponse.json({ error: 'Workshop not found' }, { status: 404 })
    }

    // Regular users can only add participants to their own workshops
    if (session.user.role !== 'admin' && workshop.conductedBy !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const newParticipant = {
      workshopId: participantData.workshopId,
      name: participantData.name,
      age: participantData.age,
      gender: participantData.gender,
      idNumber: participantData.idNumber,
      phoneNumber: participantData.phoneNumber,
      specialStatus: {
        isDisabled: participantData.specialStatus?.isDisabled || false,
        isWounded: participantData.specialStatus?.isWounded || false,
        isSeparated: participantData.specialStatus?.isSeparated || false,
        isUnaccompanied: participantData.specialStatus?.isUnaccompanied || false
      },
      registrationDate: new Date().toISOString(),
      attendanceStatus: 'registered',
      materialsReceived: []
    }

    const result = await db.collection('participants').insertOne(newParticipant)
    return NextResponse.json({ _id: result.insertedId, ...newParticipant })
  } catch (error) {
    console.error('Create participant error:', error)
    return NextResponse.json({ error: 'Failed to create participant' }, { status: 500 })
  }
}