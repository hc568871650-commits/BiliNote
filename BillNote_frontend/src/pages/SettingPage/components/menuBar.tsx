import styles from './index.module.css'
import { FC, JSX } from 'react'
import { Link, useLocation } from 'react-router-dom'

export interface IMenuProps {
  id: string
  name: string
  icon: JSX.Element
  path: string
}

interface IMenuItem {
  menuItem: IMenuProps
}

const MenuBar: ({ menuItem }: { menuItem: any }) => JSX.Element = ({ menuItem }) => {
  const location = useLocation()
  const isActive =
    location.pathname.startsWith(menuItem.path + '/') || location.pathname === menuItem.path

  return (
    <Link to={menuItem.path} className="shrink-0 lg:w-full">
      <div
        className={
          styles.menuBar +
          ' flex h-10 items-center gap-2 whitespace-nowrap rounded px-3 lg:h-12 lg:w-full lg:px-2' +
          (isActive ? ' bg-accent font-semibold text-primary' : '')
        }
      >
        <div className="h-5 w-5 shrink-0 lg:h-6 lg:w-6">{menuItem.icon}</div>
        <div className="text-sm lg:text-[16px]">{menuItem.name}</div>
      </div>
    </Link>
  )
}

export default MenuBar
