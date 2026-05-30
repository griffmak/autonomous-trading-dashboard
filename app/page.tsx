'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (!res.ok) {
        let message = 'Authentication failed'
        try {
          const data = await res.json()
          if (data?.error) message = data.error
        } catch {
          // non-JSON body — keep default message
        }
        setError(message)
        return
      }

      // Redirect to overview on success
      router.push('/overview')
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-trading-dark">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-4 bg-trading-slate p-8 rounded"
      >
        <h1 className="text-2xl font-bold text-white">Trading Dashboard</h1>

        <input
          type="password"
          placeholder="Enter dashboard password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          className="w-full"
        />

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-trading-accent hover:bg-sky-600 disabled:opacity-50"
        >
          {loading ? 'Authenticating...' : 'Login'}
        </button>
      </form>
    </div>
  )
}
