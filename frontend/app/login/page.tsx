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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-obsidian px-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(73,246,213,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,141,92,0.14),transparent_28%)]" />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-slate-panel shadow-2xl shadow-black/30 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="hidden border-r border-white/10 p-10 lg:block">
          <p className="text-xs uppercase tracking-[0.38em] text-cyan-accent/70">Security Desk</p>
          <h1 className="mt-5 max-w-md text-5xl font-semibold leading-tight">
            AI CCTV Employee Finder System
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-white/65">
            Register employees with face scans, sync live camera snapshots, and locate a person across Room A, Room B, and Room C from one control surface.
          </p>

          <div className="mt-10 grid gap-4">
            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <p className="text-sm font-medium text-white">Static admin plus user registration</p>
              <p className="mt-2 text-sm text-white/55">Use the built-in admin or create a separate login from the registration page.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <p className="text-sm font-medium text-white">Offline-friendly AI path</p>
              <p className="mt-2 text-sm text-white/55">InsightFace is used when available, with an OpenCV fallback for local execution.</p>
            </div>
          </div>
        </section>

        <section className="p-8 sm:p-10">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-accent text-obsidian">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-white/45">Admin Console</p>
              <p className="text-lg font-semibold text-white">Sign in</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm text-white/55">Username</span>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <User2 className="h-4 w-4 text-cyan-accent" />
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="w-full bg-transparent outline-none"
                  placeholder="admin"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-white/55">Password</span>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <LockKeyhole className="h-4 w-4 text-cyan-accent" />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full bg-transparent outline-none"
                  placeholder="admin123"
                />
              </div>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-cyan-accent px-4 py-3 font-semibold text-obsidian transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Open dashboard'}
            </button>
          </form>

          <div className="mt-6 rounded-3xl border border-dashed border-white/10 bg-black/20 p-5 text-sm text-white/60">
            Built-in admin: <span className="text-white">admin</span> / <span className="text-white">admin123</span>.
            <Link href="/register" className="ml-2 text-cyan-accent hover:underline">
              Create account
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
