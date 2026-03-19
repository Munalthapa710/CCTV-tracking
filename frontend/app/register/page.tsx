'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { LockKeyhole, ShieldPlus, User2 } from 'lucide-react'

import { authApi } from '@/lib/api'
import { setSession } from '@/lib/auth'

export default function RegisterPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const { data } = await authApi.register(username, password)
      setSession({ token: data.token, username: data.username })
      toast.success('Account created')
      router.replace('/dashboard')
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-obsidian px-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(73,246,213,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(255,141,92,0.14),transparent_24%)]" />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-slate-panel shadow-2xl shadow-black/30 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden border-r border-white/10 p-10 lg:block">
          <p className="text-xs uppercase tracking-[0.38em] text-cyan-accent/70">Access Setup</p>
          <h1 className="mt-5 max-w-md text-5xl font-semibold leading-tight">
            Create a login for the control room
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-white/65">
            Register a username and password for this local deployment. The built-in admin account remains available for emergency access.
          </p>
        </section>

        <section className="p-8 sm:p-10">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-accent text-obsidian">
              <ShieldPlus className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-white/45">User Registration</p>
              <p className="text-lg font-semibold text-white">Create account</p>
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
                  placeholder="security-team"
                  required
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
                  placeholder="Minimum 6 characters"
                  required
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-white/55">Confirm password</span>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <LockKeyhole className="h-4 w-4 text-cyan-accent" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full bg-transparent outline-none"
                  placeholder="Re-enter password"
                  required
                />
              </div>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-cyan-accent px-4 py-3 font-semibold text-obsidian transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Creating account...' : 'Register and continue'}
            </button>
          </form>

          <div className="mt-6 rounded-3xl border border-dashed border-white/10 bg-black/20 p-5 text-sm text-white/60">
            Already registered?
            <Link href="/login" className="ml-2 text-cyan-accent hover:underline">
              Back to login
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
