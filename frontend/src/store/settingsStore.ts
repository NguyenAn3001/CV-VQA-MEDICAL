import { create } from 'zustand';
import api from '../lib/axios';
import { type SettingsFormValues } from '../components/admin/settingsSchema';

interface SettingsState {
  settings: SettingsFormValues | null;
  isLoading: boolean;
  error: string | null;
  fetchSettings: () => Promise<void>;
  updateSettings: (data: SettingsFormValues) => Promise<boolean>;
  testConnection: (data: SettingsFormValues) => Promise<{ success: boolean; message: string }>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: null,
  isLoading: false,
  error: null,

  fetchSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/admin/settings');
      
      // Map API response to Form Values
      const mappedData: SettingsFormValues = {
        // General
        systemName: res.data.general.systemName,
        defaultModel: res.data.general.defaultModel || '',
        language: res.data.general.language,
        timezone: res.data.general.timezone,
        maxUploadSizeMB: res.data.general.maxUploadSizeMB,
        enableImageAnalysis: res.data.general.enableImageAnalysis,
        enableSessionAutoTitle: res.data.general.enableSessionAutoTitle,
        
        // Models
        llmProvider: res.data.models.llmProvider,
        baseUrl: res.data.models.baseUrl || "",
        apiKey: res.data.models.apiKey || "",
        defaultChatModel: res.data.models.defaultChatModel,
        defaultVisionModel: res.data.models.defaultVisionModel,
      };
      
      set({ settings: mappedData, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch settings', isLoading: false });
    }
  },

  updateSettings: async (data: SettingsFormValues) => {
    set({ isLoading: true, error: null });
    try {
      const payload = {
        general: {
          systemName: data.systemName,
          defaultModel: data.defaultModel,
          language: data.language,
          timezone: data.timezone,
          maxUploadSizeMB: data.maxUploadSizeMB,
          enableImageAnalysis: data.enableImageAnalysis,
          enableSessionAutoTitle: data.enableSessionAutoTitle,
        },
        models: {
          llmProvider: data.llmProvider,
          baseUrl: data.baseUrl,
          apiKey: data.apiKey,
          defaultChatModel: data.defaultChatModel,
          defaultVisionModel: data.defaultVisionModel,
        }
      };

      await api.put('/admin/settings', payload);
      
      set({ settings: data, isLoading: false });
      return true;
    } catch (err: any) {
      set({ error: err.message || 'Failed to update settings', isLoading: false });
      return false;
    }
  },

  testConnection: async (data: SettingsFormValues) => {
    try {
      const payload = {
        llmProvider: data.llmProvider,
        baseUrl: data.baseUrl,
        apiKey: data.apiKey,
      };

      const res = await api.post('/admin/settings/test-connection', payload);
      return { success: true, message: res.data.message || 'Connection successful' };
    } catch (err: any) {
      return { 
        success: false, 
        message: err.response?.data?.detail || err.message || 'Connection failed' 
      };
    }
  }
}));
