'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useInactivityTimeout } from '@/hooks/useInactivityTimeout'
import Sidebar from './Sidebar'
import AdminHeader from './AdminHeader'
import InactivityWarningModal from './InactivityWarningModal'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface ProtectedLayoutProps {
  children: React.ReactNode
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const router = useRouter()
  const { user, loading, signOut } = useAuth()
  const [showInactivityWarning, setShowInactivityWarning] = useState(false)

  // Handle auto logout
  const handleAutoLogout = async () => {
    console.log('[ProtectedLayout] Auto logout due to inactivity')
    toast.info('Signed out due to inactivity')
    await signOut()
    router.push('/auth?reason=inactivity')
  }

  // Setup inactivity timeout
  const { resetTimer } = useInactivityTimeout({
    warningTime: 30 * 60 * 1000, // 30 minutes
    logoutTime: 60 * 60 * 1000,  // 60 minutes
    onWarning: () => {
      console.log('[ProtectedLayout] Showing inactivity warning')
      setShowInactivityWarning(true)
    },
    onLogout: handleAutoLogout
  })

  // Handle "I'm still here" button
  const handleStillHere = () => {
    console.log('[ProtectedLayout] User confirmed still active')
    setShowInactivityWarning(false)
    resetTimer()
    toast.success('Session extended')
  }

  // Handle manual logout from warning modal
  const handleManualLogout = async () => {
    console.log('[ProtectedLayout] Manual logout from warning modal')
    await signOut()
    router.push('/auth')
  }

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Loading...</h2>
          <p className="text-gray-600">Please wait while we load your session</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-x-hidden">
          <AdminHeader />
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>

      {/* Inactivity warning modal */}
      <InactivityWarningModal
        isOpen={showInactivityWarning}
        onStillHere={handleStillHere}
        onLogout={handleManualLogout}
        timeUntilLogout={30 * 60} // 30 minutes in seconds
      />
    </>
  )
}
