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
      <AppShell title="Employee Dashboard" subtitle="Registered employees with last known location pulled from tracking history.">
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard label="Employees" value={employees.length} hint="Total registered profiles in SQLite" />
          <MetricCard label="Tracked" value={seenCount} hint="Employees with at least one detection event" />
          <MetricCard label="Missing" value={employees.length - seenCount} hint="Employees without any successful match yet" />
        </div>

        <div className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-slate-panel">
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
            <div>
              <h3 className="text-lg font-semibold">Registered employees</h3>
              <p className="text-sm text-white/55">Employee ID, stored profile, and last seen state.</p>
            </div>
            <button
              onClick={loadEmployees}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10"
            >
              Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-black/20 text-white/45">
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
                  <tr key={employee.employee_id} className="border-t border-white/5 text-white/80">
                    <td className="px-6 py-4">{employee.employee_id}</td>
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
                    <td colSpan={5} className="px-6 py-10 text-center text-white/45">
                      No employees registered yet. Add one from the Add Employee page.
                    </td>
                  </tr>
                )}

                {loading && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-white/45">
                      Loading dashboard...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
