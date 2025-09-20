import Link from 'next/link'
import { Separator } from '@/components/ui/separator'

export function Footer() {
  return (
    <footer className="w-full border-t bg-background">
      <div className="container">
        <div className="grid gap-8 px-4 py-8 md:grid-cols-4">
          {/* Brand Section */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">📦 Inventory System</h3>
            <p className="text-sm text-muted-foreground">
              Comprehensive inventory and workshop management solution for organizations.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/workshops" className="text-muted-foreground hover:text-foreground transition-colors">
                  Workshops
                </Link>
              </li>
              <li>
                <Link href="/reports" className="text-muted-foreground hover:text-foreground transition-colors">
                  Reports
                </Link>
              </li>
            </ul>
          </div>

          {/* Features */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Features</h4>
            <ul className="space-y-2 text-sm">
              <li className="text-muted-foreground">📊 Real-time Analytics</li>
              <li className="text-muted-foreground">👥 User Management</li>
              <li className="text-muted-foreground">🎪 Workshop Tracking</li>
              <li className="text-muted-foreground">📦 Inventory Control</li>
            </ul>
          </div>

          {/* Account */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Account</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/auth/change-password" className="text-muted-foreground hover:text-foreground transition-colors">
                  Change Password
                </Link>
              </li>
              <li>
                <Link href="/auth/reset-password" className="text-muted-foreground hover:text-foreground transition-colors">
                  Reset Password
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <Separator />

        {/* Bottom Section */}
        <div className="flex flex-col items-center justify-between gap-4 py-6 md:flex-row">
          <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
            <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
              © 2024 Inventory Management System. All rights reserved.
            </p>
          </div>

          <div className="flex flex-col items-center gap-2 text-center md:text-right">
            <p className="text-sm text-muted-foreground">
              Developed with ❤️ by{' '}
              <span className="font-semibold text-foreground">Mohammed Ahmed</span>
            </p>
            <p className="text-xs text-muted-foreground">
              <a
                href="mailto:mohammed@dozdan.com"
                className="hover:text-foreground transition-colors underline decoration-dotted"
              >
                mohammed@dozdan.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}