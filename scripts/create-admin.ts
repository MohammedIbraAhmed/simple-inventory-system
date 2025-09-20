import { MongoClient } from 'mongodb'
import { hashPassword } from '../src/lib/auth-utils'

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/simple-inventory'

async function createAdminUser() {
  const client = new MongoClient(uri)

  try {
    console.log('Connecting to MongoDB Atlas...')
    await client.connect()
    console.log('✅ Connected to MongoDB')

    // Use the correct database name from the URI
    const db = client.db('sinv')
    console.log(`✅ Using database: ${db.databaseName}`)

    // List all collections to see what's in the database
    const collections = await db.listCollections().toArray()
    console.log('📋 Collections in database:', collections.map(c => c.name))

    // Count users
    const userCount = await db.collection('users').countDocuments()
    console.log(`👥 Total users in database: ${userCount}`)

    // Check if admin user already exists
    const existingAdmin = await db.collection('users').findOne({ email: 'admin@admin.com' })
    if (existingAdmin) {
      console.log('⚠️ Admin user already exists:', existingAdmin.email, 'Role:', existingAdmin.role)
      return
    }

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

    const result = await db.collection('users').insertOne(adminUser)
    console.log('✅ Admin user created with ID:', result.insertedId)

    // Verify the user was created
    const createdUser = await db.collection('users').findOne({ _id: result.insertedId })
    console.log('✅ Verification - User found:', createdUser?.email, 'Role:', createdUser?.role)

    console.log('\n🔐 Login Credentials:')
    console.log('   Email: admin@admin.com')
    console.log('   Password: password')

  } catch (error) {
    console.error('❌ Error creating admin user:', error)
    process.exit(1)
  } finally {
    await client.close()
    console.log('✅ Database connection closed')
  }
}

// Run the function
createAdminUser().catch(console.error)