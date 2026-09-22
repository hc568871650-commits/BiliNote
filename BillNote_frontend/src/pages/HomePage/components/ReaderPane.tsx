import { ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowUp, BookOpen, Expand, Minimize, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import './reader.css'

interface Props { taskId: string; versionId: string; content: string; title: string; children: ReactNode }
const SETTINGS_KEY = 'bilinote-reader-settings-v1'
function readJSON(key: string) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') } catch { return null }
}
function fingerprint(text: string) {
  let hash = 2166136261
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619)
  return (hash >>> 0).toString(36)
}

export default function ReaderPane({ taskId, versionId, content, title, children }: Props) {
  const viewport = useRef<HTMLDivElement>(null)
  const article = useRef<HTMLDivElement>(null)
  const [fontSize, setFontSize] = useState(() => {
    const size = readJSON(SETTINGS_KEY)?.fontSize
    return [14, 16, 18, 20, 22].includes(size) ? size : 16
  })
  const [wide, setWide] = useState(() => readJSON(SETTINGS_KEY)?.wide === true)
  const [focus, setFocus] = useState(false)
  const [progress, setProgress] = useState(0)
  const [savedProgress, setSavedProgress] = useState(0)
  const [storageError, setStorageError] = useState(false)
  const [headings, setHeadings] = useState<{ text: string; level: number; element: HTMLElement }[]>([])
  const readingKey = useMemo(() => `bilinote-reader-v1:${taskId}:${versionId}:${fingerprint(content)}`, [taskId, versionId, content])
  const characterCount = useMemo(() => content.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\s/g, '').length, [content])

  useEffect(() => {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify({ fontSize, wide })) } catch { setStorageError(true) }
  }, [fontSize, wide])

  useEffect(() => {
    const element = viewport.current
    if (!element) return
    const saved = readJSON(readingKey)
    setSavedProgress(typeof saved === 'number' && Number.isFinite(saved) ? Math.max(0, Math.min(1, saved)) : 0)
    element.scrollTop = 0
    setProgress(0)
    let latest: number | null = null
    let timer: ReturnType<typeof setTimeout> | undefined
    const save = () => {
      if (latest === null) return
      try { localStorage.setItem(readingKey, JSON.stringify(latest)) } catch { setStorageError(true) }
    }
    const update = () => {
      if (element.clientHeight === 0) return
      const max = element.scrollHeight - element.clientHeight
      latest = max > 0 ? Math.max(0, Math.min(1, element.scrollTop / max)) : 0
      setProgress(Math.round(latest * 100))
      clearTimeout(timer)
      timer = setTimeout(save, 400)
    }
    element.addEventListener('scroll', update, { passive: true })
    window.addEventListener('pagehide', save)
    return () => { clearTimeout(timer); save(); element.removeEventListener('scroll', update); window.removeEventListener('pagehide', save) }
  }, [readingKey])

  useEffect(() => {
    setHeadings(Array.from(article.current?.querySelectorAll<HTMLElement>('.markdown-body :is(h1,h2,h3,h4,h5,h6)') || []).map(element => ({
      text: element.textContent || '未命名章节', level: Number(element.tagName.slice(1)), element,
    })))
  }, [content])
  useEffect(() => {
    if (!focus) return
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setFocus(false) }
    window.addEventListener('keydown', escape)
    return () => window.removeEventListener('keydown', escape)
  }, [focus])

  return <section aria-label="笔记阅读器" className={focus ? 'fixed inset-3 z-40 flex min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-background shadow-2xl' : 'flex min-h-0 min-w-0 flex-1 flex-col'}>
    {focus && <div className="truncate border-b border-border px-4 py-2 text-sm font-medium">{title}</div>}
    <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border px-3 py-2 text-xs">
      <BookOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
      <select aria-label="跳转章节" defaultValue="" onChange={event => {
        if (event.target.value !== '') headings[Number(event.target.value)]?.element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        event.target.value = ''
      }} className="min-w-0 max-w-[200px] flex-1 rounded border border-input bg-background px-2 py-1.5">
        <option value="">目录 · {headings.length} 个章节</option>
        {headings.map((heading, index) => <option key={index} value={index}>{'　'.repeat(Math.min(heading.level - 1, 3))}{heading.text}</option>)}
      </select>
      <select aria-label="阅读字号" value={fontSize} onChange={event => setFontSize(Number(event.target.value))} className="rounded border border-input bg-background px-1 py-1.5">
        {[14, 16, 18, 20, 22].map(size => <option key={size} value={size}>{size}px</option>)}
      </select>
      <Button size="sm" variant="ghost" onClick={() => setWide(!wide)} aria-pressed={wide}>{wide ? '舒适宽度' : '铺满宽度'}</Button>
      <Button size="sm" variant="ghost" title={focus ? '退出专注阅读（Esc）' : '专注阅读'} aria-label={focus ? '退出专注阅读' : '专注阅读'} onClick={() => setFocus(!focus)}>{focus ? <Minimize className="h-4 w-4" /> : <Expand className="h-4 w-4" />}</Button>
      <Button size="sm" variant="ghost" title="回到顶部" aria-label="回到顶部" onClick={() => viewport.current?.scrollTo({ top: 0, behavior: 'smooth' })}><ArrowUp className="h-4 w-4" /></Button>
      <span className="text-muted-foreground">约 {Math.max(1, Math.ceil(characterCount / 500))} 分钟 · {progress}%</span>
    </div>
    {savedProgress > 0.02 && <div className="flex shrink-0 items-center gap-2 bg-muted/50 px-3 py-1.5 text-xs">
      <span className="flex-1 text-muted-foreground">上次读到 {Math.round(savedProgress * 100)}%</span>
      <button type="button" className="text-primary hover:underline" onClick={() => {
        const element = viewport.current
        if (element) element.scrollTo({ top: (element.scrollHeight - element.clientHeight) * savedProgress, behavior: 'smooth' })
        setSavedProgress(0)
      }}>继续阅读</button>
      <button type="button" aria-label="清除阅读位置" title="清除阅读位置" onClick={() => {
        try { localStorage.removeItem(readingKey); setSavedProgress(0); viewport.current?.scrollTo({ top: 0 }); setProgress(0) } catch { setStorageError(true) }
      }}><RotateCcw className="h-3.5 w-3.5" /></button>
    </div>}
    {storageError && <p className="px-3 py-1 text-xs text-amber-600">浏览器存储不可用，阅读位置和偏好可能无法保留。</p>}
    <div ref={viewport} data-testid="reader-viewport" className="min-h-0 flex-1 overflow-auto overscroll-contain">
      <div ref={article} className={`reader-body mx-auto w-full px-4 py-3 ${wide ? '' : 'max-w-[860px]'}`} style={{ fontSize }}>{children}</div>
    </div>
  </section>
}
