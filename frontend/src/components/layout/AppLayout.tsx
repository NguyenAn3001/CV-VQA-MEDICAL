import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function AppLayout() {
  return (
    <div className="min-h-[100dvh] bg-[#f7f9fb] text-slate-900">
      <div className="mx-auto flex min-h-[100dvh] max-w-[1600px]">
        <Sidebar />
        <main className="min-w-0 flex-1 bg-white">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
