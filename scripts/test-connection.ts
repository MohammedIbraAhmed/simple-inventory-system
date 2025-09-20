import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/simple-inventory'

async function testConnection() {
  const client = new MongoClient(uri)

  try {
    console.log('🔗 Connecting to MongoDB Atlas...')
    console.log('📍 URI:', uri.replace(/\/\/([^:]+):([^@]+)@/, '//****:****@')) // Hide credentials

    await client.connect()
    console.log('✅ Connected successfully!')

    // List all databases
    const adminDb = client.db().admin()
    const databasesList = await adminDb.listDatabases()
    console.log('\n📊 All databases on this cluster:')
    databasesList.databases.forEach(db => {
      console.log(`   - ${db.name} (${db.sizeOnDisk} bytes)`)
    })

    // Try to connect to 'sinv' database specifically
    console.log('\n🎯 Testing sinv database...')
    const sinvDb = client.db('sinv')
    console.log('✅ Connected to sinv database')

    // Try to create a test collection
    console.log('📝 Creating test collection...')
    const testCollection = sinvDb.collection('test')
    const insertResult = await testCollection.insertOne({ test: 'data', timestamp: new Date() })
    console.log('✅ Test document inserted:', insertResult.insertedId)

    // List collections in sinv
    const collections = await sinvDb.listCollections().toArray()
    console.log('📋 Collections in sinv database:', collections.map(c => c.name))

    // Count documents
    const count = await testCollection.countDocuments()
    console.log('📊 Documents in test collection:', count)

    // Clean up test data
    await testCollection.deleteMany({})
    console.log('🧹 Cleaned up test data')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await client.close()
    console.log('🔌 Connection closed')
  }
}

testConnection().catch(console.error)