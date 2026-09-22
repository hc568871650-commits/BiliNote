import type { ReactNode, FC } from 'react'
// import "@/global.css"
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from 'next-themes'
import ThemeToggle from '@/components/ThemeToggle'

interface RootLayoutProps {
  children: ReactNode
}

export const metadata = {
  title: 'BiliNote - 视频笔记生成器',
  description: '通过视频链接结合大模型自动生成对应的笔记',
}

const RootLayout: FC<RootLayoutProps> = ({ children }) => {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="bilinote-theme">
      <div className="min-h-screen bg-background font-sans text-foreground">
        <Toaster
          position="top-center" // 顶部居中显示
          toastOptions={{
            style: {
              borderRadius: '8px',
              background: 'var(--card)',
              color: 'var(--card-foreground)',
              border: '1px solid var(--border)',
            },
          }}
        />
        {children}
        <ThemeToggle />
      </div>
    </ThemeProvider>
  )
}

export default RootLayout
