import { useEffect, useRef, useState } from "react"
import type { IScannerControls } from "@zxing/browser"
import { Camera, CameraOff, ScanLine } from "lucide-react"

import { getErrorMessage } from "@/lib/utils"

export type PetIntakeQrPayload =
  | { type: "health-share"; code: string }
  | { type: "pet-code"; code: string }

interface PetHealthQrScannerProps {
  onCodeScanned: (payload: PetIntakeQrPayload) => void
}

const normalizeCode = (value: string) => value.trim().toUpperCase()

const classifyRawCode = (value: string): PetIntakeQrPayload => {
  const code = normalizeCode(value)
  return code.startsWith("PO-")
    ? { type: "pet-code", code }
    : { type: "health-share", code }
}

const extractQrPayload = (rawValue: string): PetIntakeQrPayload => {
  const value = rawValue.trim()

  try {
    const url = new URL(value)
    const shareCode = url.searchParams.get("shareCode")
    if (shareCode) return { type: "health-share", code: normalizeCode(shareCode) }

    const petCode = url.searchParams.get("petCode")
    if (petCode) return { type: "pet-code", code: normalizeCode(petCode) }
  } catch {
    // Raw codes are valid too.
  }

  return classifyRawCode(value)
}

export default function PetHealthQrScanner({
  onCodeScanned,
}: PetHealthQrScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const stopScanner = () => {
    controlsRef.current?.stop()
    controlsRef.current = null
    setIsScanning(false)
  }

  useEffect(() => stopScanner, [])

  const startScanner = async () => {
    if (!videoRef.current || isScanning) return

    setErrorMessage("")
    setIsScanning(true)

    try {
      const { BrowserMultiFormatReader } = await import("@zxing/browser")
      const reader = new BrowserMultiFormatReader()
      const controls = await reader.decodeFromConstraints(
        {
          audio: false,
          video: {
            facingMode: { ideal: "environment" },
          },
        },
        videoRef.current,
        (result) => {
          if (!result) return

          const payload = extractQrPayload(result.getText())
          stopScanner()
          onCodeScanned(payload)
        },
      )

      controlsRef.current = controls
    } catch (error) {
      setErrorMessage(
        getErrorMessage(
          error,
          "Camera is unavailable. Please enter the PetOmi ID or HealthShareCode manually.",
        ),
      )
      setIsScanning(false)
    }
  }

  return (
    <section className="grid gap-4 rounded-[24px] border border-po-border bg-white p-5 shadow-sm shadow-orange-200/15">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-po-primary-soft text-po-primary">
            <ScanLine className="size-5" />
          </span>
          <div>
            <h2 className="text-lg font-extrabold text-po-text">Scan QR code</h2>
            <p className="mt-1 text-sm text-po-text-muted">
              Point the camera at the pet passport QR. HealthShare links are still accepted as a backup.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={isScanning ? stopScanner : startScanner}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-po-primary px-4 text-sm font-semibold text-white transition hover:bg-po-primary-hover"
        >
          {isScanning ? <CameraOff className="size-4" /> : <Camera className="size-4" />}
          {isScanning ? "Stop camera" : "Start camera"}
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-po-border bg-black">
        <video
          ref={videoRef}
          muted
          playsInline
          className="aspect-video w-full object-cover"
        />
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-po-warning/30 bg-po-warning-soft px-4 py-3 text-sm font-semibold text-po-warning">
          {errorMessage}
        </div>
      ) : null}
    </section>
  )
}
