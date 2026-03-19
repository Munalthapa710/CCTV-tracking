'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

import AppShell from '@/components/AppShell'
import CameraPanel from '@/components/CameraPanel'
import ProtectedRoute from '@/components/ProtectedRoute'
import { cameraApi, CameraStatus, CameraTestResult } from '@/lib/api'

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
  const [editingCameraId, setEditingCameraId] = useState<string | null>(null)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<CameraTestResult | null>(null)

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

  async function handleSubmitCamera(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalizedUrl = form.source_url.trim()

    if (form.source_type === 'network') {
      if (!normalizedUrl) {
        toast.error('Source URL is required for network cameras')
        return
      }

      if (normalizedUrl.includes('WIFI_IP') || normalizedUrl.includes('YOUR_IP')) {
        toast.error('Replace the placeholder with the actual phone or camera IP address')
        return
      }
    }

    setSaving(true)
    try {
      if (editingCameraId) {
        await cameraApi.update(editingCameraId, {
          display_name: form.display_name,
          location: form.location,
          source_type: form.source_type,
          source_url: normalizedUrl || null,
          notes: form.notes || null,
          is_active: form.is_active,
        })
        toast.success('Camera updated')
      } else {
        await cameraApi.create({
          ...form,
          source_url: normalizedUrl || null,
          notes: form.notes || null,
        })
        toast.success('Camera added')
      }
      setForm(initialForm)
      setEditingCameraId(null)
      setTestResult(null)
      await loadCameras()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to save camera')
    } finally {
      setSaving(false)
    }
  }

  function startEditing(camera: CameraStatus) {
    setEditingCameraId(camera.camera_id)
    setTestResult(null)
    setForm({
      camera_id: camera.camera_id,
      display_name: camera.display_name,
      location: camera.location,
      source_type: camera.source_type,
      source_url: camera.source_url || '',
      notes: camera.notes || '',
      is_active: camera.is_active,
    })
  }

  function cancelEditing() {
    setEditingCameraId(null)
    setForm(initialForm)
    setTestResult(null)
  }

  function applyDroidCamTemplate(path: 'video' | 'mjpegfeed' | 'shot.jpg') {
    const currentUrl = form.source_url.trim()
    const match = currentUrl.match(/^(https?:\/\/)?([^/:]+)(?::(\d+))?/i)
    const host = match?.[2] || '192.168.1.71'
    const port = match?.[3] || '4747'
    const protocol = match?.[1] || 'http://'

    setForm((current) => ({
      ...current,
      source_type: 'network',
      source_url: `${protocol}${host}:${port}/${path}`,
    }))
  }

  async function runCameraTest(sourceType = form.source_type, sourceUrl = form.source_url) {
    const normalizedUrl = sourceUrl.trim()
    if (sourceType === 'network' && !normalizedUrl) {
      toast.error('Enter a source URL before testing')
      return
    }

    setTesting(true)
    setTestResult(null)
    try {
      const { data } = await cameraApi.test({
        source_type: sourceType,
        source_url: normalizedUrl || null,
      })
      setTestResult(data)
      if (data.connected) {
        toast.success(data.message)
      } else {
        toast.error(data.message)
      }
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Camera test failed'
      toast.error(message)
      setTestResult({
        connected: false,
        message,
        preview_image: null,
        face_detected: false,
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <ProtectedRoute>
      <AppShell title="Manage Cameras" subtitle="Register browser cameras or CCTV stream sources for live employee tracking.">
        <div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
          <section className="rounded-3xl border border-white/10 bg-slate-panel p-6">
            <h3 className="text-lg font-semibold">{editingCameraId ? 'Edit camera' : 'Add camera'}</h3>
            <p className="mt-2 text-sm text-white/55">
              Use <span className="text-white">browser</span> for local webcam-backed camera slots or <span className="text-white">network</span> for CCTV URLs. For network cameras, use an OpenCV-readable source such as RTSP, HTTP MJPEG, or a direct video stream URL.
            </p>

            <div className="mt-4 rounded-3xl border border-cyan-accent/20 bg-cyan-accent/10 p-4 text-sm text-white/80">
              <p className="font-medium text-white">iPhone DroidCam quick setup</p>
              <p className="mt-2">
                If DroidCam shows WiFi IP <span className="text-white">192.168.1.71</span> and port <span className="text-white">4747</span>, the usual first URL is:
              </p>
              <p className="mt-2 rounded-2xl bg-black/20 px-3 py-2 font-mono text-cyan-accent">
                http://192.168.1.71:4747/video
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => applyDroidCamTemplate('video')}
                  className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 transition hover:bg-white/10"
                >
                  Use `/video`
                </button>
                <button
                  type="button"
                  onClick={() => applyDroidCamTemplate('mjpegfeed')}
                  className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 transition hover:bg-white/10"
                >
                  Use `/mjpegfeed`
                </button>
                <button
                  type="button"
                  onClick={() => applyDroidCamTemplate('shot.jpg')}
                  className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 transition hover:bg-white/10"
                >
                  Use `/shot.jpg`
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmitCamera} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm text-white/55">Camera ID</span>
                  <input
                    value={form.camera_id}
                    onChange={(event) => setForm((current) => ({ ...current, camera_id: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 outline-none"
                    placeholder="cam-lobby"
                    required
                    disabled={editingCameraId !== null}
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
                  placeholder={form.source_type === 'network' ? 'http://192.168.1.71:4747/video or rtsp://user:pass@ip:554/stream' : 'Leave empty for browser cameras'}
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

              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/75">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))}
                />
                Camera is active
              </label>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => runCameraTest()}
                  disabled={testing}
                  className="rounded-2xl border border-amber-300/25 bg-amber-300/10 px-4 py-3 text-white transition hover:bg-amber-300/15 disabled:opacity-60"
                >
                  {testing ? 'Testing...' : 'Test connection'}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-2xl bg-cyan-accent px-4 py-3 font-semibold text-obsidian transition hover:brightness-110 disabled:opacity-60"
                >
                  {saving ? 'Saving...' : editingCameraId ? 'Save changes' : 'Add camera'}
                </button>
                {editingCameraId && (
                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white/75 transition hover:bg-white/10"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            {testResult && (
              <div className={`mt-5 rounded-3xl border p-4 text-sm ${testResult.connected ? 'border-emerald-400/25 bg-emerald-400/10 text-white' : 'border-rose-400/25 bg-rose-400/10 text-white'}`}>
                <p className="font-medium">{testResult.connected ? 'Camera test passed' : 'Camera test failed'}</p>
                <p className="mt-1 text-white/80">{testResult.message}</p>
                <p className="mt-1 text-white/70">
                  Face detected in preview: {testResult.face_detected ? 'Yes' : 'No'}
                </p>
                {testResult.preview_image && (
                  <img
                    src={testResult.preview_image}
                    alt="Camera test preview"
                    className="mt-3 h-48 w-full rounded-2xl object-cover"
                  />
                )}
              </div>
            )}
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
                    <p><span className="text-white">Active:</span> {camera.is_active ? 'Yes' : 'No'}</p>
                    <p><span className="text-white">URL:</span> {camera.source_url || 'Browser-managed source'}</p>
                    <p><span className="text-white">Notes:</span> {camera.notes || 'None'}</p>
                    <button
                      onClick={() => startEditing(camera)}
                      className="mt-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => runCameraTest(camera.source_type, camera.source_url || '')}
                      className="ml-2 mt-3 rounded-2xl border border-amber-300/25 bg-amber-300/10 px-4 py-2 text-sm text-white transition hover:bg-amber-300/15"
                    >
                      Test
                    </button>
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
