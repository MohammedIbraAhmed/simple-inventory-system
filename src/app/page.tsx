'use client'

import { useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Footer } from '@/components/footer'

export default function LandingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (session) {
      router.push('/dashboard')
    }
  }, [session, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      })

      if (result?.ok) {
        router.push('/dashboard')
      } else {
        toast.error('Invalid email or password. Please try again.')
      }
    } catch (err) {
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (session) return null

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="text-2xl">📦</div>
              <span className="text-xl font-bold">Inventory Management System</span>
            </div>
            <Badge variant="outline" className="text-xs">
              Professional Edition
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <section className="py-12 md:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900">
                    Streamline Your
                    <span className="text-primary block">Inventory Management</span>
                  </h1>
                  <p className="text-xl text-muted-foreground leading-relaxed">
                    Comprehensive solution for tracking inventory, managing workshops,
                    and organizing material distribution with real-time analytics and user management.
                  </p>
                </div>

                {/* Feature Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <div className="text-2xl">📊</div>
                    <div>
                      <h4 className="font-semibold text-blue-900">Real-time Analytics</h4>
                      <p className="text-sm text-blue-700">Live inventory tracking</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-green-50 border border-green-200">
                    <div className="text-2xl">👥</div>
                    <div>
                      <h4 className="font-semibold text-green-900">User Management</h4>
                      <p className="text-sm text-green-700">Role-based access control</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-purple-50 border border-purple-200">
                    <div className="text-2xl">🎪</div>
                    <div>
                      <h4 className="font-semibold text-purple-900">Workshop Tracking</h4>
                      <p className="text-sm text-purple-700">Event management</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-orange-50 border border-orange-200">
                    <div className="text-2xl">📦</div>
                    <div>
                      <h4 className="font-semibold text-orange-900">Smart Allocation</h4>
                      <p className="text-sm text-orange-700">Automated distribution</p>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center space-x-8 pt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">100%</div>
                    <div className="text-sm text-muted-foreground">Inventory Visibility</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">24/7</div>
                    <div className="text-sm text-muted-foreground">System Availability</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">Secure</div>
                    <div className="text-sm text-muted-foreground">Role-based Access</div>
                  </div>
                </div>
              </div>

              {/* Right Content - Login Card */}
              <div className="flex justify-center lg:justify-end">
                <Card className="w-full max-w-md shadow-lg border-2">
                  <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
                    <CardDescription className="text-base">
                      Sign in to access your inventory dashboard
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">

                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          disabled={isLoading}
                          className="h-11"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          disabled={isLoading}
                          className="h-11"
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full h-11 text-base font-semibold"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Signing in...</span>
                          </div>
                        ) : (
                          'Sign In'
                        )}
                      </Button>
                    </form>

                    <div className="text-center mt-6">
                      <Link
                        href="/auth/reset-password"
                        className="text-sm text-primary hover:text-primary/80 transition-colors"
                      >
                        Forgot your password?
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Benefits Section */}
          <section className="py-16 border-t bg-gray-50/50">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Why Choose Our System?</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Built specifically for organizations that need reliable inventory and workshop management
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-2xl">⚡</span>
                </div>
                <h3 className="text-xl font-semibold">Fast & Efficient</h3>
                <p className="text-muted-foreground">
                  Streamlined workflows that save time and reduce manual errors in inventory management.
                </p>
              </div>

              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-2xl">🔒</span>
                </div>
                <h3 className="text-xl font-semibold">Secure & Reliable</h3>
                <p className="text-muted-foreground">
                  Enterprise-grade security with role-based access control and data protection.
                </p>
              </div>

              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-2xl">📈</span>
                </div>
                <h3 className="text-xl font-semibold">Insightful Reports</h3>
                <p className="text-muted-foreground">
                  Comprehensive analytics and reporting to make data-driven decisions.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}