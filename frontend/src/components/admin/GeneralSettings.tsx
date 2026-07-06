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
  MODEL_OPTIONS,
  LANGUAGE_OPTIONS,
  TIMEZONE_OPTIONS,
} from './settingsSchema';

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
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="defaultModel" className="h-10">
                <SelectValue placeholder="Select model…" />
              </SelectTrigger>
              <SelectContent>
                {MODEL_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
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
