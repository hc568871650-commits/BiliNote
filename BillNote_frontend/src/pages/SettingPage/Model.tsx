import Provider from '@/components/Form/modelForm/Provider.tsx'
import { Outlet } from 'react-router-dom'

const Model = () => {
  return (
    <div className="flex min-h-full min-w-0 flex-col bg-background lg:h-full lg:min-h-0 lg:flex-row">
      <div className="min-w-0 shrink-0 border-b border-border p-3 lg:w-60 lg:overflow-y-auto lg:border-r lg:border-b-0">
        <Provider></Provider>
      </div>
      <div className="min-w-0 flex-1 lg:overflow-y-auto">
        <Outlet />
      </div>
    </div>
  )
}
export default Model
