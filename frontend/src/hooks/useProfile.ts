import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import api from '../lib/axios';
import { useAuthStore } from '../store/authStore';
import type { ProfileResponse, ProfileUpdate } from '../types/api';

export function useProfile() {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const setUser = useAuthStore((state) => state.setUser);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<ProfileResponse>('/profile');
      setProfile(data);
      setUser({
        id: data.id,
        username: data.username,
        email: data.email,
        role: data.role as 'user' | 'admin',
        is_active: data.is_active,
        full_name: data.full_name,
        avatar_url: data.avatar_url,
        bio: data.bio,
        specialty: data.specialty,
        must_change_password: data.must_change_password,
        created_at: data.created_at,
        updated_at: data.updated_at,
      });
    } catch {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [setUser]);

  const updateProfile = useCallback(
    async (updates: ProfileUpdate) => {
      try {
        const { data } = await api.put<ProfileResponse>('/profile', updates);
        setProfile(data);
        await fetchProfile();
        toast.success('Profile updated');
        return data;
      } catch {
        toast.error('Failed to update profile');
        throw new Error('Failed to update profile');
      }
    },
    [fetchProfile]
  );

  const uploadAvatar = useCallback(
    async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const { data } = await api.post<{ avatar_url: string }>('/profile/avatar', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        await fetchProfile();
        toast.success('Avatar updated');
        return data.avatar_url;
      } catch {
        toast.error('Failed to upload avatar');
        throw new Error('Failed to upload avatar');
      }
    },
    [fetchProfile]
  );

  return { profile, loading, fetchProfile, updateProfile, uploadAvatar };
}
