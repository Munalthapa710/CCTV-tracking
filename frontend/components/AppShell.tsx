'use client'

import Link from 'next/link'
import { ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Camera, LayoutDashboard, LogOut, Search, Settings2, UserPlus } from 'lucide-react'

import { clearSession } from '@/lib/auth'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/add-employee', label: 'Add Employee', icon: UserPlus },
  { href: '/find', label: 'Find Employee', icon: Search },
  { href: '/cameras', label: 'Manage Cameras', icon: Settings2 },
]

export default function AppShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <div className="min-h-screen bg-obsidian text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <aside className="hidden w-72 shrink-0 rounded-3xl border border-white/10 bg-slate-panel/70 p-6 backdrop-blur lg:block">
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-accent text-obsidian">
              <Camera className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/40">Internal</p>
              <h1 className="text-lg font-semibold">AI CCTV Finder</h1>
            </div>
          </div>

          <nav className="space-y-2">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${
                    active
                      ? 'bg-cyan-accent text-obsidian shadow-[0_14px_40px_rgba(73,246,213,0.22)]'
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              )
            })}
          </nav>

          <button
            onClick={() => {
              clearSession()
              router.replace('/login')
            }}
            className="mt-10 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 transition hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </aside>

        <div className="flex-1">
          <header className="mb-6 rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(73,246,213,0.18),transparent_35%),linear-gradient(135deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] p-6 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-accent/70">Control Room</p>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-3xl font-semibold">{title}</h2>
                <p className="mt-1 text-sm text-white/65">{subtitle}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/60">
                Static login: <span className="text-white">admin / admin123</span>
              </div>
            </div>
          </header>

          <main>{children}</main>
        </div>
      </div>
    </div>
  )
}
