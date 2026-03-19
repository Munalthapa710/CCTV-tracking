'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Radar, Search, UserRound, Video } from 'lucide-react'

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
  }, [cameras])

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

  const highlightedCount = cameras.filter((camera) => camera.highlighted).length

  return (
    <ProtectedRoute>
      <AppShell title="Find Employee" subtitle="Run a guided search across all connected cameras and surface the strongest live match.">
        <div className="grid gap-6 xl:grid-cols-[0.84fr_1.16fr]">
          <section className="space-y-6">
            <div className="glass-panel rounded-[2rem] p-6">
              <p className="text-[11px] uppercase tracking-[0.34em] text-white/40">Search Panel</p>
              <div className="mt-4 flex items-center gap-3 rounded-[1.2rem] border border-white/10 bg-black/20 px-4 py-3">
                <Search className="h-4 w-4 text-cyan-accent" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="w-full bg-transparent outline-none placeholder:text-white/25"
                  placeholder="Search by name or employee ID"
                />
              </div>

              <div className="mt-5 max-h-72 space-y-3 overflow-y-auto pr-1">
                {filteredEmployees.map((employee) => (
                  <button
                    key={employee.employee_id}
                    onClick={() => setSelectedEmployee(employee)}
                    className={`flex w-full items-center gap-4 rounded-[1.4rem] border px-4 py-3 text-left transition ${
                      selectedEmployee?.employee_id === employee.employee_id
                        ? 'border-cyan-accent/45 bg-cyan-accent/10 shadow-[0_12px_34px_rgba(255,154,92,0.08)]'
                        : 'border-white/10 bg-black/20 hover:bg-white/[0.04]'
                    }`}
                  >
                    {resolveAssetUrl(employee.preview_image_url) ? (
                      <img
                        src={resolveAssetUrl(employee.preview_image_url) || undefined}
                        alt={employee.name}
                        className="h-14 w-14 rounded-[1rem] border border-white/8 object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-[1rem] bg-white/10 text-xs text-white/60">
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
            </div>

            <div className="panel-soft rounded-[2rem] p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] bg-[linear-gradient(135deg,rgba(255,154,92,0.22),rgba(255,211,111,0.16))] text-cyan-accent">
                  <UserRound className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.32em] text-white/40">Selected Target</p>
                  <p className="text-lg font-semibold text-white">{selectedEmployee ? selectedEmployee.name : 'Choose an employee'}</p>
                </div>
              </div>

              {selectedEmployee ? (
                <div className="mt-5">
                  <div className="flex items-center gap-4">
                    {resolveAssetUrl(selectedEmployee.preview_image_url) ? (
                      <img
                        src={resolveAssetUrl(selectedEmployee.preview_image_url) || undefined}
                        alt={selectedEmployee.name}
                        className="h-24 w-24 rounded-[1.4rem] border border-white/10 object-cover"
                      />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-[1.4rem] bg-white/10 text-xs text-white/60">
                        No photo
                      </div>
                    )}
                    <div>
                      <p className="text-xl font-semibold text-white">{selectedEmployee.name}</p>
                      <p className="mt-1 text-sm text-white/55">{selectedEmployee.employee_id}</p>
                    </div>
                  </div>

                  <button
                    onClick={handleFind}
                    disabled={finding}
                    className="mt-6 w-full rounded-[1.2rem] bg-[linear-gradient(135deg,#ff9a5c,#ffd36f)] px-4 py-3 font-semibold text-obsidian transition hover:brightness-105 disabled:opacity-60"
                  >
                    {finding ? 'Scanning cameras...' : 'Find employee'}
                  </button>
                </div>
              ) : (
                <p className="mt-5 text-sm leading-6 text-white/56">
                  Pick a person from the search list, then run a camera scan. Matching cameras will be highlighted in the grid.
                </p>
              )}
            </div>

            {resultMessage && (
              <div className={`rounded-[2rem] border p-5 text-sm ${
                highlightedCount > 0 ? 'border-cyan-accent/30 bg-cyan-accent/10 text-white' : 'border-amber-300/25 bg-amber-300/10 text-white'
              }`}>
                <div className="flex items-center gap-3">
                  <Radar className="h-5 w-5" />
                  <p className="font-medium">{highlightedCount > 0 ? 'Match result' : 'No match found'}</p>
                </div>
                <p className="mt-2 text-white/82">{resultMessage}</p>
              </div>
            )}
          </section>

          <section className="space-y-5">
            <div className="glass-panel rounded-[2rem] p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.34em] text-white/40">Live Feed Source</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">Browser camera input</h3>
                  <p className="mt-2 text-sm leading-6 text-white/56">
                    Browser cameras are mirrored from this webcam feed. Network CCTV streams are processed directly by the backend using their configured source URLs.
                  </p>
                </div>
                <div className="hidden h-12 w-12 items-center justify-center rounded-[1rem] bg-white/[0.05] text-cyan-accent sm:flex">
                  <Video className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-5 overflow-hidden rounded-[1.8rem] border border-white/10">
                <video ref={videoRef} className="aspect-video w-full object-cover" muted playsInline />
              </div>
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
