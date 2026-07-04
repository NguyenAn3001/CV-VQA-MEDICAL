import { UserCircle2 } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '../../store/authStore';

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <Navbar title="Profile" subtitle="Account identity and access level" />
      <div className="mx-auto w-full max-w-5xl px-6 py-8 lg:px-8">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-200">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                <UserCircle2 className="h-8 w-8" />
              </div>
              <div>
                <CardTitle className="text-2xl text-slate-900">{user?.username ?? 'User'}</CardTitle>
                <p className="mt-1 text-sm text-slate-500">{user?.role === 'admin' ? 'Administrator' : 'Clinical user'}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 pt-6 md:grid-cols-2">
            <Detail label="Username" value={user?.username || '-'} />
            <Detail label="Email" value={user?.email || '-'} />
            <Detail label="Role" value={user?.role || '-'} />
            <Detail label="Account status" value={user?.is_active ? 'Active' : 'Inactive'} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
      <div className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">{label}</div>
      <div className="mt-2 text-base font-medium text-slate-900">{value}</div>
    </div>
  );
}
