import { describe, it, expect } from 'vitest'
import { LoginRequestSchema } from '@/schemas/auth.schema'

describe('LoginRequestSchema', () => {
  it('accepts a valid email and password', () => {
    const result = LoginRequestSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
    })
    expect(result.success).toBe(true)
  })

  it('rejects an invalid email address', () => {
    const result = LoginRequestSchema.safeParse({
      email: 'not-an-email',
      password: 'password123',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Email không hợp lệ')
    }
  })

  it('rejects an empty email', () => {
    const result = LoginRequestSchema.safeParse({
      email: '',
      password: 'password123',
    })
    expect(result.success).toBe(false)
  })

  it('rejects a password shorter than 6 characters', () => {
    const result = LoginRequestSchema.safeParse({
      email: 'user@example.com',
      password: '12345',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Mật khẩu phải có ít nhất 6 ký tự')
    }
  })

  it('rejects an empty password', () => {
    const result = LoginRequestSchema.safeParse({
      email: 'user@example.com',
      password: '',
    })
    expect(result.success).toBe(false)
  })

  it('accepts optional device fields', () => {
    const result = LoginRequestSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
      deviceFingerprint: 'abc-fingerprint',
      deviceName: 'Chrome on Windows',
      deviceType: 'WEB',
    })
    expect(result.success).toBe(true)
  })

  it('accepts when optional device fields are omitted', () => {
    const result = LoginRequestSchema.safeParse({
      email: 'user@example.com',
      password: 'exactly6',
    })
    expect(result.success).toBe(true)
  })
})
