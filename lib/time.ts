import {
  startOfWeek,
  endOfWeek,
  subWeeks,
  addWeeks,
  format,
  parseISO,
  setHours,
  setMinutes,
  setSeconds,
  setMilliseconds,
  getDay,
  addDays,
  subDays,
  isAfter,
  isBefore,
} from 'date-fns'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'

export interface WeekWindow {
  weekNumber: number // -3 to 0, where 0 is current week
  start: Date
  end: Date
  isCurrent: boolean
  label: string
}

export interface CutoffSettings {
  dayOfWeek: number // 0-6 (Sunday-Saturday)
  time: string // "HH:MM" format
  timezone: string // e.g., "America/New_York"
}

// Get default timezone from browser
export function getDefaultTimezone(): string {
  if (typeof Intl !== 'undefined') {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  }
  return 'UTC'
}

// Parse time string "HH:MM" to hours and minutes
function parseTime(time: string): { hours: number; minutes: number } {
  const [hours, minutes] = time.split(':').map(Number)
  return { hours: hours || 23, minutes: minutes || 59 }
}

// Get the cutoff datetime for a given date in the user's timezone
function getCutoffForDate(date: Date, settings: CutoffSettings): Date {
  const { hours, minutes } = parseTime(settings.time)
  const zonedDate = toZonedTime(date, settings.timezone)

  // Set the time
  let cutoff = setMilliseconds(
    setSeconds(
      setMinutes(
        setHours(zonedDate, hours),
        minutes
      ),
      0
    ),
    0
  )

  // Adjust to the correct day of week
  const currentDow = getDay(cutoff)
  const targetDow = settings.dayOfWeek
  const dayDiff = targetDow - currentDow

  if (dayDiff !== 0) {
    cutoff = addDays(cutoff, dayDiff)
  }

  // Convert back to UTC
  return fromZonedTime(cutoff, settings.timezone)
}

// Get the week window that ends at/before the given cutoff
function getWeekEndingAt(cutoff: Date): { start: Date; end: Date } {
  // Week ends at cutoff, starts 7 days before
  return {
    start: subDays(cutoff, 7),
    end: cutoff,
  }
}

// Calculate week windows based on cutoff settings
export function calculateWeekWindows(
  settings: CutoffSettings,
  now: Date = new Date()
): WeekWindow[] {
  const windows: WeekWindow[] = []
  const zonedNow = toZonedTime(now, settings.timezone)

  // Find the most recent cutoff (could be in the future if we're mid-week)
  let nextCutoff = getCutoffForDate(zonedNow, settings)

  // If the cutoff is in the past this week, move to next week's cutoff
  const utcNextCutoff = fromZonedTime(nextCutoff, settings.timezone)
  if (isBefore(utcNextCutoff, now)) {
    nextCutoff = addDays(nextCutoff, 7)
  }

  // Current week ends at next cutoff
  const currentWeekEnd = fromZonedTime(nextCutoff, settings.timezone)
  const currentWeekStart = subDays(currentWeekEnd, 7)

  // Add current week
  windows.push({
    weekNumber: 0,
    start: currentWeekStart,
    end: currentWeekEnd,
    isCurrent: true,
    label: 'This Week',
  })

  // Add past 4 weeks (for scorecard)
  for (let i = 1; i <= 4; i++) {
    const weekEnd = subWeeks(currentWeekEnd, i)
    const weekStart = subDays(weekEnd, 7)

    windows.push({
      weekNumber: -i,
      start: weekStart,
      end: weekEnd,
      isCurrent: false,
      label: i === 1 ? 'Last Week' : `${i} Weeks Ago`,
    })
  }

  return windows
}

// Format date for display
export function formatDate(date: Date, timezone: string): string {
  const zonedDate = toZonedTime(date, timezone)
  return format(zonedDate, 'MMM d, yyyy')
}

// Format time for display
export function formatTime(date: Date, timezone: string): string {
  const zonedDate = toZonedTime(date, timezone)
  return format(zonedDate, 'h:mm a')
}

// Format week range for display
export function formatWeekRange(start: Date, end: Date, timezone: string): string {
  const zonedStart = toZonedTime(start, timezone)
  const zonedEnd = toZonedTime(end, timezone)
  return `${format(zonedStart, 'MMM d')} - ${format(zonedEnd, 'MMM d, yyyy')}`
}

// Day of week options
export const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
]

// Common timezones
export const COMMON_TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Asia/Dubai',
  'Australia/Sydney',
  'Pacific/Auckland',
  'UTC',
]
