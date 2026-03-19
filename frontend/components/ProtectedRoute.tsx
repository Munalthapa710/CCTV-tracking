'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { getSession } from '@/lib/auth'

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const session = getSession()
    if (!session) {
      router.replace('/login')
      return
    }
    setReady(true)
  }, [router])

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-obsidian">
        <div className="rounded-full border border-white/15 px-5 py-2 text-sm text-white/70">
          Verifying session...
        </div>
      </div>
    )
  }

  return <>{children}</>
}
