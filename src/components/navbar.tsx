'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { NotificationSystem } from '@/components/notification-system'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'
import { cn } from '@/lib/utils'

export function Navbar() {
  const { data: session, status } = useSession()
  const pathname = usePathname()

  // Don't show navbar on auth pages
  if (pathname?.startsWith('/auth/')) {
    return null
  }

  if (status === 'loading') {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center px-4 md:px-6">
          <div className="mr-4 hidden md:flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <span className="hidden font-bold sm:inline-block">
                📦 Inventory System
              </span>
            </Link>
          </div>
          <div className="flex-1"></div>
          <div className="flex items-center justify-between space-x-2 md:justify-end">
            <div className="w-full flex-1 md:w-auto md:flex-none">
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          </div>
        </div>
      </header>
    )
  }

  if (!session) {
    return null
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center px-4 md:px-6">
        <div className="mr-4 hidden md:flex">
          <Link href="/dashboard" className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block">
              📦 Inventory System
            </span>
          </Link>
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <Link href="/dashboard" legacyBehavior passHref>
                  <NavigationMenuLink className={cn(navigationMenuTriggerStyle(), pathname === '/dashboard' && 'bg-accent text-accent-foreground')}>
                    🏠 Dashboard
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Link href="/workshops" legacyBehavior passHref>
                  <NavigationMenuLink className={cn(navigationMenuTriggerStyle(), pathname === '/workshops' && 'bg-accent text-accent-foreground')}>
                    🎪 Workshops
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger>📊 Reports</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                    <li className="row-span-3">
                      <NavigationMenuLink asChild>
                        <Link
                          className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                          href="/reports"
                        >
                          <div className="mb-2 mt-4 text-lg font-medium">
                            📊 Reports
                          </div>
                          <p className="text-sm leading-tight text-muted-foreground">
                            View comprehensive reports on workshops, inventory, and distributions.
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <Link
                          href="/reports"
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="text-sm font-medium leading-none">Workshop Reports</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Detailed analysis of workshop activities and participation.
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <Link
                          href="/reports"
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="text-sm font-medium leading-none">Inventory Reports</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Stock levels, distributions, and material usage analytics.
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {session.user.role === 'admin' && (
                <NavigationMenuItem>
                  <NavigationMenuTrigger>⚙️ Admin</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid gap-3 p-6 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                      <li>
                        <NavigationMenuLink asChild>
                          <Link
                            href="/admin"
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          >
                            <div className="text-sm font-medium leading-none">👥 User Management</div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              Create and manage user accounts, roles, and permissions.
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink asChild>
                          <Link
                            href="/admin"
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          >
                            <div className="text-sm font-medium leading-none">📤 Stock Allocation</div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              Allocate materials to users and manage stock distribution.
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink asChild>
                          <Link
                            href="/dashboard"
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          >
                            <div className="text-sm font-medium leading-none">📦 Inventory Management</div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              Add, edit, and monitor product inventory levels.
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink asChild>
                          <Link
                            href="/reports"
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          >
                            <div className="text-sm font-medium leading-none">📊 System Reports</div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              Comprehensive system analytics and reporting.
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              )}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Mobile menu button - simple version for now */}
        <div className="flex flex-1 items-center justify-between space-x-2 md:hidden">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <span className="font-bold">📦 Inventory</span>
          </Link>
        </div>

        <div className="flex items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <div className="flex items-center space-x-1 md:space-x-2">
              <span className="hidden text-sm text-muted-foreground lg:inline-block">
                Welcome, {session.user?.name || session.user?.email}
              </span>
              <NotificationSystem userId={session.user.id} userRole={session.user.role} />
              <Link href="/auth/change-password">
                <Button variant="ghost" size="sm" className="px-2 md:px-3">
                  🔐
                </Button>
              </Link>
              <Button onClick={() => signOut()} variant="outline" size="sm" className="px-2 md:px-3 text-xs md:text-sm">
                <span className="hidden md:inline">Sign Out</span>
                <span className="md:hidden">Out</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}