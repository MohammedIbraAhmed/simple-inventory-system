import type { Metadata } from 'next'
import { SessionProvider } from './providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'Simple Inventory',
  description: 'Basic inventory management',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}