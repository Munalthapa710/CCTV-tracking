import { CameraStatus, resolveAssetUrl } from '@/lib/api'

export default function CameraPanel({
  camera,
  fallbackPreview,
}: {
  camera: CameraStatus
  fallbackPreview?: string | null
}) {
  const preview = resolveAssetUrl(camera.latest_preview) || fallbackPreview

  return (
    <div
      className={`overflow-hidden rounded-3xl border ${
        camera.highlighted ? 'border-cyan-accent shadow-[0_0_0_1px_rgba(73,246,213,0.45)]' : 'border-white/10'
      } bg-slate-panel`}
    >
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-white">{camera.display_name}</p>
          <p className="text-xs uppercase tracking-[0.28em] text-white/45">{camera.location}</p>
        </div>
        <div
          className={`rounded-full px-3 py-1 text-xs ${
            camera.highlighted
              ? 'bg-cyan-accent text-obsidian'
              : camera.face_detected
                ? 'bg-amber-400/15 text-amber-200'
                : 'bg-white/8 text-white/60'
          }`}
        >
          {camera.highlighted ? 'Match' : camera.face_detected ? 'Face detected' : 'Waiting'}
        </div>
      </div>

      <div className="aspect-video bg-[#081016]">
        {preview ? (
          <img src={preview} alt={camera.display_name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-white/35">
            Camera preview will appear after sync
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-4 py-3 text-xs text-white/55">
        <span>{camera.processed_at ? 'Processed' : 'Not processed yet'}</span>
        <span>{camera.similarity ? `${Math.round(camera.similarity * 100)}% match` : 'No match score'}</span>
      </div>
    </div>
  )
}
