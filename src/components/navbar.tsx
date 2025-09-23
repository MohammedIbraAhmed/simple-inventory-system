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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Menu, Home, Users, MapPin, BarChart3, Settings, Lock, LogOut, User, ChevronDown } from 'lucide-react'
import { useState } from 'react'

// Helper function to get user initials
function getUserInitials(name?: string, email?: string): string {
  if (name) {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  if (email) {
    return email.charAt(0).toUpperCase()
  }
  return 'U'
}

export function Navbar() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
                  <NavigationMenuLink className={cn(navigationMenuTriggerStyle(), "flex items-center", pathname === '/dashboard' && 'bg-accent text-accent-foreground')}>
                    <Home className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span>Dashboard</span>
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Link href="/workshops" legacyBehavior passHref>
                  <NavigationMenuLink className={cn(navigationMenuTriggerStyle(), "flex items-center", pathname === '/workshops' && 'bg-accent text-accent-foreground')}>
                    <Users className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span>Workshops</span>
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Link href="/locations" legacyBehavior passHref>
                  <NavigationMenuLink className={cn(navigationMenuTriggerStyle(), "flex items-center", pathname === '/locations' && 'bg-accent text-accent-foreground')}>
                    <MapPin className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span>Locations</span>
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger className="flex items-center">
                  <BarChart3 className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span>Reports</span>
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                    <li className="row-span-3">
                      <NavigationMenuLink asChild>
                        <Link
                          className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                          href="/reports"
                        >
                          <div className="mb-2 mt-4 text-lg font-medium flex items-center">
                            <BarChart3 className="mr-2 h-5 w-5" />
                            Reports
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
                  <NavigationMenuTrigger className="flex items-center">
                    <Settings className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span>Admin</span>
                  </NavigationMenuTrigger>
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

        {/* Mobile menu */}
        <div className="flex flex-1 items-center justify-between space-x-2 md:hidden">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <span className="font-bold">📦 Inventory</span>
          </Link>
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="px-2">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  📦 Inventory System
                </SheetTitle>
              </SheetHeader>

              {/* Mobile Profile Section */}
              <div className="mt-6 mb-6 p-4 bg-muted/30 rounded-lg border shadow-sm">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12 ring-2 ring-border">
                    <AvatarImage src={session.user?.image || ''} alt={session.user?.name || ''} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-lg font-medium">
                      {getUserInitials(session.user?.name, session.user?.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-none truncate">
                      {session.user?.name || 'User'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {session.user?.email}
                    </p>
                    <div className="mt-2">
                      <Badge
                        variant={session.user.role === 'admin' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        <User className="mr-1 h-3 w-3" />
                        {session.user.role === 'admin' ? 'Administrator' : 'User'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col space-y-2">
                <Link
                  href="/dashboard"
                  className={cn(
                    "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                    pathname === '/dashboard' && 'bg-accent text-accent-foreground'
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Home className="mr-3 h-4 w-4 flex-shrink-0" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  href="/workshops"
                  className={cn(
                    "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                    pathname === '/workshops' && 'bg-accent text-accent-foreground'
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Users className="mr-3 h-4 w-4 flex-shrink-0" />
                  <span>Workshops</span>
                </Link>
                <Link
                  href="/locations"
                  className={cn(
                    "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                    pathname === '/locations' && 'bg-accent text-accent-foreground'
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <MapPin className="mr-3 h-4 w-4 flex-shrink-0" />
                  <span>Locations</span>
                </Link>
                <Link
                  href="/reports"
                  className={cn(
                    "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                    pathname === '/reports' && 'bg-accent text-accent-foreground'
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <BarChart3 className="mr-3 h-4 w-4 flex-shrink-0" />
                  <span>Reports</span>
                </Link>
                {session.user.role === 'admin' && (
                  <Link
                    href="/admin"
                    className={cn(
                      "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                      pathname === '/admin' && 'bg-accent text-accent-foreground'
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Settings className="mr-3 h-4 w-4 flex-shrink-0" />
                    <span>Admin</span>
                  </Link>
                )}
                <div className="border-t pt-2 mt-4">
                  <Link
                    href="/auth/change-password"
                    className="flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Lock className="mr-3 h-4 w-4 flex-shrink-0" />
                    <span>Change Password</span>
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false)
                      signOut()
                    }}
                    className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    <LogOut className="mr-3 h-4 w-4 flex-shrink-0" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <div className="flex items-center space-x-1 md:space-x-2">
              <NotificationSystem userId={session.user.id} userRole={session.user.role} />

              {/* Profile Dropdown Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center space-x-2 px-2 md:px-3 py-2 h-auto hover:bg-accent/50 transition-colors duration-200 rounded-md"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={session.user?.image || ''} alt={session.user?.name || ''} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                        {getUserInitials(session.user?.name, session.user?.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:flex md:flex-col md:items-start md:text-left">
                      <span className="text-sm font-medium leading-none">
                        {session.user?.name || session.user?.email}
                      </span>
                      <div className="flex items-center gap-1 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {session.user.role === 'admin' ? 'Admin' : 'User'}
                        </Badge>
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-64 p-2"
                  align="end"
                  sideOffset={8}
                  forceMount
                >
                  <DropdownMenuLabel className="font-normal p-3">
                    <div className="flex flex-col space-y-3">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10 ring-2 ring-border">
                          <AvatarImage src={session.user?.image || ''} alt={session.user?.name || ''} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {getUserInitials(session.user?.name, session.user?.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col space-y-1 min-w-0 flex-1">
                          <p className="text-sm font-medium leading-none truncate">
                            {session.user?.name || 'User'}
                          </p>
                          <p className="text-xs leading-none text-muted-foreground truncate">
                            {session.user?.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Badge
                          variant={session.user.role === 'admin' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          <User className="mr-1 h-3 w-3" />
                          {session.user.role === 'admin' ? 'Administrator' : 'User'}
                        </Badge>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/auth/change-password" className="flex items-center px-3 py-2">
                      <Lock className="mr-3 h-4 w-4" />
                      <span>Change Password</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer px-3 py-2 text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20"
                    onClick={() => signOut()}
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}