import { UAParser } from "ua-parser-js"

const FINGERPRINT_KEY = "petomi-device-fingerprint"
const STORAGE_PREFIX = "petomi-"

export interface DeviceInfo {
  deviceFingerprint: string
  deviceName: string
  deviceType: string
}

export const getDeviceInfo = (): DeviceInfo => {
  const storedFingerprint = localStorage.getItem(STORAGE_PREFIX + FINGERPRINT_KEY)

  if (storedFingerprint) {
    const name = localStorage.getItem(STORAGE_PREFIX + "device-name")
    const type = localStorage.getItem(STORAGE_PREFIX + "device-type")
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
  localStorage.setItem(STORAGE_PREFIX + "device-name", deviceName)
  localStorage.setItem(STORAGE_PREFIX + "device-type", deviceType)

  return {
    deviceFingerprint: fingerprint,
    deviceName: deviceName,
    deviceType: deviceType,
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
  const components = [
    navigator.userAgent,
    navigator.language,
    navigator.hardwareConcurrency?.toString() ?? "",
    (screen.width * screen.height).toString(),
    new UAParser().getResult().device.vendor ?? "",
    new UAParser().getResult().device.model ?? "",
    new UAParser().getResult().browser.name ?? "",
    new UAParser().getResult().os.name ?? "",
  ]

  let hash = 0
  for (const component of components) {
    const chr = component.charCodeAt(0)
    hash = (hash << 5) - hash + chr
    hash |= 0
  }

  return `${Math.abs(hash).toString(16)}-${crypto.randomUUID()}`
}
