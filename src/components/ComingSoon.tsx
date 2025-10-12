'use client'

import ProtectedLayout from './ProtectedLayout'
import { Construction, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface ComingSoonProps {
  title: string
  description: string
  icon: React.ReactNode
}

export default function ComingSoon({ title, description, icon }: ComingSoonProps) {
  return (
    <ProtectedLayout>
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            {icon}
          </div>
          <Construction className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{title}</h1>
          <p className="text-xl text-gray-600 mb-8">{description}</p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <p className="text-sm text-blue-800">
              This feature is under development and will be available soon!
            </p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    </ProtectedLayout>
  )
}
