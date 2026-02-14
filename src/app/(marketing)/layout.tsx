
import Link from "next/link"

interface MarketingLayoutProps {
  children: React.ReactNode
}

export const dynamic = 'force-dynamic'

export default function MarketingLayout({
  children,
}: MarketingLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="container z-40 bg-background">
        <div className="flex h-20 items-center justify-between py-6">
          <div className="flex gap-6 md:gap-10">
            <Link href="/" className="hidden items-center space-x-2 md:flex">
              <span className="hidden font-bold sm:inline-block">
                SocialManager
              </span>
            </Link>
          </div>
          <nav>
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Login
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="container py-6 md:px-8 md:py-0">
        <div className="flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built by <a href="#" target="_blank" rel="noreferrer" className="font-medium underline underline-offset-4">You</a>. The source code is available on <a href="#" target="_blank" rel="noreferrer" className="font-medium underline underline-offset-4">GitHub</a>.
          </p>
        </div>
      </footer>
    </div>
  )
}
