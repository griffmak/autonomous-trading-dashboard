'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const NAV_LINKS: Array<{ href: string; label: string }> = [
  { href: '/overview', label: 'Overview' },
  { href: '/signals', label: 'Signals' },
  { href: '/positions', label: 'Positions' },
  { href: '/history', label: 'History' },
  { href: '/performance', label: 'Performance' },
]

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await fetch('/api/auth', { method: 'DELETE' })
    } catch {
      // Even if the network call fails, push back to login so the user can retry.
    }
    router.push('/')
  }

  return (
    <nav className="bg-trading-slate border-b border-slate-800 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <span className="text-sm font-semibold text-white">Trading Dashboard</span>
        <div className="flex gap-6">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href
            const classes = isActive
              ? 'text-trading-accent'
              : 'text-slate-300 hover:text-white'
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? 'page' : undefined}
                className={classes}
              >
                {link.label}
              </Link>
            )
          })}
        </div>
      </div>
      <button
        type="button"
        onClick={handleLogout}
        className="!bg-transparent !text-slate-400 hover:!text-white !px-0"
      >
        Logout
      </button>
    </nav>
  )
}
