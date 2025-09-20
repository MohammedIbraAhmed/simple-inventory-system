import { MongoClient } from 'mongodb'

// Use the Atlas URI directly
const atlasUri = 'mongodb+srv://ajsrp_portal:kU0Cl64PYwaPoDxs@cluster0.e94elwz.mongodb.net/sinv?retryWrites=true&w=majority&appName=Cluster0'

async function testAtlasConnection() {
  const client = new MongoClient(atlasUri)

  try {
    console.log('🔗 Connecting directly to Atlas...')
    console.log('📍 Cluster: cluster0.e94elwz.mongodb.net')

    await client.connect()
    console.log('✅ Connected to Atlas successfully!')

    // List all databases
    const adminDb = client.db().admin()
    const databasesList = await adminDb.listDatabases()
    console.log('\n📊 All databases on Atlas cluster:')
    databasesList.databases.forEach(db => {
      console.log(`   - ${db.name} (${db.sizeOnDisk} bytes)`)
    })

    // Check sinv database
    const sinvDb = client.db('sinv')
    const collections = await sinvDb.listCollections().toArray()
    console.log('\n📋 Collections in sinv database:', collections.map(c => c.name))

    // Count users
    const userCount = await sinvDb.collection('users').countDocuments()
    console.log('👥 Total users:', userCount)

    if (userCount > 0) {
      const adminUser = await sinvDb.collection('users').findOne({ email: 'admin@admin.com' })
      console.log('🔐 Admin user exists:', !!adminUser)
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await client.close()
    console.log('🔌 Atlas connection closed')
  }
}

testAtlasConnection().catch(console.error)