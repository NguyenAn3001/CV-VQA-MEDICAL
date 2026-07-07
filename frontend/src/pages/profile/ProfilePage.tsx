import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Verified, Edit3, Camera, Loader2 } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '../../store/authStore';
import { useProfile } from '../../hooks/useProfile';

export default function ProfilePage() {
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const { profile, loading, fetchProfile, updateProfile, uploadAvatar } = useProfile();

  const [editOpen, setEditOpen] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editSpecialty, setEditSpecialty] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const openEdit = () => {
    setEditFullName(profile?.full_name ?? '');
    setEditBio(profile?.bio ?? '');
    setEditSpecialty(profile?.specialty ?? '');
    setEditOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({
        full_name: editFullName || null,
        bio: editBio || null,
        specialty: editSpecialty || null,
      });
      setEditOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadAvatar(file);
    } finally {
      setUploading(false);
    }
  };

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : null;

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <Navbar title="Profile" subtitle="Account identity and access level" />

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="mx-auto w-full max-w-4xl">
          {loading && !profile ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Profile Header Card */}
              <div className="mb-8 flex flex-col gap-6 rounded-xl border border-border-subtle bg-surface-white p-6 md:flex-row md:items-center">
                <div className="relative shrink-0">
                  <button
                    onClick={handleAvatarClick}
                    disabled={uploading}
                    className="group relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-secondary-container text-3xl font-bold text-on-secondary-container shadow-sm md:h-24 md:w-24"
                  >
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt="Avatar"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      profile?.username?.[0]?.toUpperCase() || 'U'
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                      {uploading ? (
                        <Loader2 className="h-6 w-6 animate-spin text-white" />
                      ) : (
                        <Camera className="h-6 w-6 text-white" />
                      )}
                    </div>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>

                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-3">
                    <h3 className="text-xl font-bold text-on-surface">
                      {profile?.full_name || profile?.username || 'User'}
                    </h3>
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary-fixed px-2 py-0.5 text-label-xs font-label-xs font-medium text-on-primary-fixed-variant">
                      <Verified className="h-3 w-3" />
                      Verified
                    </span>
                  </div>
                  <p className="mb-1 text-body-base font-body-base text-on-surface-variant">
                    {profile?.email || 'No email'}
                  </p>
                  <p className="mb-1 flex items-center gap-1 text-body-sm font-body-sm text-outline">
                    {profile?.role === 'admin' ? 'Administrator' : profile?.specialty || 'Radiologist'}
                  </p>
                  {memberSince && (
                    <p className="text-label-xs font-label-xs text-outline">Member since {memberSince}</p>
                  )}
                </div>

                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                  <DialogTrigger asChild>
                    <button
                      onClick={openEdit}
                      className="mt-4 flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-white px-4 py-2 text-label-md font-label-md font-medium text-on-surface shadow-sm transition-colors hover:bg-surface-container-lowest md:mt-0"
                    >
                      <Edit3 className="h-4 w-4" />
                      Edit Profile
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Edit Profile</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          value={editFullName}
                          onChange={(e) => setEditFullName(e.target.value)}
                          placeholder="Your full name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Input
                          id="bio"
                          value={editBio}
                          onChange={(e) => setEditBio(e.target.value)}
                          placeholder="Tell us about yourself"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="specialty">Specialty</Label>
                        <Input
                          id="specialty"
                          value={editSpecialty}
                          onChange={(e) => setEditSpecialty(e.target.value)}
                          placeholder="e.g. Radiology, Cardiology"
                        />
                      </div>
                      <div className="flex justify-end gap-3 pt-2">
                        <Button variant="outline" onClick={() => setEditOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={saving}>
                          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Save
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Account & Profile Grid */}
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
                        <p className="text-body-base font-body-base font-medium text-on-surface">
                          {profile?.full_name || '-'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="mb-1 text-label-xs font-label-xs uppercase tracking-wide text-outline">Username</p>
                        <p className="text-body-base font-body-base font-medium text-on-surface">
                          {profile?.username || '-'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="mb-1 text-label-xs font-label-xs uppercase tracking-wide text-outline">Email</p>
                        <p className="text-body-base font-body-base font-medium text-on-surface">
                          {profile?.email || '-'}
                        </p>
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

                {/* Profile Section */}
                <Card className="border-border-subtle bg-surface-white">
                  <div className="border-b border-border-subtle px-6 pb-3 pt-6">
                    <h4 className="flex items-center gap-2 text-lg font-semibold text-on-surface">Profile</h4>
                  </div>
                  <CardContent className="space-y-6 px-6 py-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="mb-1 text-label-xs font-label-xs uppercase tracking-wide text-outline">Specialty</p>
                        <p className="text-body-base font-body-base font-medium text-on-surface">
                          {profile?.specialty || '-'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="mb-1 text-label-xs font-label-xs uppercase tracking-wide text-outline">Bio</p>
                        <p className="text-body-base font-body-base font-medium text-on-surface">
                          {profile?.bio || '-'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="mb-1 text-label-xs font-label-xs uppercase tracking-wide text-outline">Role</p>
                        <p className="text-body-base font-body-base font-medium text-on-surface">
                          {profile?.role === 'admin' ? 'Administrator' : 'User'}
                        </p>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
