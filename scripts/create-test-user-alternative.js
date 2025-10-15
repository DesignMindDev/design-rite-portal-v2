/**
 * Create test user with alternative email to avoid rate limits
 * Run: node scripts/create-test-user-alternative.js
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

async function createTestUser() {
  const email = 'test@design-rite.com'
  const password = 'TestPassword123!'

  console.log('\n🔧 Creating alternative test user...')
  console.log('Email:', email)
  console.log('Password:', password)
  console.log('')

  try {
    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users.find(u => u.email?.toLowerCase() === email.toLowerCase())

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
            full_name: 'Test User',
            company: 'Design-Rite',
            source: 'manual_test_script_alternative'
          }
        }
      )

      if (updateError) {
        console.error('❌ Error updating user:', updateError.message)
        process.exit(1)
      }

      console.log('✅ User password updated successfully!')
    } else {
      // Create new user
      const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: 'Test User',
          company: 'Design-Rite',
          source: 'manual_test_script_alternative'
        }
      })

      if (signUpError) {
        console.error('❌ Error creating user:', signUpError.message)
        process.exit(1)
      }

      console.log('✅ Test user created successfully!')
      console.log('User ID:', signUpData.user.id)
    }

    console.log('')
    console.log('🔑 Test Credentials:')
    console.log('   Email:', email)
    console.log('   Password:', password)
    console.log('')
    console.log('🌐 Test Forgot Password Flow:')
    console.log('   1. Go to: http://localhost:3001/forgot-password')
    console.log('   2. Enter email:', email)
    console.log('   3. Check email and click reset link')
    console.log('   4. Should land on /reset-password page')
    console.log('')

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
    process.exit(1)
  }
}

createTestUser()
