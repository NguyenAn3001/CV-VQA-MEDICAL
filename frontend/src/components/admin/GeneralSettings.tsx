import { Controller, type Control, type FieldErrors } from 'react-hook-form';
import { Input }    from '@/components/ui/input';
import { Switch }   from '@/components/ui/switch';
import { Label }    from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { SettingsFormValues } from './settingsSchema';
import {
  LANGUAGE_OPTIONS,
  TIMEZONE_OPTIONS,
} from './settingsSchema';
import { useEffect, useState } from 'react';
import api from '@/lib/axios';

// ── Shared row layout ────────────────────────────────────────────
interface SettingsRowProps {
  label: string;
  description?: string;
  htmlFor?: string;
  children: React.ReactNode;
  error?: string;
  last?: boolean;
}

function SettingsRow({ label, description, htmlFor, children, error, last }: SettingsRowProps) {
  return (
    <>
      <div className="flex flex-col gap-3 py-[22px] sm:flex-row sm:items-center sm:justify-between sm:gap-8">
        {/* Left — label */}
        <div className="min-w-0 sm:w-[240px] sm:shrink-0">
          <Label htmlFor={htmlFor} className="text-sm font-medium text-slate-800">
            {label}
          </Label>
          {description && (
            <p className="mt-0.5 text-xs text-slate-400 leading-relaxed">{description}</p>
          )}
        </div>
        {/* Right — control */}
        <div className="flex flex-1 flex-col gap-1.5">
          {children}
          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}
        </div>
      </div>
      {!last && <Separator />}
    </>
  );
}

// ── Props ────────────────────────────────────────────────────────
interface GeneralSettingsProps {
  control: Control<SettingsFormValues>;
  errors: FieldErrors<SettingsFormValues>;
}

