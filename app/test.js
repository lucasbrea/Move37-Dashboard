import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL)

async function testConnection() {
  const result = await sql`SELECT NOW()`
  console.log('Connected! DB time:', result)
}

testConnection()