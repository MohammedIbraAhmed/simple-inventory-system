import type { Metadata } from 'next'
import { SessionProvider } from './providers'
import { LayoutContent } from '@/components/layout-content'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

export const metadata: Metadata = {
  title: 'Inventory Management System',
  description: 'Comprehensive inventory and workshop management solution',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white font-sans antialiased">
        <SessionProvider>
          <LayoutContent>{children}</LayoutContent>
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  )
}
