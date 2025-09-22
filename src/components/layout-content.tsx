'use client'

import { usePathname } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'

interface LayoutContentProps {
  children: React.ReactNode
}

export function LayoutContent({ children }: LayoutContentProps) {
  const pathname = usePathname()

  // Don't show navbar/footer on home page (landing page) as it has its own layout
  const isLandingPage = pathname === '/'

  if (isLandingPage) {
    return <>{children}</>
  }

  // Regular layout for other pages
  return (
    <div className="relative flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 px-4 md:px-6 lg:px-8">{children}</main>
      <Footer />
    </div>
  )
}