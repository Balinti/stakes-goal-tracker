// GitHub public API for releases
// No auth required for public repos

export interface GitHubRelease {
  id: number
  tag_name: string
  name: string | null
  html_url: string
  published_at: string
  body: string | null
  draft: boolean
  prerelease: boolean
}

export interface ReleaseProof {
  id: number
  tag_name: string
  html_url: string
  published_at: string
  name: string | null
  body_length: number
}

export interface FetchReleasesResult {
  success: boolean
  releases: GitHubRelease[]
  error?: string
  rateLimited?: boolean
}

// Parse repo URL to extract owner and name
export function parseRepoUrl(input: string): { owner: string; name: string } | null {
  // Handle formats:
  // - https://github.com/owner/repo
  // - github.com/owner/repo
  // - owner/repo

  const cleaned = input.trim().replace(/\/$/, '')

  // Try URL format
  const urlMatch = cleaned.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([^\/]+)\/([^\/]+)/i)
  if (urlMatch) {
    return { owner: urlMatch[1], name: urlMatch[2].replace(/\.git$/, '') }
  }

  // Try owner/repo format
  const simpleMatch = cleaned.match(/^([^\/]+)\/([^\/]+)$/)
  if (simpleMatch) {
    return { owner: simpleMatch[1], name: simpleMatch[2].replace(/\.git$/, '') }
  }

  return null
}

// Fetch releases from GitHub public API
export async function fetchReleases(owner: string, name: string): Promise<FetchReleasesResult> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${name}/releases?per_page=100`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'stakes-goal-tracker',
        },
        next: { revalidate: 60 }, // Cache for 1 minute
      }
    )

    if (response.status === 403) {
      const remaining = response.headers.get('X-RateLimit-Remaining')
      if (remaining === '0') {
        return {
          success: false,
          releases: [],
          error: 'GitHub API rate limit exceeded. Try again later or add an evidence link.',
          rateLimited: true,
        }
      }
    }

    if (response.status === 404) {
      return {
        success: false,
        releases: [],
        error: 'Repository not found. Make sure it exists and is public.',
      }
    }

    if (!response.ok) {
      return {
        success: false,
        releases: [],
        error: `GitHub API error: ${response.status}`,
      }
    }

    const releases: GitHubRelease[] = await response.json()

    // Filter out drafts
    const publishedReleases = releases.filter(r => !r.draft)

    return {
      success: true,
      releases: publishedReleases,
    }
  } catch (error) {
    return {
      success: false,
      releases: [],
      error: error instanceof Error ? error.message : 'Failed to fetch releases',
    }
  }
}

// Convert release to proof snapshot
export function releaseToProof(release: GitHubRelease): ReleaseProof {
  return {
    id: release.id,
    tag_name: release.tag_name,
    html_url: release.html_url,
    published_at: release.published_at,
    name: release.name,
    body_length: release.body?.length || 0,
  }
}

// Check if any release was published within a time window
export function hasReleaseInWindow(
  releases: GitHubRelease[],
  windowStart: Date,
  windowEnd: Date,
  tagPattern?: string | null
): { pass: boolean; release: GitHubRelease | null } {
  for (const release of releases) {
    const publishedAt = new Date(release.published_at)

    // Check if within window
    if (publishedAt >= windowStart && publishedAt < windowEnd) {
      // Check tag pattern if specified
      if (tagPattern) {
        try {
          const regex = new RegExp(tagPattern)
          if (!regex.test(release.tag_name)) {
            continue
          }
        } catch {
          // Invalid regex, skip pattern matching
        }
      }

      return { pass: true, release }
    }
  }

  return { pass: false, release: null }
}
