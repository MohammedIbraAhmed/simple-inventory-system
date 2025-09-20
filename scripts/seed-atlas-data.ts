import { MongoClient } from 'mongodb'
import { hashPassword } from '../src/lib/auth-utils'

// Direct Atlas connection
const atlasUri = 'mongodb+srv://ajsrp_portal:kU0Cl64PYwaPoDxs@cluster0.e94elwz.mongodb.net/sinv?retryWrites=true&w=majority&appName=Cluster0'

async function seedAtlasData() {
  const client = new MongoClient(atlasUri)

  try {
    console.log('🔗 Connecting to Atlas cluster...')
    await client.connect()
    console.log('✅ Connected to Atlas!')

    const db = client.db('sinv')

    // Get admin user ID
    const adminUser = await db.collection('users').findOne({ email: 'admin@admin.com' })
    if (!adminUser) {
      console.error('❌ Admin user not found!')
      return
    }
    const adminId = adminUser._id.toString()

    // Create regular users
    console.log('👥 Creating regular users...')
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
    console.log('📦 Creating sample products...')
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
        createdBy: adminId,
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
        createdBy: adminId,
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
        createdBy: adminId,
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
        createdBy: adminId,
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
        createdBy: adminId,
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
        createdBy: adminId,
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
        createdBy: adminId,
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
        createdBy: adminId,
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
        createdBy: adminId,
        updatedAt: new Date().toISOString()
      }
    ]

    const productResult = await db.collection('products').insertMany(products)
    const productIds = Object.values(productResult.insertedIds).map(id => id.toString())
    console.log('✅ Sample products created')

    // Create user balances (allocate materials to users)
    console.log('⚖️ Creating user material allocations...')
    const userBalances: any[] = []

    for (let i = 0; i < userIds.length; i++) {
      const userId = userIds[i]

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

    await db.collection('userBalances').insertMany(userBalances)
    console.log('✅ User material allocations created')

    // Create sample workshops
    console.log('🎪 Creating sample workshops...')
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
    const workshopIds = Object.values(workshopResult.insertedIds).map(id => id.toString())
    console.log('✅ Sample workshops created')

    // Create sample participants
    console.log('👥 Creating sample participants...')
    const participants: any[] = []

    // Participants for Children's Art Workshop
    const artWorkshopParticipants = [
      { name: 'Sara Ahmed', age: 8, phone: '+1-555-1001' },
      { name: 'Omar Hassan', age: 9, phone: '+1-555-1002' },
      { name: 'Layla Mohamed', age: 7, phone: '+1-555-1003' },
      { name: 'Yusuf Ali', age: 10, phone: '+1-555-1004' },
      { name: 'Amina Salem', age: 6, phone: '+1-555-1005' }
    ]

    artWorkshopParticipants.forEach(participant => {
      participants.push({
        workshopId: workshopIds[0],
        name: participant.name,
        age: participant.age,
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
      { name: 'Khalid Ibrahim', age: 16, phone: '+1-555-2001' },
      { name: 'Nour Mahmoud', age: 17, phone: '+1-555-2002' },
      { name: 'Hassan Omar', age: 15, phone: '+1-555-2003' },
      { name: 'Mariam Yusuf', age: 16, phone: '+1-555-2004' }
    ]

    leadershipParticipants.forEach(participant => {
      participants.push({
        workshopId: workshopIds[1],
        name: participant.name,
        age: participant.age,
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

    // Create audit log entries
    console.log('📋 Creating audit log entries...')
    const auditLogs = [
      {
        action: 'CREATE_USER',
        userId: adminId,
        userEmail: 'admin@admin.com',
        resourceType: 'user',
        details: { message: 'Regular users created during database seeding' },
        timestamp: new Date().toISOString()
      },
      {
        action: 'CREATE_PRODUCT',
        userId: adminId,
        userEmail: 'admin@admin.com',
        resourceType: 'product',
        details: { message: 'Product catalog created during database seeding' },
        timestamp: new Date().toISOString()
      },
      {
        action: 'ALLOCATE_MATERIALS',
        userId: adminId,
        userEmail: 'admin@admin.com',
        resourceType: 'allocation',
        details: { message: 'Initial material allocations created during database seeding' },
        timestamp: new Date().toISOString()
      }
    ]

    await db.collection('audit_logs').insertMany(auditLogs)
    console.log('✅ Audit log entries created')

    console.log('\n🎉 Atlas database fully populated!')
    console.log('\n📋 Summary:')
    console.log(`   - 1 Admin user (already existed)`)
    console.log(`   - ${users.length} Regular users created`)
    console.log(`   - ${products.length} Products created`)
    console.log(`   - ${userBalances.length} User material allocations created`)
    console.log(`   - ${workshops.length} Workshops created`)
    console.log(`   - ${participants.length} Participants registered`)
    console.log(`   - ${auditLogs.length} Audit log entries created`)

    console.log('\n🔐 Login Credentials:')
    console.log('   Admin: admin@admin.com / password')
    console.log('   Users: ahmed@workshop.com / user123!')
    console.log('          fatima@workshop.com / user123!')
    console.log('          mohammed@workshop.com / user123!')

  } catch (error) {
    console.error('❌ Error seeding Atlas data:', error)
  } finally {
    await client.close()
    console.log('\n✅ Atlas connection closed')
  }
}

seedAtlasData().catch(console.error)