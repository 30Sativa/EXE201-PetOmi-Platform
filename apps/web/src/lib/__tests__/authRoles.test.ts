import { describe, it, expect } from 'vitest'
import { resolvePreferredRole, getDashboardPathForRole, AUTH_ROLES } from '@/lib/authRoles'

describe('resolvePreferredRole', () => {
  it('returns Admin when roles include admin (case-insensitive)', () => {
    expect(resolvePreferredRole('Owner', ['Owner', 'Admin'])).toBe(AUTH_ROLES.ADMIN)
  })

  it('returns Owner when roles include owner but not admin', () => {
    expect(resolvePreferredRole('Vet', ['Owner', 'Vet'])).toBe(AUTH_ROLES.OWNER)
  })

  it('returns Vet when only vet role is present', () => {
    expect(resolvePreferredRole('Vet', ['Vet'])).toBe(AUTH_ROLES.VET)
  })

  it('falls back to activeRole when roles array is empty and activeRole is Admin', () => {
    expect(resolvePreferredRole('Admin', [])).toBe(AUTH_ROLES.ADMIN)
  })

  it('falls back to activeRole when roles array is empty and activeRole is Vet', () => {
    expect(resolvePreferredRole('Vet', [])).toBe(AUTH_ROLES.VET)
  })

  it('defaults to Owner when no roles and no recognizable activeRole', () => {
    expect(resolvePreferredRole(undefined, [])).toBe(AUTH_ROLES.OWNER)
  })

  it('Admin in roles takes priority over activeRole being Owner', () => {
    expect(resolvePreferredRole('Owner', ['Admin', 'Owner'])).toBe(AUTH_ROLES.ADMIN)
  })
})

describe('getDashboardPathForRole', () => {
  it('returns /dashboard/admin for Admin role', () => {
    expect(getDashboardPathForRole('Admin')).toBe('/dashboard/admin')
  })

  it('returns /dashboard/clinic for Vet role', () => {
    expect(getDashboardPathForRole('Vet')).toBe('/dashboard/clinic')
  })

  it('returns /dashboard/owner for Owner role', () => {
    expect(getDashboardPathForRole('Owner')).toBe('/dashboard/owner')
  })

  it('defaults to /dashboard/owner for unknown role', () => {
    expect(getDashboardPathForRole('SuperUser')).toBe('/dashboard/owner')
  })

  it('defaults to /dashboard/owner for undefined', () => {
    expect(getDashboardPathForRole(undefined)).toBe('/dashboard/owner')
  })
})
