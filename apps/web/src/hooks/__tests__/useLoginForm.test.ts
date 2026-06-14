import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'

// Mocks must be declared before imports that use them (Vitest hoists vi.mock calls)
vi.mock('@/services/auth.service', () => ({
  loginApi: vi.fn(),
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('@/lib/device', () => ({
  getDeviceInfo: vi.fn(() => ({
    deviceFingerprint: 'test-fingerprint',
    deviceName: 'Test Browser on jsdom',
    deviceType: 'WEB',
  })),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

import { loginApi } from '@/services/auth.service'
import { useAuth } from '@/contexts/AuthContext'
import { useLoginForm } from '@/hooks/useLoginForm'
import type { AuthContextType } from '@/types'
import type { LoginResponse } from '@/types'

const mockSetAuthFromTokens = vi.fn()

const defaultAuthContext: AuthContextType = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  setAuthFromTokens: mockSetAuthFromTokens,
  logout: vi.fn(),
}

const successResponse: LoginResponse = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  userId: 'user-1',
  email: 'test@example.com',
  activeRole: 'Owner',
  roles: ['Owner'],
  isProfileCompleted: true,
}

function wrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(MemoryRouter, null, children)
}

describe('useLoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue(defaultAuthContext)
  })

  // ── Initial state ──────────────────────────────────────────────────────────

  it('initialises with idle status and empty message', () => {
    const { result } = renderHook(() => useLoginForm(), { wrapper })
    expect(result.current.status).toBe('idle')
    expect(result.current.message).toBe('')
  })

  it('initialises with password hidden', () => {
    const { result } = renderHook(() => useLoginForm(), { wrapper })
    expect(result.current.showPassword).toBe(false)
  })

  // ── Password toggle ────────────────────────────────────────────────────────

  it('toggles password visibility on/off', () => {
    const { result } = renderHook(() => useLoginForm(), { wrapper })

    act(() => { result.current.onTogglePassword() })
    expect(result.current.showPassword).toBe(true)

    act(() => { result.current.onTogglePassword() })
    expect(result.current.showPassword).toBe(false)
  })

  // ── Successful login ───────────────────────────────────────────────────────

  it('calls loginApi with credentials and device info', async () => {
    vi.mocked(loginApi).mockResolvedValue(successResponse)

    const { result } = renderHook(() => useLoginForm(), { wrapper })
    await act(async () => {
      await result.current.onSubmit({ email: 'test@example.com', password: 'password123' })
    })

    expect(loginApi).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
      deviceFingerprint: 'test-fingerprint',
      deviceName: 'Test Browser on jsdom',
      deviceType: 'WEB',
    })
  })

  it('stores tokens via setAuthFromTokens after successful login', async () => {
    vi.mocked(loginApi).mockResolvedValue(successResponse)

    const { result } = renderHook(() => useLoginForm(), { wrapper })
    await act(async () => {
      await result.current.onSubmit({ email: 'test@example.com', password: 'password123' })
    })

    expect(mockSetAuthFromTokens).toHaveBeenCalledWith(
      'access-token',
      'refresh-token',
      expect.objectContaining({
        userId: 'user-1',
        email: 'test@example.com',
        activeRole: 'Owner',
        roles: ['Owner'],
      }),
    )
  })

  it('sets status to success and shows Vietnamese success message', async () => {
    vi.mocked(loginApi).mockResolvedValue(successResponse)

    const { result } = renderHook(() => useLoginForm(), { wrapper })
    await act(async () => {
      await result.current.onSubmit({ email: 'test@example.com', password: 'password123' })
    })

    expect(result.current.status).toBe('success')
    expect(result.current.message).toBe('Đăng nhập thành công.')
  })

  it('navigates to owner dashboard after 500 ms when profile is complete', async () => {
    vi.useFakeTimers()
    vi.mocked(loginApi).mockResolvedValue(successResponse)

    const { result } = renderHook(() => useLoginForm(), { wrapper })
    await act(async () => {
      await result.current.onSubmit({ email: 'test@example.com', password: 'password123' })
    })
    act(() => { vi.advanceTimersByTime(500) })

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/owner')
    vi.useRealTimers()
  })

  it('navigates to admin dashboard when user has Admin role', async () => {
    vi.useFakeTimers()
    vi.mocked(loginApi).mockResolvedValue({
      ...successResponse,
      activeRole: 'Admin',
      roles: ['Admin', 'Owner'],
    })

    const { result } = renderHook(() => useLoginForm(), { wrapper })
    await act(async () => {
      await result.current.onSubmit({ email: 'admin@example.com', password: 'adminpass' })
    })
    act(() => { vi.advanceTimersByTime(500) })

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/admin')
    vi.useRealTimers()
  })

  it('navigates to clinic dashboard when user only has Vet role', async () => {
    vi.useFakeTimers()
    vi.mocked(loginApi).mockResolvedValue({
      ...successResponse,
      activeRole: 'Vet',
      roles: ['Vet'],
    })

    const { result } = renderHook(() => useLoginForm(), { wrapper })
    await act(async () => {
      await result.current.onSubmit({ email: 'vet@example.com', password: 'vetpass1' })
    })
    act(() => { vi.advanceTimersByTime(500) })

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/clinic')
    vi.useRealTimers()
  })

  it('navigates to /complete-profile when isProfileCompleted is false', async () => {
    vi.useFakeTimers()
    vi.mocked(loginApi).mockResolvedValue({ ...successResponse, isProfileCompleted: false })

    const { result } = renderHook(() => useLoginForm(), { wrapper })
    await act(async () => {
      await result.current.onSubmit({ email: 'new@example.com', password: 'newpass1' })
    })
    act(() => { vi.advanceTimersByTime(500) })

    expect(mockNavigate).toHaveBeenCalledWith('/complete-profile')
    vi.useRealTimers()
  })

  // ── Failed login ───────────────────────────────────────────────────────────

  it('sets status to error when loginApi rejects', async () => {
    vi.mocked(loginApi).mockRejectedValue(new Error('Invalid credentials'))

    const { result } = renderHook(() => useLoginForm(), { wrapper })
    await act(async () => {
      await result.current.onSubmit({ email: 'wrong@example.com', password: 'wrongpass' })
    })

    expect(result.current.status).toBe('error')
  })

  it('exposes the error message when loginApi rejects with an Error', async () => {
    vi.mocked(loginApi).mockRejectedValue(new Error('Invalid credentials'))

    const { result } = renderHook(() => useLoginForm(), { wrapper })
    await act(async () => {
      await result.current.onSubmit({ email: 'wrong@example.com', password: 'wrongpass' })
    })

    expect(result.current.message).toBe('Invalid credentials')
  })

  it('does not call navigate when loginApi rejects', async () => {
    vi.mocked(loginApi).mockRejectedValue(new Error('Server error'))

    const { result } = renderHook(() => useLoginForm(), { wrapper })
    await act(async () => {
      await result.current.onSubmit({ email: 'user@example.com', password: 'pass123' })
    })

    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('does not store tokens when loginApi rejects', async () => {
    vi.mocked(loginApi).mockRejectedValue(new Error('Unauthorised'))

    const { result } = renderHook(() => useLoginForm(), { wrapper })
    await act(async () => {
      await result.current.onSubmit({ email: 'user@example.com', password: 'pass123' })
    })

    expect(mockSetAuthFromTokens).not.toHaveBeenCalled()
  })
})
