/**
 * Simple Node.js script to create test user
 * Run: node scripts/create-test-user-simple.js
 */

const { createClient } = require('@supabase/supabase-js')

// Portal v2 Supabase credentials - CORRECT KEYS
const supabaseUrl = 'https://aeorianxnxpxveoxzhov.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlb3JpYW54bnhweHZlb3h6aG92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTE3NzMyOSwiZXhwIjoyMDc0NzUzMzI5fQ.qKUYyhUVZZpKKHXH-6-WCedEhlSbXIhuwk52ofXQqpk'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createTestUser() {
  const email = 'dan@design-rite.com'
  const password = 'TestPassword123!'

  console.log('\n🔧 Creating test user...')
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
            full_name: 'Dan Koziar',
            company: 'Design-Rite',
            source: 'manual_test_script'
          }
        }
      )

      if (updateError) {
        console.error('❌ Error updating user:', updateError.message)
        process.exit(1)
      }

      console.log('✅ User password updated successfully!')
      console.log('')
      console.log('🔑 Test Credentials:')
      console.log('   Email:', email)
      console.log('   Password:', password)
      console.log('')
      console.log('🌐 Test URLs:')
      console.log('   Sign In: http://localhost:3001/auth')
      console.log('   Forgot Password: http://localhost:3001/forgot-password')
      console.log('')
    } else {
      // Create new user
      const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: 'Dan Koziar',
          company: 'Design-Rite',
          source: 'manual_test_script'
        }
      })

      if (signUpError) {
        console.error('❌ Error creating user:', signUpError.message)
        process.exit(1)
      }

      console.log('✅ Test user created successfully!')
      console.log('User ID:', signUpData.user.id)
      console.log('Email confirmed:', signUpData.user.email_confirmed_at ? 'Yes' : 'No')
      console.log('')
      console.log('🔑 Test Credentials:')
      console.log('   Email:', email)
      console.log('   Password:', password)
      console.log('')
      console.log('🌐 Test URLs:')
      console.log('   Sign In: http://localhost:3001/auth')
      console.log('   Forgot Password: http://localhost:3001/forgot-password')
      console.log('')
    }

    console.log('📝 Next Steps:')
    console.log('1. Sign in with the credentials above')
    console.log('2. Test the forgot password flow')
    console.log('3. Check that password reset works correctly')
    console.log('')

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
    process.exit(1)
  }
}

createTestUser()
