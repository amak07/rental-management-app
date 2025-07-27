import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Rental Management App',
  description: 'Enterprise-grade rental management system',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}