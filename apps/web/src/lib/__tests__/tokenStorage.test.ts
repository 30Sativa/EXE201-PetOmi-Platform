import { describe, it, expect, beforeEach } from 'vitest'
import { tokenStorage, decodeJwt, decodeAccessToken } from '@/lib/tokenStorage'

function makeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  const body = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  return `${header}.${body}.`
}

describe('tokenStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns null when no access token stored', () => {
    expect(tokenStorage.getAccessToken()).toBeNull()
  })

  it('stores and retrieves access token', () => {
    tokenStorage.setAccessToken('test-access-token')
    expect(tokenStorage.getAccessToken()).toBe('test-access-token')
  })

  it('returns null when no refresh token stored', () => {
    expect(tokenStorage.getRefreshToken()).toBeNull()
  })

  it('stores and retrieves refresh token', () => {
    tokenStorage.setRefreshToken('test-refresh-token')
    expect(tokenStorage.getRefreshToken()).toBe('test-refresh-token')
  })

  it('hasValidToken returns false when no token', () => {
    expect(tokenStorage.hasValidToken()).toBe(false)
  })

  it('hasValidToken returns true for a valid non-expired JWT', () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600
    tokenStorage.setAccessToken(makeJwt({ sub: 'u1', exp: futureExp }))
    expect(tokenStorage.hasValidToken()).toBe(true)
  })

  it('hasValidToken returns false for an expired JWT', () => {
    const pastExp = Math.floor(Date.now() / 1000) - 1
    tokenStorage.setAccessToken(makeJwt({ sub: 'u1', exp: pastExp }))
    expect(tokenStorage.hasValidToken()).toBe(false)
  })

  it('hasValidToken returns false for a non-JWT string', () => {
    tokenStorage.setAccessToken('not-a-real-jwt')
    expect(tokenStorage.hasValidToken()).toBe(false)
  })

  it('clearTokens removes both tokens', () => {
    const exp = Math.floor(Date.now() / 1000) + 3600
    tokenStorage.setAccessToken(makeJwt({ exp }))
    tokenStorage.setRefreshToken('refresh')
    tokenStorage.clearTokens()
    expect(tokenStorage.getAccessToken()).toBeNull()
    expect(tokenStorage.getRefreshToken()).toBeNull()
  })

  it('hasValidToken returns false after clearTokens', () => {
    const exp = Math.floor(Date.now() / 1000) + 3600
    tokenStorage.setAccessToken(makeJwt({ exp }))
    tokenStorage.clearTokens()
    expect(tokenStorage.hasValidToken()).toBe(false)
  })
})

describe('decodeJwt', () => {
  it('returns null for empty string', () => {
    expect(decodeJwt('')).toBeNull()
  })

  it('returns null for invalid token format', () => {
    expect(decodeJwt('not-a-jwt')).toBeNull()
  })

  it('decodes a valid JWT payload', () => {
    const payload = { sub: 'user-123', email: 'test@example.com' }
    const decoded = decodeJwt(makeJwt(payload))
    expect(decoded?.sub).toBe('user-123')
    expect(decoded?.email).toBe('test@example.com')
  })

  it('returns null for a token with malformed base64 payload', () => {
    expect(decodeJwt('header.!!!.sig')).toBeNull()
  })
})

describe('decodeAccessToken', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns null when no access token in storage', () => {
    expect(decodeAccessToken()).toBeNull()
  })

  it('decodes access token stored in localStorage', () => {
    const payload = { sub: 'user-456', email: 'stored@example.com' }
    tokenStorage.setAccessToken(makeJwt(payload))
    const decoded = decodeAccessToken()
    expect(decoded?.sub).toBe('user-456')
    expect(decoded?.email).toBe('stored@example.com')
  })
})
