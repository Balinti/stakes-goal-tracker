import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Stakes Goal Tracker - Ship or Lose Your Deposit',
  description: 'Proof-of-Ship accountability tool for indie builders. Verify weekly shipping via GitHub Releases with refundable deposit sprints.',
  openGraph: {
    title: 'Stakes Goal Tracker',
    description: 'Proof-of-Ship accountability tool for indie builders. Ship weekly or lose your deposit.',
    url: 'https://stakes-goal-tracker.vercel.app',
    siteName: 'Stakes Goal Tracker',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Stakes Goal Tracker',
    description: 'Proof-of-Ship accountability tool for indie builders.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
