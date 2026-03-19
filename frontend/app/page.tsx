'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { getSession } from '@/lib/auth'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const session = getSession()
    router.replace(session ? '/dashboard' : '/login')
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-obsidian text-white/70">
      Loading...
    </div>
  )
}
