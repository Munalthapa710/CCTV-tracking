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
      className={`overflow-hidden rounded-[1.8rem] border ${
        camera.highlighted
          ? 'border-cyan-accent/50 shadow-[0_0_0_1px_rgba(82,242,208,0.25),0_22px_55px_rgba(82,242,208,0.12)]'
          : 'border-white/10'
      } bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015)),rgba(10,20,28,0.92)]`}
    >
      <div className="flex items-center justify-between border-b border-white/8 px-4 py-4">
        <div>
          <p className="text-sm font-semibold text-white">{camera.display_name}</p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.28em] text-white/42">{camera.location}</p>
        </div>
        <div
          className={`rounded-full px-3 py-1 text-[11px] font-medium ${
            camera.highlighted
              ? 'bg-[linear-gradient(135deg,#52f2d0,#7cc7ff)] text-obsidian'
              : camera.face_detected
                ? 'bg-amber-300/16 text-amber-100'
                : 'bg-white/8 text-white/58'
          }`}
        >
          {camera.highlighted ? 'Match' : camera.face_detected ? 'Face detected' : 'Waiting'}
        </div>
      </div>

      <div className="aspect-video bg-[#081016]">
        {preview ? (
          <img src={preview} alt={camera.display_name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-white/34">
            Camera preview will appear after sync
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-white/8 px-4 py-3 text-[11px] uppercase tracking-[0.16em] text-white/46">
        <span>{camera.processed_at ? 'Processed' : 'Not processed'}</span>
        <span>{camera.similarity ? `${Math.round(camera.similarity * 100)}% match` : 'No score yet'}</span>
      </div>
    </div>
  )
}
