'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

import AppShell from '@/components/AppShell'
import MetricCard from '@/components/MetricCard'
import ProtectedRoute from '@/components/ProtectedRoute'
import { employeeApi, EmployeeCard } from '@/lib/api'

export default function DashboardPage() {
  const [employees, setEmployees] = useState<EmployeeCard[]>([])
  const [loading, setLoading] = useState(true)

  async function loadEmployees() {
    try {
      const { data } = await employeeApi.list()
      setEmployees(data.employees)
    } catch {
      toast.error('Failed to load employees')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEmployees()
    const timer = window.setInterval(loadEmployees, 10000)
    return () => window.clearInterval(timer)
  }, [])

  const seenCount = employees.filter((employee) => employee.last_seen_time).length

  return (
    <ProtectedRoute>
      <AppShell title="Employee Dashboard" subtitle="Registered employees, latest detections, and system readiness in one view.">
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard label="Employees" value={employees.length} hint="Profiles currently stored in the local SQLite database." />
          <MetricCard label="Tracked" value={seenCount} hint="Employees with at least one successful detection event." />
          <MetricCard label="Pending" value={employees.length - seenCount} hint="Profiles waiting for their first confirmed camera match." />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="glass-panel overflow-hidden rounded-[2rem]">
            <div className="flex items-center justify-between border-b border-white/8 px-6 py-5">
              <div>
                <h3 className="text-lg font-semibold text-white">Registered employees</h3>
                <p className="mt-1 text-sm text-white/55">Identity records, sample count, and most recent known location.</p>
              </div>
              <button
                onClick={loadEmployees}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/78 transition hover:bg-white/10"
              >
                Refresh
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-white/[0.03] text-white/42">
                  <tr>
                    <th className="px-6 py-4 font-medium">Employee ID</th>
                    <th className="px-6 py-4 font-medium">Name</th>
                    <th className="px-6 py-4 font-medium">Samples</th>
                    <th className="px-6 py-4 font-medium">Last Seen Location</th>
                    <th className="px-6 py-4 font-medium">Last Seen Time</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr key={employee.employee_id} className="border-t border-white/6 text-white/82 transition hover:bg-white/[0.025]">
                      <td className="px-6 py-4 font-medium text-cyan-accent/92">{employee.employee_id}</td>
                      <td className="px-6 py-4">{employee.name}</td>
                      <td className="px-6 py-4">{employee.sample_count}</td>
                      <td className="px-6 py-4">{employee.last_seen_location || 'Not seen yet'}</td>
                      <td className="px-6 py-4">
                        {employee.last_seen_time ? format(new Date(employee.last_seen_time), 'PPpp') : 'No detections'}
                      </td>
                    </tr>
                  ))}

                  {!loading && employees.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-white/45">
                        No employees registered yet. Add one from the Add Employee page.
                      </td>
                    </tr>
                  )}

                  {loading && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-white/45">
                        Loading dashboard...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4">
            <div className="glass-panel rounded-[2rem] p-6">
              <p className="text-[11px] uppercase tracking-[0.34em] text-white/38">System Notes</p>
              <h3 className="mt-3 text-xl font-semibold text-white">Tracking workflow</h3>
              <p className="mt-3 text-sm leading-6 text-white/58">
                Capture clean face samples first, then sync a camera feed from the Find page or a network stream from Manage Cameras. The scanner compares embeddings and records the best match.
              </p>
            </div>

            <div className="panel-soft rounded-[2rem] p-6">
              <p className="text-[11px] uppercase tracking-[0.34em] text-white/38">Visual Status</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-cyan-accent shadow-[0_0_18px_rgba(255,154,92,0.85)]" />
                <p className="text-sm text-white/68">Detection engine online and ready for camera updates.</p>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
