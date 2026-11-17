import { useEffect, useRef } from 'react'

/**
 * The rear camera, full size behind the transparent AR canvas; stops the camera when it unmounts.
 * Ported from the SPHEREx XR project (arvr/src/xr/CameraFeed.tsx).
 */
export function CameraFeed({ onError, onReady }: { onError?: (message: string) => void; onReady?: () => void }) {
  const video = useRef<HTMLVideoElement>(null)
  const report = useRef(onError)
  report.current = onError
  const ready = useRef(onReady)
  ready.current = onReady

  useEffect(() => {
    let stream: MediaStream | null = null
    let cancelled = false
    if (!navigator.mediaDevices?.getUserMedia) {
      report.current?.('The camera needs a secure (https://) link. Showing Mars against the stars instead.')
      return
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop())
          return
        }
        stream = s
        const el = video.current
        if (!el) return
        el.srcObject = s
        el.play().catch(() => undefined)
        ready.current?.()
      })
      .catch(() => report.current?.('Camera access was blocked. Allow the camera for this site to see Mars in your room.'))
    return () => {
      cancelled = true
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  return <video className="ar-feed" ref={video} playsInline muted autoPlay aria-hidden />
}