// ── Component ───────────────────────────────────────────────────
export default function GeneralSettings({ control, errors }: GeneralSettingsProps) {
  const [modelOptions, setModelOptions] = useState<{value: string, label: string}[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  useEffect(() => {
    // Fetch models from all configured providers
    const fetchModels = async () => {
      setIsLoadingModels(true);
      try {
        const providersRes = await api.get('/admin/providers');
        const allProviders = providersRes.data || [];
        
        let allModelOptions: {value: string, label: string}[] = [];
        
        for (const provider of allProviders) {
            try {
               const modelsRes = await api.post(`/admin/providers/${provider.id}/models`);
               if (modelsRes.data.success && modelsRes.data.models.length > 0) {
                   const providerModels = modelsRes.data.models.map((m: string) => ({
                       value: m, 
                       label: `${m} (${provider.name})`
                   }));
                   allModelOptions = [...allModelOptions, ...providerModels];
               } else if (provider.chatModel) {
                   allModelOptions.push({
                       value: provider.chatModel,
                       label: `${provider.chatModel} (${provider.name})`
                   });
               }
            } catch (err) {
               console.error(`Failed to load models for provider ${provider.name}`, err);
               if (provider.chatModel) {
                   allModelOptions.push({
                       value: provider.chatModel,
                       label: `${provider.chatModel} (${provider.name} - Offline)`
                   });
               }
            }
        }
        
        // Remove duplicates just in case multiple providers expose the same model name, 
        // though the label will differ so they are technically unique options if desired.
        // We'll keep them unique by value, or if user wants to select a model explicitly via a provider,
        // we might need to store provider info. Let's keep it simple: model names are often unique, 
        // but if not, the first one found takes precedence for the exact string value.
        const uniqueModels = Array.from(new Map(allModelOptions.map(item => [item.value, item])).values());
        
        setModelOptions(uniqueModels);
        
      } catch (err) {
        console.error("Failed to load models for general settings", err);
        setModelOptions([]);
      } finally {
        setIsLoadingModels(false);
      }
    };
    fetchModels();
  }, []);

  return (
    <div role="tabpanel" id="settings-panel-general" aria-labelledby="settings-tab-general">
      {/* ── System Name ──────────────────── */}
      <SettingsRow
        label="System Name"
        description="The display name shown across the platform."
        htmlFor="systemName"
        error={errors.systemName?.message}
      >
        <Controller
          name="systemName"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              id="systemName"
              placeholder="MedVQA Medical Assistant"
              className={cn(
                'h-10 rounded-lg border-[#E5E7EB] text-sm',
                'focus-visible:ring-[#2563EB]/30 focus-visible:border-[#2563EB]',
                errors.systemName && 'border-red-400 focus-visible:ring-red-400/30'
              )}
            />
          )}
        />
      </SettingsRow>

      {/* ── Default Model ────────────────── */}
      <SettingsRow
        label="Default Model"
        description="AI model used for medical image analysis."
        htmlFor="defaultModel"
        error={errors.defaultModel?.message}
      >
        <Controller
          name="defaultModel"
          control={control}
          render={({ field }) => {
            // Ensure the currently selected value is always in the dropdown options to prevent Select from breaking
            const currentOptions = [...modelOptions];
            if (field.value && !currentOptions.find(o => o.value === field.value)) {
              currentOptions.push({ value: field.value, label: field.value });
            }

            return (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="defaultModel" className="h-10">
                  <SelectValue placeholder={isLoadingModels ? "Loading models..." : "Select model…"} />
                </SelectTrigger>
                <SelectContent>
                  {currentOptions.length > 0 ? (
                    currentOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No models available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            );
          }}
        />
      </SettingsRow>

      {/* ── Language ─────────────────────── */}
      <SettingsRow
        label="Language"
        description="Interface language for all users."
        htmlFor="language"
        error={errors.language?.message}
      >
        <Controller
          name="language"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="language" className="h-10">
                <SelectValue placeholder="Select language…" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </SettingsRow>

      {/* ── Timezone ─────────────────────── */}
      <SettingsRow
        label="Timezone"
        description="Timestamps will be displayed in this timezone."
        htmlFor="timezone"
        error={errors.timezone?.message}
      >
        <Controller
          name="timezone"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="timezone" className="h-10">
                <SelectValue placeholder="Select timezone…" />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </SettingsRow>

      {/* ── Max Upload Size ──────────────── */}
      <SettingsRow
        label="Max Upload Size"
        description="Maximum file size allowed for image uploads."
        htmlFor="maxUploadSizeMB"
        error={errors.maxUploadSizeMB?.message}
      >
        <Controller
          name="maxUploadSizeMB"
          control={control}
          render={({ field }) => (
            <div className="flex items-center gap-2">
              <Input
                {...field}
                id="maxUploadSizeMB"
                type="number"
                min={1}
                max={100}
                onChange={(e) => field.onChange(Number(e.target.value))}
                className={cn(
                  'h-10 w-28 rounded-lg border-[#E5E7EB] text-sm',
                  'focus-visible:ring-[#2563EB]/30 focus-visible:border-[#2563EB]',
                  errors.maxUploadSizeMB && 'border-red-400 focus-visible:ring-red-400/30'
                )}
              />
              <span className="text-sm font-medium text-slate-500">MB</span>
            </div>
          )}
        />
      </SettingsRow>

      {/* ── Enable Image Analysis ────────── */}
      <SettingsRow
        label="Enable Image Analysis"
        description="Allow users to submit medical images for AI analysis."
        htmlFor="enableImageAnalysis"
      >
        <Controller
          name="enableImageAnalysis"
          control={control}
          render={({ field }) => (
            <div className="flex items-center gap-3">
              <Switch
                id="enableImageAnalysis"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
              <span className="text-sm text-slate-500">
                {field.value ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          )}
        />
      </SettingsRow>

      {/* ── Enable Session Auto-Title ────── */}
      <SettingsRow
        label="Enable Session Auto-Title"
        description="Automatically generate session titles from first message."
        htmlFor="enableSessionAutoTitle"
        last
      >
        <Controller
          name="enableSessionAutoTitle"
          control={control}
          render={({ field }) => (
            <div className="flex items-center gap-3">
              <Switch
                id="enableSessionAutoTitle"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
              <span className="text-sm text-slate-500">
                {field.value ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          )}
        />
      </SettingsRow>
    </div>
  );
}
