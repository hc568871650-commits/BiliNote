import { useTaskStore } from '@/store/taskStore'
import { useFolderStore, ALL_FOLDER_ID, DEFAULT_FOLDER_ID } from '@/store/folderStore'
import { useLibraryStore, defaultLibraryEntry } from '@/store/libraryStore'
import { Badge } from '@/components/ui/badge.tsx'
import { cn } from '@/lib/utils.ts'
import { Archive, CheckSquare, FolderInput, RotateCcw, Square, Trash2, Star, Pin, Pencil, X } from 'lucide-react'
import { Button } from '@/components/ui/button.tsx'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip.tsx'
import LazyImage from '@/components/LazyImage.tsx'
import { FC, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import MoveNotesDialog from '@/pages/HomePage/components/MoveNotesDialog.tsx'
import LibraryMetadataDialog from '@/pages/HomePage/components/LibraryMetadataDialog.tsx'
import { defaultLibraryFilters, filterAndSortLibraryTasks, type LibraryFilters } from '@/utils/libraryFilters'
import type { LearningStatus } from '@/services/noteLibrary'

interface NoteHistoryProps { onSelect: (taskId: string) => void; selectedId: string | null; archived: boolean; foldersReady: boolean }
const learningLabels: Record<LearningStatus, string> = { unread: '未学习', learning: '学习中', done: '已学完' }

const NoteHistory: FC<NoteHistoryProps> = ({ onSelect, selectedId, archived, foldersReady }) => {
  const tasks = useTaskStore(state => state.tasks)
  const removeTask = useTaskStore(state => state.removeTask)
  const archiveTask = useTaskStore(state => state.archiveTask)
  const restoreTask = useTaskStore(state => state.restoreTask)
  const folders = useFolderStore(state => state.folders)
  const assignments = useFolderStore(state => state.assignments)
  const folderId = useFolderStore(state => state.selectedFolderId)
  const moveTasks = useFolderStore(state => state.moveTasks)
  const entries = useLibraryStore(state => state.entries)
  const libraryLoadState = useLibraryStore(state => state.loadState)
  const libraryError = useLibraryStore(state => state.errorMessage)
  const libraryMutating = useLibraryStore(state => state.isMutating)
  const loadLibrary = useLibraryStore(state => state.loadLibrary)
  const updateEntries = useLibraryStore(state => state.updateEntries)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [filters, setFilters] = useState<LibraryFilters>(defaultLibraryFilters)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [moveOpen, setMoveOpen] = useState(false)
  const [moveBusy, setMoveBusy] = useState(false)
  const [metadataId, setMetadataId] = useState<string | null>(null)
  const [metadataBusy, setMetadataBusy] = useState(false)
  const baseURL = String(import.meta.env.VITE_API_BASE_URL || 'api').replace(/\/$/, '')

  useEffect(() => { void loadLibrary().catch(() => undefined) }, [loadLibrary])
  const visibleTasks = useMemo(() => tasks.filter(task => Boolean(task.archived_at) === archived && (folderId === ALL_FOLDER_ID || (assignments[task.id] || DEFAULT_FOLDER_ID) === folderId)), [tasks, archived, folderId, assignments])
  const filteredTasks = useMemo(() => filterAndSortLibraryTasks(visibleTasks, entries, filters), [visibleTasks, entries, filters])
  const filteredIds = useMemo(() => new Set(filteredTasks.map(task => task.id)), [filteredTasks])
  useEffect(() => { setSelectedIds([]); setMoveOpen(false) }, [archived, folderId, filters])
  useEffect(() => { setSelectedIds(current => current.filter(id => filteredIds.has(id))) }, [filteredIds])

  const perform = async (id: string, action: () => Promise<void>, success: string) => {
    if (busyId) return
    setBusyId(id)
    try { await action(); toast.success(success) } catch (error) { console.error('笔记操作失败', error); toast.error('操作失败，请稍后重试') } finally { setBusyId(null) }
  }
  const updateMetadata = async (taskIds: string[], changes: Parameters<typeof updateEntries>[1], success: string) => {
    try { await updateEntries(taskIds, changes); toast.success(success) } catch (error) { console.error('更新笔记库信息失败', error); toast.error('保存失败，请稍后重试') }
  }
  const toggleSelected = (id: string) => setSelectedIds(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id])
  const moveSelected = async (targetFolderId: string) => {
    if (!selectedIds.length || !foldersReady) return
    setMoveBusy(true)
    try { await moveTasks(selectedIds, targetFolderId); setSelectedIds([]); setMoveOpen(false); toast.success('笔记已移动') } catch (error) { console.error('移动笔记失败', error) } finally { setMoveBusy(false) }
  }
  const metadataTask = tasks.find(task => task.id === metadataId)
  const hasActiveFilters = Boolean(filters.search || filters.favoriteOnly || filters.learningStatus !== 'all' || filters.taskStatus !== 'all')
  const libraryReady = libraryLoadState === 'ready' && !libraryMutating

  return <>
    <div className="mb-2 flex flex-wrap items-center gap-2">
      <input type="search" placeholder="搜索标题、标签或备注..." className="select-text min-w-0 flex-1 basis-40 rounded border border-input bg-background px-3 py-1 text-sm outline-none focus:border-primary" value={filters.search} onChange={event => setFilters(current => ({ ...current, search: event.target.value }))} />
      <select aria-label="学习状态筛选" disabled={!libraryReady} className="max-w-24 rounded border border-input bg-background px-2 py-1 text-xs" value={filters.learningStatus} onChange={event => setFilters(current => ({ ...current, learningStatus: event.target.value as LibraryFilters['learningStatus'] }))}><option value="all">全部学习</option><option value="unread">未学习</option><option value="learning">学习中</option><option value="done">已学完</option></select>
      <select aria-label="任务状态筛选" className="max-w-24 rounded border border-input bg-background px-2 py-1 text-xs" value={filters.taskStatus} onChange={event => setFilters(current => ({ ...current, taskStatus: event.target.value as LibraryFilters['taskStatus'] }))}><option value="all">全部任务</option><option value="complete">生成完成</option><option value="pending">进行中</option><option value="failed">失败</option></select>
      <select aria-label="排序" className="max-w-24 rounded border border-input bg-background px-2 py-1 text-xs" value={filters.sort} onChange={event => setFilters(current => ({ ...current, sort: event.target.value as LibraryFilters['sort'] }))}><option value="newest">最新</option><option value="oldest">最旧</option><option value="title">标题</option></select>
      <Button type="button" size="sm" variant={filters.favoriteOnly ? 'default' : 'outline'} disabled={!libraryReady} title="只看收藏" onClick={() => setFilters(current => ({ ...current, favoriteOnly: !current.favoriteOnly }))}><Star className="h-4 w-4" /></Button>
      <Button type="button" size="sm" variant="ghost" title="清空筛选" onClick={() => setFilters(defaultLibraryFilters)}><X className="h-4 w-4" /></Button>
    </div>
    <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span>共 {filteredTasks.length} 篇</span>{libraryLoadState === 'error' && <span className="flex items-center gap-1 text-destructive">{libraryError}<Button size="sm" variant="outline" disabled={libraryMutating} onClick={() => void loadLibrary().catch(() => undefined)}>重试</Button></span>}{filteredTasks.length > 0 && <Button type="button" size="sm" variant="ghost" onClick={selectedIds.length === filteredTasks.length ? () => setSelectedIds([]) : () => setSelectedIds(filteredTasks.map(task => task.id))}>{selectedIds.length === filteredTasks.length ? '取消全选' : '全选结果'}</Button>}{selectedIds.length > 0 && <><Button type="button" size="sm" variant="outline" disabled={!foldersReady} onClick={() => setMoveOpen(true)}><FolderInput className="h-4 w-4" />移动</Button><select aria-label="批量学习状态" disabled={!libraryReady} className="rounded border border-input bg-background px-2 py-1" defaultValue="" onChange={event => { const status = event.target.value as LearningStatus; if (status) void updateMetadata(selectedIds, { learning_status: status }, '学习状态已更新'); event.currentTarget.value = '' }}><option value="" disabled>批量学习状态</option><option value="unread">未学习</option><option value="learning">学习中</option><option value="done">已学完</option></select></>}</div>
    {filteredTasks.length === 0 ? <div className="rounded-md border border-border bg-muted py-6 text-center"><p className="text-sm text-muted-foreground">{hasActiveFilters ? '没有匹配的笔记' : archived ? '归档区暂无笔记' : '此文件夹暂无笔记'}</p></div> : <div className="flex flex-col gap-2 overflow-hidden">{filteredTasks.map(task => {
      const entry = entries[task.id] || defaultLibraryEntry()
      return <div key={task.id} onClick={() => onSelect(task.id)} className={cn('flex cursor-pointer flex-col rounded-md border border-border p-3', selectedId === task.id && 'border-primary bg-primary-light')}>
        <div className="flex min-w-0 items-center gap-2"><button type="button" title={selectedIds.includes(task.id) ? '取消选择' : '选择笔记'} className="shrink-0 text-muted-foreground" onClick={event => { event.stopPropagation(); toggleSelected(task.id) }}>{selectedIds.includes(task.id) ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}</button>{task.audioMeta?.platform === 'local' ? <img src={task.audioMeta.cover_url || '/placeholder.png'} alt="封面" className="h-10 w-12 shrink-0 rounded-md object-cover" /> : <LazyImage src={task.audioMeta?.cover_url ? `${baseURL}/image_proxy?url=${encodeURIComponent(task.audioMeta.cover_url)}` : '/placeholder.png'} alt="封面" />}<TooltipProvider><Tooltip><TooltipTrigger asChild><div className="min-w-0 flex-1 line-clamp-2 text-sm">{task.audioMeta?.title || '未命名笔记'}</div></TooltipTrigger><TooltipContent><p>{task.audioMeta?.title || '未命名笔记'}</p></TooltipContent></Tooltip></TooltipProvider></div>
        <div className="mt-2 flex min-w-0 flex-wrap items-center gap-1 text-[10px]"><div>{task.status === 'SUCCESS' && <span className="rounded bg-primary px-1.5 py-0.5 text-white">生成完成</span>}{!['SUCCESS', 'FAILED'].includes(task.status) && <span className="rounded bg-green-500 px-1.5 py-0.5 text-white">等待中</span>}{task.status === 'FAILED' && <span className="rounded bg-red-500 px-1.5 py-0.5 text-white">失败</span>}</div>{entry.favorite && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />}{entry.pinned && <Pin className="h-3.5 w-3.5 text-primary" />}{entry.tags.map(tag => <Badge key={tag} variant="secondary" className="max-w-20 truncate px-1 py-0 text-[10px]">{tag}</Badge>)}<span className="ml-auto text-muted-foreground">{learningLabels[entry.learning_status]}</span></div>
        <div className="mt-1 flex flex-wrap items-center justify-end gap-1">{archived && <Badge variant="outline">已归档</Badge>}<Button type="button" size="sm" variant="ghost" disabled={!libraryReady} title={entry.favorite ? '取消收藏' : '收藏'} onClick={event => { event.stopPropagation(); void updateMetadata([task.id], { favorite: !entry.favorite }, entry.favorite ? '已取消收藏' : '已收藏') }}><Star className={cn('h-4 w-4', entry.favorite && 'fill-amber-400 text-amber-500')} /></Button><Button type="button" size="sm" variant="ghost" disabled={!libraryReady} title={entry.pinned ? '取消置顶' : '置顶'} onClick={event => { event.stopPropagation(); void updateMetadata([task.id], { pinned: !entry.pinned }, entry.pinned ? '已取消置顶' : '已置顶') }}><Pin className={cn('h-4 w-4', entry.pinned && 'text-primary')} /></Button><Button type="button" size="sm" variant="ghost" disabled={!libraryReady} title="编辑标签、备注和学习状态" onClick={event => { event.stopPropagation(); setMetadataId(task.id) }}><Pencil className="h-4 w-4" /></Button><Button type="button" size="sm" variant="ghost" disabled={!foldersReady} title="移动笔记" onClick={event => { event.stopPropagation(); setSelectedIds([task.id]); setMoveOpen(true) }}><FolderInput className="h-4 w-4 text-muted-foreground" /></Button><TooltipProvider><Tooltip><TooltipTrigger asChild><Button type="button" size="sm" variant="ghost" disabled={busyId === task.id || !['SUCCESS', 'FAILED'].includes(task.status)} onClick={event => { event.stopPropagation(); if (archived) void perform(task.id, () => restoreTask(task.id), '笔记已恢复'); else void perform(task.id, () => archiveTask(task.id), '笔记已归档') }}>{archived ? <RotateCcw className="h-4 w-4 text-muted-foreground" /> : <Archive className="h-4 w-4 text-muted-foreground" />}</Button></TooltipTrigger><TooltipContent><p>{archived ? '恢复' : '归档'}</p></TooltipContent></Tooltip></TooltipProvider>{archived && <Button type="button" size="sm" variant="ghost" title="彻底删除" disabled={busyId === task.id || !['SUCCESS', 'FAILED'].includes(task.status)} onClick={event => { event.stopPropagation(); setConfirmId(task.id) }}><Trash2 className="h-4 w-4 text-red-600" /></Button>}</div>
      </div>
    })}</div>}
    <MoveNotesDialog open={moveOpen} folders={folders} count={selectedIds.length} busy={moveBusy} onOpenChange={open => { if (!moveBusy) setMoveOpen(open) }} onMove={target => void moveSelected(target)} />
    {metadataTask && <LibraryMetadataDialog open={Boolean(metadataId)} title={metadataTask.audioMeta?.title || '未命名笔记'} entry={entries[metadataTask.id] || defaultLibraryEntry()} busy={metadataBusy} onOpenChange={open => { if (!open && !metadataBusy) setMetadataId(null) }} onSave={changes => { setMetadataBusy(true); void updateEntries([metadataTask.id], changes).then(() => { toast.success('学习信息已保存'); setMetadataId(null) }).catch(error => { console.error('保存学习信息失败', error); toast.error('保存失败，请稍后重试') }).finally(() => setMetadataBusy(false)) }} />}
    <Dialog open={Boolean(confirmId)} onOpenChange={open => { if (!open && !busyId) setConfirmId(null) }}><DialogContent onEscapeKeyDown={event => { if (busyId) event.preventDefault() }} onPointerDownOutside={event => { if (busyId) event.preventDefault() }}><DialogHeader><DialogTitle>彻底删除笔记？</DialogTitle><DialogDescription>将永久删除《{tasks.find(task => task.id === confirmId)?.audioMeta?.title || '未命名笔记'}》的笔记、历史版本、配图及关联记录，无法通过归档区恢复。不会删除原始视频和共享音视频缓存。</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" disabled={Boolean(busyId)} onClick={() => setConfirmId(null)}>取消</Button><Button variant="destructive" disabled={Boolean(busyId)} onClick={() => { if (!confirmId) return; const id = confirmId; setBusyId(id); void removeTask(id).then(() => { toast.success('笔记已彻底删除'); setConfirmId(null) }).catch(error => { console.error('删除失败', error); toast.error('删除失败，请稍后重试') }).finally(() => setBusyId(null)) }}>{busyId ? '删除中…' : '彻底删除'}</Button></DialogFooter></DialogContent></Dialog>
  </>
}

export default NoteHistory
