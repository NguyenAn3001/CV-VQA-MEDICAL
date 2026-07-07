import { useNavigate } from 'react-router-dom';
import { LogOut, Verified, Edit3 } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '../../store/authStore';

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <Navbar title="Profile" subtitle="Account identity and access level" />

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="mx-auto w-full max-w-4xl">
          {/* Profile Header Card */}
          <div className="mb-8 flex flex-col gap-6 rounded-xl border border-border-subtle bg-surface-white p-6 md:flex-row md:items-center">
            <div className="relative shrink-0">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary-container text-3xl font-bold text-on-secondary-container shadow-sm md:h-24 md:w-24">
                {user?.username?.[0]?.toUpperCase() || 'U'}
              </div>
            </div>

            <div className="flex-1">
              <div className="mb-1 flex items-center gap-3">
                <h3 className="text-xl font-bold text-on-surface">{user?.username ?? 'User'}</h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-primary-fixed px-2 py-0.5 text-label-xs font-label-xs font-medium text-on-primary-fixed-variant">
                  <Verified className="h-3 w-3" />
                  Verified
                </span>
              </div>
              <p className="mb-1 text-body-base font-body-base text-on-surface-variant">{user?.email || 'No email'}</p>
              <p className="mb-1 flex items-center gap-1 text-body-sm font-body-sm text-outline">
                {user?.role === 'admin' ? 'Administrator' : 'Radiologist'}
              </p>
              <p className="text-label-xs font-label-xs text-outline">Member since January 2025</p>
            </div>

            <button className="mt-4 flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-white px-4 py-2 text-label-md font-label-md font-medium text-on-surface shadow-sm transition-colors hover:bg-surface-container-lowest md:mt-0">
              <Edit3 className="h-4 w-4" />
              Edit Profile
            </button>
          </div>

          {/* Account & Preferences Grid */}
          <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Account Section */}
            <Card className="border-border-subtle bg-surface-white">
              <div className="border-b border-border-subtle px-6 pb-3 pt-6">
                <h4 className="flex items-center gap-2 text-lg font-semibold text-on-surface">Account</h4>
              </div>
              <CardContent className="space-y-6 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="mb-1 text-label-xs font-label-xs uppercase tracking-wide text-outline">Full Name</p>
                    <p className="text-body-base font-body-base font-medium text-on-surface">{user?.username || '-'}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="mb-1 text-label-xs font-label-xs uppercase tracking-wide text-outline">Email</p>
                    <p className="text-body-base font-body-base font-medium text-on-surface">{user?.email || '-'}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-border-subtle/50 pt-5">
                  <div>
                    <p className="mb-1 text-label-xs font-label-xs uppercase tracking-wide text-outline">Password</p>
                    <p className="mt-1 font-mono tracking-widest text-on-surface">••••••••</p>
                  </div>
                  <button
                    onClick={() => navigate('/change-password')}
                    className="text-label-md font-label-md font-medium text-primary transition-colors hover:text-on-primary-fixed-variant"
                  >
                    Change
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Preferences Section */}
            <Card className="border-border-subtle bg-surface-white">
              <div className="border-b border-border-subtle px-6 pb-3 pt-6">
                <h4 className="flex items-center gap-2 text-lg font-semibold text-on-surface">Preferences</h4>
              </div>
              <CardContent className="space-y-6 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="mb-1 text-label-xs font-label-xs uppercase tracking-wide text-outline">Language</p>
                    <p className="text-body-base font-body-base font-medium text-on-surface">English</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="mb-1 text-label-xs font-label-xs uppercase tracking-wide text-outline">Timezone</p>
                    <p className="text-body-base font-body-base font-medium text-on-surface">(UTC+7) Bangkok, Hanoi, Jakarta</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sign Out */}
          <div className="flex justify-end">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-label-md font-label-md text-error transition-colors hover:bg-error-container hover:text-on-error-container"
            >
              <LogOut className="h-[18px] w-[18px]" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
