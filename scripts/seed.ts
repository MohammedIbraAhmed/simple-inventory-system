import { MongoClient } from 'mongodb'
import { hashPassword } from '../src/lib/auth-utils'

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/simple-inventory'

async function seedDatabase() {
  const client = new MongoClient(uri)

  try {
    await client.connect()
    console.log('Connected to MongoDB')

    const db = client.db('sinv')

    // Clear existing data (be careful in production!)
    console.log('Clearing existing data...')
    await db.collection('users').deleteMany({})
    await db.collection('products').deleteMany({})
    await db.collection('workshops').deleteMany({})
    await db.collection('user_balances').deleteMany({})
    await db.collection('participants').deleteMany({})
    await db.collection('audit_logs').deleteMany({})
    // New collections for program management
    await db.collection('locations').deleteMany({})
    await db.collection('programs').deleteMany({})
    await db.collection('sessions').deleteMany({})
    await db.collection('unique_participants').deleteMany({})
    await db.collection('program_participants').deleteMany({})
    await db.collection('session_attendance').deleteMany({})

    // Create admin user
    console.log('Creating admin user...')
    const adminPassword = await hashPassword('password')
    const adminUser = {
      name: 'System Admin',
      email: 'admin@admin.com',
      password: adminPassword,
      role: 'admin',
      isActive: true,
      createdAt: new Date().toISOString(),
      profile: {
        organization: 'System Administration',
        phone: '+1-555-0100',
        location: 'Head Office'
      }
    }
    const adminResult = await db.collection('users').insertOne(adminUser)
    console.log('✅ Admin user created')

    // Create regular users
    console.log('Creating regular users...')
    const userPassword = await hashPassword('user123!')
    const users = [
      {
        name: 'Ahmed Hassan',
        email: 'ahmed@workshop.com',
        password: userPassword,
        role: 'user',
        isActive: true,
        createdAt: new Date().toISOString(),
        profile: {
          organization: 'Community Center East',
          phone: '+1-555-0101',
          location: 'East District'
        }
      },
      {
        name: 'Fatima Ali',
        email: 'fatima@workshop.com',
        password: userPassword,
        role: 'user',
        isActive: true,
        createdAt: new Date().toISOString(),
        profile: {
          organization: 'Community Center West',
          phone: '+1-555-0102',
          location: 'West District'
        }
      },
      {
        name: 'Mohammed Salem',
        email: 'mohammed@workshop.com',
        password: userPassword,
        role: 'user',
        isActive: true,
        createdAt: new Date().toISOString(),
        profile: {
          organization: 'Youth Center North',
          phone: '+1-555-0103',
          location: 'North District'
        }
      }
    ]

    const userResult = await db.collection('users').insertMany(users)
    const userIds = Object.values(userResult.insertedIds).map(id => id.toString())
    console.log('✅ Regular users created')

    // Create sample products
    console.log('Creating sample products...')
    const products = [
      // Materials
      {
        name: 'Notebooks (A4)',
        sku: 'NB-A4-001',
        stock: 500,
        price: 2.50,
        category: 'materials',
        notes: 'Standard A4 ruled notebooks for students',
        createdAt: new Date().toISOString(),
        createdBy: adminResult.insertedId.toString(),
        updatedAt: new Date().toISOString()
      },
      {
        name: 'Pencil Set (12 pcs)',
        sku: 'PEN-SET-001',
        stock: 200,
        price: 5.00,
        category: 'materials',
        notes: 'Set of 12 graphite pencils',
        createdAt: new Date().toISOString(),
        createdBy: adminResult.insertedId.toString(),
        updatedAt: new Date().toISOString()
      },
      {
        name: 'Color Markers (24 colors)',
        sku: 'MAR-COL-001',
        stock: 100,
        price: 15.00,
        category: 'materials',
        notes: 'Professional color markers for art activities',
        createdAt: new Date().toISOString(),
        createdBy: adminResult.insertedId.toString(),
        updatedAt: new Date().toISOString()
      },
      {
        name: 'Drawing Paper (A3)',
        sku: 'PAP-A3-001',
        stock: 300,
        price: 1.20,
        category: 'materials',
        notes: 'High-quality drawing paper',
        createdAt: new Date().toISOString(),
        createdBy: adminResult.insertedId.toString(),
        updatedAt: new Date().toISOString()
      },
      {
        name: 'Craft Scissors',
        sku: 'SCI-CRA-001',
        stock: 80,
        price: 8.50,
        category: 'materials',
        notes: 'Safety scissors for craft activities',
        createdAt: new Date().toISOString(),
        createdBy: adminResult.insertedId.toString(),
        updatedAt: new Date().toISOString()
      },

      // Refreshments
      {
        name: 'Bottled Water (500ml)',
        sku: 'WAT-BOT-001',
        stock: 1000,
        price: 0.75,
        category: 'refreshments',
        notes: 'Purified drinking water',
        createdAt: new Date().toISOString(),
        createdBy: adminResult.insertedId.toString(),
        updatedAt: new Date().toISOString()
      },
      {
        name: 'Juice Boxes (Apple)',
        sku: 'JUI-APP-001',
        stock: 400,
        price: 1.25,
        category: 'refreshments',
        notes: '200ml apple juice boxes',
        createdAt: new Date().toISOString(),
        createdBy: adminResult.insertedId.toString(),
        updatedAt: new Date().toISOString()
      },
      {
        name: 'Granola Bars',
        sku: 'GRA-BAR-001',
        stock: 300,
        price: 2.00,
        category: 'refreshments',
        notes: 'Healthy granola bars',
        createdAt: new Date().toISOString(),
        createdBy: adminResult.insertedId.toString(),
        updatedAt: new Date().toISOString()
      },
      {
        name: 'Fresh Fruit Cups',
        sku: 'FRU-CUP-001',
        stock: 200,
        price: 3.50,
        category: 'refreshments',
        notes: 'Mixed fresh fruit cups',
        createdAt: new Date().toISOString(),
        createdBy: adminResult.insertedId.toString(),
        updatedAt: new Date().toISOString()
      }
    ]

    const productResult = await db.collection('products').insertMany(products)
    const productIds = Object.values(productResult.insertedIds).map(id => id.toString())
    console.log('✅ Sample products created')

    // Create user balances (allocate some materials to users)
    console.log('Creating user balances...')
    const userBalances: any[] = []

    // Allocate materials to each user
    for (let i = 0; i < userIds.length; i++) {
      const userId = userIds[i]
      const user = users[i]

      // Allocate different amounts based on user
      const allocations = [
        { productIndex: 0, allocated: 50, available: 45 }, // Notebooks
        { productIndex: 1, allocated: 20, available: 18 }, // Pencil Sets
        { productIndex: 2, allocated: 10, available: 8 },  // Color Markers
        { productIndex: 3, allocated: 30, available: 25 }, // Drawing Paper
        { productIndex: 4, allocated: 8, available: 6 },   // Craft Scissors
        { productIndex: 5, allocated: 100, available: 85 }, // Water bottles
        { productIndex: 6, allocated: 40, available: 35 },  // Juice boxes
        { productIndex: 7, allocated: 30, available: 25 },  // Granola bars
        { productIndex: 8, allocated: 20, available: 15 }   // Fruit cups
      ]

      allocations.forEach(allocation => {
        const product = products[allocation.productIndex]
        userBalances.push({
          userId: userId,
          productId: productIds[allocation.productIndex],
          productName: product.name,
          allocatedQuantity: allocation.allocated,
          availableQuantity: allocation.available,
          lastUpdated: new Date().toISOString()
        })
      })
    }

    await db.collection('user_balances').insertMany(userBalances)
    console.log('✅ User balances created')

    // Create sample locations
    console.log('Creating sample locations...')
    const locations = [
      {
        name: 'Community Center East',
        address: '123 East Main Street',
        neighborhood: 'East District',
        city: 'Gaza City',
        governorate: 'Gaza',
        coordinates: {
          latitude: 31.5017,
          longitude: 34.4668
        },
        capacity: 100,
        facilities: ['projector', 'sound system', 'wifi', 'kitchen'],
        contactPerson: 'Ahmed Hassan',
        contactPhone: '+1-555-0101',
        isActive: true,
        notes: 'Main community center with multiple rooms',
        createdAt: new Date().toISOString(),
        createdBy: adminResult.insertedId.toString()
      },
      {
        name: 'Community Center West',
        address: '456 West Avenue',
        neighborhood: 'West District',
        city: 'Gaza City',
        governorate: 'Gaza',
        coordinates: {
          latitude: 31.5020,
          longitude: 34.4650
        },
        capacity: 80,
        facilities: ['projector', 'wifi', 'parking'],
        contactPerson: 'Fatima Ali',
        contactPhone: '+1-555-0102',
        isActive: true,
        notes: 'Smaller community center focused on family programs',
        createdAt: new Date().toISOString(),
        createdBy: adminResult.insertedId.toString()
      },
      {
        name: 'Youth Center North',
        address: '789 North Boulevard',
        neighborhood: 'North District',
        city: 'Gaza City',
        governorate: 'Gaza',
        coordinates: {
          latitude: 31.5025,
          longitude: 34.4670
        },
        capacity: 60,
        facilities: ['sound system', 'wifi', 'sports equipment'],
        contactPerson: 'Mohammed Salem',
        contactPhone: '+1-555-0103',
        isActive: true,
        notes: 'Youth-focused center with recreational facilities',
        createdAt: new Date().toISOString(),
        createdBy: adminResult.insertedId.toString()
      },
      {
        name: 'Education Hub Central',
        address: '321 Central Square',
        neighborhood: 'Central District',
        city: 'Gaza City',
        governorate: 'Gaza',
        coordinates: {
          latitude: 31.5015,
          longitude: 34.4660
        },
        capacity: 120,
        facilities: ['projector', 'sound system', 'wifi', 'kitchen', 'library'],
        contactPerson: 'Nour Mahmoud',
        contactPhone: '+1-555-0104',
        isActive: true,
        notes: 'Large educational facility with library and training rooms',
        createdAt: new Date().toISOString(),
        createdBy: adminResult.insertedId.toString()
      }
    ]

    const locationResult = await db.collection('locations').insertMany(locations)
    const locationIds = Object.values(locationResult.insertedIds).map(id => id.toString())
    console.log('✅ Sample locations created')

    // Create sample workshops
    console.log('Creating sample workshops...')
    const workshops = [
      {
        title: 'Children\'s Art Workshop',
        description: 'Creative art workshop for children ages 6-12',
        date: '2024-01-25',
        startTime: '10:00',
        endTime: '12:00',
        location: 'Community Center East - Art Room',
        conductedBy: userIds[0],
        status: 'planned',
        expectedParticipants: 20,
        actualParticipants: 0,
        materialsUsed: [],
        createdAt: new Date().toISOString(),
        notes: 'Focus on basic drawing and coloring techniques'
      },
      {
        title: 'Youth Leadership Training',
        description: 'Leadership development workshop for teenagers',
        date: '2024-01-30',
        startTime: '14:00',
        endTime: '17:00',
        location: 'Youth Center North - Conference Room',
        conductedBy: userIds[2],
        status: 'planned',
        expectedParticipants: 15,
        actualParticipants: 0,
        materialsUsed: [],
        createdAt: new Date().toISOString(),
        notes: 'Interactive sessions on communication and teamwork'
      },
      {
        title: 'Community Health Awareness',
        description: 'Health and wellness workshop for families',
        date: '2024-02-05',
        startTime: '09:00',
        endTime: '11:30',
        location: 'Community Center West - Main Hall',
        conductedBy: userIds[1],
        status: 'planned',
        expectedParticipants: 30,
        actualParticipants: 0,
        materialsUsed: [],
        createdAt: new Date().toISOString(),
        notes: 'Covering nutrition, exercise, and mental health'
      }
    ]

    const workshopResult = await db.collection('workshops').insertMany(workshops)
    console.log('✅ Sample workshops created')

    // Create sample participants
    console.log('Creating sample participants...')
    const participants: any[] = []
    const workshopIds = Object.values(workshopResult.insertedIds).map(id => id.toString())

    // Participants for Children's Art Workshop
    const artWorkshopParticipants = [
      { name: 'Sara Ahmed', age: 8, gender: 'female', idNumber: 'ID001234567', phone: '+1-555-1001' },
      { name: 'Omar Hassan', age: 9, gender: 'male', idNumber: 'ID001234568', phone: '+1-555-1002' },
      { name: 'Layla Mohamed', age: 7, gender: 'female', idNumber: 'ID001234569', phone: '+1-555-1003' },
      { name: 'Yusuf Ali', age: 10, gender: 'male', idNumber: 'ID001234570', phone: '+1-555-1004' },
      { name: 'Amina Salem', age: 6, gender: 'female', idNumber: 'ID001234571', phone: '+1-555-1005' }
    ]

    artWorkshopParticipants.forEach(participant => {
      participants.push({
        workshopId: workshopIds[0],
        name: participant.name,
        age: participant.age,
        gender: participant.gender,
        idNumber: participant.idNumber,
        phoneNumber: participant.phone,
        specialStatus: {
          isDisabled: false,
          isWounded: false,
          isSeparated: false,
          isUnaccompanied: false
        },
        registrationDate: new Date().toISOString(),
        attendanceStatus: 'registered',
        materialsReceived: []
      })
    })

    // Participants for Youth Leadership Training
    const leadershipParticipants = [
      { name: 'Khalid Ibrahim', age: 16, gender: 'male', idNumber: 'ID002234567', phone: '+1-555-2001' },
      { name: 'Nour Mahmoud', age: 17, gender: 'female', idNumber: 'ID002234568', phone: '+1-555-2002' },
      { name: 'Hassan Omar', age: 15, gender: 'male', idNumber: 'ID002234569', phone: '+1-555-2003' },
      { name: 'Mariam Yusuf', age: 16, gender: 'female', idNumber: 'ID002234570', phone: '+1-555-2004' }
    ]

    leadershipParticipants.forEach(participant => {
      participants.push({
        workshopId: workshopIds[1],
        name: participant.name,
        age: participant.age,
        gender: participant.gender,
        idNumber: participant.idNumber,
        phoneNumber: participant.phone,
        specialStatus: {
          isDisabled: false,
          isWounded: false,
          isSeparated: false,
          isUnaccompanied: false
        },
        registrationDate: new Date().toISOString(),
        attendanceStatus: 'registered',
        materialsReceived: []
      })
    })

    await db.collection('participants').insertMany(participants)
    console.log('✅ Sample participants created')

    // Create sample programs with sessions
    console.log('Creating sample programs...')
    const now = new Date()
    const programs = [
      {
        title: 'Digital Literacy Training Program',
        description: 'Comprehensive 6-session program teaching basic computer skills, internet safety, and digital communication for adults',
        objectives: [
          'Learn basic computer operation and file management',
          'Understand internet browsing and email communication',
          'Develop digital safety awareness',
          'Create and edit simple documents'
        ],
        startDate: '2024-02-15',
        endDate: '2024-03-21',
        totalSessions: 6,
        minimumSessionsForCompletion: 4,
        locationId: locationIds[3], // Education Hub Central
        expectedParticipants: 25,
        enrolledParticipants: 20,
        completedParticipants: 0,
        completedSessions: 0,
        status: 'ongoing',
        conductedBy: userIds[0], // Ahmed Hassan
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        notes: 'Program focused on bridging the digital divide'
      },
      {
        title: 'Youth Entrepreneurship Development',
        description: 'Multi-session program for young adults (18-25) focusing on business skills, project planning, and startup development',
        objectives: [
          'Develop business planning skills',
          'Learn market research techniques',
          'Understand financial planning basics',
          'Create a viable business proposal'
        ],
        startDate: '2024-02-20',
        endDate: '2024-04-10',
        totalSessions: 8,
        minimumSessionsForCompletion: 6,
        locationId: locationIds[2], // Youth Center North
        expectedParticipants: 15,
        enrolledParticipants: 12,
        completedParticipants: 0,
        completedSessions: 0,
        status: 'ongoing',
        conductedBy: userIds[2], // Mohammed Salem
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        notes: 'Intensive program with mentorship component'
      },
      {
        title: 'Women\'s Health and Wellness Series',
        description: '5-session program covering women\'s health topics, nutrition, mental wellness, and preventive care',
        objectives: [
          'Improve health literacy',
          'Learn nutrition and meal planning',
          'Understand preventive healthcare',
          'Develop stress management techniques'
        ],
        startDate: '2024-03-01',
        endDate: '2024-03-29',
        totalSessions: 5,
        minimumSessionsForCompletion: 3,
        locationId: locationIds[1], // Community Center West
        expectedParticipants: 20,
        enrolledParticipants: 18,
        completedParticipants: 0,
        completedSessions: 0,
        status: 'planned',
        conductedBy: userIds[1], // Fatima Ali
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        notes: 'Women-only sessions with healthcare professional guest speakers'
      }
    ]

    const programResult = await db.collection('programs').insertMany(programs)
    const programIds = Object.values(programResult.insertedIds).map(id => id.toString())

    // Generate program codes for each program
    console.log('Generating program codes...')
    for (let i = 0; i < programIds.length; i++) {
      const program = programs[i]
      const user = users.find(u => u.email === (i === 0 ? 'ahmed@workshop.com' : i === 1 ? 'mohammed@workshop.com' : 'fatima@workshop.com'))
      const location = locations[i === 0 ? 3 : i === 1 ? 2 : 1]

      // Generate program code: [UserInitials]-[YYYYMMDD]-[LocationCode]-PROG-[Counter]
      const userInitials = user?.name.split(' ').map(n => n[0]).join('') || 'UN'
      const dateStr = program.startDate.replace(/-/g, '')
      const locationCode = location.neighborhood.split(' ').map(w => w[0]).join('').toUpperCase()
      const programCode = `${userInitials}-${dateStr}-${locationCode}-PROG-${i + 1}`

      await db.collection('programs').updateOne(
        { _id: programResult.insertedIds[i] },
        { $set: { programCode } }
      )
    }

    console.log('✅ Sample programs created')

    // Create sessions for each program
    console.log('Creating program sessions...')
    const sessions: any[] = []

    // Digital Literacy Training Program sessions
    const digitalLiteracySessions = [
      { title: 'Computer Basics and Setup', date: '2024-02-15', description: 'Introduction to computer hardware, software, and basic operation' },
      { title: 'File Management and Organization', date: '2024-02-22', description: 'Creating, organizing, and managing files and folders' },
      { title: 'Internet Browsing and Search', date: '2024-02-29', description: 'Web browsing fundamentals and effective search strategies' },
      { title: 'Email Communication', date: '2024-03-07', description: 'Setting up and using email for professional communication' },
      { title: 'Digital Safety and Security', date: '2024-03-14', description: 'Online safety, password security, and avoiding scams' },
      { title: 'Document Creation and Editing', date: '2024-03-21', description: 'Basic word processing and document formatting' }
    ]

    digitalLiteracySessions.forEach((sessionData, index) => {
      sessions.push({
        programId: programIds[0],
        sessionNumber: index + 1,
        title: sessionData.title,
        description: sessionData.description,
        date: sessionData.date,
        startTime: '10:00',
        endTime: '12:00',
        locationId: locationIds[3],
        expectedParticipants: 25,
        actualParticipants: index < 3 ? 22 : 0, // First 3 sessions completed
        status: index < 3 ? 'completed' : 'planned',
        attendanceRate: index < 3 ? 88 : 0,
        objectives: [`Session ${index + 1} learning objectives`],
        materialsUsed: [],
        conductedBy: userIds[0],
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      })
    })

    // Youth Entrepreneurship sessions
    const entrepreneurshipSessions = [
      { title: 'Introduction to Entrepreneurship', date: '2024-02-20', description: 'Understanding business fundamentals and entrepreneurial mindset' },
      { title: 'Market Research and Analysis', date: '2024-02-27', description: 'Conducting market research and analyzing business opportunities' },
      { title: 'Business Model Development', date: '2024-03-05', description: 'Creating and refining business models' },
      { title: 'Financial Planning Basics', date: '2024-03-12', description: 'Understanding startup costs, revenue models, and financial projections' },
      { title: 'Marketing and Customer Acquisition', date: '2024-03-19', description: 'Developing marketing strategies and customer outreach' },
      { title: 'Legal and Regulatory Considerations', date: '2024-03-26', description: 'Understanding business registration and legal requirements' },
      { title: 'Pitch Preparation', date: '2024-04-02', description: 'Preparing and practicing business pitches' },
      { title: 'Final Presentations and Feedback', date: '2024-04-10', description: 'Presenting business plans and receiving feedback' }
    ]

    entrepreneurshipSessions.forEach((sessionData, index) => {
      sessions.push({
        programId: programIds[1],
        sessionNumber: index + 1,
        title: sessionData.title,
        description: sessionData.description,
        date: sessionData.date,
        startTime: '14:00',
        endTime: '17:00',
        locationId: locationIds[2],
        expectedParticipants: 15,
        actualParticipants: index < 2 ? 13 : 0, // First 2 sessions completed
        status: index < 2 ? 'completed' : 'planned',
        attendanceRate: index < 2 ? 87 : 0,
        objectives: [`Session ${index + 1} learning objectives`],
        materialsUsed: [],
        conductedBy: userIds[2],
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      })
    })

    // Women's Health sessions
    const healthSessions = [
      { title: 'Introduction to Women\'s Health', date: '2024-03-01', description: 'Overview of women\'s health across life stages' },
      { title: 'Nutrition and Healthy Eating', date: '2024-03-08', description: 'Balanced nutrition and meal planning for families' },
      { title: 'Preventive Healthcare', date: '2024-03-15', description: 'Understanding screenings, check-ups, and preventive care' },
      { title: 'Mental Health and Stress Management', date: '2024-03-22', description: 'Managing stress and maintaining mental wellness' },
      { title: 'Healthy Lifestyle Habits', date: '2024-03-29', description: 'Exercise, sleep, and lifestyle factors for optimal health' }
    ]

    healthSessions.forEach((sessionData, index) => {
      sessions.push({
        programId: programIds[2],
        sessionNumber: index + 1,
        title: sessionData.title,
        description: sessionData.description,
        date: sessionData.date,
        startTime: '09:00',
        endTime: '11:00',
        locationId: locationIds[1],
        expectedParticipants: 20,
        actualParticipants: 0, // All planned for future
        status: 'planned',
        attendanceRate: 0,
        objectives: [`Session ${index + 1} learning objectives`],
        materialsUsed: [],
        conductedBy: userIds[1],
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      })
    })

    const sessionResult = await db.collection('sessions').insertMany(sessions)
    const sessionIds = Object.values(sessionResult.insertedIds).map(id => id.toString())

    // Generate session codes for each session
    console.log('Generating session codes...')
    for (let i = 0; i < sessionIds.length; i++) {
      const session = sessions[i]
      const programIndex = programIds.indexOf(session.programId)
      const programCode = `AH-20240215-CD-PROG-1` // This would be generated properly
      const sessionCode = `${programCode}-S${session.sessionNumber}`

      await db.collection('sessions').updateOne(
        { _id: sessionResult.insertedIds[i] },
        { $set: { sessionCode } }
      )
    }

    console.log('✅ Program sessions created')

    // Create unique participants for programs
    console.log('Creating unique program participants...')
    const uniqueParticipants = [
      // Digital Literacy participants (adults 25-55)
      { name: 'Nadia Mahmoud', age: 35, gender: 'female', idNumber: 'ID003234567', phoneNumber: '+1-555-3001' },
      { name: 'Khaled Yusuf', age: 42, gender: 'male', idNumber: 'ID003234568', phoneNumber: '+1-555-3002' },
      { name: 'Rania Hassan', age: 28, gender: 'female', idNumber: 'ID003234569', phoneNumber: '+1-555-3003' },
      { name: 'Mahmoud Ali', age: 51, gender: 'male', idNumber: 'ID003234570', phoneNumber: '+1-555-3004' },
      { name: 'Salma Omar', age: 33, gender: 'female', idNumber: 'ID003234571', phoneNumber: '+1-555-3005' },

      // Youth Entrepreneurship participants (18-25)
      { name: 'Basel Ahmed', age: 22, gender: 'male', idNumber: 'ID004234567', phoneNumber: '+1-555-4001' },
      { name: 'Lina Salem', age: 24, gender: 'female', idNumber: 'ID004234568', phoneNumber: '+1-555-4002' },
      { name: 'Tariq Ibrahim', age: 20, gender: 'male', idNumber: 'ID004234569', phoneNumber: '+1-555-4003' },
      { name: 'Maya Khalil', age: 23, gender: 'female', idNumber: 'ID004234570', phoneNumber: '+1-555-4004' },
      { name: 'Samer Nasser', age: 25, gender: 'male', idNumber: 'ID004234571', phoneNumber: '+1-555-4005' },

      // Women's Health participants (women 20-50)
      { name: 'Amira Zaid', age: 29, gender: 'female', idNumber: 'ID005234567', phoneNumber: '+1-555-5001' },
      { name: 'Layla Mansour', age: 34, gender: 'female', idNumber: 'ID005234568', phoneNumber: '+1-555-5002' },
      { name: 'Heba Saad', age: 26, gender: 'female', idNumber: 'ID005234569', phoneNumber: '+1-555-5003' },
      { name: 'Dina Farid', age: 38, gender: 'female', idNumber: 'ID005234570', phoneNumber: '+1-555-5004' },
      { name: 'Noura Qasemi', age: 31, gender: 'female', idNumber: 'ID005234571', phoneNumber: '+1-555-5005' }
    ]

    // Add special status to some participants
    uniqueParticipants.forEach((participant, index) => {
      participant.specialStatus = {
        isDisabled: index === 2 || index === 7, // 2 disabled participants
        isWounded: index === 5 || index === 12, // 2 wounded participants
        isSeparated: index === 1 || index === 9, // 2 separated participants
        isUnaccompanied: index === 4 // 1 unaccompanied participant
      }
      participant.createdAt = now.toISOString()
      participant.lastUpdated = now.toISOString()
    })

    const uniqueParticipantResult = await db.collection('unique_participants').insertMany(uniqueParticipants)
    const uniqueParticipantIds = Object.values(uniqueParticipantResult.insertedIds).map(id => id.toString())
    console.log('✅ Unique program participants created')

    // Create program enrollments
    console.log('Creating program enrollments...')
    const programParticipants: any[] = []

    // Enroll participants in Digital Literacy Program
    for (let i = 0; i < 5; i++) {
      const participant = uniqueParticipants[i]
      programParticipants.push({
        programId: programIds[0],
        participantId: uniqueParticipantIds[i],
        name: participant.name,
        age: participant.age,
        gender: participant.gender,
        idNumber: participant.idNumber,
        phoneNumber: participant.phoneNumber,
        specialStatus: participant.specialStatus,
        enrollmentDate: '2024-02-10',
        status: 'active',
        sessionsAttended: i < 3 ? 3 : 0, // First 3 participants attended sessions
        sessionsCompleted: i < 3 ? 3 : 0,
        attendanceRate: i < 3 ? 100 : 0,
        overallMaterialsReceived: [],
        notes: `Enrolled in Digital Literacy Training Program`
      })
    }

    // Enroll participants in Youth Entrepreneurship Program
    for (let i = 5; i < 10; i++) {
      const participant = uniqueParticipants[i]
      programParticipants.push({
        programId: programIds[1],
        participantId: uniqueParticipantIds[i],
        name: participant.name,
        age: participant.age,
        gender: participant.gender,
        idNumber: participant.idNumber,
        phoneNumber: participant.phoneNumber,
        specialStatus: participant.specialStatus,
        enrollmentDate: '2024-02-15',
        status: 'active',
        sessionsAttended: i < 8 ? 2 : 0, // First 3 participants attended sessions
        sessionsCompleted: i < 8 ? 2 : 0,
        attendanceRate: i < 8 ? 100 : 0,
        overallMaterialsReceived: [],
        notes: `Enrolled in Youth Entrepreneurship Development Program`
      })
    }

    // Enroll participants in Women's Health Program
    for (let i = 10; i < 15; i++) {
      const participant = uniqueParticipants[i]
      programParticipants.push({
        programId: programIds[2],
        participantId: uniqueParticipantIds[i],
        name: participant.name,
        age: participant.age,
        gender: participant.gender,
        idNumber: participant.idNumber,
        phoneNumber: participant.phoneNumber,
        specialStatus: participant.specialStatus,
        enrollmentDate: '2024-02-25',
        status: 'enrolled',
        sessionsAttended: 0,
        sessionsCompleted: 0,
        attendanceRate: 0,
        overallMaterialsReceived: [],
        notes: `Enrolled in Women's Health and Wellness Series`
      })
    }

    const programParticipantResult = await db.collection('program_participants').insertMany(programParticipants)
    const programParticipantIds = Object.values(programParticipantResult.insertedIds).map(id => id.toString())
    console.log('✅ Program enrollments created')

    // Create session attendance records
    console.log('Creating session attendance records...')
    const sessionAttendance: any[] = []

    // Digital Literacy attendance (first 3 sessions completed)
    const digitalLiteracySessionIds = sessionIds.slice(0, 6)
    const digitalLiteracyParticipantIds = programParticipantIds.slice(0, 5)

    for (let sessionIndex = 0; sessionIndex < 3; sessionIndex++) {
      for (let participantIndex = 0; participantIndex < 3; participantIndex++) {
        sessionAttendance.push({
          sessionId: digitalLiteracySessionIds[sessionIndex],
          programParticipantId: digitalLiteracyParticipantIds[participantIndex],
          participantName: uniqueParticipants[participantIndex].name,
          attendanceStatus: 'attended',
          checkInTime: '10:05',
          checkOutTime: '11:55',
          sessionMaterialsReceived: [
            {
              productId: productIds[0], // Notebooks
              productName: 'Notebooks (A4)',
              quantity: 1
            },
            {
              productId: productIds[1], // Pencil Set
              productName: 'Pencil Set (12 pcs)',
              quantity: 1
            }
          ],
          sessionPerformance: participantIndex === 0 ? 'excellent' : participantIndex === 1 ? 'good' : 'satisfactory',
          sessionNotes: `Participated actively in Session ${sessionIndex + 1}`,
          recordedBy: userIds[0],
          recordedAt: now.toISOString()
        })
      }
    }

    // Youth Entrepreneurship attendance (first 2 sessions completed)
    const entrepreneurshipSessionIds = sessionIds.slice(6, 14)
    const entrepreneurshipParticipantIds = programParticipantIds.slice(5, 10)

    for (let sessionIndex = 0; sessionIndex < 2; sessionIndex++) {
      for (let participantIndex = 0; participantIndex < 3; participantIndex++) {
        sessionAttendance.push({
          sessionId: entrepreneurshipSessionIds[sessionIndex],
          programParticipantId: entrepreneurshipParticipantIds[participantIndex],
          participantName: uniqueParticipants[participantIndex + 5].name,
          attendanceStatus: 'attended',
          checkInTime: '14:10',
          checkOutTime: '16:50',
          sessionMaterialsReceived: [
            {
              productId: productIds[0], // Notebooks
              productName: 'Notebooks (A4)',
              quantity: 1
            },
            {
              productId: productIds[3], // Drawing Paper
              productName: 'Drawing Paper (A3)',
              quantity: 3
            }
          ],
          sessionPerformance: participantIndex === 0 ? 'excellent' : 'good',
          sessionNotes: `Engaged participant in Session ${sessionIndex + 1}`,
          recordedBy: userIds[2],
          recordedAt: now.toISOString()
        })
      }
    }

    await db.collection('session_attendance').insertMany(sessionAttendance)
    console.log('✅ Session attendance records created')

    // Update program completion counts
    console.log('Updating program statistics...')
    await db.collection('programs').updateOne(
      { _id: programResult.insertedIds[0] },
      { $set: { completedSessions: 3 } }
    )
    await db.collection('programs').updateOne(
      { _id: programResult.insertedIds[1] },
      { $set: { completedSessions: 2 } }
    )

    console.log('✅ Program statistics updated')

    // Create audit log entries
    console.log('Creating audit log entries...')
    const auditLogs = [
      {
        action: 'CREATE_USER',
        userId: adminResult.insertedId.toString(),
        userEmail: 'admin@admin.com',
        resourceType: 'user',
        details: { message: 'System admin user created during database seeding' },
        timestamp: new Date().toISOString()
      },
      {
        action: 'CREATE_PRODUCT',
        userId: adminResult.insertedId.toString(),
        userEmail: 'admin@admin.com',
        resourceType: 'product',
        details: { message: 'Initial product catalog created during database seeding' },
        timestamp: new Date().toISOString()
      },
      {
        action: 'ALLOCATE_MATERIALS',
        userId: adminResult.insertedId.toString(),
        userEmail: 'admin@admin.com',
        resourceType: 'allocation',
        details: { message: 'Initial material allocations created during database seeding' },
        timestamp: new Date().toISOString()
      }
    ]

    await db.collection('audit_logs').insertMany(auditLogs)
    console.log('✅ Audit log entries created')

    console.log('\n🎉 Database seeding completed successfully!')
    console.log('\n📋 Summary:')
    console.log(`   - 1 Admin user created (admin@admin.com / password)`)
    console.log(`   - ${users.length} Regular users created (password: user123!)`)
    console.log(`   - ${products.length} Products created`)
    console.log(`   - ${userBalances.length} User balance allocations created`)
    console.log(`   - ${workshops.length} Workshops created`)
    console.log(`   - ${participants.length} Workshop participants registered`)
    console.log(`   - ${locations.length} Locations created`)
    console.log(`   - ${programs.length} Programs created with auto-generated codes`)
    console.log(`   - ${sessions.length} Program sessions created`)
    console.log(`   - ${uniqueParticipants.length} Unique program participants created`)
    console.log(`   - ${programParticipants.length} Program enrollments created`)
    console.log(`   - ${sessionAttendance.length} Session attendance records created`)
    console.log(`   - ${auditLogs.length} Audit log entries created`)

    console.log('\n🔐 Login Credentials:')
    console.log('   Admin: admin@admin.com / password')
    console.log('   Users: ahmed@workshop.com / user123!')
    console.log('          fatima@workshop.com / user123!')
    console.log('          mohammed@workshop.com / user123!')

  } catch (error) {
    console.error('❌ Error seeding database:', error)
    process.exit(1)
  } finally {
    await client.close()
    console.log('\n✅ Database connection closed')
  }
}

// Run the seeding function
seedDatabase().catch(console.error)