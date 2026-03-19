import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'

import './globals.css'

export const metadata: Metadata = {
  title: 'AI CCTV Employee Finder System',
  description: 'Register employees with face scans and find them across multiple cameras.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#0f1c24',
              color: '#f3f7fa',
              border: '1px solid rgba(255,255,255,0.08)',
            },
          }}
        />
      </body>
    </html>
  )
}
