import { z } from 'zod';

export const settingsSchema = z.object({
  systemName: z.string().min(1, 'System name is required').max(100),
  defaultModel: z.enum(['gpt-4o-medical', 'gpt-4.1', 'claude-sonnet', 'gemini-2.5']),
  language: z.enum(['en', 'vi', 'ja']),
  timezone: z.string().min(1),
  maxUploadSizeMB: z
    .number({ message: 'Must be a number' })
    .min(1, 'Minimum 1 MB')
    .max(100, 'Maximum 100 MB'),
  enableImageAnalysis: z.boolean(),
  enableSessionAutoTitle: z.boolean(),
});

export type SettingsFormValues = z.infer<typeof settingsSchema>;

export const defaultSettingsValues: SettingsFormValues = {
  systemName: 'MedVQA Medical Assistant',
  defaultModel: 'gpt-4o-medical',
  language: 'en',
  timezone: 'Asia/Bangkok',
  maxUploadSizeMB: 10,
  enableImageAnalysis: true,
  enableSessionAutoTitle: true,
};

export const MODEL_OPTIONS = [
  { value: 'gpt-4o-medical', label: 'GPT-4o + Medical' },
  { value: 'gpt-4.1',        label: 'GPT-4.1' },
  { value: 'claude-sonnet',  label: 'Claude Sonnet' },
  { value: 'gemini-2.5',     label: 'Gemini 2.5' },
] as const;

export const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'vi', label: 'Vietnamese' },
  { value: 'ja', label: 'Japanese' },
] as const;

export const TIMEZONE_OPTIONS = [
  { value: 'Asia/Bangkok',    label: '(UTC+7) Bangkok, Hanoi, Jakarta' },
  { value: 'UTC',             label: '(UTC+0) UTC' },
  { value: 'America/New_York',label: '(UTC-5) New York' },
  { value: 'Europe/London',   label: '(UTC+0) London' },
  { value: 'Asia/Tokyo',      label: '(UTC+9) Tokyo' },
  { value: 'Asia/Shanghai',   label: '(UTC+8) Shanghai' },
] as const;
