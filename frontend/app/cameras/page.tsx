'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Cable, CheckCircle2, PencilLine, Plus, Power, RadioTower, Smartphone, TestTube2, Trash2 } from 'lucide-react'

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
  const [busyCameraId, setBusyCameraId] = useState<string | null>(null)

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

  async function handleToggleCamera(camera: CameraStatus) {
    setBusyCameraId(camera.camera_id)
    try {
      await cameraApi.setActive(camera.camera_id, !camera.is_active)
      toast.success(camera.is_active ? 'Camera disabled' : 'Camera enabled')
      if (editingCameraId === camera.camera_id) {
        setForm((current) => ({ ...current, is_active: !camera.is_active }))
      }
      await loadCameras()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update camera')
    } finally {
      setBusyCameraId(null)
    }
  }

  async function handleDeleteCamera(camera: CameraStatus) {
    const confirmed = window.confirm(`Delete camera "${camera.display_name}"?`)
    if (!confirmed) return

    setBusyCameraId(camera.camera_id)
    try {
      await cameraApi.delete(camera.camera_id)
      if (editingCameraId === camera.camera_id) {
        cancelEditing()
      }
      toast.success('Camera deleted')
      await loadCameras()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to delete camera')
    } finally {
      setBusyCameraId(null)
    }
  }

  return (
    <ProtectedRoute>
      <AppShell title="Manage Cameras" subtitle="Add mobile, browser, and network CCTV feeds with guided setup, testing, inline editing, and lifecycle controls.">
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="space-y-6">
            <div className="glass-panel rounded-[2rem] p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-[1.2rem] bg-[linear-gradient(135deg,rgba(255,154,92,0.22),rgba(255,211,111,0.18))] text-cyan-accent">
                  {editingCameraId ? <PencilLine className="h-7 w-7" /> : <Plus className="h-7 w-7" />}
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.34em] text-white/40">{editingCameraId ? 'Edit Mode' : 'New Camera'}</p>
                  <h3 className="text-xl font-semibold text-white">{editingCameraId ? 'Update camera configuration' : 'Register a camera feed'}</h3>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
                  <div className="flex items-center gap-2 text-cyan-accent">
                    <Smartphone className="h-4 w-4" />
                    <span className="text-xs uppercase tracking-[0.24em]">Mobile</span>
                  </div>
                  <p className="mt-2 text-sm text-white/62">Use DroidCam or similar apps over local Wi-Fi.</p>
                </div>
                <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
                  <div className="flex items-center gap-2 text-sky-accent">
                    <RadioTower className="h-4 w-4" />
                    <span className="text-xs uppercase tracking-[0.24em]">Network</span>
                  </div>
                  <p className="mt-2 text-sm text-white/62">Supports RTSP, MJPEG, and other OpenCV-readable URLs.</p>
                </div>
                <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
                  <div className="flex items-center gap-2 text-amber-accent">
                    <Cable className="h-4 w-4" />
                    <span className="text-xs uppercase tracking-[0.24em]">Browser</span>
                  </div>
                  <p className="mt-2 text-sm text-white/62">Bind a local browser feed for interactive testing from the Find page.</p>
                </div>
              </div>

              <div className="mt-5 rounded-[1.8rem] border border-cyan-accent/18 bg-cyan-accent/10 p-5">
                <p className="text-sm font-medium text-white">iPhone DroidCam quick setup</p>
                <p className="mt-2 text-sm leading-6 text-white/74">
                  If DroidCam shows WiFi IP <span className="font-medium text-white">192.168.1.71</span> and port <span className="font-medium text-white">4747</span>, the most common first URL is:
                </p>
                <p className="mt-3 rounded-[1rem] bg-black/20 px-3 py-3 font-mono text-sm text-cyan-accent">
                  http://192.168.1.71:4747/video
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => applyDroidCamTemplate('video')} className="rounded-[1rem] border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 transition hover:bg-white/10">
                    Use `/video`
                  </button>
                  <button type="button" onClick={() => applyDroidCamTemplate('mjpegfeed')} className="rounded-[1rem] border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 transition hover:bg-white/10">
                    Use `/mjpegfeed`
                  </button>
                  <button type="button" onClick={() => applyDroidCamTemplate('shot.jpg')} className="rounded-[1rem] border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 transition hover:bg-white/10">
                    Use `/shot.jpg`
                  </button>
                </div>
                <p className="mt-4 text-xs leading-5 text-white/62">
                  If all three URLs fail, the iPhone app is probably not exposing a real MJPEG/RTSP stream for OpenCV. In that case, use browser camera mode, the official DroidCam desktop client, or a different IP camera app.
                </p>
              </div>

              <form onSubmit={handleSubmitCamera} className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm text-white/55">Camera ID</span>
                    <input
                      value={form.camera_id}
                      onChange={(event) => setForm((current) => ({ ...current, camera_id: event.target.value }))}
                      className="w-full rounded-[1.2rem] border border-white/10 bg-black/20 px-4 py-3 outline-none"
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
                      className="w-full rounded-[1.2rem] border border-white/10 bg-black/20 px-4 py-3 outline-none"
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
                      className="w-full rounded-[1.2rem] border border-white/10 bg-black/20 px-4 py-3 outline-none"
                      placeholder="Main Lobby"
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm text-white/55">Source type</span>
                    <select
                      value={form.source_type}
                      onChange={(event) => setForm((current) => ({ ...current, source_type: event.target.value }))}
                      className="w-full rounded-[1.2rem] border border-white/10 bg-black/20 px-4 py-3 outline-none"
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
                    className="w-full rounded-[1.2rem] border border-white/10 bg-black/20 px-4 py-3 outline-none"
                    placeholder={form.source_type === 'network' ? 'http://192.168.1.71:4747/video or rtsp://user:pass@ip:554/stream' : 'Leave empty for browser cameras'}
                    disabled={form.source_type === 'browser'}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm text-white/55">Notes</span>
                  <textarea
                    value={form.notes}
                    onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                    className="min-h-[110px] w-full rounded-[1.2rem] border border-white/10 bg-black/20 px-4 py-3 outline-none"
                    placeholder="Installation note, floor, NVR info, or stream hint"
                  />
                </label>

                <label className="flex items-center gap-3 rounded-[1.2rem] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/75">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))}
                  />
                  Camera is active
                </label>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => runCameraTest()}
                    disabled={testing}
                    className="rounded-[1.2rem] border border-amber-300/25 bg-amber-300/10 px-5 py-3 text-white transition hover:bg-amber-300/16 disabled:opacity-60"
                  >
                    <span className="inline-flex items-center gap-2">
                      <TestTube2 className="h-4 w-4" />
                      {testing ? 'Testing...' : 'Test connection'}
                    </span>
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 rounded-[1.2rem] bg-[linear-gradient(135deg,#ff9a5c,#ffd36f)] px-5 py-3 font-semibold text-obsidian transition hover:brightness-105 disabled:opacity-60"
                  >
                    {saving ? 'Saving...' : editingCameraId ? 'Save changes' : 'Add camera'}
                  </button>
                  {editingCameraId && (
                    <button
                      type="button"
                      onClick={cancelEditing}
                      className="rounded-[1.2rem] border border-white/10 bg-white/5 px-5 py-3 text-white/78 transition hover:bg-white/10"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              {testResult && (
                <div className={`mt-5 rounded-[1.8rem] border p-5 text-sm ${
                  testResult.connected ? 'border-emerald-300/25 bg-emerald-300/10 text-white' : 'border-rose-300/25 bg-rose-300/10 text-white'
                }`}>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5" />
                    <p className="font-medium">{testResult.connected ? 'Camera test passed' : 'Camera test failed'}</p>
                  </div>
                  <p className="mt-2 text-white/82">{testResult.message}</p>
                  <p className="mt-1 text-white/68">Face detected in preview: {testResult.face_detected ? 'Yes' : 'No'}</p>
                  {testResult.preview_image && (
                    <img
                      src={testResult.preview_image}
                      alt="Camera test preview"
                      className="mt-4 h-56 w-full rounded-[1.6rem] object-cover"
                    />
                  )}
                </div>
              )}
            </div>
          </section>

          <section className="space-y-5">
            <div className="glass-panel rounded-[2rem] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.34em] text-white/40">Camera Registry</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">Registered camera feeds</h3>
                  <p className="mt-2 text-sm leading-6 text-white/56">Every connected feed with current preview, stream details, and quick edit, test, enable, or delete actions.</p>
                </div>
                <button
                  onClick={loadCameras}
                  className="rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/78 transition hover:bg-white/10"
                >
                  Refresh
                </button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {cameras.map((camera) => (
                <div key={camera.camera_id} className="space-y-3">
                  <CameraPanel camera={camera} />
                  <div className="panel-soft rounded-[1.8rem] p-4 text-sm text-white/66">
                    <p><span className="text-white">Type:</span> {camera.source_type}</p>
                    <p><span className="text-white">Location:</span> {camera.location}</p>
                    <p><span className="text-white">Active:</span> {camera.is_active ? 'Yes' : 'No'}</p>
                    <p><span className="text-white">URL:</span> {camera.source_url || 'Browser-managed source'}</p>
                    <p><span className="text-white">Notes:</span> {camera.notes || 'None'}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => startEditing(camera)}
                        className="rounded-[1rem] border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/82 transition hover:bg-white/10"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => runCameraTest(camera.source_type, camera.source_url || '')}
                        className="rounded-[1rem] border border-amber-300/25 bg-amber-300/10 px-4 py-2 text-sm text-white transition hover:bg-amber-300/16"
                      >
                        Test
                      </button>
                      <button
                        onClick={() => handleToggleCamera(camera)}
                        disabled={busyCameraId === camera.camera_id}
                        className="rounded-[1rem] border border-cyan-accent/20 bg-cyan-accent/10 px-4 py-2 text-sm text-white transition hover:bg-cyan-accent/16 disabled:opacity-60"
                      >
                        <span className="inline-flex items-center gap-2">
                          <Power className="h-4 w-4" />
                          {camera.is_active ? 'Disable' : 'Enable'}
                        </span>
                      </button>
                      <button
                        onClick={() => handleDeleteCamera(camera)}
                        disabled={busyCameraId === camera.camera_id}
                        className="rounded-[1rem] border border-rose-300/25 bg-rose-300/10 px-4 py-2 text-sm text-white transition hover:bg-rose-300/16 disabled:opacity-60"
                      >
                        <span className="inline-flex items-center gap-2">
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </span>
                      </button>
                    </div>
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
