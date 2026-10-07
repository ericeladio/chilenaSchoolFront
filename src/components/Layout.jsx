import { Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import RightPanel from './RightPanel'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import WebChat from './WebChat'

export default function Layout({ withRightPanel = false }) {
  const { user } = useAuth()
  return (
    <div className="min-h-screen rounded-[64px] bg-[#EDF7FF] px-[38px] pb-[38px] pt-[37px]">
      <div className="relative">
        <div
          className={`grid h-[calc(100vh-75px)] ${
            withRightPanel ? 'grid-cols-[20%_60%_20%]' : 'grid-cols-[20%_80%]'
          }`}
        >
          <div className="min-h-0 pr-[38px]">
            <Sidebar />
          </div>
          <div className={withRightPanel ? 'min-h-0' : 'min-h-0 pl-[38px]'}>
            <Outlet />
          </div>
          {withRightPanel && (
            <div className="flex min-h-0 flex-col pl-[38px]">
              <RightPanel />
            </div>
          )}
        </div>
        <TopBar />
      </div>
      {user && <WebChat />}
    </div>
  )
}
