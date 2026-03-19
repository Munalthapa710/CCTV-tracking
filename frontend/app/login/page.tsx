'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { LockKeyhole, ShieldCheck, User2 } from 'lucide-react'

import { authApi } from '@/lib/api'
import { setSession } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin123')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)

    try {
      const { data } = await authApi.login(username, password)
      setSession({ token: data.token, username: data.username })
      toast.success('Access granted')
      router.replace('/dashboard')
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Invalid login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-obsidian px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_10%,rgba(82,242,208,0.18),transparent_24%),radial-gradient(circle_at_92%_12%,rgba(124,199,255,0.16),transparent_18%),radial-gradient(circle_at_80%_78%,rgba(255,179,106,0.12),transparent_18%)]" />

      <div className="relative grid w-full max-w-6xl overflow-hidden rounded-[2.2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015)),rgba(11,24,34,0.92)] shadow-[0_30px_90px_rgba(0,0,0,0.34)] lg:grid-cols-[1.18fr_0.82fr]">
        <section className="hidden border-r border-white/8 p-10 lg:block">
          <p className="text-[11px] uppercase tracking-[0.42em] text-cyan-accent/72">Security Desk</p>
          <h1 className="mt-6 max-w-xl text-5xl font-semibold leading-[1.05] text-white">
            Modern employee tracking for camera-connected workspaces
          </h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-white/62">
            Register employees from face scans, connect mobile or network cameras, and locate people from a single control interface designed for internal operations.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.8rem] border border-white/8 bg-white/[0.035] p-5">
              <p className="text-sm font-medium text-white">Built-in admin access</p>
              <p className="mt-2 text-sm leading-6 text-white/58">Use the default account for initial setup or create additional local accounts from registration.</p>
            </div>
            <div className="rounded-[1.8rem] border border-white/8 bg-white/[0.035] p-5">
              <p className="text-sm font-medium text-white">Camera-ready workflow</p>
              <p className="mt-2 text-sm leading-6 text-white/58">Supports browser-backed feeds, network CCTV streams, and mobile camera connections such as DroidCam.</p>
            </div>
          </div>
        </section>

        <section className="p-8 sm:p-10">
          <div className="mb-8 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-[1.2rem] bg-[linear-gradient(135deg,#52f2d0,#7cc7ff)] text-obsidian shadow-[0_18px_40px_rgba(82,242,208,0.18)]">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm text-white/42">Admin Console</p>
              <p className="text-xl font-semibold text-white">Sign in</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm text-white/55">Username</span>
              <div className="flex items-center gap-3 rounded-[1.2rem] border border-white/10 bg-black/20 px-4 py-3 transition focus-within:border-cyan-accent/40 focus-within:bg-white/[0.03]">
                <User2 className="h-4 w-4 text-cyan-accent" />
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="w-full bg-transparent outline-none placeholder:text-white/25"
                  placeholder="admin"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-white/55">Password</span>
              <div className="flex items-center gap-3 rounded-[1.2rem] border border-white/10 bg-black/20 px-4 py-3 transition focus-within:border-cyan-accent/40 focus-within:bg-white/[0.03]">
                <LockKeyhole className="h-4 w-4 text-cyan-accent" />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full bg-transparent outline-none placeholder:text-white/25"
                  placeholder="admin123"
                />
              </div>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-[1.2rem] bg-[linear-gradient(135deg,#52f2d0,#7cc7ff)] px-4 py-3 font-semibold text-obsidian transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Open dashboard'}
            </button>
          </form>

          <div className="mt-6 rounded-[1.8rem] border border-white/10 bg-black/20 p-5 text-sm text-white/62">
            Built-in admin: <span className="font-medium text-white">admin</span> / <span className="font-medium text-white">admin123</span>.
            <Link href="/register" className="ml-2 text-cyan-accent hover:text-white">
              Create account
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
