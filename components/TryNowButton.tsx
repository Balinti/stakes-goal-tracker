'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TryNowButtonProps {
  className?: string
  size?: 'default' | 'large'
}

export function TryNowButton({ className, size = 'default' }: TryNowButtonProps) {
  return (
    <Link
      href="/app"
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 text-white font-semibold transition-all hover:bg-primary-700 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        size === 'large' ? 'px-8 py-4 text-lg' : 'px-6 py-3 text-base',
        className
      )}
    >
      Try it now
      <ArrowRight className={size === 'large' ? 'w-5 h-5' : 'w-4 h-4'} />
    </Link>
  )
}
