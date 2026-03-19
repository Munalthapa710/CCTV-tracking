'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

import AppShell from '@/components/AppShell'
import CameraPanel from '@/components/CameraPanel'
import ProtectedRoute from '@/components/ProtectedRoute'
import { cameraApi, CameraStatus } from '@/lib/api'

const initialForm = {
  camera_id: '',
  display_name: '',
  location: '',
  source_type: 'network',
  source_url: '',
  notes: '',
  is_active: true,
}

export default function CamerasPage() {
  const [cameras, setCameras] = useState<CameraStatus[]>([])
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)

  async function loadCameras() {
    try {
      const { data } = await cameraApi.list()
      setCameras(data.cameras)
    } catch {
      toast.error('Failed to load cameras')
    }
  }

  useEffect(() => {
    loadCameras()
    const timer = window.setInterval(loadCameras, 4000)
    return () => window.clearInterval(timer)
  }, [])

  async function handleCreateCamera(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    try {
      await cameraApi.create({
        ...form,
        source_url: form.source_url || null,
        notes: form.notes || null,
      })
      toast.success('Camera added')
      setForm(initialForm)
      await loadCameras()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to add camera')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ProtectedRoute>
      <AppShell title="Manage Cameras" subtitle="Register browser cameras or CCTV stream sources for live employee tracking.">
        <div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
          <section className="rounded-3xl border border-white/10 bg-slate-panel p-6">
            <h3 className="text-lg font-semibold">Add camera</h3>
            <p className="mt-2 text-sm text-white/55">
              Use <span className="text-white">browser</span> for local webcam-backed camera slots or <span className="text-white">network</span> for CCTV URLs. For network cameras, use an OpenCV-readable source such as RTSP, HTTP MJPEG, or a direct video stream URL.
            </p>

            <form onSubmit={handleCreateCamera} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm text-white/55">Camera ID</span>
                  <input
                    value={form.camera_id}
                    onChange={(event) => setForm((current) => ({ ...current, camera_id: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 outline-none"
                    placeholder="cam-lobby"
                    required
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm text-white/55">Display name</span>
                  <input
                    value={form.display_name}
                    onChange={(event) => setForm((current) => ({ ...current, display_name: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 outline-none"
                    placeholder="Lobby Camera"
                    required
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm text-white/55">Location</span>
                  <input
                    value={form.location}
                    onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 outline-none"
                    placeholder="Main Lobby"
                    required
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm text-white/55">Source type</span>
                  <select
                    value={form.source_type}
                    onChange={(event) => setForm((current) => ({ ...current, source_type: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 outline-none"
                  >
                    <option value="network">Network CCTV</option>
                    <option value="browser">Browser webcam slot</option>
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm text-white/55">Source URL</span>
                <input
                  value={form.source_url}
                  onChange={(event) => setForm((current) => ({ ...current, source_url: event.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 outline-none"
                  placeholder={form.source_type === 'network' ? 'rtsp://user:pass@ip:554/stream' : 'Leave empty for browser cameras'}
                  disabled={form.source_type === 'browser'}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-white/55">Notes</span>
                <textarea
                  value={form.notes}
                  onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                  className="min-h-[96px] w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 outline-none"
                  placeholder="Optional installation note, floor, NVR info, or stream hint"
                />
              </label>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-2xl bg-cyan-accent px-4 py-3 font-semibold text-obsidian transition hover:brightness-110 disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Add camera'}
              </button>
            </form>
          </section>

          <section className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-slate-panel p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Registered cameras</h3>
                  <p className="mt-1 text-sm text-white/55">Latest previews and source configuration.</p>
                </div>
                <button
                  onClick={loadCameras}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10"
                >
                  Refresh
                </button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {cameras.map((camera) => (
                <div key={camera.camera_id} className="space-y-3">
                  <CameraPanel camera={camera} />
                  <div className="rounded-3xl border border-white/10 bg-slate-panel p-4 text-sm text-white/65">
                    <p><span className="text-white">Type:</span> {camera.source_type}</p>
                    <p><span className="text-white">Location:</span> {camera.location}</p>
                    <p><span className="text-white">URL:</span> {camera.source_url || 'Browser-managed source'}</p>
                    <p><span className="text-white">Notes:</span> {camera.notes || 'None'}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
