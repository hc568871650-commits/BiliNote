import { Folder, FolderOpen, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ALL_FOLDER_ID, DEFAULT_FOLDER_ID, useFolderStore } from '@/store/folderStore'
import type { Task } from '@/store/taskStore'

interface FolderSidebarProps {
  tasks: Task[]
  archived: boolean
  disabled: boolean
  onCreate: () => void
  onRename: (id: string) => void
  onDelete: (id: string) => void
}

const FolderSidebar = ({ tasks, archived, disabled, onCreate, onRename, onDelete }: FolderSidebarProps) => {
  const folders = useFolderStore(state => state.folders)
  const assignments = useFolderStore(state => state.assignments)
  const selectedFolderId = useFolderStore(state => state.selectedFolderId)
  const selectFolder = useFolderStore(state => state.selectFolder)
  const visibleTasks = tasks.filter(task => Boolean(task.archived_at) === archived)
  const count = (id: string) => id === ALL_FOLDER_ID
    ? visibleTasks.length
    : visibleTasks.filter(task => (assignments[task.id] || DEFAULT_FOLDER_ID) === id).length

  const folderRows = [{ id: ALL_FOLDER_ID, name: '全部笔记' }, ...folders]
  return <aside className="flex max-h-40 min-h-0 w-full shrink-0 flex-col border-b border-border pb-2">
    <div className="flex items-center justify-between px-1 pb-1">
      <span className="text-xs font-medium text-muted-foreground">逻辑文件夹</span>
      <Button type="button" size="sm" variant="ghost" className="h-7 w-7 p-0" disabled={disabled} onClick={onCreate} title="新建文件夹">
        <Plus className="h-4 w-4" />
      </Button>
    </div>
    <div className="flex min-h-0 min-w-0 flex-col gap-1 overflow-y-auto pb-1">
      {folderRows.map(folder => {
        const system = folder.id === DEFAULT_FOLDER_ID
        const selected = selectedFolderId === folder.id
        return <div key={folder.id} className={cn('group flex min-w-0 items-center rounded-md', selected && 'bg-accent')}>
          <button type="button" disabled={disabled} onClick={() => selectFolder(folder.id)}
            className="flex min-w-0 flex-1 items-center gap-1.5 px-2 py-1.5 text-left text-sm hover:bg-accent disabled:cursor-not-allowed">
            {selected ? <FolderOpen className="h-4 w-4 shrink-0 text-primary" /> : <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />}
            <span className="min-w-0 flex-1 truncate">{folder.name}</span>
            <span className="shrink-0 text-xs text-muted-foreground">{count(folder.id)}</span>
          </button>
          {!disabled && folder.id !== ALL_FOLDER_ID && !system && <div className="flex shrink-0 opacity-100 group-hover:opacity-100">
            <Button type="button" size="sm" variant="ghost" className="h-6 w-6 p-0" title="重命名文件夹" onClick={() => onRename(folder.id)}><Pencil className="h-3.5 w-3.5" /></Button>
            <Button type="button" size="sm" variant="ghost" className="h-6 w-6 p-0" title="删除文件夹" onClick={() => onDelete(folder.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
          </div>}
          {system && <MoreHorizontal className="mr-1 h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
        </div>
      })}
    </div>
  </aside>
}

export default FolderSidebar
