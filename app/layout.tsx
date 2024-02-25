import { GeistSans } from 'geist/font/sans'
import './globals.css'

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000'

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: 'Next.js and Supabase Starter Kit',
  description: 'The fastest way to build apps with Next.js and Supabase',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ colorScheme: 'dark' }} className={GeistSans.className}>
      <body className="bg-zinc-950 bg-[radial-gradient(circle_at_65%_25%,#18181b_60%,transparent)] text-zinc-50">
        <main className="flex h-dvh flex-col items-center">{children}</main>
      </body>
    </html>
  )
}
