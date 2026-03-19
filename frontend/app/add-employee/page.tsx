'use client'

import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Camera, CheckCircle2, ScanFace, Trash2, UserRound } from 'lucide-react'

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
      <AppShell title="Add Employee" subtitle="Capture a clean face set, generate embeddings, and build a reliable employee identity profile.">
        <div className="grid gap-6 2xl:grid-cols-[1.12fr_0.88fr]">
          <section className="glass-panel rounded-[2rem] p-6">
            <div className="grid gap-4">
              <div className="panel-soft min-w-0 rounded-[1.8rem] p-5">
                <p className="text-[11px] uppercase tracking-[0.34em] text-white/40">Profile Setup</p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm text-white/55">Employee name</span>
                    <div className="flex items-center gap-3 rounded-[1.2rem] border border-white/10 bg-black/20 px-4 py-3">
                      <UserRound className="h-4 w-4 text-cyan-accent" />
                      <input
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        className="w-full bg-transparent outline-none placeholder:text-white/25"
                        placeholder="John Doe"
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm text-white/55">Employee ID</span>
                    <div className="flex items-center gap-3 rounded-[1.2rem] border border-white/10 bg-black/20 px-4 py-3">
                      <ScanFace className="h-4 w-4 text-sky-accent" />
                      <input
                        value={employeeId}
                        onChange={(event) => setEmployeeId(event.target.value)}
                        className="w-full bg-transparent outline-none placeholder:text-white/25"
                        placeholder="EMP-001"
                      />
                    </div>
                  </label>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  <div className="min-w-0 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                    <p className="text-[11px] uppercase tracking-[0.28em] text-white/40">Minimum</p>
                    <p className="mt-2 text-2xl font-semibold text-white">5</p>
                    <p className="mt-1 text-sm text-white/55">Required samples</p>
                  </div>
                  <div className="min-w-0 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                    <p className="text-[11px] uppercase tracking-[0.28em] text-white/40">Captured</p>
                    <p className="mt-2 text-2xl font-semibold text-cyan-accent">{samples.length}</p>
                    <p className="mt-1 text-sm text-white/55">Current session</p>
                  </div>
                  <div className="min-w-0 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                    <p className="text-[11px] uppercase tracking-[0.28em] text-white/40">Status</p>
                    <p className="mt-2 text-base font-semibold text-white">{samples.length >= 5 ? 'Ready to save' : 'Capture more'}</p>
                    <p className="mt-1 break-words text-sm leading-5 text-white/55">Clear face, centered frame</p>
                  </div>
                </div>
              </div>

              <div className="min-w-0 overflow-hidden rounded-[1.8rem] border border-white/10 bg-black/25">
                <div className="flex items-center justify-between border-b border-white/8 px-4 py-4">
                  <div>
                    <p className="text-sm font-semibold text-white">Live capture</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.24em] text-white/38">Webcam feed</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.06] text-cyan-accent">
                    <Camera className="h-5 w-5" />
                  </div>
                </div>
                <video ref={videoRef} className="aspect-video w-full object-cover" muted playsInline />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={captureSample}
                className="rounded-[1.2rem] bg-[linear-gradient(135deg,#52f2d0,#7cc7ff)] px-5 py-3 font-semibold text-obsidian transition hover:brightness-105"
              >
                Capture sample
              </button>
              <button
                onClick={() => setSamples([])}
                className="rounded-[1.2rem] border border-white/10 bg-white/5 px-5 py-3 text-white/78 transition hover:bg-white/10"
              >
                <span className="inline-flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Clear samples
                </span>
              </button>
              <button
                onClick={saveEmployee}
                disabled={saving}
                className="rounded-[1.2rem] border border-emerald-300/25 bg-emerald-300/12 px-5 py-3 font-medium text-emerald-100 transition hover:bg-emerald-300/18 disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save employee'}
              </button>
            </div>

            <p className="mt-4 text-sm leading-6 text-white/56">
              Capture front-facing samples with slight angle and lighting variation. The backend stores embeddings plus a preview image for quick review.
            </p>
          </section>

          <section className="space-y-6">
            <div className="glass-panel rounded-[2rem] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.34em] text-white/40">Sample Strip</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">Captured frames</h3>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${samples.length >= 5 ? 'bg-[linear-gradient(135deg,#52f2d0,#7cc7ff)] text-obsidian' : 'bg-white/10 text-white/65'}`}>
                  {samples.length}/5 minimum
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {samples.map((sample, index) => (
                  <img key={`${sample}-${index}`} src={sample} alt={`Sample ${index + 1}`} className="aspect-square rounded-[1.3rem] border border-white/8 object-cover" />
                ))}

                {samples.length === 0 && (
                  <div className="col-span-full rounded-[1.8rem] border border-dashed border-white/10 bg-black/20 p-10 text-center text-sm text-white/44">
                    No samples captured yet.
                  </div>
                )}
              </div>
            </div>

            <div className="panel-soft rounded-[2rem] p-6">
              <p className="text-[11px] uppercase tracking-[0.34em] text-white/40">Saved Preview</p>
              {savedPreview ? (
                <div className="mt-4">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-300/12 px-3 py-1 text-xs text-emerald-100">
                    <CheckCircle2 className="h-4 w-4" />
                    Latest registration stored
                  </div>
                  <img src={savedPreview} alt="Saved employee preview" className="h-60 w-full rounded-[1.8rem] object-cover" />
                </div>
              ) : (
                <p className="mt-4 text-sm leading-6 text-white/56">
                  After saving, the best preview image appears here so you can confirm the registered identity at a glance.
                </p>
              )}
            </div>
          </section>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </AppShell>
    </ProtectedRoute>
  )
}
