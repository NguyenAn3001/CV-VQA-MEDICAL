import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, CheckCircle2, Cpu, Shield, Bell, Plug } from 'lucide-react';
import DashboardLayout from '../../components/admin/DashboardLayout';
import SettingsTabs, { type SettingsTabId } from '../../components/admin/SettingsTabs';
import GeneralSettings from '../../components/admin/GeneralSettings';
import PlaceholderPanel from '../../components/admin/PlaceholderPanel';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  settingsSchema,
  defaultSettingsValues,
  type SettingsFormValues,
} from '../../components/admin/settingsSchema';

// ── Placeholder tab content ──────────────────────────────────────
const PLACEHOLDER_TABS = {
  models: {
    title: 'Model Configuration',
    description: 'Fine-tune model parameters, temperature, context window and system prompt per use-case.',
    icon: Cpu,
  },
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
  const [isSaving, setIsSaving]     = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: defaultSettingsValues,
  });

  const onSubmit = async (data: SettingsFormValues) => {
    setIsSaving(true);
    // Simulate async save (replace with real API call)
    await new Promise((resolve) => setTimeout(resolve, 800));
    console.info('[SettingsPage] saved:', data);
    setIsSaving(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <DashboardLayout pageTitle="Settings">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
          <p className="mt-1 text-sm text-slate-500">Configure system preferences</p>
        </div>

        <Button
          id="save-settings-btn"
          type="button"
          disabled={!isDirty || isSaving}
          onClick={handleSubmit(onSubmit)}
          className="gap-2 self-start rounded-lg bg-[#2563EB] text-white shadow-sm shadow-blue-200
                     hover:bg-[#1d4ed8] active:bg-[#1e40af] transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
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

      {/* ── Settings Card ────────────────────────────────────────── */}
      <Card className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-sm">
        <CardContent className="p-0">
          {/* Tab navigation */}
          <div className="px-6 pt-2">
            <SettingsTabs activeTab={activeTab} onChange={setActiveTab} />
          </div>

          {/* Tab panels */}
          <div className="px-6 pb-6">
            {activeTab === 'general' ? (
              <GeneralSettings control={control} errors={errors} />
            ) : (
              <PlaceholderPanel
                tabId={activeTab}
                title={PLACEHOLDER_TABS[activeTab as keyof typeof PLACEHOLDER_TABS].title}
                description={PLACEHOLDER_TABS[activeTab as keyof typeof PLACEHOLDER_TABS].description}
                icon={PLACEHOLDER_TABS[activeTab as keyof typeof PLACEHOLDER_TABS].icon}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Success toast ────────────────────────────────────────── */}
      <SaveSuccessToast visible={showToast} />
    </DashboardLayout>
  );
}
