import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Provider, ProviderCreate, useProvidersStore } from '@/store/providersStore';
import { toast } from 'sonner';

interface ProviderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  provider: Provider | null;
}

const PROVIDER_TYPES = [
  'OpenAI Compatible', 'OpenAI', 'Gemini', 'Ollama', 
  'Anthropic', 'OpenRouter', 'Azure OpenAI', 'LM Studio', 'Custom'
];

export default function ProviderDialog({ isOpen, onClose, provider }: ProviderDialogProps) {
  const { createProvider, updateProvider } = useProvidersStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<ProviderCreate>({
    defaultValues: {
      name: '',
      type: 'OpenAI Compatible',
      baseUrl: '',
      apiKey: '',
      chatModel: '',
      temperature: 0.7,
      maxTokens: 1024,
      timeout: 120,
      supportsToolCalling: false,
      enabled: true,
      isDefault: false
    }
  });

  useEffect(() => {
    if (provider) {
      reset({
        ...provider,
        apiKey: provider.apiKey === '********' ? '********' : provider.apiKey
      });
    } else {
      reset({
        name: '', type: 'OpenAI Compatible', baseUrl: '', apiKey: '',
        chatModel: '', temperature: 0.7, maxTokens: 1024,
        timeout: 120, supportsToolCalling: false, enabled: true, isDefault: false
      });
    }
  }, [provider, reset, isOpen]);

  const onSubmit = async (data: ProviderCreate) => {
    setIsSubmitting(true);
    let success = false;
    
    // If not editing and setting isDefault, we could show a warning, but backend handles it
    if (provider) {
      success = await updateProvider(provider.id, data);
    } else {
      success = await createProvider(data);
    }

    setIsSubmitting(false);
    if (success) {
      toast.success(provider ? "Provider updated" : "Provider created");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{provider ? 'Edit Provider' : 'Add Model Provider'}</DialogTitle>
          <DialogDescription>
            Configure connection details for the LLM inference engine.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Provider Name <span className="text-red-500">*</span></Label>
              <Input 
                placeholder="e.g. Production Ollama" 
                {...register('name', { required: 'Name is required' })} 
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Provider Type <span className="text-red-500">*</span></Label>
              <Controller
                control={control}
                name="type"
                rules={{ required: 'Type is required' }}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROVIDER_TYPES.map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Base URL</Label>
            <Input 
              placeholder="e.g. http://localhost:11434/v1" 
              {...register('baseUrl')} 
            />
          </div>

          <div className="space-y-2">
            <Label>API Key</Label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder={provider ? 'Leave empty to keep existing' : 'sk-...'}
                {...register('apiKey')}
                className="pr-10"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-slate-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Default Chat Model</Label>
              <Input placeholder="e.g. llama3.1" {...register('chatModel')} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
            <div className="space-y-2">
              <Label>Temperature</Label>
              <Input type="number" step="0.1" min="0" max="2" {...register('temperature', { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label>Max Tokens</Label>
              <Input type="number" {...register('maxTokens', { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label>Timeout (s)</Label>
              <Input type="number" {...register('timeout', { valueAsNumber: true })} />
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-4 border-t">
            <div className="flex items-center justify-between">
              <Label className="flex flex-col space-y-1">
                <span>Supports Tool Calling</span>
                <span className="font-normal text-xs text-slate-500">Enable if the model supports OpenAI tool-calling spec</span>
              </Label>
              <Controller
                control={control}
                name="supportsToolCalling"
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label className="flex flex-col space-y-1">
                <span>Enable Provider</span>
                <span className="font-normal text-xs text-slate-500">Allow users to select this provider</span>
              </Label>
              <Controller
                control={control}
                name="enabled"
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>

            {!provider?.isDefault && (
              <div className="flex items-center justify-between">
                <Label className="flex flex-col space-y-1">
                  <span>Set as Default</span>
                  <span className="font-normal text-xs text-slate-500">Make this the default system provider</span>
                </Label>
                <Controller
                  control={control}
                  name="isDefault"
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>
            )}
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="bg-[#2563EB] hover:bg-[#1D4ED8]" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
