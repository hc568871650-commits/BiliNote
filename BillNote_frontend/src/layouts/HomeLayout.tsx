import React, { FC, useRef, useState } from 'react'
import { SlidersHorizontal, PanelLeftClose, PanelLeftOpen, History as HistoryIcon, FileText, SquarePen } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip.tsx'

import { Link } from 'react-router-dom'
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from '@/components/ui/resizable'
import { ScrollArea } from "@/components/ui/scroll-area.tsx"
import type { ImperativePanelHandle } from 'react-resizable-panels'
import logo from '@/assets/icon.svg'

interface IProps {
  NoteForm: React.ReactNode
  Preview: React.ReactNode
  History: React.ReactNode
}

const HomeLayout: FC<IProps> = ({ NoteForm, Preview, History }) => {
  const [, setShowSettings] = useState(false)
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false)
  const [isMiddleCollapsed, setIsMiddleCollapsed] = useState(false)
  const [mobileView, setMobileView] = useState<'create' | 'notes' | 'read'>('notes')
  const leftPanelRef = useRef<ImperativePanelHandle>(null)
  const middlePanelRef = useRef<ImperativePanelHandle>(null)

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <div className="flex h-full flex-col md:hidden">
        <nav className="flex h-12 shrink-0 border-b border-border bg-card" aria-label="工作区">
          {([
            ['create', SquarePen, '生成'],
            ['notes', HistoryIcon, '笔记'],
            ['read', FileText, '阅读'],
          ] as const).map(([key, Icon, label]) => (
            <button key={key} type="button" onClick={() => setMobileView(key)}
              aria-current={mobileView === key ? 'page' : undefined}
              className={`flex min-w-0 flex-1 items-center justify-center gap-1 border-b-2 text-sm ${mobileView === key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}>
              <Icon className="h-4 w-4" />{label}
            </button>
          ))}
          <Link to="/settings" aria-label="设置" title="设置"
            className="flex shrink-0 items-center justify-center gap-1 border-l border-border px-3 text-sm text-muted-foreground hover:text-primary">
            <SlidersHorizontal className="h-4 w-4" />设置
          </Link>
        </nav>
        <div className={`min-h-0 flex-1 overflow-auto p-2 ${mobileView === 'create' ? '' : 'hidden'}`}>{NoteForm}</div>
        <div className={`min-h-0 flex-1 overflow-auto p-2 ${mobileView === 'notes' ? '' : 'hidden'}`}>{History}</div>
        <div className={`min-h-0 flex-1 overflow-auto p-2 ${mobileView === 'read' ? '' : 'hidden'}`}>{Preview}</div>
      </div>
      <div className="hidden h-full w-full md:block">
      <ResizablePanelGroup direction="horizontal" className="h-full w-full">
        {/* 左边表单 */}
        <ResizablePanel
          ref={leftPanelRef}
          defaultSize={23}
          minSize={10}
          maxSize={35}
          collapsible
          collapsedSize={0}
          onCollapse={() => setIsLeftCollapsed(true)}
          onExpand={() => setIsLeftCollapsed(false)}
        >
          <aside className="flex h-full flex-col overflow-hidden border-r border-border bg-card">
            <header className="flex h-16 items-center justify-between px-6">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl">
                  <img src={logo} alt="logo" className="h-full w-full object-contain" />
                </div>
                <div className="text-2xl font-bold text-foreground">BiliNote</div>
              </div>
              <div className="flex items-center gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => leftPanelRef.current?.collapse()}
                        className="text-muted-foreground hover:text-primary cursor-pointer rounded p-1 hover:bg-accent"
                      >
                        <PanelLeftClose className="h-5 w-5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <span>收起工作区</span>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger onClick={() => setShowSettings(true)}>
                      <Link to={'/settings'}>
                        <SlidersHorizontal className="text-muted-foreground hover:text-primary cursor-pointer" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>
                      <span>全局配置</span>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </header>
            <ScrollArea className="flex-1 overflow-auto">
              <div className="p-4">{NoteForm}</div>
            </ScrollArea>
          </aside>
        </ResizablePanel>

        <ResizableHandle />

        {/* 左面板折叠时的展开按钮 */}
        {isLeftCollapsed && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => leftPanelRef.current?.expand()}
                  className="flex h-full w-8 shrink-0 items-center justify-center border-r border-border bg-card hover:bg-accent"
                >
                  <PanelLeftOpen className="h-4 w-4 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <span>展开工作区</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* 中间历史 */}
        <ResizablePanel
          ref={middlePanelRef}
          defaultSize={16}
          minSize={10}
          maxSize={30}
          collapsible
          collapsedSize={0}
          onCollapse={() => setIsMiddleCollapsed(true)}
          onExpand={() => setIsMiddleCollapsed(false)}
        >
          <aside className="flex h-full flex-col overflow-hidden border-r border-border bg-card">
            <header className="flex h-10 shrink-0 items-center justify-end border-b border-border px-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => middlePanelRef.current?.collapse()}
                      className="text-muted-foreground hover:text-primary cursor-pointer rounded p-1 hover:bg-accent"
                    >
                      <PanelLeftClose className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <span>收起笔记</span>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </header>
            <ScrollArea className="flex-1 overflow-auto">
              <div>{History}</div>
            </ScrollArea>
          </aside>
        </ResizablePanel>

        <ResizableHandle />

        {/* 中间面板折叠时的展开按钮 */}
        {isMiddleCollapsed && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => middlePanelRef.current?.expand()}
                  className="flex h-full w-8 shrink-0 items-center justify-center border-r border-border bg-card hover:bg-accent"
                >
                  <HistoryIcon className="h-4 w-4 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <span>展开笔记</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* 右边预览 */}
        <ResizablePanel defaultSize={61} minSize={30}>
          <main className="flex h-full flex-col overflow-hidden bg-background p-6">{Preview}</main>
        </ResizablePanel>
      </ResizablePanelGroup>
      </div>
    </div>
  )
}

export default HomeLayout
