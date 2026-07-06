import { create } from 'zustand';
import api from '../lib/axios';

export interface Provider {
  id: string;
  name: string;
  type: string;
  baseUrl?: string;
  apiKey?: string;
  chatModel?: string;
  temperature: number;
  maxTokens: number;
  timeout: number;
  supportsToolCalling: boolean;
  enabled: boolean;
  isDefault: boolean;
  connectionStatus: string;
  created_at: string;
  updated_at: string;
}

export interface ProviderCreate extends Omit<Provider, 'id' | 'connectionStatus' | 'created_at' | 'updated_at'> {}

interface ProvidersState {
  providers: Provider[];
  isLoading: boolean;
  error: string | null;
  fetchProviders: () => Promise<void>;
  createProvider: (data: ProviderCreate) => Promise<boolean>;
  updateProvider: (id: string, data: Partial<ProviderCreate>) => Promise<boolean>;
  deleteProvider: (id: string) => Promise<boolean>;
  testConnection: (id: string) => Promise<{ success: boolean; message: string }>;
  reloadModels: (id: string) => Promise<{ success: boolean; models: string[] }>;
}

export const useProvidersStore = create<ProvidersState>((set, get) => ({
  providers: [],
  isLoading: false,
  error: null,

  fetchProviders: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/admin/providers');
      set({ providers: res.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch providers', isLoading: false });
    }
  },

  createProvider: async (data: ProviderCreate) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/admin/providers', data);
      await get().fetchProviders();
      return true;
    } catch (err: any) {
      set({ error: err.message || 'Failed to create provider', isLoading: false });
      return false;
    }
  },

  updateProvider: async (id: string, data: Partial<ProviderCreate>) => {
    set({ isLoading: true, error: null });
    try {
      await api.put(`/admin/providers/${id}`, data);
      await get().fetchProviders();
      return true;
    } catch (err: any) {
      set({ error: err.message || 'Failed to update provider', isLoading: false });
      return false;
    }
  },

  deleteProvider: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/admin/providers/${id}`);
      await get().fetchProviders();
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.detail || err.message || 'Failed to delete provider', isLoading: false });
      return false;
    }
  },

  testConnection: async (id: string) => {
    try {
      const res = await api.post(`/admin/providers/${id}/test-connection`);
      await get().fetchProviders(); // Refresh to get updated connectionStatus
      return { success: true, message: res.data.message || 'Connection successful' };
    } catch (err: any) {
      await get().fetchProviders();
      return { 
        success: false, 
        message: err.response?.data?.detail || err.message || 'Connection failed' 
      };
    }
  },

  reloadModels: async (id: string) => {
    try {
      const res = await api.post(`/admin/providers/${id}/models`);
      return { success: true, models: res.data.models || [] };
    } catch (err: any) {
      return { 
        success: false, 
        models: [] 
      };
    }
  }
}));
