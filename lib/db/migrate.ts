import { drizzle } from 'drizzle-orm/vercel-postgres'
import { migrate } from 'drizzle-orm/vercel-postgres/migrator'
import { sql } from '@vercel/postgres'

const db = drizzle(sql)

async function runMigrations() {
  console.log('Running migrations...')
  
  await migrate(db, { migrationsFolder: './lib/db/migrations' })
  
  console.log('Migrations completed!')
  process.exit(0)
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})