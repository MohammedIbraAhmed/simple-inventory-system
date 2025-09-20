'use client'

import { signIn, getSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  useEffect(() => {
    getSession().then(session => {
      if (session) {
        router.push('/')
      }
    })
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false
    })

    if (result?.ok) {
      router.push('/')
    } else {
      alert('Invalid credentials')
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '100px auto' }}>
      <h1>Sign In</h1>
      <p>Use: admin@inventory.com / admin</p>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', padding: '10px', margin: '5px 0' }}
            required
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '10px', margin: '5px 0' }}
            required
          />
        </div>
        <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#007cba', color: 'white' }}>
          Sign In
        </button>
      </form>
      <div style={{ textAlign: 'center', marginTop: '15px' }}>
        <Link href="/auth/reset-password" style={{ color: '#007cba', textDecoration: 'none', fontSize: '14px' }}>
          Forgot your password?
        </Link>
      </div>
    </div>
  )
}