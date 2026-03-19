'use client'

import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'

import AppShell from '@/components/AppShell'
import ProtectedRoute from '@/components/ProtectedRoute'
import { employeeApi, resolveAssetUrl } from '@/lib/api'

export default function AddEmployeePage() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [name, setName] = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const [samples, setSamples] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [savedPreview, setSavedPreview] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
        if (!mounted) return
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
      } catch {
        toast.error('Webcam access is required to register an employee')
      }
    }

    startCamera()

    return () => {
      mounted = false
      streamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  function captureSample() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const context = canvas.getContext('2d')
    if (!context) return

    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
    setSamples((current) => (current.length >= 8 ? current : [...current, dataUrl]))
  }

  async function saveEmployee() {
    if (!name.trim() || !employeeId.trim()) {
      toast.error('Name and employee ID are required')
      return
    }
    if (samples.length < 5) {
      toast.error('Capture at least 5 samples before saving')
      return
    }

    setSaving(true)
    try {
      const { data } = await employeeApi.add({
        name: name.trim(),
        employee_id: employeeId.trim(),
        samples,
      })
      toast.success('Employee saved')
      setSavedPreview(resolveAssetUrl(data.preview_image_url))
      setName('')
      setEmployeeId('')
      setSamples([])
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Unable to save employee')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ProtectedRoute>
      <AppShell title="Add Employee" subtitle="Capture face samples from the webcam, generate embeddings, and store the employee profile.">
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl border border-white/10 bg-slate-panel p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm text-white/55">Employee name</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 outline-none placeholder:text-white/25"
                  placeholder="John Doe"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-white/55">Employee ID</span>
                <input
                  value={employeeId}
                  onChange={(event) => setEmployeeId(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 outline-none placeholder:text-white/25"
                  placeholder="EMP-001"
                />
              </label>
            </div>

            <div className="mt-5 overflow-hidden rounded-[2rem] border border-white/10 bg-black/30">
              <video ref={videoRef} className="aspect-video w-full object-cover" muted playsInline />
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={captureSample}
                className="rounded-2xl bg-cyan-accent px-4 py-3 font-semibold text-obsidian transition hover:brightness-110"
              >
                Capture sample
              </button>
              <button
                onClick={() => setSamples([])}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white/75 transition hover:bg-white/10"
              >
                Clear samples
              </button>
              <button
                onClick={saveEmployee}
                disabled={saving}
                className="rounded-2xl border border-emerald-400/30 bg-emerald-400/15 px-4 py-3 text-emerald-100 transition hover:bg-emerald-400/20 disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save employee'}
              </button>
            </div>

            <p className="mt-4 text-sm text-white/55">
              Capture at least 5 clear samples with the full face visible. The backend stores embeddings and one preview image.
            </p>
          </section>

          <section className="rounded-3xl border border-white/10 bg-slate-panel p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Captured samples</h3>
              <span className={`rounded-full px-3 py-1 text-xs ${samples.length >= 5 ? 'bg-cyan-accent text-obsidian' : 'bg-white/10 text-white/65'}`}>
                {samples.length}/5 minimum
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {samples.map((sample, index) => (
                <img key={`${sample}-${index}`} src={sample} alt={`Sample ${index + 1}`} className="aspect-square rounded-2xl object-cover" />
              ))}
              {samples.length === 0 && (
                <div className="col-span-full rounded-3xl border border-dashed border-white/10 p-8 text-center text-sm text-white/45">
                  No samples captured yet.
                </div>
              )}
            </div>

            {savedPreview && (
              <div className="mt-6 rounded-3xl border border-cyan-accent/25 bg-black/20 p-4">
                <p className="text-sm text-white/65">Latest saved preview</p>
                <img src={savedPreview} alt="Saved employee preview" className="mt-3 h-48 w-48 rounded-3xl object-cover" />
              </div>
            )}
          </section>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </AppShell>
    </ProtectedRoute>
  )
}
