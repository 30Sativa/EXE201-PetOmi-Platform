import { UAParser } from "ua-parser-js"

import type { DeviceInfo } from "@/types"

const STORAGE_PREFIX = "petomi-"
const FINGERPRINT_KEY = "device-fingerprint"
const DEVICE_NAME_KEY = "device-name"
const DEVICE_TYPE_KEY = "device-type"

export const getDeviceInfo = (): DeviceInfo => {
  const storedFingerprint = localStorage.getItem(STORAGE_PREFIX + FINGERPRINT_KEY)

  if (storedFingerprint) {
    const name = localStorage.getItem(STORAGE_PREFIX + DEVICE_NAME_KEY)
    const type = localStorage.getItem(STORAGE_PREFIX + DEVICE_TYPE_KEY)

    return {
      deviceFingerprint: storedFingerprint,
      deviceName: name ?? "Unknown Device",
      deviceType: type ?? "WEB",
    }
  }

  const parser = new UAParser()
  const ua = parser.getResult()

  const browser = ua.browser.name ?? "Unknown Browser"
  const os = ua.os.name ?? "Unknown OS"
  const deviceType = detectDeviceType(parser)
  const deviceName = `${browser} on ${os}`
  const fingerprint = generateFingerprint()

  localStorage.setItem(STORAGE_PREFIX + FINGERPRINT_KEY, fingerprint)
  localStorage.setItem(STORAGE_PREFIX + DEVICE_NAME_KEY, deviceName)
  localStorage.setItem(STORAGE_PREFIX + DEVICE_TYPE_KEY, deviceType)

  return {
    deviceFingerprint: fingerprint,
    deviceName,
    deviceType,
  }
}

const detectDeviceType = (parser: UAParser): string => {
  const ua = parser.getResult()
  const device = ua.device

  if (device.type === "mobile") return "MOBILE"
  if (device.type === "tablet") return "TABLET"
  if (device.type === "smarttv") return "TV"

  return "WEB"
}

const generateFingerprint = (): string => {
  const ua = new UAParser().getResult()

  const components = [
    navigator.userAgent,
    navigator.language,
    navigator.hardwareConcurrency?.toString() ?? "",
    `${screen.width}x${screen.height}`,
    ua.device.vendor ?? "",
    ua.device.model ?? "",
    ua.browser.name ?? "",
    ua.os.name ?? "",
  ]

  let hash = 0

  for (const component of components) {
    for (let i = 0; i < component.length; i += 1) {
      const chr = component.charCodeAt(i)
      hash = (hash << 5) - hash + chr
      hash |= 0
    }
  }

  return `${Math.abs(hash).toString(16)}-${crypto.randomUUID()}`
}