import { MongoClient } from 'mongodb'
import { hashPassword } from '../src/lib/auth-utils'

// Direct Atlas connection
const atlasUri = 'mongodb+srv://ajsrp_portal:kU0Cl64PYwaPoDxs@cluster0.e94elwz.mongodb.net/sinv?retryWrites=true&w=majority&appName=Cluster0'

async function createAtlasAdmin() {
  const client = new MongoClient(atlasUri)

  try {
    console.log('🔗 Connecting to Atlas cluster...')
    await client.connect()
    console.log('✅ Connected to Atlas!')

    const db = client.db('sinv')
    console.log('📍 Working with sinv database on Atlas')

    // Check if admin already exists
    const existingAdmin = await db.collection('users').findOne({ email: 'admin@admin.com' })
    if (existingAdmin) {
      console.log('⚠️ Admin user already exists on Atlas')
      return
    }

    // Create admin user
    console.log('👤 Creating admin user on Atlas...')
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

    const result = await db.collection('users').insertOne(adminUser)
    console.log('✅ Admin user created on Atlas with ID:', result.insertedId)

    // Verify
    const verification = await db.collection('users').findOne({ _id: result.insertedId })
    console.log('✅ Verification - User found on Atlas:', verification?.email)

    console.log('\n🔐 Atlas Login Credentials:')
    console.log('   Email: admin@admin.com')
    console.log('   Password: password')

  } catch (error) {
    console.error('❌ Error creating admin on Atlas:', error)
  } finally {
    await client.close()
    console.log('🔌 Atlas connection closed')
  }
}

createAtlasAdmin().catch(console.error)