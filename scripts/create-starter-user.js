/**
 * Create test user for Starter plan testing
 * Run: node scripts/create-starter-user.js
 */

const { createClient } = require('@supabase/supabase-js')

// Portal v2 Supabase credentials
const supabaseUrl = 'https://aeorianxnxpxveoxzhov.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlb3JpYW54bnhweHZlb3h6aG92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTE3NzMyOSwiZXhwIjoyMDc0NzUzMzI5fQ.qKUYyhUVZZpKKHXH-6-WCedEhlSbXIhuwk52ofXQqpk'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createStarterUser() {
  const email = 'starter-test@design-rite.com'
  const password = 'StarterTest123!'

  console.log('\n🔧 Creating Starter plan test user...')
  console.log('Email:', email)
  console.log('Password:', password)
  console.log('')

  try {
    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users.find(u => u.email?.toLowerCase() === email.toLowerCase())

    let userId

    if (existingUser) {
      console.log('⚠️  User already exists with ID:', existingUser.id)
      console.log('Updating password instead...')

      // Update existing user's password
      const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        {
          password: password,
          email_confirm: true,
          user_metadata: {
            full_name: 'Starter Test User',
            company: 'Test Company',
            source: 'manual_starter_script'
          }
        }
      )

      if (updateError) {
        console.error('❌ Error updating user:', updateError.message)
        process.exit(1)
      }

      userId = existingUser.id
      console.log('✅ User password updated successfully!')
    } else {
      // Create new user
      const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: 'Starter Test User',
          company: 'Test Company',
          source: 'manual_starter_script'
        }
      })

      if (signUpError) {
        console.error('❌ Error creating user:', signUpError.message)
        process.exit(1)
      }

      userId = signUpData.user.id
      console.log('✅ Test user created successfully!')
      console.log('User ID:', userId)
    }

    console.log('')
    console.log('📋 Next Step: Assign Starter Subscription')
    console.log('Run this SQL in Supabase SQL Editor:')
    console.log('')
    console.log('UPDATE public.subscriptions')
    console.log('SET')
    console.log('  tier=\'starter\',')
    console.log('  status=\'active\',')
    console.log('  source=\'admin_grant\',')
    console.log('  is_trial=false,')
    console.log('  max_documents=10,')
    console.log('  updated_at=NOW()')
    console.log('WHERE user_id=\'' + userId + '\';')
    console.log('')
    console.log('🔑 Test Credentials:')
    console.log('   Email:', email)
    console.log('   Password:', password)
    console.log('   Login URL: http://localhost:3001/auth')
    console.log('')

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
    process.exit(1)
  }
}

createStarterUser()
