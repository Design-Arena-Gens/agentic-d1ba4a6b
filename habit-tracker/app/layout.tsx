import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Habit Tracker',
  description: 'Track your daily habits and gratitude',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
