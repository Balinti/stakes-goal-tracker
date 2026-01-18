'use client'

import { z } from 'zod'
import type { ReleaseProof } from './github'

// LocalStorage schema version
const STORAGE_KEY = 'sgt_v1'

// Week status enum
export type WeekStatus = 'pass' | 'fail' | 'grace' | 'pending'

// Schema for a week's data
export const WeekDataSchema = z.object({
  weekStart: z.string(), // ISO date string
  weekEnd: z.string(), // ISO date string
  status: z.enum(['pass', 'fail', 'grace', 'pending']),
  proof: z.object({
    id: z.number(),
    tag_name: z.string(),
    html_url: z.string(),
    published_at: z.string(),
    name: z.string().nullable(),
    body_length: z.number(),
  }).nullable(),
  evidenceUrl: z.string().nullable(),
  note: z.string().nullable(),
  evaluatedAt: z.string().nullable(), // ISO date string
})

export type WeekData = z.infer<typeof WeekDataSchema>

// Schema for commitment settings
export const CommitmentSchema = z.object({
  repoOwner: z.string(),
  repoName: z.string(),
  timezone: z.string(),
  cutoffDow: z.number().min(0).max(6),
  cutoffTime: z.string(), // "HH:MM"
  tagPattern: z.string().nullable(),
  createdAt: z.string(), // ISO date string
})

export type Commitment = z.infer<typeof CommitmentSchema>

// Full local storage schema
export const LocalStorageSchema = z.object({
  commitment: CommitmentSchema.nullable(),
  weeks: z.array(WeekDataSchema),
  engagementFlags: z.object({
    hasSelectedRepo: z.boolean(),
    hasFetchedReleases: z.boolean(),
    hasAddedEvidence: z.boolean(),
    hasViewedScorecard: z.boolean(),
    promptDismissedAt: z.string().nullable(),
  }),
  migration: z.object({
    migratedAt: z.string().nullable(),
    userId: z.string().nullable(),
  }).nullable(),
})

export type LocalStorageData = z.infer<typeof LocalStorageSchema>

// Default storage data
const defaultData: LocalStorageData = {
  commitment: null,
  weeks: [],
  engagementFlags: {
    hasSelectedRepo: false,
    hasFetchedReleases: false,
    hasAddedEvidence: false,
    hasViewedScorecard: false,
    promptDismissedAt: null,
  },
  migration: null,
}

// Read from localStorage
export function readLocalStorage(): LocalStorageData {
  if (typeof window === 'undefined') {
    return defaultData
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return defaultData
    }

    const parsed = JSON.parse(raw)
    const validated = LocalStorageSchema.safeParse(parsed)

    if (validated.success) {
      return validated.data
    }

    console.warn('Invalid localStorage data, using defaults')
    return defaultData
  } catch (error) {
    console.warn('Failed to read localStorage:', error)
    return defaultData
  }
}

// Write to localStorage
export function writeLocalStorage(data: LocalStorageData): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('Failed to write localStorage:', error)
  }
}

// Update commitment
export function setCommitment(commitment: Commitment): void {
  const data = readLocalStorage()
  data.commitment = commitment
  data.engagementFlags.hasSelectedRepo = true
  writeLocalStorage(data)
}

// Get commitment
export function getCommitment(): Commitment | null {
  return readLocalStorage().commitment
}

// Update week data
export function updateWeek(week: WeekData): void {
  const data = readLocalStorage()
  const existingIndex = data.weeks.findIndex(
    w => w.weekStart === week.weekStart && w.weekEnd === week.weekEnd
  )

  if (existingIndex >= 0) {
    data.weeks[existingIndex] = week
  } else {
    data.weeks.push(week)
  }

  // Keep only last 8 weeks
  data.weeks = data.weeks
    .sort((a, b) => new Date(b.weekEnd).getTime() - new Date(a.weekEnd).getTime())
    .slice(0, 8)

  writeLocalStorage(data)
}

// Get weeks
export function getWeeks(): WeekData[] {
  return readLocalStorage().weeks
}

// Set engagement flag
export function setEngagementFlag(
  flag: keyof LocalStorageData['engagementFlags'],
  value: boolean | string | null
): void {
  const data = readLocalStorage()
  if (typeof value === 'boolean') {
    (data.engagementFlags as Record<string, unknown>)[flag] = value
  } else {
    (data.engagementFlags as Record<string, unknown>)[flag] = value
  }
  writeLocalStorage(data)
}

// Get engagement flags
export function getEngagementFlags(): LocalStorageData['engagementFlags'] {
  return readLocalStorage().engagementFlags
}

// Check if user has meaningful engagement
export function hasMeaningfulEngagement(): boolean {
  const flags = getEngagementFlags()
  return (
    flags.hasSelectedRepo &&
    (flags.hasFetchedReleases || flags.hasAddedEvidence || flags.hasViewedScorecard)
  )
}

// Mark as migrated
export function markMigrated(userId: string): void {
  const data = readLocalStorage()
  data.migration = {
    migratedAt: new Date().toISOString(),
    userId,
  }
  writeLocalStorage(data)
}

// Check if migrated
export function isMigrated(): boolean {
  const data = readLocalStorage()
  return data.migration?.migratedAt !== null
}

// Get data for migration
export function getDataForMigration(): {
  commitment: Commitment | null
  weeks: WeekData[]
} | null {
  const data = readLocalStorage()

  // Don't migrate if already migrated
  if (data.migration?.migratedAt) {
    return null
  }

  // Don't migrate if no data
  if (!data.commitment && data.weeks.length === 0) {
    return null
  }

  return {
    commitment: data.commitment,
    weeks: data.weeks,
  }
}

// Clear local storage (for testing)
export function clearLocalStorage(): void {
  if (typeof window === 'undefined') {
    return
  }
  localStorage.removeItem(STORAGE_KEY)
}
