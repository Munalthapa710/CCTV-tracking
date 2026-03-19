'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'

import AppShell from '@/components/AppShell'
import CameraPanel from '@/components/CameraPanel'
import ProtectedRoute from '@/components/ProtectedRoute'
import { cameraApi, CameraStatus, employeeApi, EmployeeCard, findApi, resolveAssetUrl } from '@/lib/api'

export default function FindEmployeePage() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const syncTimerRef = useRef<number | null>(null)

  const [employees, setEmployees] = useState<EmployeeCard[]>([])
  const [query, setQuery] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeCard | null>(null)
  const [cameras, setCameras] = useState<CameraStatus[]>([])
  const [localPreviews, setLocalPreviews] = useState<Record<string, string>>({})
  const [finding, setFinding] = useState(false)
  const [resultMessage, setResultMessage] = useState<string | null>(null)

  useEffect(() => {
    async function bootstrap() {
      try {
        const [{ data: employeeData }, { data: cameraData }] = await Promise.all([employeeApi.list(), cameraApi.list()])
        setEmployees(employeeData.employees)
        setCameras(cameraData.cameras)
      } catch {
        toast.error('Failed to load search data')
      }
    }

    bootstrap()
  }, [])

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
        syncTimerRef.current = window.setInterval(() => {
          void syncCameraFrames()
        }, 2000)
      } catch {
        toast.error('Camera access is required to scan feeds')
      }
    }

    startCamera()

    return () => {
      mounted = false
      if (syncTimerRef.current) window.clearInterval(syncTimerRef.current)
      streamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  const filteredEmployees = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return employees
    return employees.filter(
      (employee) =>
        employee.name.toLowerCase().includes(normalized) ||
        employee.employee_id.toLowerCase().includes(normalized)
    )
  }, [employees, query])

  async function syncCameraFrames() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.videoWidth === 0 || video.videoHeight === 0) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const context = canvas.getContext('2d')
    if (!context) return

    const browserCameras = cameras.filter((camera) => camera.source_type === 'browser')
    const frames = browserCameras.map((camera, index) => ({
      camera_id: camera.camera_id,
      image: renderVariantFrame(video, canvas, context, index),
    }))

    if (frames.length === 0) return

    setLocalPreviews(
      frames.reduce<Record<string, string>>((accumulator, frame) => {
        accumulator[frame.camera_id] = frame.image
        return accumulator
      }, {})
    )

    try {
      await cameraApi.sync(frames)
      const { data } = await cameraApi.list()
      setCameras(data.cameras)
    } catch {
      // keep page usable if a sync cycle fails
    }
  }

  function renderVariantFrame(
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D,
    variantIndex: number
  ) {
    context.save()
    context.clearRect(0, 0, canvas.width, canvas.height)

    if (variantIndex === 1) {
      context.translate(canvas.width, 0)
      context.scale(-1, 1)
      context.filter = 'contrast(1.1) saturate(1.1) hue-rotate(15deg)'
    } else if (variantIndex === 2) {
      context.filter = 'grayscale(0.15) sepia(0.15) brightness(1.05)'
    } else {
      context.filter = 'none'
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    context.restore()
    return canvas.toDataURL('image/jpeg', 0.88)
  }

  async function handleFind() {
    if (!selectedEmployee) {
      toast.error('Select an employee first')
      return
    }

    setFinding(true)
    setResultMessage(null)

    try {
      await syncCameraFrames()
      const { data } = await findApi.find(selectedEmployee.employee_id)
      setCameras(data.cameras)
      setResultMessage(data.message)
      if (data.found) {
        toast.success(data.message)
      } else {
        toast.error(data.message)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Find request failed')
    } finally {
      setFinding(false)
    }
  }

  return (
    <ProtectedRoute>
      <AppShell title="Find Employee" subtitle="Search by employee name or ID, sync the live camera grid, and locate the best match.">
        <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
          <section className="rounded-3xl border border-white/10 bg-slate-panel p-6">
            <label className="block">
              <span className="mb-2 block text-sm text-white/55">Search employee</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 outline-none placeholder:text-white/25"
                placeholder="Search by name or employee ID"
              />
            </label>

            <div className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">
              {filteredEmployees.map((employee) => (
                <button
                  key={employee.employee_id}
                  onClick={() => setSelectedEmployee(employee)}
                  className={`flex w-full items-center gap-4 rounded-2xl border px-4 py-3 text-left transition ${
                    selectedEmployee?.employee_id === employee.employee_id
                      ? 'border-cyan-accent bg-cyan-accent/10'
                      : 'border-white/10 bg-black/20 hover:bg-white/5'
                  }`}
                >
                  {resolveAssetUrl(employee.preview_image_url) ? (
                    <img
                      src={resolveAssetUrl(employee.preview_image_url) || undefined}
                      alt={employee.name}
                      className="h-14 w-14 rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-xs text-white/60">
                      No photo
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-white">{employee.name}</p>
                    <p className="text-sm text-white/55">{employee.employee_id}</p>
                  </div>
                </button>
              ))}
            </div>

            {selectedEmployee && (
              <div className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-white/45">Selected employee</p>
                <div className="mt-4 flex items-center gap-4">
                  {resolveAssetUrl(selectedEmployee.preview_image_url) ? (
                    <img
                      src={resolveAssetUrl(selectedEmployee.preview_image_url) || undefined}
                      alt={selectedEmployee.name}
                      className="h-20 w-20 rounded-3xl object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10 text-xs text-white/60">
                      No photo
                    </div>
                  )}
                  <div>
                    <p className="text-lg font-semibold text-white">{selectedEmployee.name}</p>
                    <p className="text-sm text-white/55">{selectedEmployee.employee_id}</p>
                  </div>
                </div>

                <button
                  onClick={handleFind}
                  disabled={finding}
                  className="mt-5 w-full rounded-2xl bg-cyan-accent px-4 py-3 font-semibold text-obsidian transition hover:brightness-110 disabled:opacity-60"
                >
                  {finding ? 'Finding...' : 'Find'}
                </button>
              </div>
            )}

            {resultMessage && (
              <div className="mt-4 rounded-3xl border border-cyan-accent/25 bg-cyan-accent/10 p-4 text-sm text-white">
                {resultMessage}
              </div>
            )}
          </section>

          <section className="space-y-5">
            <div className="rounded-3xl border border-white/10 bg-slate-panel p-4">
              <video ref={videoRef} className="aspect-video w-full rounded-[1.6rem] object-cover" muted playsInline />
              <p className="mt-3 text-sm text-white/55">
                Browser cameras use the local webcam feed. Network CCTV cameras use their configured stream URL on the backend.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {cameras.map((camera) => (
                <CameraPanel key={camera.camera_id} camera={camera} fallbackPreview={localPreviews[camera.camera_id]} />
              ))}
            </div>
          </section>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </AppShell>
    </ProtectedRoute>
  )
}
