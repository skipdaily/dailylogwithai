import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { NavigationProvider } from '@/contexts/NavigationContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Construction Daily Logs',
  description: 'A daily log application for construction projects',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NavigationProvider>
          {children}
        </NavigationProvider>
      </body>
    </html>
  )
}
