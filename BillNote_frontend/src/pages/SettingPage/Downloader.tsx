import { Outlet } from 'react-router-dom'
import Options from '@/components/Form/DownloaderForm/Options.tsx'
import ProxyConfig from '@/components/Form/DownloaderForm/ProxyConfig.tsx'
const Downloader = () => {
  return (
    <div className="flex min-h-full min-w-0 flex-col bg-background lg:h-full lg:min-h-0 lg:flex-row">
      <div className="flex min-w-0 shrink-0 flex-col gap-3 border-b border-border p-3 lg:w-72 lg:overflow-y-auto lg:border-r lg:border-b-0">
        <ProxyConfig />
        <Options></Options>
      </div>
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  )
}
export default Downloader
