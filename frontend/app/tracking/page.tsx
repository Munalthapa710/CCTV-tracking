'use client'

import { useEffect, useMemo, useState } from 'react'
import { formatDistanceToNowStrict } from 'date-fns'
import { Camera, Clock3, History, Search } from 'lucide-react'
import toast from 'react-hot-toast'

import AppShell from '@/components/AppShell'
import ProtectedRoute from '@/components/ProtectedRoute'
import { resolveAssetUrl, trackingApi, TrackingHistoryItem } from '@/lib/api'

export default function TrackingPage() {
  const [events, setEvents] = useState<TrackingHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  async function loadEvents() {
    try {
      const { data } = await trackingApi.list({ limit: 60 })
      setEvents(data.events)
    } catch {
      toast.error('Failed to load tracking history')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEvents()
    const timer = window.setInterval(loadEvents, 10000)
    return () => window.clearInterval(timer)
  }, [])

  const filteredEvents = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return events
    return events.filter((event) =>
      [
        event.employee_name,
        event.employee_id,
        event.location,
        event.camera_display_name || '',
        event.camera_id,
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalized)
    )
  }, [events, query])

  const uniqueEmployees = new Set(events.map((event) => event.employee_id)).size
  const uniqueLocations = new Set(events.map((event) => event.location)).size

  return (
    <ProtectedRoute>
      <AppShell title="Tracking History" subtitle="Review every recent match with saved evidence frames, employee details, and camera context.">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="glass-panel rounded-[1.8rem] p-5">
            <p className="text-[11px] uppercase tracking-[0.32em] text-white/38">Events</p>
            <p className="mt-3 text-3xl font-semibold text-white">{events.length}</p>
            <p className="mt-2 text-sm text-white/58">Recent detections loaded from the tracking log.</p>
          </div>
          <div className="glass-panel rounded-[1.8rem] p-5">
            <p className="text-[11px] uppercase tracking-[0.32em] text-white/38">Employees</p>
            <p className="mt-3 text-3xl font-semibold text-white">{uniqueEmployees}</p>
            <p className="mt-2 text-sm text-white/58">Unique employee identities seen in the current history window.</p>
          </div>
          <div className="glass-panel rounded-[1.8rem] p-5">
            <p className="text-[11px] uppercase tracking-[0.32em] text-white/38">Locations</p>
            <p className="mt-3 text-3xl font-semibold text-white">{uniqueLocations}</p>
            <p className="mt-2 text-sm text-white/58">Distinct rooms or camera locations represented in the log.</p>
          </div>
        </div>

        <div className="mt-6 glass-panel rounded-[2rem] p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.34em] text-white/40">Evidence Feed</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Detection timeline</h3>
              <p className="mt-2 text-sm leading-6 text-white/56">Each confirmed match stores the employee, the matched camera, similarity score, and a snapshot of the frame used for the detection.</p>
            </div>

            <div className="flex items-center gap-3 rounded-[1.2rem] border border-white/10 bg-black/20 px-4 py-3 lg:w-[22rem]">
              <Search className="h-4 w-4 text-cyan-accent" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full bg-transparent outline-none placeholder:text-white/28"
                placeholder="Filter by employee, camera, or location"
              />
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {filteredEvents.map((event) => (
              <article key={event.id} className="panel-soft overflow-hidden rounded-[1.8rem]">
                <div className="grid gap-0 lg:grid-cols-[1.08fr_0.92fr]">
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      {resolveAssetUrl(event.employee_preview_image_url) ? (
                        <img
                          src={resolveAssetUrl(event.employee_preview_image_url) || undefined}
                          alt={event.employee_name}
                          className="h-16 w-16 rounded-[1.2rem] border border-white/10 object-cover"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-[1.2rem] bg-white/8 text-xs text-white/50">
                          No photo
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-lg font-semibold text-white">{event.employee_name}</p>
                          <span className="rounded-full bg-cyan-accent/12 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-cyan-accent">
                            {Math.round(event.similarity * 100)}% match
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-white/55">{event.employee_id}</p>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-[1.2rem] border border-white/8 bg-black/15 p-4">
                            <div className="flex items-center gap-2 text-white/48">
                              <Camera className="h-4 w-4 text-sky-accent" />
                              <span className="text-[11px] uppercase tracking-[0.24em]">Camera</span>
                            </div>
                            <p className="mt-2 text-sm text-white">{event.camera_display_name || event.camera_id}</p>
                            <p className="mt-1 text-xs text-white/46">{event.camera_id}</p>
                          </div>
                          <div className="rounded-[1.2rem] border border-white/8 bg-black/15 p-4">
                            <div className="flex items-center gap-2 text-white/48">
                              <Clock3 className="h-4 w-4 text-amber-accent" />
                              <span className="text-[11px] uppercase tracking-[0.24em]">Seen</span>
                            </div>
                            <p className="mt-2 text-sm text-white">{event.location}</p>
                            <p className="mt-1 text-xs text-white/46">
                              {formatDistanceToNowStrict(new Date(event.timestamp), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-white/8 bg-black/12 p-5 lg:border-l lg:border-t-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.28em] text-white/40">Snapshot</p>
                        <p className="mt-2 text-sm text-white/60">Saved detection frame for evidence review.</p>
                      </div>
                      <History className="h-5 w-5 text-cyan-accent" />
                    </div>

                    <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#071117]">
                      {resolveAssetUrl(event.snapshot_image_url) ? (
                        <img
                          src={resolveAssetUrl(event.snapshot_image_url) || undefined}
                          alt={`${event.employee_name} snapshot`}
                          className="aspect-video w-full object-cover"
                        />
                      ) : (
                        <div className="flex aspect-video items-center justify-center px-6 text-center text-sm text-white/38">
                          No snapshot was saved for this event.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))}

            {!loading && filteredEvents.length === 0 && (
              <div className="rounded-[1.8rem] border border-white/10 bg-black/20 px-6 py-12 text-center text-sm text-white/48">
                No tracking events match the current filter.
              </div>
            )}

            {loading && (
              <div className="rounded-[1.8rem] border border-white/10 bg-black/20 px-6 py-12 text-center text-sm text-white/48">
                Loading tracking history...
              </div>
            )}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
