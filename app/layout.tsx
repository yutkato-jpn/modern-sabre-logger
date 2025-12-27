import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Modern Sabre AI Logger',
  description: 'フェンシング試合記録・分析アプリ',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <head>
        <link 
          href="https://cdn.jsdelivr.net/npm/digital-7-font@1.0.0/dist/digital-7.css" 
          rel="stylesheet" 
        />
      </head>
      <body className="font-sans bg-black text-white min-h-screen">
        {children}
      </body>
    </html>
  )
}

