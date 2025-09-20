import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

async function testAtlasConnection() {
  const uri = process.env.MONGODB_URI

  if (!uri) {
    console.error('❌ MONGODB_URI not found in environment variables')
    console.log('Please check your .env.local file')
    process.exit(1)
  }

  console.log('🔍 Testing MongoDB Atlas Connection...')
  console.log('URI:', uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')) // Hide credentials

  const options = {
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS: 30000,
    ssl: true,
    retryWrites: true,
    retryReads: true,
    appName: 'InventoryManagementSystem-Test'
  }

  let client: MongoClient | null = null

  try {
    console.log('⏳ Connecting to MongoDB Atlas...')

    client = new MongoClient(uri, options)
    await client.connect()

    console.log('✅ Successfully connected to MongoDB Atlas!')

    // Test ping
    console.log('⏳ Testing ping...')
    const adminDb = client.db('admin')
    await adminDb.admin().ping()
    console.log('✅ Ping successful!')

    // Test database access
    console.log('⏳ Testing database access...')
    const db = client.db('sinv')
    const collections = await db.listCollections().toArray()
    console.log(`✅ Database 'sinv' accessible! Found ${collections.length} collections:`)
    collections.forEach(col => console.log(`  - ${col.name}`))

    // Test write operation
    console.log('⏳ Testing write operation...')
    const testCollection = db.collection('connection_test')
    const result = await testCollection.insertOne({
      test: true,
      timestamp: new Date(),
      message: 'Connection test successful'
    })
    console.log('✅ Write operation successful!', result.insertedId)

    // Clean up test document
    await testCollection.deleteOne({ _id: result.insertedId })
    console.log('✅ Test cleanup completed!')

    console.log('🎉 All tests passed! MongoDB Atlas connection is working correctly.')

  } catch (error) {
    console.error('❌ Connection test failed!')

    if (error instanceof Error) {
      console.error('Error:', error.message)

      if (error.message.includes('Server selection timed out')) {
        console.log('\n🔧 Troubleshooting Steps:')
        console.log('1. 🌐 Check MongoDB Atlas cluster status:')
        console.log('   - Go to your Atlas dashboard')
        console.log('   - Ensure your cluster is not paused')
        console.log('   - Verify the cluster is running')

        console.log('\n2. 🛡️ Check Network Access (IP Whitelist):')
        console.log('   - Go to Atlas → Network Access')
        console.log('   - Add your current IP address')
        console.log('   - Or temporarily add 0.0.0.0/0 (allow all) for testing')

        console.log('\n3. 🔑 Verify Database User:')
        console.log('   - Go to Atlas → Database Access')
        console.log('   - Ensure user exists and has proper permissions')
        console.log('   - Try resetting the password')

        console.log('\n4. 🌍 Check Connection String:')
        console.log('   - Ensure it follows Atlas format:')
        console.log('   - mongodb+srv://username:password@cluster.xxxxx.mongodb.net/database?retryWrites=true&w=majority')
      } else if (error.message.includes('Authentication failed')) {
        console.log('\n🔧 Authentication Issues:')
        console.log('1. Check username/password in connection string')
        console.log('2. Verify database user permissions in Atlas')
        console.log('3. Try resetting the database user password')
      }
    }

    process.exit(1)
  } finally {
    if (client) {
      await client.close()
      console.log('🔌 Connection closed')
    }
  }
}

// Run the test
testAtlasConnection().catch(console.error)