'use client'

import Link from 'next/link'
import { ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Camera, History, LayoutDashboard, LogOut, Search, Settings2, UserPlus } from 'lucide-react'

import { clearSession } from '@/lib/auth'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/add-employee', label: 'Add Employee', icon: UserPlus },
  { href: '/find', label: 'Find Employee', icon: Search },
  { href: '/tracking', label: 'Tracking', icon: History },
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
      <div className="mx-auto flex min-h-screen max-w-7xl gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <aside className="glass-panel hidden w-72 shrink-0 rounded-[2rem] p-6 lg:block">
          <div className="mb-10 flex items-center gap-4">
            <div className="accent-ring flex h-14 w-14 items-center justify-center rounded-[1.3rem] bg-[linear-gradient(135deg,#ff9a5c,#ffd36f)] text-obsidian">
              <Camera className="h-7 w-7" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.34em] text-white/35">Internal Vision</p>
              <h1 className="text-xl font-semibold text-white">AI CCTV Finder</h1>
            </div>
          </div>

          <nav className="space-y-2">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${
                    active
                      ? 'bg-[linear-gradient(135deg,rgba(255,154,92,0.95),rgba(255,211,111,0.92))] text-obsidian shadow-[0_18px_44px_rgba(255,154,92,0.2)]'
                      : 'text-white/68 hover:bg-white/6 hover:text-white'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? 'text-obsidian' : 'text-white/55 group-hover:text-cyan-accent'}`} />
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
            className="mt-10 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/82 transition hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </aside>

        <div className="flex-1 pb-24 lg:pb-0">
          <header className="glass-panel mb-6 rounded-[2rem] p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.38em] text-cyan-accent/75">Command Center</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{title}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/62">{subtitle}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] px-4 py-3 text-sm text-white/70">
                Active workspace with employee registration, camera scanning, and detection workflows.
              </div>
            </div>
          </header>

          <main>{children}</main>

          <div className="glass-panel fixed inset-x-4 bottom-4 z-20 rounded-[1.6rem] p-2 lg:hidden">
            <nav className="grid grid-cols-5 gap-2">
              {navItems.map(({ href, label, icon: Icon }) => {
                const active = pathname === href
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-3 text-[11px] transition ${
                      active ? 'bg-[linear-gradient(135deg,rgba(255,154,92,0.95),rgba(255,211,111,0.9))] text-obsidian' : 'text-white/62 hover:bg-white/6 hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-center leading-tight">{label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      </div>
    </div>
  )
}
