import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, CheckCircle2, Shield, Bell, Plug } from 'lucide-react';
import DashboardLayout from '../../components/admin/DashboardLayout';
import SettingsTabs, { type SettingsTabId } from '../../components/admin/SettingsTabs';
import GeneralSettings from '../../components/admin/GeneralSettings';
import ProvidersManager from '../../components/admin/ProvidersManager';
import PlaceholderPanel from '../../components/admin/PlaceholderPanel';
import { Button } from '@/components/ui/button';
import { useSettingsStore } from '../../store/settingsStore';
import {
  settingsSchema,
  defaultSettingsValues,
  type SettingsFormValues,
} from '../../components/admin/settingsSchema';

// ── Placeholder tab content ──────────────────────────────────────
const PLACEHOLDER_TABS = {
  security: {
    title: 'Security Settings',
    description: 'Configure 2FA, API keys, session expiry and IP allow-listing for hospital staff.',
    icon: Shield,
  },
  notifications: {
    title: 'Notification Preferences',
    description: 'Set up email digests, Slack alerts and in-app notifications for key events.',
    icon: Bell,
  },
  integrations: {
    title: 'Integrations',
    description: 'Connect your EHR, PACS, and third-party services to the MedVQA platform.',
    icon: Plug,
  },
} as const;

// ── Success Toast ────────────────────────────────────────────────
function SaveSuccessToast({ visible }: { visible: boolean }) {
  return (
    <div
      className={`
        fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-emerald-200
        bg-white px-4 py-3 shadow-lg shadow-emerald-100/50 transition-all duration-300
        ${visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'}
      `}
      role="status"
      aria-live="polite"
    >
      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
      <div>
        <p className="text-sm font-semibold text-slate-800">Settings saved</p>
        <p className="text-xs text-slate-400">Your preferences have been updated.</p>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTabId>('general');
  const [showToast, setShowToast]   = useState(false);
  
  const { fetchSettings, updateSettings, settings, isLoading: storeLoading } = useSettingsStore();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: defaultSettingsValues,
  });

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (settings) {
      reset(settings);
    }
  }, [settings, reset]);

  const onSubmit = async (data: SettingsFormValues) => {
    const success = await updateSettings(data);
    if (success) {
      reset(data); // reset form to new clean state
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  return (
    <DashboardLayout pageTitle="Settings">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[24px] font-semibold leading-tight text-slate-900">Settings</h1>
          <p className="mt-1 text-sm text-slate-500">Configure system preferences</p>
        </div>

        <Button
          id="save-settings-btn"
          type="button"
          disabled={!isDirty || isSubmitting || storeLoading}
          onClick={handleSubmit(onSubmit)}
          className="gap-2 self-start rounded-lg bg-[#2563EB] text-white shadow-sm shadow-blue-200
                     hover:bg-[#1d4ed8] active:bg-[#1e40af] transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Saving…
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* ── Settings Tabs Container ────────────────────────────────────────── */}
      {storeLoading && !settings ? (
        <div className="flex items-center justify-center p-20">
          <svg className="h-8 w-8 text-[#2563EB] animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <SettingsTabs activeTab={activeTab} onChange={setActiveTab} />
          </div>

          {/* Tab panels */}
          <div className="space-y-8">
            {activeTab === 'general' ? (
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50/50">
                  <h3 className="text-sm font-semibold text-slate-900">General Configuration</h3>
                </div>
                <div className="p-6">
                  <GeneralSettings control={control} errors={errors} />
                </div>
              </div>
            ) : activeTab === 'models' ? (
              <ProvidersManager />
            ) : (
              <PlaceholderPanel
                tabId={activeTab}
                title={PLACEHOLDER_TABS[activeTab as keyof typeof PLACEHOLDER_TABS].title}
                description={PLACEHOLDER_TABS[activeTab as keyof typeof PLACEHOLDER_TABS].description}
                icon={PLACEHOLDER_TABS[activeTab as keyof typeof PLACEHOLDER_TABS].icon}
              />
            )}
          </div>
        </div>
      )}

      {/* ── Success toast ────────────────────────────────────────── */}
      <SaveSuccessToast visible={showToast} />
    </DashboardLayout>
  );
}
