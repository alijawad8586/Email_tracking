'use client'

import { Suspense } from 'react'
import LoginForm from './login-form'

export const dynamic = 'force-dynamic'

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFormSkeleton />}>
      <LoginForm />
    </Suspense>
  )
}

function LoginFormSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Lead Tracker</h1>
          <p className="text-gray-600">Manage leads and automate email replies</p>
        </div>
        <div className="w-full h-11 bg-gray-200 rounded-lg animate-pulse"></div>
      </div>
    </div>
  )
}
