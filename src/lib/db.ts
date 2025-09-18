import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/simple-inventory'
let client: MongoClient

export async function connectDB() {
  if (!client) {
    client = new MongoClient(uri)
    await client.connect()
  }
  return client.db()
}